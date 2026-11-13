"use client";

import type { AddressLookup, Menu, Store } from "@quefome/contract";
import {
  CHECKOUT_ISSUE_MESSAGES,
  type Fulfillment,
  PAYMENT_LABELS,
  type PaymentKind,
  checkoutIssues,
  formatMoney,
  isValidZipCode,
  normalizeBrazilianMobile,
  parseMoneyInput,
} from "@quefome/domain";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { ApiRequestError, api } from "@/lib/api";
import { addressStore, customerStore, newLineId, recentOrdersStore } from "@/lib/storage";
import { allowedFulfillment, useCart } from "../store/useCart";

/** Streamlined checkout (guest): how to receive → address → name + WhatsApp → payment → send. */
export function CheckoutPage({ slug }: { slug: string }) {
  const store = useQuery({ queryKey: ["store", slug], queryFn: () => api.getStore(slug) });
  const menu = useQuery({ queryKey: ["menu", slug], queryFn: () => api.getMenu(slug), staleTime: 60_000 });
  if (store.isError && store.error instanceof ApiRequestError && store.error.isNotFound) {
    return (
      <div className="not-found establishment-not-found">
        <p className="title">Estabelecimento não encontrado</p>
      </div>
    );
  }
  if (!store.data || !menu.data) return <LoadingAnimation />;
  return <CheckoutForm store={store.data} menu={menu.data} />;
}

type AddressState =
  | { stage: "input" }
  | { stage: "searching" }
  | { stage: "found"; address: AddressLookup; attended: boolean }
  | { stage: "manual"; street: string; neighborhood: string }
  | { stage: "not-found" };

const PAYMENT_HINTS: Record<PaymentKind, string> = {
  PIX: "A chave Pix aparece depois que você enviar o pedido.",
  CARD: "Crédito ou débito, na maquininha do entregador ou no balcão.",
  CASH: "Se precisar de troco, informe para quanto.",
};

function CheckoutForm({ store, menu }: { store: Store; menu: Menu }) {
  const router = useRouter();
  const cart = useCart(store, menu);
  const [fulfillment, setFulfillment] = useState<Fulfillment>(allowedFulfillment("DELIVERY", store));
  const [zipCode, setZipCode] = useState("");
  const [addressState, setAddressState] = useState<AddressState>({ stage: "input" });
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [paymentKind, setPaymentKind] = useState<PaymentKind | null>(store.paymentKinds.length === 1 ? store.paymentKinds[0]! : null);
  const [changeText, setChangeText] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const idempotencyKey = useRef(newLineId());
  const initialized = useRef(false);

  const checkArea = async (address: AddressLookup) => {
    try {
      const { attended } = await api.checkDelivery(store.slug, address);
      setAddressState({ stage: "found", address, attended });
    } catch {
      setAddressState({ stage: "found", address, attended: false });
    }
  };

  const lookupZip = async (value = zipCode) => {
    if (!isValidZipCode(value)) return;
    setAddressState({ stage: "searching" });
    try {
      await checkArea(await api.lookupZipCode(value));
    } catch {
      setAddressState({ stage: "not-found" });
    }
  };

  // restore what this device remembers (no account), once the cart is loaded
  useEffect(() => {
    if (!cart.loaded || initialized.current) return;
    initialized.current = true;
    if (cart.lines.length === 0) {
      router.replace(`/${store.slug}`);
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- one-time initialization from persisted state */
    setFulfillment(allowedFulfillment(cart.fulfillment, store));
    const customer = customerStore().get();
    if (customer) {
      setName(customer.name);
      setWhatsapp(customer.whatsapp);
    }
    const saved = addressStore().get();
    if (saved && saved.address.city === store.address.city) {
      setZipCode(saved.address.zipCode);
      setNumber(saved.number);
      setComplement(saved.complement);
      void checkArea(saved.address);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the cart is hydrated
  }, [cart.loaded]);

  const manualAddress: AddressLookup | null =
    addressState.stage === "manual" && addressState.street.trim() && addressState.neighborhood.trim()
      ? { zipCode: zipCode.trim(), street: addressState.street.trim(), neighborhood: addressState.neighborhood.trim(), city: store.address.city, state: store.address.state }
      : null;
  const foundAddress = addressState.stage === "found" ? addressState.address : null;
  const deliveryFee = fulfillment === "DELIVERY" ? Math.max(0, store.deliveryFeeCents) : 0;
  const totalCents = cart.subtotalCents + deliveryFee;
  const changeForCents = paymentKind === "CASH" && changeText.trim() ? parseMoneyInput(changeText) : null;
  const issues = checkoutIssues({
    fulfillment,
    address: fulfillment === "DELIVERY" ? (foundAddress ? { found: true, attended: addressState.stage === "found" && addressState.attended, number } : manualAddress ? { found: true, attended: true, number } : null) : null,
    customerName: name,
    whatsapp,
    paymentKind,
    changeForCents,
    totalCents,
  });
  const changeInvalid = paymentKind === "CASH" && changeText.trim() !== "" && changeForCents === null;
  const blockingMessage = cart.invalidMessage || (issues.length ? CHECKOUT_ISSUE_MESSAGES[issues[0]!] : changeInvalid ? "O valor do troco não é um número." : "");

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (blockingMessage || cart.isInvalid) return;
    const address = fulfillment === "DELIVERY" ? (foundAddress ?? manualAddress) : null;
    setSending(true);
    setSendError(null);
    try {
      if (manualAddress && fulfillment === "DELIVERY") {
        const { attended } = await api.checkDelivery(store.slug, manualAddress);
        if (!attended) {
          setSending(false);
          setSendError(CHECKOUT_ISSUE_MESSAGES.ADDRESS_NOT_ATTENDED);
          return;
        }
      }
      const order = await api.createOrder(
        store.slug,
        {
          fulfillment,
          address: address ? { ...address, number: number.trim(), complement: complement.trim() } : null,
          customer: { name: name.trim(), whatsapp },
          paymentKind: paymentKind!,
          changeForCents,
          notes: notes.trim(),
          items: cart.lines.map((l) => l.selection),
        },
        idempotencyKey.current,
      );
      customerStore().set({ name: name.trim(), whatsapp });
      if (address) addressStore().set({ address, number: number.trim(), complement: complement.trim() });
      const recent = recentOrdersStore();
      recent.set([{ slug: store.slug, token: order.trackingToken, number: order.number, at: order.createdAt }, ...(recent.get() ?? [])].slice(0, 10));
      cart.clear();
      router.replace(`/${store.slug}/pedido/${order.trackingToken}`);
    } catch (error) {
      setSending(false);
      setSendError(error instanceof ApiRequestError && (error.isBusinessError || error.status === 429) ? error.message : "Não conseguimos enviar seu pedido agora. Verifique sua internet e tente de novo.");
    }
  };

  return (
    <form className="qf-checkout" onSubmit={send} noValidate>
      <header className="qf-checkout-header">
        <Link href={`/${store.slug}`} className="qf-back">
          <Icon name="back" /> <span>{store.name}</span>
        </Link>
        <h1>Finalizar pedido</h1>
      </header>

      <section className="qf-card" aria-labelledby="sec-items">
        <h2 id="sec-items">Seu pedido</h2>
        <ul className="qf-lines">
          {cart.lines.map((l) => (
            <li key={l.lineId}>
              <span>
                {l.selection.quantity}x {l.product.name}
              </span>
              <span>R$ {formatMoney(l.totalCents)}</span>
            </li>
          ))}
        </ul>
        <Link href={`/${store.slug}`} className="btn btn-link qf-edit-link">
          Editar itens
        </Link>
      </section>

      {store.deliveryEnabled && store.pickupEnabled && (
        <section className="qf-card" aria-labelledby="sec-fulfillment">
          <h2 id="sec-fulfillment">Como você quer receber?</h2>
          <div className="qf-options" role="radiogroup" aria-labelledby="sec-fulfillment">
            {(["DELIVERY", "PICKUP"] as const).map((f) => (
              <label key={f} className={`qf-option${fulfillment === f ? " selected" : ""}`}>
                <input type="radio" name="fulfillment" checked={fulfillment === f} onChange={() => { setFulfillment(f); cart.setFulfillment(f); }} />
                <span>{f === "DELIVERY" ? `Entrega (R$ ${formatMoney(store.deliveryFeeCents)})` : "Retirar no balcão"}</span>
              </label>
            ))}
          </div>
        </section>
      )}
      {!store.deliveryEnabled && <p className="qf-info">Esse restaurante trabalha só com retirada no balcão: {store.address.street}, {store.address.number}.</p>}

      {fulfillment === "DELIVERY" && (
        <section className="qf-card" aria-labelledby="sec-address">
          <h2 id="sec-address">Endereço de entrega</h2>
          {(addressState.stage === "input" || addressState.stage === "searching" || addressState.stage === "not-found") && (
            <div className="qf-field">
              <label htmlFor="zip">CEP</label>
              <div className="qf-inline">
                <input id="zip" className="form-control" type="tel" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                <button type="button" className="btn btn-primary" disabled={!isValidZipCode(zipCode) || addressState.stage === "searching"} onClick={() => lookupZip()}>
                  {addressState.stage === "searching" ? <Icon name="loading" spin /> : "Buscar"}
                </button>
              </div>
              {addressState.stage === "not-found" && <p className="qf-error" role="alert">CEP não encontrado.</p>}
              <button type="button" className="btn btn-link qf-small-link" onClick={() => setAddressState({ stage: "manual", street: "", neighborhood: "" })}>
                Não sei meu CEP
              </button>
            </div>
          )}

          {addressState.stage === "manual" && (
            <>
              <div className="qf-field">
                <label htmlFor="street">Rua / Avenida</label>
                <input id="street" className="form-control" autoComplete="address-line1" value={addressState.street} onChange={(e) => setAddressState({ ...addressState, street: e.target.value })} />
              </div>
              <div className="qf-field">
                <label htmlFor="neighborhood">Bairro</label>
                <input id="neighborhood" className="form-control" value={addressState.neighborhood} onChange={(e) => setAddressState({ ...addressState, neighborhood: e.target.value })} />
              </div>
              <p className="qf-hint">
                {store.address.city} - {store.address.state}
              </p>
            </>
          )}

          {addressState.stage === "found" && (
            <div className="qf-found-address">
              <p>
                <strong>{addressState.address.street}</strong>
                <br />
                {addressState.address.neighborhood}, {addressState.address.city} - {addressState.address.state}
              </p>
              <button type="button" className="btn btn-link qf-small-link" onClick={() => { setAddressState({ stage: "input" }); setZipCode(""); }}>
                Trocar endereço
              </button>
              {!addressState.attended && <p className="qf-error" role="alert">O restaurante não entrega nesse endereço.{store.pickupEnabled ? " Você pode retirar no balcão." : ""}</p>}
            </div>
          )}

          {(addressState.stage === "found" && addressState.attended) || addressState.stage === "manual" ? (
            <div className="qf-row">
              <div className="qf-field">
                <label htmlFor="number">Número</label>
                <input id="number" className="form-control" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <div className="qf-field">
                <label htmlFor="complement">Complemento</label>
                <input id="complement" className="form-control" placeholder="Apto, bloco, referência" value={complement} onChange={(e) => setComplement(e.target.value)} />
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="qf-card" aria-labelledby="sec-contact">
        <h2 id="sec-contact">Seus dados</h2>
        <div className="qf-field">
          <label htmlFor="name">Nome</label>
          <input id="name" className="form-control" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="qf-field">
          <label htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" className="form-control" type="tel" inputMode="tel" autoComplete="tel" placeholder="(51) 99999-8888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          <p className="qf-hint">Você recebe as atualizações do pedido nesse WhatsApp.</p>
          {submitted && whatsapp.trim() && !normalizeBrazilianMobile(whatsapp) && <p className="qf-error">{CHECKOUT_ISSUE_MESSAGES.WHATSAPP_INVALID}</p>}
        </div>
      </section>

      <section className="qf-card" aria-labelledby="sec-payment">
        <h2 id="sec-payment">Pagamento</h2>
        <p className="qf-hint">Você paga direto ao restaurante.</p>
        <div className="qf-options qf-options-stacked" role="radiogroup" aria-labelledby="sec-payment">
          {store.paymentKinds.map((kind) => (
            <label key={kind} className={`qf-option${paymentKind === kind ? " selected" : ""}`}>
              <input type="radio" name="payment" checked={paymentKind === kind} onChange={() => setPaymentKind(kind)} />
              <span>
                <strong>{PAYMENT_LABELS[kind]}</strong>
                <small>{PAYMENT_HINTS[kind]}</small>
              </span>
            </label>
          ))}
        </div>
        {paymentKind === "CASH" && (
          <div className="qf-field">
            <label htmlFor="change">Troco para quanto? (opcional)</label>
            <input id="change" className="form-control" inputMode="decimal" placeholder="Ex.: 100" value={changeText} onChange={(e) => setChangeText(e.target.value)} />
          </div>
        )}
      </section>

      <section className="qf-card">
        <h2>
          <label htmlFor="notes">Observações (opcional)</label>
        </h2>
        <textarea id="notes" className="form-control" rows={2} maxLength={500} placeholder="Ex.: interfone quebrado, ligar ao chegar" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>

      <section className="qf-card qf-totals" aria-label="Total">
        <p>
          <span>Subtotal</span>
          <span>R$ {formatMoney(cart.subtotalCents)}</span>
        </p>
        {fulfillment === "DELIVERY" && (
          <p>
            <span>Entrega</span>
            <span>{deliveryFee === 0 ? "Grátis" : `R$ ${formatMoney(deliveryFee)}`}</span>
          </p>
        )}
        <p className="qf-total">
          <span>Total</span>
          <span>R$ {formatMoney(totalCents)}</span>
        </p>
      </section>

      <div className="qf-submit">
        {(submitted && blockingMessage) || sendError ? (
          <p className="qf-error" role="alert">
            {sendError ?? blockingMessage}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sending}>
          {sending ? (
            <>
              <Icon name="loading" spin /> Enviando...
            </>
          ) : (
            `Enviar pedido · R$ ${formatMoney(totalCents)}`
          )}
        </button>
      </div>
    </form>
  );
}
