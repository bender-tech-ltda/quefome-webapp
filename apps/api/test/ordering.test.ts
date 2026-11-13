/**
 * The MVP flow, API level:
 * customer orders (no account) → restaurant gets a WhatsApp summary → staff moves the order forward →
 * the customer gets a WhatsApp message on every status change → the order page reflects it.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CUSTOMER_WHATSAPP, Client, FIXED_NOW, type RunningApi, STAFF, STORE_WHATSAPP, deliveryOrder, startTestApi } from "./harness";

let running: RunningApi;
const client = () => new Client(() => running.baseUrl);
const control = (path: string, body: unknown = {}) => client().post(`/__control${path}`, body);
const staff = async () => {
  const c = client();
  expect((await c.post("/api/admin/session", { ...STAFF, keepLoggedIn: true })).status).toBe(200);
  return c;
};
const placeOrder = (body: object = deliveryOrder, headers?: Record<string, string>) => client().post("/api/stores/burger-do-ze/orders", body, headers);

beforeAll(async () => {
  running = await startTestApi();
});
afterAll(() => running.stop());
beforeEach(async () => {
  await control("/reset");
  await control("/clock", { now: FIXED_NOW });
  running.whatsapp.reset();
});

describe("customer places an order (no account)", () => {
  it("prices on the server, numbers per store, returns the order page data", async () => {
    const tampered = { ...deliveryOrder, items: deliveryOrder.items.map((i) => ({ ...i, priceCents: 1 })) };
    const res = await placeOrder(tampered);
    expect(res.status, JSON.stringify(res.json)).toBe(201);
    // X-Salada 22,90 + bacon 4,00 = 26,90 ; Pizza HIGHEST(45,90, 49,90) = 49,90 ; delivery 5,00
    expect(res.json).toMatchObject({
      number: 1, status: "PENDING", subtotalCents: 7680, deliveryFeeCents: 500, totalCents: 8180,
      payment: { kind: "CASH", changeForCents: 10000 }, store: { slug: "burger-do-ze", name: "Burger do Zé", whatsapp: STORE_WHATSAPP },
      statusHistory: [{ status: "PENDING" }], pix: null,
    });
    expect(res.json.trackingToken.length).toBeGreaterThanOrEqual(20);
    expect(JSON.stringify(res.json)).not.toContain("Rua Quinze"); // the public order page carries no address
    expect((await placeOrder()).json.number).toBe(2);
  });

  it("sends the restaurant a WhatsApp summary: items, amounts, payment, delivery", async () => {
    await placeOrder({ ...deliveryOrder, notes: "Interfone quebrado" });
    await running.flush();
    const [msg] = running.whatsapp.to(STORE_WHATSAPP);
    expect(msg).toBeDefined();
    expect(msg!.text).toContain("*Novo pedido #1* - Burger do Zé");
    expect(msg!.text).toContain("Cliente: Ana Cliente - (51) 99999-8888");
    expect(msg!.text).toContain("Entrega: Rua Quinze de Janeiro, nº 10, compl. ap 2 - Bairro Centro, Canoas");
    expect(msg!.text).toContain("1x X-Salada - R$ 26,90");
    expect(msg!.text).toContain("• Ponto da carne: Bem passado");
    expect(msg!.text).toContain("• + Bacon");
    expect(msg!.text).toContain("• Obs: sem tomate");
    expect(msg!.text).toContain("1x Pizza Grande - R$ 49,90");
    expect(msg!.text).toContain("• Sabores: Calabresa / Quatro queijos");
    expect(msg!.text).toContain("*Total: R$ 81,80*");
    expect(msg!.text).toContain("Pagamento: Dinheiro (troco para R$ 100,00: levar R$ 18,20)");
    expect(msg!.text).toContain("Observações: Interfone quebrado");
    expect(msg!.text).toContain("Abrir no painel: https://app.test/admin");
    expect(msg!.template).toBeNull(); // no approved template configured in tests -> free-form text
  });

  it("the order page shows the restaurant was notified once the message is delivered", async () => {
    const order = (await placeOrder()).json;
    await running.flush();
    expect((await client().get(`/api/orders/${order.trackingToken}`)).json.restaurantNotified).toBe(true);
  });

  it("Pix: the order page shows the store's key; the restaurant is told to check the receipt", async () => {
    const order = (await placeOrder({ ...deliveryOrder, paymentKind: "PIX", changeForCents: 5000 })).json;
    expect(order.pix).toEqual({ keyType: "EMAIL", key: "pix@burgerdoze.com.br", holderName: "Burger do Zé Ltda" });
    expect(order.payment).toEqual({ kind: "PIX", changeForCents: null }); // troco only for cash
    await running.flush();
    expect(running.whatsapp.to(STORE_WHATSAPP)[0]!.text).toContain("Pagamento: Pix (conferir o comprovante)");
  });

  it("pickup + card: no delivery fee, no address", async () => {
    const res = await placeOrder({ ...deliveryOrder, fulfillment: "PICKUP", address: null, paymentKind: "CARD", changeForCents: null });
    expect(res.json).toMatchObject({ fulfillment: "PICKUP", deliveryFeeCents: 0, totalCents: 7680, payment: { kind: "CARD" } });
    await running.flush();
    expect(running.whatsapp.to(STORE_WHATSAPP)[0]!.text).toContain("Retirada no balcão");
  });

  it("a double tap (same Idempotency-Key) creates one order and one WhatsApp message", async () => {
    const key = { "idempotency-key": "k-1" };
    const [a, b] = await Promise.all([placeOrder(deliveryOrder, key), placeOrder(deliveryOrder, key)]);
    expect(a.json.trackingToken).toBe(b.json.trackingToken);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    await running.flush();
    expect(running.whatsapp.to(STORE_WHATSAPP)).toHaveLength(1);
  });

  it.each([
    ["store paused", async () => control("/stores/burger-do-ze/status", { status: "CLOSED" }), deliveryOrder, "STORE_CLOSED"],
    ["address outside the area", null, { ...deliveryOrder, address: { ...deliveryOrder.address, neighborhood: "Estância Velha" } }, "ADDRESS_NOT_ATTENDED"],
    ["below the minimum", null, { ...deliveryOrder, items: [{ productId: "301", quantity: 1, instructions: "", flavorIds: [], components: [] }] }, "BELOW_MINIMUM"],
    ["troco lower than the total", null, { ...deliveryOrder, changeForCents: 1000 }, "CHANGE_TOO_LOW"],
    ["landline instead of WhatsApp", null, { ...deliveryOrder, customer: { name: "Ana", whatsapp: "(51) 3333-4444" } }, "WHATSAPP_INVALID"],
    ["too many flavors", null, { ...deliveryOrder, items: [{ productId: "201", quantity: 1, instructions: "", flavorIds: ["2011", "2012", "2013"], components: [] }] }, "ITEM_INVALID"],
    ["product from another store", null, { ...deliveryOrder, items: [{ productId: "401", quantity: 1, instructions: "", flavorIds: [], components: [] }] }, "PRODUCT_NOT_FOUND"],
  ] as const)("rejects: %s", async (_name, setup, body, code) => {
    if (setup) await setup();
    const res = await placeOrder(body);
    expect(res.status).toBe(422);
    expect(res.json.code).toBe(code);
    await running.flush();
    expect(running.whatsapp.sent).toHaveLength(0);
  });

  it("rejects a payment kind the store doesn't accept", async () => {
    await control("/stores/pizzaria-bella/status", { status: "OPEN" });
    const res = await client().post("/api/stores/pizzaria-bella/orders", { ...deliveryOrder, paymentKind: "PIX", changeForCents: null, items: [{ productId: "401", quantity: 1, instructions: "", flavorIds: [], components: [] }] });
    expect(res.json.code).toBe("PAYMENT_METHOD_INVALID");
  });

  it("limits orders per WhatsApp number (abuse of pay-on-delivery)", async () => {
    for (let i = 0; i < 5; i++) expect((await placeOrder()).status).toBe(201);
    expect((await placeOrder()).status).toBe(429);
  });
});

describe("restaurant moves the order forward; the customer is told on WhatsApp", () => {
  it("PENDING → PREPARING → READY → DELIVERED: one customer message per step, history on the order page", async () => {
    const order = (await placeOrder()).json;
    const s = await staff();
    const adminOrder = (await s.get("/api/admin/orders")).json[0];
    let version = adminOrder.version;
    for (const status of ["PREPARING", "READY", "DELIVERED"]) {
      const res = await s.patch(`/api/admin/orders/${adminOrder.id}/status`, { status, version });
      expect(res.status, JSON.stringify(res.json)).toBe(200);
      version = res.json.version;
    }
    await running.flush();
    const toCustomer = running.whatsapp.to(CUSTOMER_WHATSAPP).map((m) => m.text);
    expect(toCustomer).toHaveLength(3);
    expect(toCustomer[0]).toContain("O restaurante confirmou e está preparando seu pedido.");
    expect(toCustomer[1]).toContain("Seu pedido está pronto e logo sai para entrega!");
    expect(toCustomer[2]).toContain("Pedido entregue. Bom apetite!");
    expect(toCustomer[0]).toContain(`Acompanhe: https://app.test/burger-do-ze/pedido/${order.trackingToken}`);

    const page = (await client().get(`/api/orders/${order.trackingToken}`)).json;
    expect(page.status).toBe("DELIVERED");
    expect(page.statusHistory.map((h: { status: string }) => h.status)).toEqual(["PENDING", "PREPARING", "READY", "DELIVERED"]);

    const notifications = (await s.get(`/api/admin/orders/${adminOrder.id}`)).json.notifications;
    expect(notifications.map((n: { recipient: string; status: string }) => `${n.recipient}:${n.status}`)).toEqual(["STORE:SENT", "CUSTOMER:SENT", "CUSTOMER:SENT", "CUSTOMER:SENT"]);
  });

  it("cancel needs a reason, which the customer receives", async () => {
    await placeOrder();
    const s = await staff();
    const { id, version } = (await s.get("/api/admin/orders")).json[0];
    expect((await s.patch(`/api/admin/orders/${id}/status`, { status: "CANCELED", version })).json.code).toBe("REASON_REQUIRED");
    expect((await s.patch(`/api/admin/orders/${id}/status`, { status: "CANCELED", version, reason: "Acabou o pão" })).json).toMatchObject({ status: "CANCELED", cancelReason: "Acabou o pão" });
    await running.flush();
    expect(running.whatsapp.to(CUSTOMER_WHATSAPP)[0]!.text).toContain("Seu pedido foi cancelado pelo restaurante.\nMotivo: Acabou o pão");
  });

  it("no skipping steps, no going back, no changes after delivery", async () => {
    await placeOrder();
    const s = await staff();
    const { id } = (await s.get("/api/admin/orders")).json[0];
    expect((await s.patch(`/api/admin/orders/${id}/status`, { status: "READY", version: 0 })).json.code).toBe("INVALID_TRANSITION");
    await s.patch(`/api/admin/orders/${id}/status`, { status: "PREPARING", version: 0 });
    expect((await s.patch(`/api/admin/orders/${id}/status`, { status: "PENDING", version: 1 })).json.code).toBe("INVALID_TRANSITION");
  });

  it("two attendants clicking at once: the second gets a conflict with the current order", async () => {
    await placeOrder();
    const [a, b] = [await staff(), await staff()];
    const { id } = (await a.get("/api/admin/orders")).json[0];
    expect((await a.patch(`/api/admin/orders/${id}/status`, { status: "PREPARING", version: 0 })).status).toBe(200);
    const conflict = await b.patch(`/api/admin/orders/${id}/status`, { status: "PREPARING", version: 0 });
    expect(conflict.status).toBe(409);
    expect(conflict.json.details.current.status).toBe("PREPARING");
    await running.flush();
    expect(running.whatsapp.to(CUSTOMER_WHATSAPP)).toHaveLength(1); // not two "preparing" messages
  });
});

describe("WhatsApp delivery is reliable and never blocks orders", () => {
  it("retries transient failures with backoff, then delivers", async () => {
    running.whatsapp.failNext = { times: 1, retryable: true };
    expect((await placeOrder()).status).toBe(201); // order succeeds even with WhatsApp down
    await running.flush();
    expect(running.whatsapp.sent).toHaveLength(0);
    const s = await staff();
    const id = (await s.get("/api/admin/orders")).json[0].id;
    expect((await s.get(`/api/admin/orders/${id}`)).json.notifications[0].status).toBe("PENDING");
    await control("/clock", { now: "2024-03-15T23:01:00.000Z" }); // after the backoff
    await running.flush();
    expect(running.whatsapp.to(STORE_WHATSAPP)).toHaveLength(1);
    expect((await s.get(`/api/admin/orders/${id}`)).json.notifications[0].status).toBe("SENT");
  });

  it("permanent failures (e.g. invalid number) are marked FAILED for the merchant to see", async () => {
    running.whatsapp.failNext = { times: 1, retryable: false };
    await placeOrder();
    await running.flush();
    const s = await staff();
    const [order] = (await s.get("/api/admin/orders")).json;
    expect(order.notifications).toEqual([expect.objectContaining({ recipient: "STORE", status: "FAILED" })]);
  });

  it("gives up after 5 attempts", async () => {
    running.whatsapp.failNext = { times: 99, retryable: true };
    await placeOrder();
    for (let minute = 1; minute <= 30; minute++) {
      await control("/clock", { now: new Date(Date.parse(FIXED_NOW) + minute * 60_000).toISOString() });
      await running.flush();
    }
    const [order] = (await (await staff()).get("/api/admin/orders")).json;
    expect(order.notifications[0].status).toBe("FAILED");
  });
});
