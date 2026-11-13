/** MVP rules: lifecycle, WhatsApp identity and messages, guest checkout, payment options. */
import { describe, expect, it } from "vitest";
import {
  type MessageOrder,
  advanceActionLabel,
  availablePaymentKinds,
  canTransition,
  checkoutIssues,
  isFinalStatus,
  newOrderMessage,
  nextStatus,
  normalizeBrazilianMobile,
  orderStatusDescription,
  statusUpdateMessage,
  whatsappLink,
} from "../src";

describe("order lifecycle (MVP): PENDING → PREPARING → READY → DELIVERED, + CANCELED", () => {
  it("moves forward one step at a time; no skipping, no going back", () => {
    expect(nextStatus("PENDING")).toBe("PREPARING");
    expect(nextStatus("PREPARING")).toBe("READY");
    expect(nextStatus("READY")).toBe("DELIVERED");
    expect(nextStatus("DELIVERED")).toBeNull();
    expect(canTransition("PENDING", "READY")).toBe(false);
    expect(canTransition("READY", "PREPARING")).toBe(false);
  });
  it("can be canceled until delivered; final states are final", () => {
    for (const s of ["PENDING", "PREPARING", "READY"] as const) expect(canTransition(s, "CANCELED")).toBe(true);
    expect(canTransition("DELIVERED", "CANCELED")).toBe(false);
    expect(isFinalStatus("CANCELED") && isFinalStatus("DELIVERED")).toBe(true);
  });
  it("labels depend on delivery vs pickup", () => {
    expect(advanceActionLabel("PREPARING", "PICKUP")).toBe("Pronto para retirada");
    expect(advanceActionLabel("READY", "DELIVERY")).toBe("Entregue");
    expect(orderStatusDescription("READY", "PICKUP")).toBe("Seu pedido está pronto para retirada!");
  });
});

describe("WhatsApp number (customer identity)", () => {
  it.each([
    ["(51) 99999-8888", "+5551999998888"],
    ["51999998888", "+5551999998888"],
    ["+55 51 99999 8888", "+5551999998888"],
    ["0 51 99999-8888", "+5551999998888"], // long-distance prefix
    ["(11) 3333-4444", null], // landline: can't receive WhatsApp notifications reliably
    ["51 89999-8888", null], // mobiles start with 9
    ["(05) 99999-8888", null], // invalid DDD
    ["9999-8888", null], // no DDD
    ["", null],
  ])("%s → %s", (input, expected) => expect(normalizeBrazilianMobile(input)).toBe(expected));

  it("store numbers may be landlines (WhatsApp Business), customers may not", async () => {
    const { normalizeBrazilianPhone } = await import("../src");
    expect(normalizeBrazilianPhone("(51) 3333-4444")).toBe("+555133334444");
    expect(normalizeBrazilianPhone("(51) 99999-8888")).toBe("+5551999998888");
    expect(normalizeBrazilianPhone("(51) 9333-4444")).toBeNull();
    expect(normalizeBrazilianMobile("(51) 3333-4444")).toBeNull();
  });

  it("builds click-to-chat links", () => {
    expect(whatsappLink("+5551999998888")).toBe("https://wa.me/5551999998888");
    expect(whatsappLink("+5551999998888", "Olá, pedido #2")).toBe("https://wa.me/5551999998888?text=Ol%C3%A1%2C%20pedido%20%232");
  });
});

const order: MessageOrder = {
  number: 12,
  status: "PENDING",
  fulfillment: "DELIVERY",
  customer: { name: "Ana", whatsapp: "+5551999998888" },
  address: { street: "Rua Quinze de Janeiro", number: "10", complement: "ap 2", neighborhood: "Centro", city: "Canoas", state: "RS" },
  items: [
    {
      quantity: 2, productName: "X-Salada", instructions: "sem tomate", totalCents: 5380, flavors: [],
      components: [
        { name: "Ponto da carne", value: { kind: "choice", optionName: "Bem passado" } },
        { name: "Bacon", value: { kind: "toggle", on: true, defaultOn: false } },
        { name: "Ovo", value: { kind: "toggle", on: false, defaultOn: false } },
        { name: "Cebola", value: { kind: "toggle", on: false, defaultOn: true } },
      ],
    },
    { quantity: 1, productName: "Pizza Grande", instructions: "", totalCents: 5790, flavors: [{ name: "Calabresa" }, { name: "Quatro queijos" }], components: [] },
  ],
  subtotalCents: 11170,
  deliveryFeeCents: 500,
  totalCents: 11670,
  payment: { kind: "CASH", changeForCents: 15000 },
  notes: "Interfone quebrado, ligar ao chegar",
};

describe("message to the restaurant (new order)", () => {
  const msg = newOrderMessage(order, "Burger do Zé", "https://app/admin/orders");
  it("contains everything the kitchen and the motoboy need", () => {
    expect(msg.text).toContain("*Novo pedido #12* - Burger do Zé");
    expect(msg.text).toContain("Cliente: Ana - (51) 99999-8888");
    expect(msg.text).toContain("Entrega: Rua Quinze de Janeiro, nº 10, compl. ap 2 - Bairro Centro, Canoas");
    expect(msg.text).toContain("2x X-Salada - R$ 53,80");
    expect(msg.text).toContain("• Ponto da carne: Bem passado");
    expect(msg.text).toContain("• + Bacon");
    expect(msg.text).toContain("• sem Cebola"); // default ingredient removed
    expect(msg.text).not.toContain("Ovo"); // unchanged default: noise
    expect(msg.text).toContain("• Obs: sem tomate");
    expect(msg.text).toContain("• Sabores: Calabresa / Quatro queijos");
    expect(msg.text).toContain("*Total: R$ 116,70*");
    expect(msg.text).toContain("Pagamento: Dinheiro (troco para R$ 150,00: levar R$ 33,30)");
    expect(msg.text).toContain("Observações: Interfone quebrado, ligar ao chegar");
  });
  it("template parameters are single-line (Meta rejects line breaks)", () => {
    for (const p of msg.params) expect(p).not.toMatch(/\n|\t| {4,}/);
    expect(msg.params[0]).toBe("12");
    expect(msg.params[2]).toContain("2x X-Salada - R$ 53,80 (Ponto da carne: Bem passado, + Bacon, sem Cebola, Obs: sem tomate); 1x Pizza Grande");
  });
  it("pickup, Pix and card render their own payment/fulfillment lines", () => {
    const pix = newOrderMessage({ ...order, fulfillment: "PICKUP", address: null, payment: { kind: "PIX", changeForCents: null } }, "X", "u");
    expect(pix.text).toContain("Retirada no balcão");
    expect(pix.text).not.toContain("Entrega: R$");
    expect(pix.text).toContain("Pagamento: Pix (conferir o comprovante)");
    expect(newOrderMessage({ ...order, payment: { kind: "CARD", changeForCents: null } }, "X", "u").text).toContain("Pagamento: Cartão na entrega");
  });
});

describe("message to the customer (status update)", () => {
  it("explains the new status and links to the tracking page", () => {
    const msg = statusUpdateMessage({ ...order, status: "PREPARING" }, "Burger do Zé", "https://app/burger-do-ze/pedido/tok");
    expect(msg.text).toBe("*Burger do Zé* - pedido #12\nO restaurante confirmou e está preparando seu pedido.\n\nAcompanhe: https://app/burger-do-ze/pedido/tok");
  });
  it("includes the cancel reason", () => {
    const msg = statusUpdateMessage({ ...order, status: "CANCELED", cancelReason: "Acabou o pão" }, "Burger do Zé", "u");
    expect(msg.text).toContain("Motivo: Acabou o pão");
    expect(msg.params[2]).toBe("Seu pedido foi cancelado pelo restaurante. Motivo: Acabou o pão");
  });
});

describe("guest checkout", () => {
  const ok = { fulfillment: "DELIVERY" as const, address: { found: true, attended: true, number: "10" }, customerName: "Ana", whatsapp: "(51) 99999-8888", paymentKind: "CASH" as const, changeForCents: null, totalCents: 3000 };
  it("valid state has no issues", () => expect(checkoutIssues(ok)).toEqual([]));
  it("delivery needs an attended address with a number; pickup doesn't", () => {
    expect(checkoutIssues({ ...ok, address: null })).toEqual(["ADDRESS_REQUIRED"]);
    expect(checkoutIssues({ ...ok, address: { found: true, attended: false, number: "10" } })).toEqual(["ADDRESS_NOT_ATTENDED"]);
    expect(checkoutIssues({ ...ok, address: { found: true, attended: true, number: " " } })).toEqual(["ADDRESS_NUMBER_REQUIRED"]);
    expect(checkoutIssues({ ...ok, fulfillment: "PICKUP", address: null })).toEqual([]);
  });
  it("requires a name and a valid WhatsApp mobile", () => {
    expect(checkoutIssues({ ...ok, customerName: " ", whatsapp: "" })).toEqual(["NAME_REQUIRED", "WHATSAPP_REQUIRED"]);
    expect(checkoutIssues({ ...ok, whatsapp: "3333-4444" })).toEqual(["WHATSAPP_INVALID"]);
  });
  it("requires a payment; troco must cover the total (cash only)", () => {
    expect(checkoutIssues({ ...ok, paymentKind: null })).toEqual(["PAYMENT_REQUIRED"]);
    expect(checkoutIssues({ ...ok, changeForCents: 2000 })).toEqual(["CHANGE_TOO_LOW"]);
    expect(checkoutIssues({ ...ok, paymentKind: "PIX", changeForCents: 2000 })).toEqual([]);
  });
});

describe("payment options", () => {
  it("lists what the store accepts (Pix first: no change, instant)", () => {
    expect(availablePaymentKinds({ cash: true, card: true, pix: { keyType: "EMAIL", key: "a@b.com", holderName: "Zé" } })).toEqual(["PIX", "CARD", "CASH"]);
    expect(availablePaymentKinds({ cash: true, card: false, pix: null })).toEqual(["CASH"]);
  });
});
