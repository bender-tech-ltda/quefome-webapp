"use client";

import type { Menu, Store } from "@quefome/contract";
import { type Fulfillment, type ItemSelection, cartIssueMessage, cartIssues, deliveryFeeFor, itemTotalCents, validateItem } from "@quefome/domain";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CartLine, type StoredCart, cartStore, newLineId } from "@/lib/storage";

const EMPTY: StoredCart = { lines: [], fulfillment: "DELIVERY" };

/** Fulfillment the store actually offers (delivery preferred). */
export function allowedFulfillment(wanted: Fulfillment, store: Pick<Store, "pickupEnabled" | "deliveryEnabled">): Fulfillment {
  if (wanted === "PICKUP" && store.pickupEnabled) return "PICKUP";
  return store.deliveryEnabled ? "DELIVERY" : "PICKUP";
}

/**
 * Reconciles a stored cart with the current menu: lines whose product disappeared, went out of stock or
 * whose choices no longer exist are removed (and reported); prices always come from the current menu.
 */
export function reconcileCart(cart: StoredCart, menu: Menu, store: Pick<Store, "pickupEnabled" | "deliveryEnabled">): { cart: StoredCart; removed: string[] } {
  const removed: string[] = [];
  const lines = cart.lines.flatMap((line) => {
    const product = menu.products.find((p) => p.id === line.product.id);
    if (!product || !product.available || validateItem(product, line.selection).includes("UNKNOWN_REFERENCE")) {
      removed.push(line.product.name);
      return [];
    }
    return [{ ...line, product }];
  });
  return { cart: { lines, fulfillment: allowedFulfillment(cart.fulfillment, store) }, removed };
}

/** Legacy EstablishmentController order state + OrderService.store/retrieve, per store, 1h TTL. */
export function useCart(store: Store, menu: Menu) {
  const [cart, setCart] = useState<StoredCart>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const storeRef = useRef(cartStore(store.id));

  useEffect(() => {
    storeRef.current = cartStore(store.id);
    const stored = storeRef.current.get();
    const result = stored ? reconcileCart(stored, menu, store) : { cart: { ...EMPTY, fulfillment: allowedFulfillment("DELIVERY", store) }, removed: [] };
    setCart(result.cart);
    setRemoved(result.removed);
    if (result.removed.length) storeRef.current.set(result.cart);
    setLoaded(true);
  }, [store, menu]);

  const update = useCallback((next: (current: StoredCart) => StoredCart) => {
    setCart((current) => {
      const value = next(current);
      storeRef.current.set(value);
      return value;
    });
  }, []);

  const pricedLines = useMemo(() => cart.lines.map((line) => ({ ...line, totalCents: itemTotalCents(line.product, line.selection) })), [cart.lines]);
  const subtotalCents = pricedLines.reduce((sum, l) => sum + l.totalCents, 0);
  const deliveryFeeCents = deliveryFeeFor(cart.fulfillment, store.deliveryFeeCents);
  const issueState = { storeOpen: store.status === "OPEN", itemCount: cart.lines.length, subtotalCents, minimumOrderCents: store.minimumOrderCents };

  return {
    loaded,
    /** Names of items removed because they became unavailable. */
    removed,
    dismissRemoved: () => setRemoved([]),
    lines: pricedLines,
    fulfillment: cart.fulfillment,
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
    isInvalid: cartIssues(issueState).length > 0,
    invalidMessage: cartIssueMessage(issueState),
    addLine: (line: Omit<CartLine, "lineId">) => update((c) => ({ ...c, lines: [...c.lines, { ...line, lineId: newLineId() }] })),
    replaceLine: (lineId: string, selection: ItemSelection) =>
      update((c) => ({ ...c, lines: c.lines.map((l) => (l.lineId === lineId ? { ...l, selection } : l)) })),
    removeLine: (lineId: string) => update((c) => ({ ...c, lines: c.lines.filter((l) => l.lineId !== lineId) })),
    setFulfillment: (fulfillment: Fulfillment) => update((c) => ({ ...c, fulfillment })),
    clear: () => {
      storeRef.current.remove();
      setCart(EMPTY);
    },
  };
}

export type Cart = ReturnType<typeof useCart>;
