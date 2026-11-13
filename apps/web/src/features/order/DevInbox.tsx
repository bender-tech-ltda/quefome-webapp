"use client";

import type { DevMessage } from "@quefome/contract";
import { formatPhone, formatTime } from "@quefome/domain";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { ApiRequestError, api } from "@/lib/api";

/** WhatsApp *bold* → <strong>, keeps line breaks. */
function WhatsAppText({ text }: { text: string }) {
  return (
    <p className="qf-bubble-text">
      {text.split(/(\*[^*\n]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? <strong key={i}>{part.slice(1, -1)}</strong> : <Fragment key={i}>{part}</Fragment>,
      )}
    </p>
  );
}

/**
 * Development-only inbox: every WhatsApp message the platform would send (MESSAGING_PROVIDER=log).
 * Lets you demo/test the whole flow without a Meta account.
 */
export function DevInbox() {
  const [who, setWho] = useState<"ALL" | DevMessage["recipient"]>("ALL");
  const messages = useQuery({ queryKey: ["dev-messages"], queryFn: () => api.dev.messages(), refetchInterval: 2000, retry: false });

  if (messages.isError) {
    const notAvailable = messages.error instanceof ApiRequestError && messages.error.isNotFound;
    return (
      <div className="not-found">
        <p className="title">Caixa de WhatsApp de desenvolvimento</p>
        <p>{notAvailable ? "Disponível apenas em desenvolvimento (MESSAGING_PROVIDER=log)." : "Não foi possível carregar as mensagens."}</p>
      </div>
    );
  }
  const list = (messages.data ?? []).filter((m) => who === "ALL" || m.recipient === who);

  return (
    <div className="qf-inbox">
      <h1>WhatsApp (simulado)</h1>
      <p className="qf-hint">Mensagens que seriam enviadas pelo WhatsApp. Em produção elas saem pela API oficial do WhatsApp.</p>
      <div className="qf-segmented" role="radiogroup" aria-label="Destinatário">
        {(["ALL", "STORE", "CUSTOMER"] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={who === r} className={who === r ? "active" : ""} onClick={() => setWho(r)}>
            {r === "ALL" ? "Todas" : r === "STORE" ? "Para restaurantes" : "Para clientes"}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="qf-empty">Nenhuma mensagem ainda. Faça um pedido!</p>}
      <ul className="qf-bubbles">
        {list.map((m) => (
          <li key={m.id} className={`qf-bubble ${m.recipient.toLowerCase()}`} aria-label={`Mensagem para ${m.recipient === "STORE" ? "o restaurante" : "o cliente"}`}>
            <p className="qf-bubble-meta">
              Para {m.recipient === "STORE" ? m.storeName : "cliente"} · {formatPhone(m.to)} · {formatTime(new Date(m.createdAt))} · {m.status === "SENT" ? "✓✓" : m.status === "FAILED" ? "falhou" : "enviando"}
            </p>
            <WhatsAppText text={m.text} />
          </li>
        ))}
      </ul>
    </div>
  );
}
