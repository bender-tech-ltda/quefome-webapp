"use client";

import type { StoreSettings, StoreSettingsUpdate } from "@quefome/contract";
import { PIX_KEY_TYPE_LABELS, type PixSettings, WEEKDAY_NAMES, formatMoney, formatPhone, isValidZipCode, normalizeBrazilianPhone, parseMoneyInput } from "@quefome/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { type FormEvent, useEffect, useState } from "react";
import { ApiRequestError, api } from "@/lib/api";
import { brand } from "@/lib/config";
import { useStaffAuthActions } from "./useStaffSession";

interface Form {
  name: string;
  description: string;
  whatsapp: string;
  address: StoreSettings["address"];
  days: { open: boolean; opensAt: string; closesAt: string }[];
  deliveryEnabled: boolean;
  deliveryFee: string;
  minimumOrder: string;
  areaMode: "CITY" | "NEIGHBORHOODS";
  neighborhoods: string;
  minMinutes: string;
  maxMinutes: string;
  pickupEnabled: boolean;
  cash: boolean;
  card: boolean;
  pixEnabled: boolean;
  pix: PixSettings;
  cuisineTypeIds: string[];
  published: boolean;
}

function toForm(s: StoreSettings): Form {
  return {
    name: s.name,
    description: s.description,
    whatsapp: formatPhone(s.whatsapp),
    address: s.address,
    days: WEEKDAY_NAMES.map((_, weekDay) => {
      const found = s.schedules.find((x) => x.weekDay === weekDay);
      return { open: !!found, opensAt: found?.opensAt ?? "18:00", closesAt: found?.closesAt ?? "23:00" };
    }),
    deliveryEnabled: s.deliveryEnabled,
    deliveryFee: formatMoney(s.deliveryFeeCents),
    minimumOrder: s.minimumOrderCents ? formatMoney(s.minimumOrderCents) : "",
    areaMode: s.deliveryArea.mode,
    neighborhoods: s.deliveryArea.neighborhoods.join("\n"),
    minMinutes: s.deliveryTime.minMinutes?.toString() ?? "",
    maxMinutes: s.deliveryTime.maxMinutes?.toString() ?? "",
    pickupEnabled: s.pickupEnabled,
    cash: s.payment.cash,
    card: s.payment.card,
    pixEnabled: !!s.payment.pix,
    pix: s.payment.pix ?? { keyType: "CNPJ", key: "", holderName: "" },
    cuisineTypeIds: s.cuisineTypeIds,
    published: s.published,
  };
}

/** Returns the update or a validation message. */
function toUpdate(f: Form, timeZone: string): StoreSettingsUpdate | string {
  const whatsapp = normalizeBrazilianPhone(f.whatsapp);
  if (!whatsapp) return "Informe o WhatsApp da loja com DDD.";
  const fee = parseMoneyInput(f.deliveryFee || "0");
  if (fee === null) return "Taxa de entrega inválida.";
  const minimum = f.minimumOrder.trim() ? parseMoneyInput(f.minimumOrder) : null;
  if (f.minimumOrder.trim() && minimum === null) return "Pedido mínimo inválido.";
  if (f.pixEnabled && (!f.pix.key.trim() || !f.pix.holderName.trim())) return "Informe a chave Pix e o nome do favorecido.";
  const minutes = (v: string) => (v.trim() ? Number(v) : null);
  return {
    name: f.name.trim(),
    description: f.description.trim(),
    whatsapp,
    address: f.address,
    timeZone,
    schedules: f.days.flatMap((d, weekDay) => (d.open ? [{ weekDay, opensAt: d.opensAt, closesAt: d.closesAt }] : [])),
    deliveryEnabled: f.deliveryEnabled,
    deliveryFeeCents: fee,
    minimumOrderCents: minimum,
    deliveryArea: { mode: f.areaMode, neighborhoods: f.neighborhoods.split(/[\n,]/).map((n) => n.trim()).filter(Boolean) },
    deliveryTime: { minMinutes: minutes(f.minMinutes), maxMinutes: minutes(f.maxMinutes) },
    pickupEnabled: f.pickupEnabled,
    payment: { cash: f.cash, card: f.card, pix: f.pixEnabled ? { ...f.pix, key: f.pix.key.trim(), holderName: f.pix.holderName.trim() } : null },
    cuisineTypeIds: f.cuisineTypeIds,
    published: f.published,
  };
}

/** Store profile and setup (MVP): profile, address, hours, delivery, payment, marketplace, publish + link/QR. */
export function SettingsPage() {
  const client = useQueryClient();
  const { refresh } = useStaffAuthActions();
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: () => api.admin.getSettings() });
  const cuisines = useQuery({ queryKey: ["cuisine-types"], queryFn: () => api.listCuisineTypes(), staleTime: 600_000 });
  const [form, setForm] = useState<Form | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [zipStatus, setZipStatus] = useState<"idle" | "searching" | "not-found">("idle");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize the form once data arrives
    if (settings.data && !form) setForm(toForm(settings.data));
  }, [settings.data, form]);

  const save = useMutation({
    mutationFn: (update: StoreSettingsUpdate) => api.admin.updateSettings(update),
    onSuccess: (saved) => {
      client.setQueryData(["admin-settings"], saved);
      setForm(toForm(saved));
      setMessage({ tone: "ok", text: saved.published ? "Salvo! Sua loja está publicada." : "Salvo!" });
      void refresh();
    },
    onError: (err) => setMessage({ tone: "error", text: err instanceof ApiRequestError && err.isBusinessError ? err.message : "Não foi possível salvar agora." }),
  });

  if (!settings.data || !form) return <p className="qf-empty">Carregando...</p>;
  const s = settings.data;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });
  const setAddress = (patch: Partial<Form["address"]>) => setForm({ ...form, address: { ...form.address, ...patch } });

  const lookupZip = async () => {
    setZipStatus("searching");
    try {
      const found = await api.lookupZipCode(form.address.zipCode);
      setAddress({ zipCode: found.zipCode, street: found.street, neighborhood: found.neighborhood, city: found.city, state: found.state });
      setZipStatus("idle");
    } catch {
      setZipStatus("not-found");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const update = toUpdate(form, s.timeZone);
    if (typeof update === "string") return setMessage({ tone: "error", text: update });
    save.mutate(update);
  };

  return (
    <form className="qf-settings" onSubmit={submit} noValidate>
      <div className="qf-page-head">
        <h1>Minha loja</h1>
      </div>

      {s.published && <ShareCard slug={s.slug} />}

      <section className="qf-card" aria-labelledby="st-profile">
        <h2 id="st-profile">Perfil</h2>
        <div className="qf-field">
          <label htmlFor="st-name">Nome</label>
          <input id="st-name" className="form-control" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="qf-field">
          <label htmlFor="st-description">Descrição</label>
          <input id="st-description" className="form-control" placeholder="Ex.: Hambúrgueres artesanais" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="qf-field">
          <label htmlFor="st-whatsapp">WhatsApp que recebe os pedidos</label>
          <input id="st-whatsapp" className="form-control" type="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
        </div>
        <p className="qf-hint">
          Link da loja: {brand.siteUrl.replace(/^https?:\/\//, "")}/{s.slug}
        </p>
      </section>

      <section className="qf-card" aria-labelledby="st-address">
        <h2 id="st-address">Endereço</h2>
        <div className="qf-field">
          <label htmlFor="st-zip">CEP</label>
          <div className="qf-inline">
            <input id="st-zip" className="form-control" inputMode="numeric" value={form.address.zipCode} onChange={(e) => setAddress({ zipCode: e.target.value })} />
            <button type="button" className="btn btn-default" disabled={!isValidZipCode(form.address.zipCode) || zipStatus === "searching"} onClick={lookupZip}>
              Buscar
            </button>
          </div>
          {zipStatus === "not-found" && <p className="qf-error">CEP não encontrado; preencha manualmente.</p>}
        </div>
        <div className="qf-field">
          <label htmlFor="st-street">Rua</label>
          <input id="st-street" className="form-control" value={form.address.street} onChange={(e) => setAddress({ street: e.target.value })} />
        </div>
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="st-number">Número</label>
            <input id="st-number" className="form-control" value={form.address.number} onChange={(e) => setAddress({ number: e.target.value })} />
          </div>
          <div className="qf-field">
            <label htmlFor="st-neighborhood">Bairro</label>
            <input id="st-neighborhood" className="form-control" value={form.address.neighborhood} onChange={(e) => setAddress({ neighborhood: e.target.value })} />
          </div>
        </div>
        <div className="qf-row">
          <div className="qf-field">
            <label htmlFor="st-city">Cidade</label>
            <input id="st-city" className="form-control" value={form.address.city} onChange={(e) => setAddress({ city: e.target.value })} />
          </div>
          <div className="qf-field qf-field-small">
            <label htmlFor="st-state">UF</label>
            <input id="st-state" className="form-control" maxLength={2} value={form.address.state} onChange={(e) => setAddress({ state: e.target.value.toUpperCase() })} />
          </div>
        </div>
      </section>

      <section className="qf-card" aria-labelledby="st-hours">
        <h2 id="st-hours">Horário de funcionamento</h2>
        <p className="qf-hint">Horários depois da meia-noite funcionam (ex.: 18:00 às 02:00).</p>
        {form.days.map((d, i) => (
          <div key={WEEKDAY_NAMES[i]} className="qf-day">
            <label className="qf-switch">
              <input type="checkbox" checked={d.open} onChange={(e) => set("days", form.days.map((x, j) => (j === i ? { ...x, open: e.target.checked } : x)))} />
              <span>{WEEKDAY_NAMES[i]}</span>
            </label>
            {d.open ? (
              <span className="qf-day-times">
                <input type="time" className="form-control" aria-label={`Abre ${WEEKDAY_NAMES[i]}`} value={d.opensAt} onChange={(e) => set("days", form.days.map((x, j) => (j === i ? { ...x, opensAt: e.target.value } : x)))} />
                <span>às</span>
                <input type="time" className="form-control" aria-label={`Fecha ${WEEKDAY_NAMES[i]}`} value={d.closesAt} onChange={(e) => set("days", form.days.map((x, j) => (j === i ? { ...x, closesAt: e.target.value } : x)))} />
              </span>
            ) : (
              <span className="qf-hint">Fechado</span>
            )}
          </div>
        ))}
      </section>

      <section className="qf-card" aria-labelledby="st-delivery">
        <h2 id="st-delivery">Entrega e retirada</h2>
        <label className="qf-switch">
          <input type="checkbox" checked={form.deliveryEnabled} onChange={(e) => set("deliveryEnabled", e.target.checked)} />
          <span>Faço entregas</span>
        </label>
        {form.deliveryEnabled && (
          <>
            <div className="qf-row">
              <div className="qf-field">
                <label htmlFor="st-fee">Taxa de entrega (R$)</label>
                <input id="st-fee" className="form-control" inputMode="decimal" value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} />
              </div>
              <div className="qf-field">
                <label htmlFor="st-minimum">Pedido mínimo (R$, opcional)</label>
                <input id="st-minimum" className="form-control" inputMode="decimal" value={form.minimumOrder} onChange={(e) => set("minimumOrder", e.target.value)} />
              </div>
            </div>
            <div className="qf-row">
              <div className="qf-field">
                <label htmlFor="st-min">Tempo mínimo (min)</label>
                <input id="st-min" className="form-control" inputMode="numeric" value={form.minMinutes} onChange={(e) => set("minMinutes", e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className="qf-field">
                <label htmlFor="st-max">Tempo máximo (min)</label>
                <input id="st-max" className="form-control" inputMode="numeric" value={form.maxMinutes} onChange={(e) => set("maxMinutes", e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
            <fieldset className="qf-field">
              <legend>Onde você entrega?</legend>
              <label className="qf-radio">
                <input type="radio" name="area" checked={form.areaMode === "CITY"} onChange={() => set("areaMode", "CITY")} /> Na cidade toda ({form.address.city || "cidade da loja"})
              </label>
              <label className="qf-radio">
                <input type="radio" name="area" checked={form.areaMode === "NEIGHBORHOODS"} onChange={() => set("areaMode", "NEIGHBORHOODS")} /> Só em alguns bairros
              </label>
              {form.areaMode === "NEIGHBORHOODS" && (
                <textarea className="form-control" rows={3} aria-label="Bairros atendidos (um por linha)" placeholder={"Centro\nNiterói"} value={form.neighborhoods} onChange={(e) => set("neighborhoods", e.target.value)} />
              )}
            </fieldset>
          </>
        )}
        <label className="qf-switch">
          <input type="checkbox" checked={form.pickupEnabled} onChange={(e) => set("pickupEnabled", e.target.checked)} />
          <span>Cliente pode retirar no balcão</span>
        </label>
      </section>

      <section className="qf-card" aria-labelledby="st-payment">
        <h2 id="st-payment">Formas de pagamento</h2>
        <p className="qf-hint">O cliente paga direto para você. Sem intermediário, sem comissão.</p>
        <label className="qf-switch">
          <input type="checkbox" checked={form.cash} onChange={(e) => set("cash", e.target.checked)} />
          <span>Dinheiro</span>
        </label>
        <label className="qf-switch">
          <input type="checkbox" checked={form.card} onChange={(e) => set("card", e.target.checked)} />
          <span>Cartão na entrega / no balcão</span>
        </label>
        <label className="qf-switch">
          <input type="checkbox" checked={form.pixEnabled} onChange={(e) => set("pixEnabled", e.target.checked)} />
          <span>Pix</span>
        </label>
        {form.pixEnabled && (
          <div className="qf-row">
            <div className="qf-field qf-field-small">
              <label htmlFor="st-pix-type">Tipo de chave</label>
              <select id="st-pix-type" className="form-control" value={form.pix.keyType} onChange={(e) => set("pix", { ...form.pix, keyType: e.target.value as PixSettings["keyType"] })}>
                {Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="qf-field">
              <label htmlFor="st-pix-key">Chave Pix</label>
              <input id="st-pix-key" className="form-control" value={form.pix.key} onChange={(e) => set("pix", { ...form.pix, key: e.target.value })} />
            </div>
            <div className="qf-field">
              <label htmlFor="st-pix-holder">Nome do favorecido</label>
              <input id="st-pix-holder" className="form-control" value={form.pix.holderName} onChange={(e) => set("pix", { ...form.pix, holderName: e.target.value })} />
            </div>
          </div>
        )}
      </section>

      <section className="qf-card" aria-labelledby="st-marketplace">
        <h2 id="st-marketplace">Tipo de comida</h2>
        <p className="qf-hint">Ajuda clientes a encontrarem sua loja na busca.</p>
        <div className="qf-chips">
          {(cuisines.data ?? []).map((t) => (
            <label key={t.id} className={`qf-chip${form.cuisineTypeIds.includes(t.id) ? " selected" : ""}`}>
              <input
                type="checkbox"
                checked={form.cuisineTypeIds.includes(t.id)}
                onChange={(e) => set("cuisineTypeIds", e.target.checked ? [...form.cuisineTypeIds, t.id] : form.cuisineTypeIds.filter((x) => x !== t.id))}
              />
              {t.name}
            </label>
          ))}
        </div>
      </section>

      <section className="qf-card" aria-labelledby="st-publish">
        <h2 id="st-publish">Publicação</h2>
        <label className="qf-switch">
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
          <span>Loja publicada (aceita pedidos pelo link e aparece na busca)</span>
        </label>
      </section>

      <div className="qf-submit qf-sticky-save">
        {message && (
          <p className={message.tone === "ok" ? "qf-success" : "qf-error"} role={message.tone === "ok" ? "status" : "alert"}>
            {message.text}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

/** The store's link + QR code (table tents, flyers, Instagram bio, WhatsApp status). */
function ShareCard({ slug }: { slug: string }) {
  const url = `${brand.siteUrl}/${slug}`;
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr, () => setQr(null));
  }, [url]);
  return (
    <section className="qf-card qf-share" aria-labelledby="st-share">
      <h2 id="st-share">Divulgue sua loja</h2>
      <p className="qf-share-url">{url}</p>
      <div className="qf-share-actions">
        <button
          type="button"
          className="btn btn-default"
          onClick={async () => {
            await navigator.clipboard.writeText(url).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
        {qr && (
          <a className="btn btn-default" href={qr} download={`qrcode-${slug}.png`}>
            Baixar QR Code
          </a>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser */}
      {qr && <img className="qf-qr" src={qr} alt={`QR Code do link ${url}`} width={160} height={160} />}
    </section>
  );
}
