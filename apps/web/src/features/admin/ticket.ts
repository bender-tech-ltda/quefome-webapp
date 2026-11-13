/**
 * Kitchen ticket, rendered in the browser from the order fetched from the API and printed via a hidden iframe.
 * DISCUSS: thermal printers (ESC/POS 58/80mm) need a print bridge; browser printing covers a counter PC.
 */
import type { AdminOrder } from "@quefome/contract";
import { formatAddressLine, formatDateTime, formatMoney, formatPhone, itemDetails, paymentSummary } from "@quefome/domain";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function renderTicketHtml(order: AdminOrder, storeName: string, timeZone: string): string {
  const e = escapeHtml;
  const out: string[] = [];
  out.push(`<b>${e(storeName)}</b><br/>`, `<b>Pedido #${order.number}</b> - ${formatDateTime(new Date(order.createdAt), timeZone)}<br/>`, "<br/>");
  out.push(`<b>Cliente:</b> ${e(order.customer.name)}<br/>`, `<b>WhatsApp:</b> ${e(formatPhone(order.customer.whatsapp))}<br/>`);
  if (order.fulfillment === "PICKUP" || !order.address) out.push("<b>RETIRADA NO BALCÃO</b><br/>");
  else out.push(`<b>Entrega:</b> ${e(formatAddressLine(order.address))} - ${e(order.address.city)}<br/>`);
  out.push("<br/>");
  for (const item of order.items) {
    out.push(`<b>${item.quantity}x ${e(item.productName)}</b> - R$ ${formatMoney(item.totalCents)}<br/>`);
    for (const d of itemDetails(item)) out.push(`&nbsp;&nbsp;- ${e(d)}<br/>`);
  }
  out.push("<br/>");
  if (order.fulfillment === "DELIVERY") out.push(`Entrega: R$ ${formatMoney(order.deliveryFeeCents)}<br/>`);
  out.push(`<b>Total: R$ ${formatMoney(order.totalCents)}</b><br/>`, `<b>Pagamento:</b> ${e(paymentSummary(order))}<br/>`);
  if (order.notes) out.push("<br/>", `<b>Obs:</b> ${e(order.notes)}<br/>`);
  return out.join("\n");
}

export function printHtml(title: string, content: string): void {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, { position: "fixed", width: "0", height: "0", border: "0" });
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }
  win.document.open();
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:monospace;font-size:12px;width:72mm}</style></head><body>${content}</body></html>`);
  win.document.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup);
  win.focus();
  win.print();
  setTimeout(cleanup, 60_000);
}
