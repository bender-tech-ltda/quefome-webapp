/** Merchant side: sign-up → setup → menu → publish; board feed; isolation between stores; security. */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config";
import { CloudApiProvider, ProviderError } from "../src/modules/messaging";
import { Client, FIXED_NOW, OTHER_STAFF, type RunningApi, STAFF, deliveryOrder, startTestApi } from "./harness";

let running: RunningApi;
const client = () => new Client(() => running.baseUrl);
const control = (path: string, body: unknown = {}) => client().post(`/__control${path}`, body);
const login = async (who = STAFF) => {
  const c = client();
  expect((await c.post("/api/admin/session", { ...who, keepLoggedIn: true })).status).toBe(200);
  return c;
};

beforeAll(async () => {
  running = await startTestApi();
});
afterAll(() => running.stop());
beforeEach(async () => {
  await control("/reset");
  await control("/clock", { now: FIXED_NOW });
  running.whatsapp.reset();
});

describe("onboarding: sign-up → settings → menu → publish → first order", () => {
  it("a new restaurant goes live and receives its first order on WhatsApp", async () => {
    const m = client();
    const signup = await m.post("/api/merchant/signup", { name: "Maria", email: "maria@lanches.com", password: "segura123", storeName: "Lanches da Maria", whatsapp: "(51) 3333-4444" });
    expect(signup.status, JSON.stringify(signup.json)).toBe(201);
    expect(signup.json).toMatchObject({ role: "OWNER", store: { slug: "lanches-da-maria", published: false } });

    // not public until published
    expect((await client().get("/api/stores/lanches-da-maria")).status).toBe(404);

    const settings = (await m.get("/api/admin/store")).json;
    expect(settings.whatsapp).toBe("+555133334444"); // WhatsApp Business on a landline is fine for stores

    // publishing with an empty menu is refused
    const update = {
      ...settings, slug: undefined, statusOverride: undefined,
      description: "Os melhores lanches",
      address: { zipCode: "92010-000", street: "Rua Quinze de Janeiro", number: "5", complement: "", neighborhood: "Centro", city: "Canoas", state: "RS" },
      schedules: [0, 1, 2, 3, 4, 5, 6].map((weekDay) => ({ weekDay, opensAt: "18:00", closesAt: "23:00" })),
      deliveryEnabled: true, deliveryFeeCents: 700, minimumOrderCents: null, deliveryArea: { mode: "CITY", neighborhoods: [] },
      deliveryTime: { minMinutes: 30, maxMinutes: 45 }, pickupEnabled: false,
      payment: { cash: true, card: false, pix: { keyType: "PHONE", key: "+5551333344444", holderName: "Maria" } },
      cuisineTypeIds: ["ct1"], published: true,
    };
    expect((await m.put("/api/admin/store", update)).json.message).toBe("Cadastre pelo menos um produto antes de publicar a loja.");

    const category = (await m.post("/api/admin/categories", { name: "Lanches", icon: "burger", sequence: 1 })).json;
    const product = (await m.post("/api/admin/products", { categoryId: category.id, name: "X-Tudo", description: "Completo", priceCents: 3200, available: true, sequence: 1 })).json;
    expect(product).toMatchObject({ name: "X-Tudo", priceCents: 3200, available: true, flavors: [], components: [] });

    const published = await m.put("/api/admin/store", update);
    expect(published.status, JSON.stringify(published.json)).toBe(200);
    expect(published.json.published).toBe(true);

    // appears in the marketplace and takes orders (schedule 18-23h, Friday 20:00)
    expect((await client().get("/api/stores?q=maria")).json.map((s: { slug: string }) => s.slug)).toEqual(["lanches-da-maria"]);
    const order = await client().post("/api/stores/lanches-da-maria/orders", {
      ...deliveryOrder, paymentKind: "PIX", changeForCents: null,
      address: { ...deliveryOrder.address, neighborhood: "Qualquer Bairro" }, // whole-city delivery
      items: [{ productId: product.id, quantity: 2, instructions: "", flavorIds: [], components: [] }],
    });
    expect(order.status, JSON.stringify(order.json)).toBe(201);
    expect(order.json).toMatchObject({ number: 1, totalCents: 7100, pix: { key: "+5551333344444" } });
    await running.flush();
    expect(running.whatsapp.to("+555133334444")[0]!.text).toContain("*Novo pedido #1* - Lanches da Maria");
  });

  it("sign-up validation: duplicate e-mail, invalid WhatsApp, unique slugs", async () => {
    expect((await client().post("/api/merchant/signup", { name: "Zé", email: STAFF.email, password: "segura123", storeName: "Outro", whatsapp: "51999998888" })).json.code).toBe("EMAIL_IN_USE");
    expect((await client().post("/api/merchant/signup", { name: "X", email: "x@x.com", password: "segura123", storeName: "Outro", whatsapp: "9999-8888" })).json.code).toBe("WHATSAPP_INVALID");
    const dup = await client().post("/api/merchant/signup", { name: "Y", email: "y@y.com", password: "segura123", storeName: "Burger do Zé", whatsapp: "51999998888" });
    expect(dup.json.store.slug).toBe("burger-do-ze-2");
    expect((await client().post("/api/merchant/signup", { name: "Z", email: "z@z.com", password: "curta", storeName: "Loja", whatsapp: "51999998888" })).status).toBe(422);
  });

  it("settings rules: at least one way to receive orders, one payment method, a delivery area", async () => {
    const m = await login();
    const current = (await m.get("/api/admin/store")).json;
    const base = { ...current, slug: undefined, statusOverride: undefined };
    expect((await m.put("/api/admin/store", { ...base, deliveryEnabled: false, pickupEnabled: false })).json.message).toBe("Ative a entrega ou a retirada no balcão.");
    expect((await m.put("/api/admin/store", { ...base, payment: { cash: false, card: false, pix: null } })).json.message).toBe("Aceite pelo menos uma forma de pagamento.");
    expect((await m.put("/api/admin/store", { ...base, deliveryArea: { mode: "NEIGHBORHOODS", neighborhoods: [] } })).json.code).toBe("STORE_SETTINGS_INVALID");
  });

  it("pause / resume from the dashboard", async () => {
    const m = await login();
    expect((await m.post("/api/admin/store/status", { override: "CLOSED" })).json.status).toBe("CLOSED");
    expect((await client().post("/api/stores/burger-do-ze/orders", deliveryOrder)).json.code).toBe("STORE_CLOSED");
    expect((await m.post("/api/admin/store/status", { override: null })).json.status).toBe("OPEN"); // back to schedule (Friday 20:00)
  });
});

describe("menu management", () => {
  it("out of stock: shown on the menu as unavailable and can't be ordered", async () => {
    const m = await login();
    expect((await m.patch("/api/admin/products/101/availability", { available: false })).json.available).toBe(false);
    const menu = (await client().get("/api/stores/burger-do-ze/menu")).json;
    expect(menu.products.find((p: { id: string }) => p.id === "101").available).toBe(false);
    expect((await client().post("/api/stores/burger-do-ze/orders", deliveryOrder)).json.code).toBe("PRODUCT_UNAVAILABLE");
  });

  it("editing keeps advanced options (flavors/extras) the editor doesn't show yet", async () => {
    const m = await login();
    const res = await m.put("/api/admin/products/201", { categoryId: "20", name: "Pizza Grande (8 fatias)", description: "", priceCents: 0, available: true, sequence: 0 });
    expect(res.json.name).toBe("Pizza Grande (8 fatias)");
    expect(res.json.flavors).toHaveLength(3);
    expect(res.json.components).toHaveLength(1);
  });

  it("deleting: products disappear from the menu (past orders keep their snapshot); non-empty categories are protected", async () => {
    const m = await login();
    const order = (await client().post("/api/stores/burger-do-ze/orders", deliveryOrder)).json;
    expect((await m.delete("/api/admin/categories/30")).json.code).toBe("CATEGORY_NOT_EMPTY");
    expect((await m.delete("/api/admin/products/301")).status).toBe(200);
    expect((await m.delete("/api/admin/categories/30")).status).toBe(200);
    expect((await m.delete("/api/admin/products/101")).status).toBe(200);
    expect((await client().get("/api/stores/burger-do-ze/menu")).json.products.map((p: { id: string }) => p.id)).not.toContain("101");
    expect((await client().get(`/api/orders/${order.trackingToken}`)).json.items[0].productName).toBe("X-Salada");
  });
});

describe("isolation between stores and access control", () => {
  it("staff of another store can't see or touch this store's orders or menu", async () => {
    await client().post("/api/stores/burger-do-ze/orders", deliveryOrder);
    const zé = await login();
    const { id } = (await zé.get("/api/admin/orders")).json[0];
    const bella = await login(OTHER_STAFF);
    expect((await bella.get("/api/admin/orders")).json).toEqual([]);
    expect((await bella.get(`/api/admin/orders/${id}`)).status).toBe(404);
    expect((await bella.patch(`/api/admin/orders/${id}/status`, { status: "PREPARING", version: 0 })).status).toBe(404);
    expect((await bella.patch("/api/admin/products/101/availability", { available: false })).status).toBe(404);
    expect((await bella.put("/api/admin/products/101", { categoryId: "40", name: "x", description: "", priceCents: 1, available: true, sequence: 0 })).status).toBe(404);
    expect((await bella.post("/api/admin/products", { categoryId: "10", name: "x", description: "", priceCents: 1, available: true, sequence: 0 })).json.code).toBe("CATEGORY_NOT_FOUND");
  });

  it("anonymous callers get 401 on every merchant endpoint", async () => {
    const c = client();
    for (const [method, path] of [["GET", "/api/admin/orders"], ["GET", "/api/admin/store"], ["GET", "/api/admin/catalog"], ["POST", "/api/admin/products"], ["POST", "/api/admin/store/status"], ["GET", "/api/admin/orders/stream"]] as const) {
      expect((await c.call(method, path, method === "POST" ? {} : undefined)).status, `${method} ${path}`).toBe(401);
    }
  });

  it("unknown/unpublished stores and tokens are 404", async () => {
    expect((await client().get("/api/stores/nao-existe")).status).toBe(404);
    expect((await client().get("/api/orders/token-que-nao-existe-123")).status).toBe(404);
  });

  it("rejects cookie-authenticated mutations from other sites (CSRF) and rate-limits logins", async () => {
    const m = await login();
    expect((await m.post("/api/admin/store/status", { override: "CLOSED" }, { origin: "https://evil.example" })).status).toBe(403);
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await client().post("/api/admin/session", { email: "x@x.com", password: "errada", keepLoggedIn: false })).status;
    expect(last).toBe(429);
  });

  it("sessions expire and logout ends them", async () => {
    const m = await login();
    expect((await m.delete("/api/admin/session")).json).toEqual({ ok: true });
    expect((await m.get("/api/admin/session")).json.user).toBeNull();
    const n = await login();
    await control("/clock", { now: "2024-05-01T00:00:00.000Z" });
    expect((await n.get("/api/admin/session")).json.user).toBeNull();
  });
});

describe("realtime board feed (SSE)", () => {
  async function readEvents(c: Client, count: number): Promise<string[]> {
    const res = await fetch(`${running.baseUrl}/api/admin/orders/stream`, { headers: { cookie: c.cookieHeader() } });
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const events: string[] = [];
    const deadline = Date.now() + 3000;
    while (events.length < count && Date.now() < deadline) {
      const next = await Promise.race([reader.read(), new Promise<"timeout">((r) => setTimeout(() => r("timeout"), Math.max(0, deadline - Date.now())))]);
      if (next === "timeout" || next.done) break;
      buffer += decoder.decode(next.value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      events.push(...parts.filter(Boolean));
    }
    await reader.cancel();
    return events;
  }

  it("a new order reaches the restaurant's board in well under 2 seconds (NFR-01), only that store's", async () => {
    const zé = await login();
    const bella = await login(OTHER_STAFF);
    const started = Date.now();
    const zéEvents = readEvents(zé, 2);
    const bellaEvents = readEvents(bella, 2);
    await new Promise((r) => setTimeout(r, 150));
    await client().post("/api/stores/burger-do-ze/orders", deliveryOrder);
    const events = await zéEvents;
    expect(events[1]).toContain("event: order.created");
    expect(Date.now() - started).toBeLessThan(2000);
    expect((await bellaEvents).filter((e) => e.includes("order."))).toHaveLength(0);
  });
});

describe("WhatsApp Cloud API provider (request format)", () => {
  afterEach(() => vi.restoreAllMocks());
  const provider = new CloudApiProvider({ apiUrl: "https://graph.facebook.com", version: "v21.0", token: "T", phoneNumberId: "123" });

  it("sends approved templates with single-line body parameters", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), { status: 200 }));
    const res = await provider.send({ to: "+5551999998888", text: "ignored", template: { name: "novo_pedido", language: "pt_BR", params: ["12", "Ana"] } });
    expect(res.providerMessageId).toBe("wamid.1");
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect((init!.headers as Record<string, string>).authorization).toBe("Bearer T");
    expect(JSON.parse(init!.body as string)).toEqual({
      messaging_product: "whatsapp", to: "5551999998888", type: "template",
      template: { name: "novo_pedido", language: { code: "pt_BR" }, components: [{ type: "body", parameters: [{ type: "text", text: "12" }, { type: "text", text: "Ana" }] }] },
    });
  });

  it("sends free-form text when no template is configured", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.2" }] }), { status: 200 }));
    await provider.send({ to: "+5551999998888", text: "Olá", template: null });
    expect(JSON.parse(spy.mock.calls[0]![1]!.body as string)).toMatchObject({ type: "text", text: { body: "Olá", preview_url: false } });
  });

  it("classifies errors: 429/5xx retry, 4xx don't", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "rate" } }), { status: 429 }));
    await expect(provider.send({ to: "+5551999998888", text: "x", template: null })).rejects.toMatchObject({ retryable: true });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "invalid parameter" } }), { status: 400 }));
    const err = await provider.send({ to: "+5551999998888", text: "x", template: null }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err).toMatchObject({ retryable: false, message: "cloud-api 400: invalid parameter" });
  });
});

describe("production configuration guards", () => {
  const prod = { NODE_ENV: "production", DATABASE_URL: "postgres://x", ADDRESS_PROVIDER: "viacep", MESSAGING_PROVIDER: "cloud-api", WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "1" } as const;
  it("refuses unsafe settings", () => {
    expect(() => loadConfig({ ...prod, API_TEST_CONTROL: "1" })).toThrow(/API_TEST_CONTROL/);
    expect(() => loadConfig({ ...prod, MESSAGING_PROVIDER: "log" })).toThrow(/MESSAGING_PROVIDER/);
    expect(() => loadConfig({ ...prod, WHATSAPP_TOKEN: undefined })).toThrow(/WHATSAPP_TOKEN/);
    expect(() => loadConfig({ ...prod, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    expect(loadConfig(prod).PORT).toBe(4020);
  });
});
