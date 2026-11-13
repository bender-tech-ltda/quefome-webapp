/**
 * Time-limited key/value storage (legacy $localStorage + OrderService.store/retrieve + AddressService).
 * Legacy kept the cart per establishment and the address for 1 hour.
 * Storage and clock are injected so rules are testable and usable outside the browser.
 */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface Envelope<T> {
  v: 1;
  updatedAt: number;
  value: T;
}

export const ONE_HOUR_MS = 60 * 60 * 1000;

export class TtlStore<T> {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key: string,
    private readonly ttlMs: number = ONE_HOUR_MS,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get(): T | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) return null;
    let envelope: Envelope<T>;
    try {
      envelope = JSON.parse(raw) as Envelope<T>;
    } catch {
      this.storage.removeItem(this.key);
      return null;
    }
    if (envelope?.v !== 1 || typeof envelope.updatedAt !== "number") {
      this.storage.removeItem(this.key);
      return null;
    }
    if (this.now() - envelope.updatedAt > this.ttlMs) {
      this.storage.removeItem(this.key);
      return null;
    }
    return envelope.value;
  }

  set(value: T): void {
    const envelope: Envelope<T> = { v: 1, updatedAt: this.now(), value };
    this.storage.setItem(this.key, JSON.stringify(envelope));
  }

  remove(): void {
    this.storage.removeItem(this.key);
  }
}

export const storageKeys = {
  cart: (storeId: string) => `quefome:v1:cart:${storeId}`,
  address: () => "quefome:v1:address",
  lastOrder: (storeId: string) => `quefome:v1:last-order:${storeId}`,
};

/** In-memory storage for tests / SSR. */
export class MemoryStorage implements KeyValueStorage {
  private readonly items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}
