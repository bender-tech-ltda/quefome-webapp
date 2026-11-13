"use client";

import type { PublicOrder } from "@quefome/contract";
import { PIX_KEY_TYPE_LABELS, TRACKING_STEPS, formatMoney, formatTime, itemDetails, orderStatusDescription, orderStatusLabel, paymentSummary, whatsappLink } from "@quefome/domain";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { ApiRequestError, api } from "@/lib/api";

const POLL_MS = 15_000;

/** Customer's order page (link also sent on WhatsApp). Polls; the customer is also notified on WhatsApp. */
export function OrderPage({ token, timeZone }: { token: string; timeZone: string }) {
  const query = useQuery({
    queryKey: ["order", token],
    queryFn: () => api.getPublicOrder(token),
    refetchInterval: (q) => (q.state.data && ["DELIVERED", "CANCELED"].includes(q.state.data.status) ? false : q.state.data?.restaurantNotified === false ? 3_000 : POLL_MS),
    refetchOnWindowFocus: true,
  });
  if (query.isError && query.error instanceof ApiRequestError && query.error.isNotFound) {
    return (
      <div className="not-found">
        <p className="title">Pedido não encontrado</p>
      </div>
    );
  }
  if (!query.data) return <LoadingAnimation message="Carregando seu pedido..." />;
  return <OrderView order={query.data} timeZone={timeZone} />;
}

function OrderView({ order, timeZone }: { order: PublicOrder; timeZone: string }) {
  const canceled = order.status === "CANCELED";
  const reached = (status: string) => order.statusHistory.find((h) => h.status === status);
  const storeChat = order.store.whatsapp ? whatsappLink(order.store.whatsapp, `Olá! Sobre o meu pedido #${order.number}`) : null;

  return (
    <div className="qf-order">
      <header className="qf-order-header">
        <p className="qf-order-store">{order.store.name}</p>
        <h1>Pedido #{order.number}</h1>
      </header>

      <section className={`qf-card qf-status${canceled ? " canceled" : ""}`} aria-live="polite">
        <p className="qf-status-text">{orderStatusDescription(order.status, order.fulfillment)}</p>
        {canceled && order.cancelReason && <p className="qf-status-reason">Motivo: {order.cancelReason}</p>}
        {!canceled && (
          <ol className="qf-steps">
            {TRACKING_STEPS.map((step) => {
              const at = reached(step);
              const label = step === "READY" ? (order.fulfillment === "PICKUP" ? "Pronto p/ retirar" : "Saindo p/ entrega") : orderStatusLabel(step === "PENDING" ? "PENDING" : step);
              return (
                <li key={step} className={at ? "done" : ""} aria-current={order.status === step ? "step" : undefined}>
                  <span className="qf-step-dot" aria-hidden="true" />
                  <span className="qf-step-label">{step === "PENDING" ? "Enviado" : label}</span>
                  {at && <span className="qf-step-time">{formatTime(new Date(at.at), timeZone)}</span>}
                </li>
              );
            })}
          </ol>
        )}
        <p className="qf-notified">
          {order.restaurantNotified ? (
            <>
              <Icon name="place-check" /> O restaurante recebeu seu pedido no WhatsApp.
            </>
          ) : (
            <>
              <Icon name="loading" spin /> Enviando seu pedido para o restaurante...
            </>
          )}
        </p>
        <p className="qf-hint">Você recebe as próximas atualizações no seu WhatsApp.</p>
      </section>

      {order.pix && order.status !== "CANCELED" && <PixBox order={order} />}

      <section className="qf-card" aria-labelledby="sec-summary">
        <h2 id="sec-summary">Resumo</h2>
        <ul className="qf-lines">
          {order.items.map((item, i) => (
            <li key={`${item.productId}-${i}`}>
              <span>
                {item.quantity}x {item.productName}
                {itemDetails(item).length > 0 && <small>{itemDetails(item).join(" · ")}</small>}
              </span>
              <span>R$ {formatMoney(item.totalCents)}</span>
            </li>
          ))}
        </ul>
        <div className="qf-totals">
          {order.fulfillment === "DELIVERY" && (
            <p>
              <span>Entrega</span>
              <span>{order.deliveryFeeCents === 0 ? "Grátis" : `R$ ${formatMoney(order.deliveryFeeCents)}`}</span>
            </p>
          )}
          <p className="qf-total">
            <span>Total</span>
            <span>R$ {formatMoney(order.totalCents)}</span>
          </p>
        </div>
        <p className="qf-hint">
          {order.fulfillment === "PICKUP" ? "Retirada no balcão" : "Entrega no endereço informado"} · {paymentSummary(order).replace(" (conferir o comprovante)", "")}
        </p>
      </section>

      <div className="qf-actions">
        {storeChat && (
          <a className="btn btn-success btn-block" href={storeChat} target="_blank" rel="noreferrer">
            Falar com o restaurante no WhatsApp
          </a>
        )}
        <Link className="btn btn-link btn-block" href={`/${order.store.slug}`}>
          Fazer outro pedido
        </Link>
      </div>
    </div>
  );
}

function PixBox({ order }: { order: PublicOrder }) {
  const [copied, setCopied] = useState(false);
  const pix = order.pix!;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  const receipt = order.store.whatsapp ? whatsappLink(order.store.whatsapp, `Olá! Segue o comprovante do Pix do pedido #${order.number} (R$ ${formatMoney(order.totalCents)}).`) : null;
  return (
    <section className="qf-card qf-pix" aria-labelledby="sec-pix">
      <h2 id="sec-pix">Pague com Pix</h2>
      <p>
        Valor: <strong>R$ {formatMoney(order.totalCents)}</strong>
      </p>
      <p className="qf-pix-key">
        <span>
          Chave ({PIX_KEY_TYPE_LABELS[pix.keyType]}): <strong>{pix.key}</strong>
        </span>
        <button type="button" className="btn btn-default btn-sm" onClick={copy}>
          {copied ? "Copiado!" : "Copiar chave"}
        </button>
      </p>
      <p className="qf-hint">Favorecido: {pix.holderName}</p>
      {receipt && (
        <a className="btn btn-default btn-block" href={receipt} target="_blank" rel="noreferrer">
          Enviar comprovante no WhatsApp
        </a>
      )}
    </section>
  );
}
