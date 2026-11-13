/**
 * MVP order lifecycle: PENDING → PREPARING → READY → DELIVERED, plus CANCELED.
 * Forward-only (no "undo"), cancel allowed until the order is delivered.
 * DISCUSS: an OUT_FOR_DELIVERY step and an "undo last step" action (see docs/MVP_SCOPE.md).
 */
import type { Fulfillment } from "./pricing";

export const ORDER_STATUSES = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PREPARING", "CANCELED"],
  PREPARING: ["READY", "CANCELED"],
  READY: ["DELIVERED", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** The single "move forward" action shown on the merchant board. */
export function nextStatus(from: OrderStatus): OrderStatus | null {
  return ORDER_TRANSITIONS[from].find((s) => s !== "CANCELED") ?? null;
}

export const isFinalStatus = (s: OrderStatus) => s === "DELIVERED" || s === "CANCELED";

/** Merchant-facing labels. */
export function orderStatusLabel(status: OrderStatus | string): string {
  switch (status) {
    case "PENDING":
      return "Novo";
    case "PREPARING":
      return "Em preparo";
    case "READY":
      return "Pronto";
    case "DELIVERED":
      return "Entregue";
    case "CANCELED":
      return "Cancelado";
    default:
      return "Desconhecido";
  }
}

/** Label of the board's main button to move the order forward. */
export function advanceActionLabel(from: OrderStatus, fulfillment: Fulfillment): string | null {
  switch (from) {
    case "PENDING":
      return "Aceitar e preparar";
    case "PREPARING":
      return fulfillment === "PICKUP" ? "Pronto para retirada" : "Pronto para entrega";
    case "READY":
      return fulfillment === "PICKUP" ? "Cliente retirou" : "Entregue";
    default:
      return null;
  }
}

/** Customer-facing description (tracking page + WhatsApp). */
export function orderStatusDescription(status: OrderStatus | string, fulfillment: Fulfillment): string {
  switch (status) {
    case "PENDING":
      return "Pedido enviado! Aguardando o restaurante confirmar.";
    case "PREPARING":
      return "O restaurante confirmou e está preparando seu pedido.";
    case "READY":
      return fulfillment === "PICKUP" ? "Seu pedido está pronto para retirada!" : "Seu pedido está pronto e logo sai para entrega!";
    case "DELIVERED":
      return fulfillment === "PICKUP" ? "Pedido retirado. Bom apetite!" : "Pedido entregue. Bom apetite!";
    case "CANCELED":
      return "Seu pedido foi cancelado pelo restaurante.";
    default:
      return "Não conseguimos identificar o status do seu pedido. Fale com o restaurante.";
  }
}

/** Steps shown on the tracking page (cancel is shown separately). */
export const TRACKING_STEPS: OrderStatus[] = ["PENDING", "PREPARING", "READY", "DELIVERED"];

// ---------------------------------------------------------------------------
// Product summary (order lists)
// ---------------------------------------------------------------------------

export interface SummaryItem {
  product: { id: string; name: string };
  quantity?: number | null;
}

/**
 * "X-Salada (2), Pizza Grande (1) e mais outro produto."
 * Grouped by product, in the order the items were added (the legacy sorted by numeric id, which is
 * meaningless with UUIDs); the suffix counts the products not shown.
 */
export function productSummary(items: SummaryItem[], limit = 3): { text: string; distinctProducts: number } {
  const grouped = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    const entry = grouped.get(item.product.id) ?? { name: item.product.name, quantity: 0 };
    entry.quantity += item.quantity && item.quantity > 0 ? item.quantity : 1;
    grouped.set(item.product.id, entry);
  }
  const all = [...grouped.values()];
  const shown = all.slice(0, limit).map((p) => `${p.name} (${p.quantity})`).join(", ");
  const hidden = all.length - Math.min(limit, all.length);
  const suffix = hidden === 0 ? "" : hidden === 1 ? " e mais outro produto." : ` e mais outros ${hidden} produtos.`;
  return { text: shown + suffix, distinctProducts: all.length };
}
