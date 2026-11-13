import { describe, expect, it } from "vitest";
import {
  type CatalogProduct,
  MemoryStorage,
  ONE_HOUR_MS,
  TtlStore,
  cartIssueMessage,
  computeOpenState,
  defaultSelection,
  flavorHint,
  formatAddressLine,
  formatBRL,
  groupComponents,
  groupMenu,
  isFlavorDisabled,
  isValidZipCode,
  normalizeStreetQuery,
  openingHoursSpec,
  parseMoneyInput,
  roundCents,
  validateItem,
} from "../src";

const pizza: CatalogProduct = {
  id: "pizza",
  name: "Pizza Grande",
  priceCents: 0,
  flavorBilling: "HIGHEST_PRICE",
  maxFlavors: 2,
  flavors: [
    { id: "calabresa", name: "Calabresa", priceCents: 4590 },
    { id: "4queijos", name: "Quatro queijos", priceCents: 4990 },
  ],
  components: [
    { kind: "toggle", id: "bacon", name: "Bacon", group: "Adicionais", groupSequence: 2, sequence: 2, priceCents: 400, defaultOn: false },
    { kind: "toggle", id: "ovo", name: "Ovo", group: "Adicionais", groupSequence: 2, sequence: 1, priceCents: 200, defaultOn: true },
    { kind: "choice", id: "borda", name: "Borda", sequence: 1, options: [
      { id: "sem", name: "Sem borda", priceCents: 0, isDefault: true, sequence: 1 },
      { id: "catupiry", name: "Catupiry", priceCents: 800, isDefault: false, sequence: 2 },
    ] },
  ],
};

describe("money", () => {
  it.each([
    [42.425 * 100, 4243],
    [1.5, 2],
    [1.4999, 1],
    [0, 0],
  ])("roundCents(%s) = %s (half-up policy, TBD)", (input, expected) => expect(roundCents(input)).toBe(expected));
  it("formats BRL", () => expect(formatBRL(123456)).toBe("R$ 1234,56"));
  it.each([
    ["50", 5000],
    ["50,5", 5050],
    ["50.50", 5050],
    ["abc", null],
    ["", null],
  ])("parseMoneyInput(%j) = %s", (input, expected) => expect(parseMoneyInput(input)).toBe(expected));
});

describe("catalog", () => {
  it("default selection: toggles use defaultOn, choices use the default option, quantity 1", () => {
    expect(defaultSelection(pizza)).toEqual({
      productId: "pizza", quantity: 1, instructions: "", flavorIds: [],
      components: [{ componentId: "bacon", on: false }, { componentId: "ovo", on: true }, { componentId: "borda", optionId: "sem" }],
    });
  });
  it("groups components: choices by their own name, toggles by group, ordered by [sequence, name]", () => {
    const groups = groupComponents(pizza);
    expect(groups.map((g) => g.name)).toEqual(["Borda", "Adicionais"]);
    expect(groups[1]!.components.map((c) => c.name)).toEqual(["Ovo", "Bacon"]);
  });
  it("groups the menu by category, ordered, dropping empty categories", () => {
    const sections = groupMenu(
      [{ id: "2", name: "Pizzas", icon: "pizza", sequence: 2 }, { id: "1", name: "Lanches", icon: null, sequence: 1 }, { id: "3", name: "Vazia", icon: null, sequence: 0 }],
      [{ categoryId: "2", id: "a" }, { categoryId: "1", id: "b" }],
    );
    expect(sections.map((s) => s.category.name)).toEqual(["Lanches", "Pizzas"]);
  });
});

describe("item validation (customize dialog)", () => {
  const base = { ...defaultSelection(pizza) };
  it("requires at least one flavor when the product has flavors", () => expect(validateItem(pizza, base)).toEqual(["FLAVOR_REQUIRED"]));
  it("limits flavors to maxFlavors", () =>
    expect(validateItem({ ...pizza, maxFlavors: 1 }, { ...base, flavorIds: ["calabresa", "4queijos"] })).toContain("TOO_MANY_FLAVORS"));
  it("requires a positive integer quantity", () => {
    expect(validateItem(pizza, { ...base, flavorIds: ["calabresa"], quantity: 0 })).toEqual(["QUANTITY_INVALID"]);
    expect(validateItem(pizza, { ...base, flavorIds: ["calabresa"], quantity: 1.5 })).toEqual(["QUANTITY_INVALID"]);
    expect(validateItem(pizza, { ...base, flavorIds: ["calabresa"], quantity: Number.NaN })).toEqual(["QUANTITY_REQUIRED"]);
  });
  it("flags references that no longer exist in the catalog", () =>
    expect(validateItem(pizza, { ...base, flavorIds: ["gone"] })).toContain("UNKNOWN_REFERENCE"));
  it("disables unselected flavors once the limit is reached", () => {
    expect(isFlavorDisabled(pizza, 2, false)).toBe(true);
    expect(isFlavorDisabled(pizza, 2, true)).toBe(false);
    expect(isFlavorDisabled({ maxFlavors: null }, 10, false)).toBe(false);
  });
  it("flavor hints follow the legacy legend", () => {
    expect(flavorHint(pizza, 0)?.level).toBe("error");
    expect(flavorHint({ maxFlavors: 1 }, 1)?.text).toBe("Você pode escolher somente um sabor");
    expect(flavorHint(pizza, 1)?.text).toBe("Você pode escolher até 2 sabores");
  });
});

describe("cart rules", () => {
  it("messages follow legacy priority: closed -> minimum -> empty", () => {
    expect(cartIssueMessage({ storeOpen: false, itemCount: 0, subtotalCents: 0, minimumOrderCents: 2000 })).toBe("O estabelecimento está fechado no momento.");
    expect(cartIssueMessage({ storeOpen: true, itemCount: 0, subtotalCents: 0, minimumOrderCents: 2000 })).toContain("só aceita pedidos acima de R$ 20,00");
    expect(cartIssueMessage({ storeOpen: true, itemCount: 0, subtotalCents: 0, minimumOrderCents: null })).toContain("pelo menos um produto");
    expect(cartIssueMessage({ storeOpen: true, itemCount: 1, subtotalCents: 2000, minimumOrderCents: 2000 })).toBe("");
  });
});

describe("store open state (computed in America/Sao_Paulo)", () => {
  const at = (local: string) => new Date(`${local}-03:00`);
  const fri = { weekDay: 5, opensAt: "18:00", closesAt: "23:30" };
  const friLate = { weekDay: 5, opensAt: "18:00", closesAt: "02:00" };
  const sun = { weekDay: 0, opensAt: "11:00", closesAt: "15:00" };

  it("open during the schedule", () => expect(computeOpenState([fri, sun], at("2024-03-15T19:00"))).toEqual({ status: "OPEN", currentSchedule: fri }));
  it("closed before opening shows today's schedule", () => expect(computeOpenState([fri, sun], at("2024-03-15T10:00"))).toEqual({ status: "CLOSED", currentSchedule: fri }));
  it("closed after closing shows the next schedule", () => expect(computeOpenState([fri, sun], at("2024-03-15T23:45"))).toEqual({ status: "CLOSED", currentSchedule: sun }));
  it("schedules crossing midnight stay open after 00:00 (typical lanchonete)", () => {
    expect(computeOpenState([friLate], at("2024-03-16T01:30")).status).toBe("OPEN");
    expect(computeOpenState([friLate], at("2024-03-16T02:00")).status).toBe("CLOSED");
  });
  it("no schedules = closed", () => expect(computeOpenState([], at("2024-03-15T19:00"))).toEqual({ status: "CLOSED", currentSchedule: null }));
  it("schema.org opening hours", () => expect(openingHoursSpec([sun, fri])).toBe("Su 11:00-15:00, Fr 18:00-23:30"));
});

describe("address", () => {
  it.each([["92000-000", true], ["92000000", true], ["9200-000", false], ["abc", false]])("zip %s -> %s", (z, v) => expect(isValidZipCode(z)).toBe(v));
  it.each([
    ["Av. Brasil, 100", "avenida brasil"],
    ["av Getúlio", "avenida getúlio"],
    ["R. Santos", "rua santos"],
    ["  Rua A  ", "rua a"],
  ])("normalizes street query %j -> %j", (input, out) => expect(normalizeStreetQuery(input)).toBe(out));
  it("formats the address line without hard-coded city", () =>
    expect(formatAddressLine({ street: "Rua A", number: "10", complement: "ap 2", neighborhood: "Centro" })).toBe("Rua A, nº 10, compl. ap 2 - Bairro Centro"));
});

describe("TtlStore (cart/address persistence, 1 hour)", () => {
  it("returns the value within the TTL and drops it afterwards", () => {
    let now = 1_000;
    const storage = new MemoryStorage();
    const store = new TtlStore<{ a: number }>(storage, "k", ONE_HOUR_MS, () => now);
    store.set({ a: 1 });
    now += ONE_HOUR_MS;
    expect(store.get()).toEqual({ a: 1 });
    now += 1;
    expect(store.get()).toBeNull();
    expect(storage.getItem("k")).toBeNull();
  });
  it("discards corrupted or legacy-format entries", () => {
    const storage = new MemoryStorage();
    storage.setItem("k", "not json");
    expect(new TtlStore(storage, "k").get()).toBeNull();
    storage.setItem("k", JSON.stringify({ __localStorageObject: true }));
    expect(new TtlStore(storage, "k").get()).toBeNull();
  });
});
