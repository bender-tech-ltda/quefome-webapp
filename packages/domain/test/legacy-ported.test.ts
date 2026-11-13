/**
 * Ports of the legacy Jasmine specs (public/assets/js/tests/**) for pure logic.
 * Same scenarios, adapted to integer cents and string ids. Intentional behavior changes are
 * named "deviation: ..." and listed in docs/DEVIATIONS.md.
 */
import { describe, expect, it } from "vitest";
import {
  type CatalogProduct,
  type ItemSelection,
  deliveryTimeLabel,
  formatMoney,
  itemTotalCents,
  orderTotalCents,
  prettyTime,
  scheduleLabel,
  shortText,
  storeStatusLabel,
} from "../src";

const product = (over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: "p1",
  name: "Produto",
  priceCents: 0,
  flavorBilling: "SUM",
  maxFlavors: null,
  flavors: [],
  components: [],
  ...over,
});
const selection = (over: Partial<ItemSelection> = {}): ItemSelection => ({
  productId: "p1",
  quantity: 1,
  instructions: "",
  flavorIds: [],
  components: [],
  ...over,
});

describe("MoneyFilterSpec", () => {
  it("should replace the point by a comma", () => expect(formatMoney(210)).toBe("2,10"));
  it("should ignore the thousand separator", () => expect(formatMoney(10_000_000)).toBe("100000,00"));
  it("should have two decimal digits", () => {
    expect(formatMoney(200)).toBe("2,00");
    expect(formatMoney(1030)).toBe("10,30");
  });
  it("should not ignore 0 values", () => expect(formatMoney(0)).toBe("0,00"));
  it("should consider null values as 0", () => expect(formatMoney(null)).toBe("0,00"));
  it("should return empty for undefined", () => expect(formatMoney(undefined)).toBe(""));
});

describe("ShortTextFilterSpec", () => {
  it("should return empty for empty text", () => expect(shortText(undefined)).toBe(""));
  it("should cut at 100 by default", () => expect(shortText("a".repeat(150))).toBe(`${"a".repeat(100)}...`));
  it("should accept a size", () => expect(shortText("abcdef", 3)).toBe("abc..."));
  it("should not cut short texts", () => expect(shortText("abc", 3)).toBe("abc"));
});

describe("EstablishmentStatusFilterSpec", () => {
  it("OPEN is Aberto", () => expect(storeStatusLabel("OPEN")).toBe("Aberto"));
  it("anything else is Fechado", () => {
    expect(storeStatusLabel("CLOSED")).toBe("Fechado");
    expect(storeStatusLabel(undefined)).toBe("Fechado");
  });
});

describe("EstablishmentDeliveryTimeSpec", () => {
  it("should use the minimum time when the maximum time is not present", () => expect(deliveryTimeLabel(10, null)).toBe("10min."));
  it("should use the maximum time when the minimum time is not present", () => expect(deliveryTimeLabel(null, 20)).toBe("20min."));
  it("should return 0 when minimum and maximum time is not present", () => expect(deliveryTimeLabel(null, null)).toBe("0min."));
  it("should return on time if the minimum and maximum time are equal", () => expect(deliveryTimeLabel(30, 30)).toBe("30min."));
  it("should return minimum and maximum time if they are different", () => expect(deliveryTimeLabel(30, 70)).toBe("30 à 70min."));
});

describe("EstablishmentScheduleFilterSpec (store time zone America/Sao_Paulo)", () => {
  // 2024-03-15 is a Friday (weekDay 5). Dates are UTC; São Paulo is UTC-3.
  const at = (isoLocal: string) => new Date(`${isoLocal}-03:00`);
  const friday = { weekDay: 5, opensAt: "18:00", closesAt: "23:30" };

  it("should return empty when there is no schedule", () => expect(scheduleLabel("CLOSED", null)).toBe(""));
  it("should return the schedule time if the establishment is open", () =>
    expect(scheduleLabel("OPEN", { weekDay: 5, opensAt: "19:30", closesAt: "23:15" }, at("2024-03-15T20:00"))).toBe("19:30 até 23:15"));
  it("should return today if closed and opens later today", () =>
    expect(scheduleLabel("CLOSED", friday, at("2024-03-15T15:00"))).toBe("Abrirá hoje, às 18:00"));
  it("should return tomorrow if it opens tomorrow", () =>
    expect(scheduleLabel("CLOSED", { ...friday, weekDay: 6 }, at("2024-03-15T20:00"))).toBe("Abrirá amanhã, às 18:00"));
  it("should return the week day if it opens on another day", () =>
    expect(scheduleLabel("CLOSED", { ...friday, weekDay: 0 }, at("2024-03-15T20:00"))).toBe("Abrirá domingo, às 18:00"));
  it("should return the week day if the opening time has passed today", () =>
    expect(scheduleLabel("CLOSED", { ...friday, opensAt: "23:30" }, at("2024-03-15T23:59"))).toBe("Abrirá sexta-feira, às 23:30"));
});

describe("PrettyTimeFilterSpec", () => {
  const now = new Date("2024-04-14T15:00:00-03:00");
  it("should use the HH:mm format if the date is equal today", () => expect(prettyTime(new Date("2024-04-14T02:00:00-03:00"), now)).toBe("02:00"));
  it("should specify the date if different from today", () =>
    expect(prettyTime(new Date("2024-04-15T14:17:00-03:00"), now)).toBe("14:17 do dia 15/04"));
  it("deviation: same day-of-month in another month is not 'today'", () =>
    expect(prettyTime(new Date("2024-03-14T14:17:00-03:00"), now)).toBe("14:17 do dia 14/03"));
});

describe("OrderServiceSpec — when calculating the order item price", () => {
  it("should use the product price", () => expect(itemTotalCents(product({ priceCents: 550 }), selection())).toBe(550));

  it("should use the selected flavors price based on the product flavor billing type", () => {
    const flavors = [
      { id: "a", name: "A", priceCents: 272 },
      { id: "b", name: "B", priceCents: 370 },
      { id: "c", name: "C", priceCents: null },
    ];
    const sel = selection({ flavorIds: ["a", "b", "c"] });
    expect(itemTotalCents(product({ flavors, flavorBilling: "SUM" }), sel)).toBe(642);
    expect(itemTotalCents(product({ flavors, flavorBilling: "HIGHEST_PRICE" }), sel)).toBe(370);
    expect(itemTotalCents(product({ flavors, flavorBilling: "AVERAGE_PRICE" }), sel)).toBe(214);
  });

  it("should use the product selected components from each item", () => {
    const p = product({
      components: [
        { kind: "toggle", id: "c1", name: "Bacon", group: "Adicionais", groupSequence: 1, sequence: 1, priceCents: 272, defaultOn: false },
        { kind: "toggle", id: "c2", name: "Ovo", group: "Adicionais", groupSequence: 1, sequence: 2, priceCents: 337, defaultOn: false },
        { kind: "toggle", id: "c3", name: "Queijo", group: "Adicionais", groupSequence: 1, sequence: 3, priceCents: 1000, defaultOn: false },
      ],
    });
    const sel = selection({ components: [{ componentId: "c1", on: true }, { componentId: "c2", on: true }, { componentId: "c3", on: false }] });
    expect(itemTotalCents(p, sel)).toBe(272 + 337);
  });

  it("should use the product selected components options from each item", () => {
    const p = product({
      components: [
        { kind: "choice", id: "borda", name: "Borda", sequence: 1, options: [
          { id: "o1", name: "Catupiry", priceCents: 200, isDefault: false, sequence: 1 },
          { id: "o2", name: "Cheddar", priceCents: 350, isDefault: false, sequence: 2 },
        ] },
        { kind: "choice", id: "massa", name: "Massa", sequence: 2, options: [{ id: "o3", name: "Fina", priceCents: null, isDefault: true, sequence: 1 }] },
      ],
    });
    expect(itemTotalCents(p, selection({ components: [{ componentId: "borda", optionId: "o2" }, { componentId: "massa", optionId: "o3" }] }))).toBe(350);
  });

  it("should use the product quantity from each item", () => {
    const p = product({
      priceCents: 500,
      flavors: [{ id: "f", name: "F", priceCents: 250 }],
      components: [{ kind: "choice", id: "c", name: "C", sequence: 1, options: [{ id: "o", name: "O", priceCents: 350, isDefault: false, sequence: 1 }] }],
    });
    expect(itemTotalCents(p, selection({ quantity: 7, flavorIds: ["f"], components: [{ componentId: "c", optionId: "o" }] }))).toBe((500 + 250 + 350) * 7);
  });

  it("deviation: an invalid quantity prices as zero (legacy cart silently used 1)", () =>
    expect(itemTotalCents(product({ priceCents: 500 }), selection({ quantity: Number.NaN }))).toBe(0));
});

describe("OrderServiceSpec — when calculating the order price", () => {
  it("legacy example: 4.22 + 9.95 + 4.725 -> 18.895 becomes 1890 cents (half-up policy)", () => {
    const line = (billing: CatalogProduct["flavorBilling"], a: number, b: number) => ({
      totalCents: itemTotalCents(
        product({ flavorBilling: billing, flavors: [{ id: "a", name: "A", priceCents: a }, { id: "b", name: "B", priceCents: b }] }),
        selection({ flavorIds: ["a", "b"] }),
      ),
    });
    const lines = [line("SUM", 272, 150), line("HIGHEST_PRICE", 995, 550), line("AVERAGE_PRICE", 595, 350)];
    expect(orderTotalCents(lines, "PICKUP", 200)).toBe(422 + 995 + 473);
  });
  it("should sum the establishment delivery fee when not a pickup", () => expect(orderTotalCents([{ totalCents: 450 }], "DELIVERY", 200)).toBe(650));
  it("should not sum the delivery fee on pickup", () => expect(orderTotalCents([{ totalCents: 450 }], "PICKUP", 200)).toBe(450));
  it("deviation: a negative delivery fee is treated as free (legacy subtracted it)", () =>
    expect(orderTotalCents([{ totalCents: 450 }], "DELIVERY", -100)).toBe(450));
});
