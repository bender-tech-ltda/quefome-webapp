import { describe, expect, it } from "vitest";
import { renderTicketHtml } from "@/features/admin/ticket";
import { order } from "./fixtures";

const text = (html: string) => html.replace(/\n/g, "").replace(/<br\/>/g, "\n").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "");

describe("kitchen ticket", () => {
  it("has what the kitchen and the motoboy need", () => {
    const t = text(renderTicketHtml(order, "Burger do Zé", "America/Sao_Paulo"));
    expect(t).toContain("Pedido #12 - 15/03/2024 20:05");
    expect(t).toContain("WhatsApp: (51) 99999-8888");
    expect(t).toContain("Entrega: Rua Quinze de Janeiro, nº 10, compl. ap 2 - Bairro Centro - Canoas");
    expect(t).toContain("1x Pizza Grande - R$ 57,90");
    expect(t).toContain("- Sabores: Calabresa / Quatro queijos");
    expect(t).toContain("- Borda: Catupiry");
    expect(t).not.toContain("Orégano"); // unchanged default: noise
    expect(t).toContain("Total: R$ 62,90");
    expect(t).toContain("Pagamento: Dinheiro (troco para R$ 100,00: levar R$ 37,10)");
    expect(t).toContain("Obs: Interfone quebrado");
  });
  it("pickup orders print the pickup notice", () => {
    expect(text(renderTicketHtml({ ...order, fulfillment: "PICKUP", address: null }, "X", "America/Sao_Paulo"))).toContain("RETIRADA NO BALCÃO");
  });
  it("escapes customer-provided text", () => {
    const html = renderTicketHtml(order, "X", "America/Sao_Paulo");
    expect(html).toContain("Ana &lt;b&gt;Cliente&lt;/b&gt;");
  });
});
