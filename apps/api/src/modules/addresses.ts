import type { AddressLookup } from "@quefome/contract";
import { normalizeStreetQuery, normalizeZipCode } from "@quefome/domain";
import { ADDRESSES } from "@quefome/fixtures";
import type { Logger } from "../lib/logger";

export interface AddressProvider {
  lookupZipCode(zipCode: string): Promise<AddressLookup | null>;
  searchStreet(street: string, city: string, state: string): Promise<AddressLookup | null>;
}

/** Offline table used by tests and as a dev fallback. */
export class FixtureAddressProvider implements AddressProvider {
  async lookupZipCode(zipCode: string) {
    const zip = normalizeZipCode(zipCode);
    return ADDRESSES.find((a) => normalizeZipCode(a.zipCode) === zip) ?? null;
  }
  async searchStreet(street: string, city: string, state: string) {
    const q = normalizeStreetQuery(street);
    return ADDRESSES.find((a) => a.city.toLowerCase() === city.trim().toLowerCase() && a.state.toLowerCase() === state.trim().toLowerCase() && a.street.toLowerCase().includes(q)) ?? null;
  }
}

interface ViaCepRow {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean | string;
}

/** ViaCEP (legacy models/Address.js) with timeout and a small TTL cache. */
export class ViaCepAddressProvider implements AddressProvider {
  private readonly cache = new Map<string, { value: AddressLookup | null; expiresAt: number }>();

  constructor(
    private readonly logger: Logger,
    private readonly timeoutMs = 2500,
    private readonly ttlMs = 6 * 60 * 60 * 1000,
  ) {}

  private async fetchJson(url: string): Promise<unknown> {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const res = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs), headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`viacep ${res.status}`);
    return res.json();
  }

  private remember(url: string, value: AddressLookup | null) {
    this.cache.set(url, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  private toLookup(row: ViaCepRow): AddressLookup {
    return { zipCode: row.cep, street: row.logradouro, neighborhood: row.bairro, city: row.localidade, state: row.uf };
  }

  async lookupZipCode(zipCode: string) {
    const zip = normalizeZipCode(zipCode);
    if (zip.length !== 8) return null;
    const url = `https://viacep.com.br/ws/${zip}/json/`;
    const row = (await this.fetchJson(url)) as ViaCepRow;
    return this.remember(url, row.erro ? null : this.toLookup(row));
  }

  async searchStreet(street: string, city: string, state: string) {
    const q = normalizeStreetQuery(street);
    if (q.length < 3) return null;
    const url = `https://viacep.com.br/ws/${encodeURIComponent(state.trim().toLowerCase())}/${encodeURIComponent(city.trim().toLowerCase())}/${encodeURIComponent(q)}/json/`;
    const rows = (await this.fetchJson(url)) as ViaCepRow[] | ViaCepRow;
    const first = Array.isArray(rows) ? rows[0] : undefined;
    this.logger.debug({ results: Array.isArray(rows) ? rows.length : 0 }, "viacep street search");
    return this.remember(url, first ? this.toLookup(first) : null);
  }
}

/** Dev convenience: real lookups, offline table when the network is unavailable. Never used in production. */
export class FallbackAddressProvider implements AddressProvider {
  constructor(
    private readonly primary: AddressProvider,
    private readonly fallback: AddressProvider,
    private readonly logger: Logger,
  ) {}
  async lookupZipCode(zipCode: string) {
    try {
      return await this.primary.lookupZipCode(zipCode);
    } catch (error) {
      this.logger.warn({ err: (error as Error).message }, "address provider unavailable, using fixtures");
      return this.fallback.lookupZipCode(zipCode);
    }
  }
  async searchStreet(street: string, city: string, state: string) {
    try {
      return await this.primary.searchStreet(street, city, state);
    } catch (error) {
      this.logger.warn({ err: (error as Error).message }, "address provider unavailable, using fixtures");
      return this.fallback.searchStreet(street, city, state);
    }
  }
}
