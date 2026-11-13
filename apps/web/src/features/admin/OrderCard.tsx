"use client";

import type { AdminOrder } from "@quefome/contract";
import {
  type OrderStatus,
  advanceActionLabel,
  formatAddressLine,
  formatDayMonthTime,
  formatMoney,
  formatPhone,
  formatTime,
  itemDetails,
  nextStatus,
  orderStatusLabel,
  paymentSummary,
  whatsappLink,
} from "@quefome/domain";
import { useState } from "react";
import { printHtml, renderTicketHtml } from "./ticket";

const CANCEL_REASONS = ["Produto em falta", "Endereço fora da área de entrega", "Restaurante fechando", "Pedido duplicado"];

function notificationBadge(order: AdminOrder): { text: string; tone: "ok" | "warn" | "error" } | null {
  const failed = order.notifications.find((n) => n.status === "FAILED");
  if (failed) return { text: failed.recipient === "CUSTOMER" ? "WhatsApp ao cliente falhou" : "Aviso no WhatsApp da loja falhou", tone: "error" };
  const lastCustomer = [...order.notifications].reverse().find((n) => n.recipient === "CUSTOMER");
  if (lastCustomer) return lastCustomer.status === "SENT" ? { text: "Cliente avisado no WhatsApp", tone: "ok" } : { text: "Avisando cliente no WhatsApp...", tone: "warn" };
  return null;
}

/** One order on the board / history. Actions are hidden when `readOnly`. */
export function OrderCard({
  order,
  storeName,
  timeZone,
  now,
  readOnly = false,
  busy = false,
  onAdvance,
  onCancel,
}: {
  order: AdminOrder;
  storeName: string;
  timeZone: string;
  now: number;
  readOnly?: boolean;
  busy?: boolean;
  onAdvance?: (order: AdminOrder, to: OrderStatus) => void;
  onCancel?: (order: AdminOrder, reason: string) => void;
}) {
  const [canceling, setCanceling] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]!);
  const [otherReason, setOtherReason] = useState("");
  const status = order.status as OrderStatus;
  const next = nextStatus(status);
  const minutes = Math.max(0, Math.round((now - Date.parse(order.createdAt)) / 60_000));
  const badge = notificationBadge(order);
  const chat = whatsappLink(order.customer.whatsapp, `Olá, ${order.customer.name.split(" ")[0]}! Aqui é do ${storeName}, sobre o seu pedido #${order.number}.`);

  return (
    <article className={`qf-order-card status-${status.toLowerCase()}`} aria-label={`Pedido #${order.number}`}>
      <header>
        <strong className="qf-order-number">#{order.number}</strong>
        <span className="qf-order-time">
          {readOnly ? formatDayMonthTime(new Date(order.createdAt), timeZone) : `${formatTime(new Date(order.createdAt), timeZone)} · há ${minutes} min`}
        </span>
        <span className={`qf-badge ${order.fulfillment === "PICKUP" ? "pickup" : "delivery"}`}>{order.fulfillment === "PICKUP" ? "Retirada" : "Entrega"}</span>
        {readOnly && <span className={`qf-badge status-${status.toLowerCase()}`}>{orderStatusLabel(status)}</span>}
      </header>

      <p className="qf-customer">
        <span>{order.customer.name}</span>
        <a href={chat} target="_blank" rel="noreferrer" className="qf-wa-link" aria-label={`Conversar com ${order.customer.name} no WhatsApp`}>
          {formatPhone(order.customer.whatsapp)}
        </a>
      </p>
      {order.fulfillment === "DELIVERY" && order.address && <p className="qf-address">{formatAddressLine(order.address)}</p>}

      <ul className="qf-items">
        {order.items.map((item, i) => (
          <li key={`${item.productId}-${i}`}>
            <span className="qf-qty">{item.quantity}x</span> {item.productName}
            {itemDetails(item).map((d) => (
              <small key={d}>{d}</small>
            ))}
          </li>
        ))}
      </ul>
      {order.notes && <p className="qf-notes">Obs: {order.notes}</p>}

      <p className="qf-payment">
        <strong>R$ {formatMoney(order.totalCents)}</strong> · {paymentSummary(order)}
      </p>
      {order.status === "CANCELED" && order.cancelReason && <p className="qf-cancel-reason">Cancelado: {order.cancelReason}</p>}
      {badge && <p className={`qf-notify ${badge.tone}`}>{badge.text}</p>}

      {!readOnly && !canceling && (
        <div className="qf-card-actions">
          {next && (
            <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => onAdvance?.(order, next)}>
              {advanceActionLabel(status, order.fulfillment)}
            </button>
          )}
          <div className="qf-secondary-actions">
            <button type="button" className="btn btn-link" onClick={() => printHtml(`Pedido #${order.number}`, renderTicketHtml(order, storeName, timeZone))}>
              Imprimir
            </button>
            {next && (
              <button type="button" className="btn btn-link qf-danger" disabled={busy} onClick={() => setCanceling(true)}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {canceling && (
        <div className="qf-cancel" role="group" aria-label="Cancelar pedido">
          <label htmlFor={`reason-${order.id}`}>Motivo (o cliente recebe no WhatsApp)</label>
          <select id={`reason-${order.id}`} className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
            {[...CANCEL_REASONS, "Outro"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          {reason === "Outro" && <input className="form-control" aria-label="Outro motivo" placeholder="Descreva o motivo" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} />}
          <div className="qf-card-actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy || (reason === "Outro" && !otherReason.trim())}
              onClick={() => {
                onCancel?.(order, reason === "Outro" ? otherReason.trim() : reason);
                setCanceling(false);
              }}
            >
              Confirmar cancelamento
            </button>
            <button type="button" className="btn btn-link" onClick={() => setCanceling(false)}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
