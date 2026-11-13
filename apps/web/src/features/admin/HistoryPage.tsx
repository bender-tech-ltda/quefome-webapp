"use client";

import type { AdminOrderQuery, StaffUser } from "@quefome/contract";
import { ORDER_STATUSES, formatMoney, orderStatusLabel, zonedParts } from "@quefome/domain";
import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { OrderCard } from "./OrderCard";

export function todayIn(timeZone: string, now = new Date()): string {
  const p = zonedParts(now, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function dateFilterMessage(from: string, to: string): string {
  if (!from) return "Informe a data inicial";
  if (!to) return "Informe a data final";
  if (from > to) return "A data inicial não pode ser maior que a data final";
  return "";
}

/** Order history by day (store time zone) and status, with the day's totals. */
export function HistoryPage({ user }: { user: StaffUser }) {
  const tz = user.store.timeZone;
  const today = todayIn(tz);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [query, setQuery] = useState<AdminOrderQuery>({ from: today, to: today });
  const [now] = useState(() => Date.now());
  const message = dateFilterMessage(from, to);
  const result = useQuery({ queryKey: ["admin-orders", "history", query], queryFn: () => api.admin.listOrders(query) });
  const orders = result.data ?? [];
  const delivered = orders.filter((o) => o.status === "DELIVERED");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (message) return;
    setQuery({ from, to, ...(status ? { status: status as AdminOrderQuery["status"] } : {}) });
  };

  return (
    <div className="qf-history">
      <div className="qf-page-head">
        <h1>Histórico</h1>
      </div>
      <form className="qf-card qf-filters" onSubmit={submit} noValidate>
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="h-from">De</label>
            <input id="h-from" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="qf-field">
            <label htmlFor="h-to">Até</label>
            <input id="h-to" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="qf-field">
            <label htmlFor="h-status">Status</label>
            <select id="h-status" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {message && (
          <p className="qf-error" role="alert">
            {message}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={!!message}>
          Pesquisar
        </button>
      </form>

      <p className="qf-summary" role="status">
        {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} · entregues: {delivered.length} · R$ {formatMoney(delivered.reduce((s, o) => s + o.totalCents, 0))}
      </p>
      <div className="qf-history-list">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} storeName={user.store.name} timeZone={tz} now={now} readOnly />
        ))}
      </div>
    </div>
  );
}
