"use client";

import { type AdminOrder, ORDER_STREAM_PATH, type StaffUser } from "@quefome/contract";
import { type OrderStatus, orderStatusLabel } from "@quefome/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { notify, requestNotificationPermission } from "@/components/notifications";
import { ApiRequestError, api } from "@/lib/api";
import { useAdminTitlePrefix } from "./AdminShell";
import { OrderCard } from "./OrderCard";
import { playNewOrderAlert, soundUnlocked, unlockSound } from "./sound";

const COLUMNS: { status: OrderStatus; title: string; empty: string }[] = [
  { status: "PENDING", title: "Novos", empty: "Nenhum pedido novo" },
  { status: "PREPARING", title: "Em preparo", empty: "Nada em preparo" },
  { status: "READY", title: "Prontos", empty: "Nada aguardando entrega/retirada" },
];
const FALLBACK_POLL_MS = 30_000;
const SOUND_KEY = "quefome:v1:board-sound";

/** Realtime feed (SSE through the same-origin proxy). EventSource reconnects by itself. */
function useOrderStream(onEvent: (type: "order.created" | "order.updated") => void) {
  const [connected, setConnected] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });
  useEffect(() => {
    const source = new EventSource(ORDER_STREAM_PATH);
    source.addEventListener("ready", () => setConnected(true));
    source.addEventListener("order.created", () => handler.current("order.created"));
    source.addEventListener("order.updated", () => handler.current("order.updated"));
    source.onerror = () => setConnected(false);
    return () => source.close();
  }, []);
  return connected;
}

/** Real-time order reception: sound on new orders, one-tap status progression, pause switch. */
export function Board({ user }: { user: StaffUser }) {
  const client = useQueryClient();
  const setTitlePrefix = useAdminTitlePrefix();
  const [tab, setTab] = useState<OrderStatus>("PENDING");
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  /** On phones each status is a tab: tell the merchant where the order went. */
  const [moved, setMoved] = useState<string | null>(null);

  const orders = useQuery({ queryKey: ["admin-orders", "board"], queryFn: () => api.admin.listOrders(), refetchInterval: FALLBACK_POLL_MS });
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: () => api.admin.getSettings() });

  const connected = useOrderStream((type) => {
    void client.invalidateQueries({ queryKey: ["admin-orders"] });
    if (type === "order.created") {
      playNewOrderAlert();
      notify("Novo pedido!", "Um novo pedido acabou de chegar.", { tag: "new-order", onlyIfHidden: true });
    }
  });

  useEffect(() => {
    requestNotificationPermission();
    const id = setInterval(() => setNow(Date.now()), 30_000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the merchant's sound preference
    if (window.localStorage.getItem(SOUND_KEY) === "on") setSoundOn(unlockSound() && soundUnlocked());
    return () => clearInterval(id);
  }, []);

  const list = orders.data ?? [];
  const byStatus = (s: OrderStatus) => list.filter((o) => o.status === s).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const pending = byStatus("PENDING").length;

  useEffect(() => {
    setTitlePrefix(pending > 0 ? `(${pending}) ` : "");
    return () => setTitlePrefix("");
  }, [pending, setTitlePrefix]);

  const change = useMutation({
    mutationFn: ({ order, status, reason }: { order: AdminOrder; status: OrderStatus; reason?: string }) =>
      api.admin.updateOrderStatus(order.id, { status, version: order.version, ...(reason ? { reason } : {}) }),
    onSuccess: (updated) => {
      setError(null);
      setMoved(`Pedido #${updated.number} → ${orderStatusLabel(updated.status)}`);
      client.setQueryData<AdminOrder[]>(["admin-orders", "board"], (old) => old?.map((o) => (o.id === updated.id ? updated : o)));
    },
    onError: (err) => {
      setError(err instanceof ApiRequestError && (err.isConflict || err.isBusinessError) ? err.message : "Não foi possível atualizar o pedido. Tente de novo.");
      void client.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const storeStatus = useMutation({
    mutationFn: (override: "OPEN" | "CLOSED" | null) => api.admin.setStoreStatus(override),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["admin-settings"] }),
  });
  const override = settings.data?.statusOverride ?? null;

  const enableSound = () => {
    const ok = unlockSound();
    setSoundOn(ok);
    window.localStorage.setItem(SOUND_KEY, ok ? "on" : "off");
    if (ok) playNewOrderAlert();
  };

  return (
    <div className="qf-board">
      <div className="qf-board-bar">
        <div className="qf-segmented" role="radiogroup" aria-label="Recebimento de pedidos">
          {([
            [null, "Seguir horário"],
            ["OPEN", "Aberto agora"],
            ["CLOSED", "Pausado"],
          ] as const).map(([value, label]) => (
            <button key={label} type="button" role="radio" aria-checked={override === value} className={override === value ? "active" : ""} disabled={storeStatus.isPending} onClick={() => storeStatus.mutate(value)}>
              {label}
            </button>
          ))}
        </div>
        <div className="qf-board-status">
          <span className={`qf-live ${connected ? "on" : "off"}`}>{connected ? "Ao vivo" : "Reconectando..."}</span>
          {soundOn ? (
            <span className="qf-sound on">Som ativado</span>
          ) : (
            <button type="button" className="btn btn-warning btn-sm" onClick={enableSound}>
              Ativar som de novos pedidos
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="qf-error" role="alert">
          {error}
        </p>
      )}
      {moved && !error && (
        <p className="qf-success qf-moved" role="status">
          {moved}
        </p>
      )}

      <div className="qf-tabs" role="tablist" aria-label="Pedidos por status">
        {COLUMNS.map((c) => (
          <button key={c.status} type="button" role="tab" aria-selected={tab === c.status} className={tab === c.status ? "active" : ""} onClick={() => setTab(c.status)}>
            {c.title} <span className="qf-count">{byStatus(c.status).length}</span>
          </button>
        ))}
      </div>

      <div className="qf-columns">
        {COLUMNS.map((c) => (
          <section key={c.status} className={`qf-column${tab === c.status ? " active" : ""}`} aria-label={c.title}>
            <h2>
              {c.title} <span className="qf-count">{byStatus(c.status).length}</span>
            </h2>
            {orders.isLoading && <p className="qf-empty">Carregando...</p>}
            {!orders.isLoading && byStatus(c.status).length === 0 && <p className="qf-empty">{c.empty}</p>}
            {byStatus(c.status).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                storeName={user.store.name}
                timeZone={user.store.timeZone}
                now={now}
                busy={change.isPending}
                onAdvance={(o, to) => change.mutate({ order: o, status: to })}
                onCancel={(o, reason) => change.mutate({ order: o, status: "CANCELED", reason })}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
