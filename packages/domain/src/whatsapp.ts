/**
 * WhatsApp messages (pt-BR). Pure functions: the API renders them into the outbox, tests assert them.
 * Two renderings per message:
 *  - `text`: rich multi-line body (dev inbox, and free-form messages inside WhatsApp's 24h window);
 *  - `params`: single-line values for an approved Cloud API TEMPLATE (Meta forbids line breaks, tabs and
 *    more than 4 consecutive spaces in template parameters).
 */
import { formatAddressLine } from "./address";
import { formatPhone, onlyDigits } from "./format";
import { formatMoney } from "./money";
import { type OrderStatus, orderStatusDescription } from "./order";
import { PAYMENT_LABELS, type PaymentKind } from "./payment";
import type { Fulfillment } from "./pricing";

export interface MessageOrderItem {
  quantity: number;
  productName: string;
  flavors: { name: string }[];
  components: { name: string; value: { kind: "toggle"; on: boolean; defaultOn?: boolean } | { kind: "choice"; optionName: string | null } }[];
  instructions: string;
  totalCents: number;
}

export interface MessageOrder {
  number: number;
  status: OrderStatus;
  fulfillment: Fulfillment;
  customer: { name: string; whatsapp: string };
  address: { street: string; number: string; complement: string; neighborhood: string; city: string; state: string } | null;
  items: MessageOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  payment: { kind: PaymentKind; changeForCents: number | null };
  notes: string;
  cancelReason?: string | null;
}

export interface RenderedMessage {
  text: string;
  params: string[];
}

/** Click-to-chat link (wa.me): used for "talk to the restaurant/customer" buttons. */
export function whatsappLink(e164: string, text?: string): string {
  const base = `https://wa.me/${onlyDigits(e164)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Details of an item that differ from the product's defaults: "Bem passado", "+ Bacon", "sem Cebola". */
export function itemDetails(item: MessageOrderItem): string[] {
  const details: string[] = [];
  if (item.flavors.length) details.push(`Sabores: ${item.flavors.map((f) => f.name).join(" / ")}`);
  for (const c of item.components) {
    if (c.value.kind === "choice") {
      if (c.value.optionName) details.push(`${c.name}: ${c.value.optionName}`);
    } else if (c.value.on !== (c.value.defaultOn ?? false)) {
      details.push(c.value.on ? `+ ${c.name}` : `sem ${c.name}`);
    }
  }
  if (item.instructions.trim()) details.push(`Obs: ${item.instructions.trim()}`);
  return details;
}

export function paymentSummary(order: Pick<MessageOrder, "payment" | "totalCents">): string {
  const { kind, changeForCents } = order.payment;
  if (kind === "CASH" && changeForCents && changeForCents > order.totalCents) {
    return `${PAYMENT_LABELS.CASH} (troco para R$ ${formatMoney(changeForCents)}: levar R$ ${formatMoney(changeForCents - order.totalCents)})`;
  }
  if (kind === "CASH") return `${PAYMENT_LABELS.CASH} (sem troco)`;
  if (kind === "PIX") return `${PAYMENT_LABELS.PIX} (conferir o comprovante)`;
  return PAYMENT_LABELS[kind];
}

export function fulfillmentSummary(order: Pick<MessageOrder, "fulfillment" | "address">): string {
  if (order.fulfillment === "PICKUP" || !order.address) return "Retirada no balcão";
  const a = order.address;
  return `Entrega: ${formatAddressLine(a)}, ${a.city}`;
}

const singleLine = (value: string) => value.replace(/\s*\n+\s*/g, " | ").replace(/\t/g, " ").replace(/ {4,}/g, "   ").trim();

/** To the RESTAURANT when a new order arrives. */
export function newOrderMessage(order: MessageOrder, storeName: string, dashboardUrl: string): RenderedMessage {
  const items = order.items.map((item) => {
    const details = itemDetails(item);
    return { line: `${item.quantity}x ${item.productName} - R$ ${formatMoney(item.totalCents)}`, details };
  });
  const text = [
    `*Novo pedido #${order.number}* - ${storeName}`,
    "",
    `Cliente: ${order.customer.name} - ${formatPhone(order.customer.whatsapp)}`,
    fulfillmentSummary(order),
    "",
    "*Itens*",
    ...items.flatMap((i) => [i.line, ...i.details.map((d) => `   • ${d}`)]),
    "",
    `Subtotal: R$ ${formatMoney(order.subtotalCents)}`,
    ...(order.fulfillment === "DELIVERY" ? [`Entrega: R$ ${formatMoney(order.deliveryFeeCents)}`] : []),
    `*Total: R$ ${formatMoney(order.totalCents)}*`,
    `Pagamento: ${paymentSummary(order)}`,
    ...(order.notes.trim() ? ["", `Observações: ${order.notes.trim()}`] : []),
    "",
    `Abrir no painel: ${dashboardUrl}`,
  ].join("\n");
  const params = [
    String(order.number),
    `${order.customer.name} - ${formatPhone(order.customer.whatsapp)}`,
    items.map((i) => (i.details.length ? `${i.line} (${i.details.join(", ")})` : i.line)).join("; "),
    `R$ ${formatMoney(order.totalCents)}`,
    paymentSummary(order),
    fulfillmentSummary(order),
    dashboardUrl,
  ].map(singleLine);
  return { text, params };
}

/** To the CUSTOMER when the restaurant changes the order status. */
export function statusUpdateMessage(order: MessageOrder, storeName: string, trackingUrl: string): RenderedMessage {
  const description = orderStatusDescription(order.status, order.fulfillment);
  const reason = order.status === "CANCELED" && order.cancelReason ? `Motivo: ${order.cancelReason}` : null;
  const text = [`*${storeName}* - pedido #${order.number}`, description, ...(reason ? [reason] : []), "", `Acompanhe: ${trackingUrl}`].join("\n");
  const params = [storeName, String(order.number), reason ? `${description} ${reason}` : description, trackingUrl].map(singleLine);
  return { text, params };
}
