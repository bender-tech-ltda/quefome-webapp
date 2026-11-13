import type { AddressLookup, Product } from "@quefome/contract";
import { type Fulfillment, type ItemSelection, type KeyValueStorage, MemoryStorage, TtlStore, storageKeys } from "@quefome/domain";

export interface CartLine {
  lineId: string;
  /** Snapshot used for display; prices are always recomputed from the fresh menu (and by the server). */
  product: Product;
  selection: ItemSelection;
}

export interface StoredCart {
  lines: CartLine[];
  fulfillment: Fulfillment;
}

/** Last delivery address used at checkout (prefill). */
export interface StoredAddress {
  address: AddressLookup;
  number: string;
  complement: string;
}

/** Name + WhatsApp remembered on this device (no account). */
export interface StoredCustomer {
  name: string;
  whatsapp: string;
}

const memory = new MemoryStorage();

function browserStorage(): KeyValueStorage {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    // Safari private mode / disabled storage
  }
  return memory;
}

export const cartStore = (storeId: string) => new TtlStore<StoredCart>(browserStorage(), storageKeys.cart(storeId));
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
export const addressStore = () => new TtlStore<StoredAddress>(browserStorage(), storageKeys.address(), THIRTY_DAYS);
export const customerStore = () => new TtlStore<StoredCustomer>(browserStorage(), "quefome:v1:customer", THIRTY_DAYS);
/** Recent orders on this device, so "acompanhar pedido" works even if the WhatsApp message is lost. */
export const recentOrdersStore = () => new TtlStore<{ slug: string; token: string; number: number; at: string }[]>(browserStorage(), "quefome:v1:recent-orders", 2 * 24 * 60 * 60 * 1000);

export function newLineId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
