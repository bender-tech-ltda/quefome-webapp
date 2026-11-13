/** Edge cases and helpers used by web and api (closes the branch-coverage gaps with real behavior). */
import { describe, expect, it } from "vitest";
import {
  type CatalogProduct,
  MemoryStorage,
  TtlStore,
  UnknownReferenceError,
  changeDueCents,
  computeOpenState,
  flavorHint,
  flavorsPriceCents,
  formatDateTime,
  formatDayMonthTime,
  formatTime,
  formatZipCode,
  groupComponents,
  isOrderStatus,
  itemTotalCents,
  normalizeZipCode,
  productSummary,
  scheduleLabel,
  sortOptions,
  unitPriceCents,
  zonedParts,
} from "../src";

const base: CatalogProduct = {
  id: "p", name: "P", priceCents: 1000, flavorBilling: "SUM", maxFlavors: null,
  flavors: [{ id: "f", name: "F", priceCents: 100 }],
  components: [
    { kind: "toggle", id: "t", name: "T", group: "G", groupSequence: 1, sequence: 1, priceCents: 50, defaultOn: false },
    { kind: "choice", id: "c", name: "C", sequence: 2, options: [{ id: "o", name: "O", priceCents: 20, isDefault: false, sequence: 1 }] },
  ],
};
const sel = (over = {}) => ({ productId: "p", quantity: 1, instructions: "", flavorIds: [], components: [], ...over });

describe("time formatting in the store time zone", () => {
  const d = new Date("2024-03-16T01:05:00Z"); // 15/03 22:05 in São Paulo
  it("formats time, admin list and ticket dates", () => {
    expect(formatTime(d)).toBe("22:05");
    expect(formatDayMonthTime(d)).toBe("15/03 22:05");
    expect(formatDateTime(d)).toBe("15/03/2024 22:05");
    expect(formatDateTime(d, "UTC")).toBe("16/03/2024 01:05");
  });
  it("exposes zoned parts (midnight is hour 0, not 24)", () => {
    expect(zonedParts(new Date("2024-03-15T03:00:00Z"))).toMatchObject({ day: 15, hour: 0, minute: 0, weekDay: 5 });
  });
});

describe("zip codes", () => {
  it("normalizes and formats", () => {
    expect(normalizeZipCode("92.010-000")).toBe("92010000");
    expect(formatZipCode("92010000")).toBe("92010-000");
    expect(formatZipCode("123")).toBe("123");
  });
});

describe("pricing guards", () => {
  it("rejects references that are not in the catalog (server must not price unknown ids)", () => {
    expect(() => unitPriceCents(base, sel({ flavorIds: ["x"] }))).toThrow(UnknownReferenceError);
    expect(() => unitPriceCents(base, sel({ components: [{ componentId: "x", on: true }] }))).toThrow(/component: x/);
    expect(() => unitPriceCents(base, sel({ components: [{ componentId: "c", optionId: "x" }] }))).toThrow(/option: x/);
  });
  it("ignores mismatched selection kinds and empty choices", () => {
    expect(itemTotalCents(base, sel({ components: [{ componentId: "t", optionId: "o" }, { componentId: "c", on: true }] }))).toBe(1000);
    expect(itemTotalCents(base, sel({ components: [{ componentId: "c", optionId: null }] }))).toBe(1000);
  });
  it("no flavors cost nothing; HIGHEST never goes below zero", () => {
    expect(flavorsPriceCents([], "HIGHEST_PRICE")).toBe(0);
    expect(flavorsPriceCents([{ priceCents: null }], "HIGHEST_PRICE")).toBe(0);
  });
  it("troco = paid - total (null when not informed)", () => {
    expect(changeDueCents(10000, 6290)).toBe(3710);
    expect(changeDueCents(null, 6290)).toBeNull();
  });
});

describe("catalog ordering ties", () => {
  it("orders by name when sequences tie (options, groups, payment categories)", () => {
    const opts = sortOptions([{ id: "2", name: "B", priceCents: 0, isDefault: false, sequence: 1 }, { id: "1", name: "A", priceCents: 0, isDefault: false, sequence: 1 }]);
    expect(opts.map((o) => o.name)).toEqual(["A", "B"]);
    const groups = groupComponents({ components: [
      { kind: "choice", id: "z", name: "Zeta", sequence: 1, options: [] },
      { kind: "choice", id: "a", name: "Alfa", sequence: 1, options: [] },
    ] });
    expect(groups.map((g) => g.name)).toEqual(["Alfa", "Zeta"]);
  });
  it("a product without a flavor limit shows no limit hint", () => expect(flavorHint({ maxFlavors: null }, 2)).toBeNull());
});

describe("order helpers", () => {
  it("recognizes statuses", () => {
    expect(isOrderStatus("PENDING")).toBe(true);
    expect(isOrderStatus("OPEN")).toBe(false);
    expect(isOrderStatus(3)).toBe(false);
  });
  it("summary keeps the order items were added; missing quantities count as 1; suffix counts hidden products", () => {
    const r = productSummary([{ product: { id: "b", name: "B" } }, { product: { id: "a", name: "A" }, quantity: 0 }, { product: { id: "b", name: "B" }, quantity: 2 }]);
    expect(r.text).toBe("B (3), A (1)");
    const many = ["1", "2", "3", "4", "5"].map((id) => ({ product: { id, name: `P${id}` } }));
    expect(productSummary(many, 3).text).toBe("P1 (1), P2 (1), P3 (1) e mais outros 2 produtos.");
    expect(productSummary(many.slice(0, 4), 3).text).toBe("P1 (1), P2 (1), P3 (1) e mais outro produto.");
  });
});

describe("schedule edge cases", () => {
  const at = (local: string) => new Date(`${local}-03:00`);
  it("unknown week day renders without a name; schedule later today that already opened is not 'hoje'", () => {
    expect(scheduleLabel("CLOSED", { weekDay: 5, opensAt: "10:00", closesAt: "12:00" }, at("2024-03-15T13:00"))).toBe("Abrirá sexta-feira, às 10:00");
  });
  it("a schedule that crossed midnight from yesterday is open early today and shows as current", () => {
    const thu = { weekDay: 4, opensAt: "20:00", closesAt: "01:00" };
    expect(computeOpenState([thu], at("2024-03-15T00:30"))).toEqual({ status: "OPEN", currentSchedule: thu });
  });
  it("picks the nearest next schedule among several", () => {
    const sat = { weekDay: 6, opensAt: "18:00", closesAt: "23:00" };
    const mon = { weekDay: 1, opensAt: "18:00", closesAt: "23:00" };
    expect(computeOpenState([mon, sat], at("2024-03-15T10:00")).currentSchedule).toEqual(sat);
  });
});

describe("storage", () => {
  it("remove() clears the entry; MemoryStorage behaves like localStorage", () => {
    const storage = new MemoryStorage();
    const store = new TtlStore<number>(storage, "k");
    store.set(1);
    expect(store.get()).toBe(1);
    store.remove();
    expect(store.get()).toBeNull();
    expect(storage.getItem("missing")).toBeNull();
  });
});
