/**
 * Executes the ORIGINAL legacy AngularJS source files (untouched) inside a minimal AMD/angular stub,
 * so new implementations can be compared against real legacy behavior (differential / golden-master testing).
 * Set LEGACY_SRC to override the location; tests are skipped when the legacy repo is not available.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";

export const LEGACY_SRC = process.env.LEGACY_SRC ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../quefome-webapp/public/assets/js/quefome");
export const legacyAvailable = existsSync(resolve(LEGACY_SRC, "services.js"));
if (!legacyAvailable && process.env.REQUIRE_LEGACY === "1") {
  throw new Error(`REQUIRE_LEGACY=1 but the legacy source was not found at ${LEGACY_SRC} (set LEGACY_SRC)`);
}

type Kind = "service" | "controller" | "filter" | "factory" | "directive";
type Registry = Record<Kind, Record<string, unknown[]>>;

let cached: Registry | null = null;

function load(): Registry {
  if (cached) return cached;
  const reg: Registry = { service: {}, controller: {}, filter: {}, factory: {}, directive: {} };
  const mod: Record<string, unknown> = {};
  for (const kind of Object.keys(reg) as Kind[]) {
    mod[kind] = (name: string, def: unknown[]) => {
      reg[kind][name] = def;
      return mod;
    };
  }
  mod.config = mod.run = () => mod;
  const angular = {
    module: () => mod,
    copy: (o: unknown) => JSON.parse(JSON.stringify(o)),
    toJson: JSON.stringify,
    element: () => ({ blur() {}, focus() {} }),
  };
  (globalThis as Record<string, unknown>).window ??= { btoa, atob, encodeURIComponent, decodeURIComponent, localStorage: null };
  for (const file of ["services.js", "filters.js", "controllers.js", "admin/filters.js"]) {
    const source = readFileSync(resolve(LEGACY_SRC, file), "utf8");
    const wrapper = runInThisContext(`(function(define){${source}\n})`) as (d: unknown) => void;
    wrapper((_deps: unknown, factory: (a: unknown) => unknown) => factory(angular));
  }
  cached = reg;
  return reg;
}

function instantiate<T>(def: unknown[], ...deps: unknown[]): T {
  const fn = def[def.length - 1] as (...a: unknown[]) => void;
  const self = {} as T;
  fn.apply(self, deps);
  return self;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Minimal angular $filter: the legacy filters only use `date` (HH:mm, dd/MM) and `orderBy` (by key). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy filters are untyped JS
export function legacyFilter(name: string): (...args: unknown[]) => any {
  const reg = load();
  const $filter = (n: string): unknown => {
    if (n === "date")
      return (d: unknown, f: string) => {
        const x = new Date(d as string);
        return f.replace("HH", pad(x.getHours())).replace("mm", pad(x.getMinutes())).replace("dd", pad(x.getDate())).replace("MM", pad(x.getMonth() + 1));
      };
    if (n === "orderBy")
      return (arr: Record<string, number>[], key: string) => [...arr].sort((a, b) => (a[key]! < b[key]! ? -1 : a[key]! > b[key]! ? 1 : 0));
    return legacyFilter(n);
  };
  const def = reg.filter[name];
  if (!def) throw new Error(`legacy filter not found: ${name}`);
  return (def[def.length - 1] as (f: unknown) => (...a: unknown[]) => unknown)($filter);
}

export interface LegacyOrderService {
  getOrderPrice(order: unknown, withDeliverTax?: boolean): number;
  getOrderItemPrice(item: unknown): number;
}

export function legacyOrderService(): LegacyOrderService {
  const noopStorage = { set() {}, get() {}, remove() {} };
  const def = load().service.OrderService;
  if (!def) throw new Error("legacy OrderService not found");
  return instantiate<LegacyOrderService>(def, {}, {}, noopStorage);
}
