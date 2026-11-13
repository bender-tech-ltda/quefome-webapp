/**
 * Differential (golden-master) tests: the ORIGINAL legacy AngularJS code vs the new domain functions,
 * on thousands of generated inputs. Any difference must be a documented deviation.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  type CatalogComponent,
  type CatalogProduct,
  type FlavorBilling,
  type ItemSelection,
  deliveryTimeLabel,
  formatMoney,
  itemTotalCents,
  orderTotalCents,
  scheduleLabel,
  shortText,
} from "../src";
import { legacyAvailable, legacyFilter, legacyOrderService } from "./legacy/loader";

const cents = fc.integer({ min: 0, max: 20_000 });
const maybeCents = fc.option(cents, { nil: null });
const billing = fc.constantFrom<FlavorBilling>("SUM", "HIGHEST_PRICE", "AVERAGE_PRICE");

/** A product plus a valid selection for it. */
const productWithSelection = fc
  .record({
    priceCents: cents,
    flavorBilling: billing,
    flavorPrices: fc.array(maybeCents, { maxLength: 4 }),
    toggles: fc.array(fc.record({ price: maybeCents, on: fc.boolean() }), { maxLength: 3 }),
    choices: fc.array(fc.record({ prices: fc.array(maybeCents, { minLength: 1, maxLength: 3 }), pick: fc.nat() , none: fc.boolean() }), { maxLength: 2 }),
    quantity: fc.integer({ min: 1, max: 12 }),
    flavorMask: fc.array(fc.boolean(), { minLength: 4, maxLength: 4 }),
  })
  .map((g) => {
    const flavors = g.flavorPrices.map((p, i) => ({ id: `f${i}`, name: `F${i}`, priceCents: p }));
    const components: CatalogComponent[] = [
      ...g.toggles.map((t, i): CatalogComponent => ({ kind: "toggle", id: `t${i}`, name: `T${i}`, group: "G", groupSequence: 1, sequence: i, priceCents: t.price, defaultOn: false })),
      ...g.choices.map((c, i): CatalogComponent => ({
        kind: "choice", id: `c${i}`, name: `C${i}`, sequence: i,
        options: c.prices.map((p, j) => ({ id: `c${i}o${j}`, name: `O${j}`, priceCents: p, isDefault: false, sequence: j })),
      })),
    ];
    const product: CatalogProduct = { id: "p", name: "P", priceCents: g.priceCents, flavorBilling: g.flavorBilling, maxFlavors: null, flavors, components };
    const selection: ItemSelection = {
      productId: "p", quantity: g.quantity, instructions: "",
      flavorIds: flavors.filter((_, i) => g.flavorMask[i]).map((f) => f.id),
      components: [
        ...g.toggles.map((t, i) => ({ componentId: `t${i}`, on: t.on })),
        ...g.choices.map((c, i) => ({ componentId: `c${i}`, optionId: c.none ? null : `c${i}o${c.pick % c.prices.length}` })),
      ],
    };
    return { product, selection };
  });

/** The same item in the legacy float/object shape consumed by OrderService.getOrderItemPrice. */
function toLegacyItem({ product, selection }: { product: CatalogProduct; selection: ItemSelection }) {
  const reais = (c: number | null) => (c === null ? undefined : c / 100);
  return {
    product: { price: product.priceCents / 100, billingType: product.flavorBilling },
    quantity: selection.quantity,
    flavors: selection.flavorIds.map((id) => ({ price: reais(product.flavors.find((f) => f.id === id)!.priceCents) })),
    components: selection.components.map((s) => {
      const c = product.components.find((x) => x.id === s.componentId)!;
      if (c.kind === "toggle") return { component: { price: reais(c.priceCents) }, value: "on" in s ? s.on : false };
      const option = "optionId" in s && s.optionId ? c.options.find((o) => o.id === s.optionId)! : null;
      return option ? { component: {}, selectedOption: { price: reais(option.priceCents) } } : { component: {}, value: undefined };
    }),
  };
}

describe.skipIf(!legacyAvailable)("differential: legacy OrderService vs domain pricing", () => {
  const legacy = legacyAvailable ? legacyOrderService() : null!;

  it("item price is identical (in cents) for SUM and HIGHEST_PRICE", () => {
    fc.assert(
      fc.property(productWithSelection.filter((x) => x.product.flavorBilling !== "AVERAGE_PRICE"), (x) => {
        expect(itemTotalCents(x.product, x.selection)).toBe(Math.round(legacy.getOrderItemPrice(toLegacyItem(x)) * 100));
      }),
      { numRuns: 3000 },
    );
  });

  it("deviation: AVERAGE_PRICE differs only by per-unit rounding to whole cents (<= 0.5 cent x quantity)", () => {
    fc.assert(
      fc.property(productWithSelection.filter((x) => x.product.flavorBilling === "AVERAGE_PRICE"), (x) => {
        const legacyCents = legacy.getOrderItemPrice(toLegacyItem(x)) * 100;
        expect(Math.abs(itemTotalCents(x.product, x.selection) - legacyCents)).toBeLessThanOrEqual(0.5 * x.selection.quantity + 1e-6);
      }),
      { numRuns: 3000 },
    );
  });

  it("order total (with/without delivery fee) matches legacy for non-average items", () => {
    fc.assert(
      fc.property(
        fc.array(productWithSelection.filter((x) => x.product.flavorBilling !== "AVERAGE_PRICE"), { minLength: 1, maxLength: 5 }),
        cents,
        fc.boolean(),
        (items, feeCents, pickup) => {
          const legacyOrder = { items: items.map(toLegacyItem), withdraw: pickup, establishment: { parameters: { deliverTax: feeCents / 100 } } };
          const lines = items.map((x) => ({ totalCents: itemTotalCents(x.product, x.selection) }));
          expect(orderTotalCents(lines, pickup ? "PICKUP" : "DELIVERY", feeCents)).toBe(Math.round(legacy.getOrderPrice(legacyOrder) * 100));
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe.skipIf(!legacyAvailable)("differential: legacy filters vs domain formatters", () => {
  it("money: identical for any cents value", () => {
    const money = legacyFilter("money");
    fc.assert(fc.property(fc.integer({ min: 0, max: 10_000_000 }), (c) => { expect(formatMoney(c)).toBe(money(c / 100)); }), { numRuns: 5000 });
  });

  it("shortText: identical", () => {
    const legacy = legacyFilter("shortText");
    fc.assert(fc.property(fc.string({ maxLength: 200 }), fc.integer({ min: 1, max: 150 }), (t, n) => { expect(shortText(t, n)).toBe(legacy(t, n)); }));
  });

  it("delivery time: identical", () => {
    const legacy = legacyFilter("establishmentDeliveryTime");
    const t = fc.option(fc.integer({ min: 0, max: 120 }), { nil: null });
    fc.assert(fc.property(t, t, (min, max) => {
      expect(deliveryTimeLabel(min, max)).toBe(legacy({ parameters: { minimumDeliveryTime: min, maximumDeliveryTime: max } }));
    }));
  });

  it("schedule label: identical when the browser is in the store time zone", () => {
    const legacy = legacyFilter("establishmentSchedule");
    const names = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
    fc.assert(
      fc.property(
        fc.constantFrom<"OPEN" | "CLOSED">("OPEN", "CLOSED"),
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }),
        fc.date({ min: new Date("2024-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }),
        (status, weekDay, oh, om, ch, cm, now) => {
          const hhmm = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const local = (h: number, m: number) => { const d = new Date(2024, 0, 1, h, m); return d.getTime(); };
          const legacyEst = { parameters: { status, currentSchedule: { weekDay: { number: weekDay, name: names[weekDay] }, openingTime: local(oh, om), closingTime: local(ch, cm) } } };
          expect(scheduleLabel(status, { weekDay, opensAt: hhmm(oh, om), closesAt: hhmm(ch, cm) }, now)).toBe(legacy(legacyEst, now));
        },
      ),
      { numRuns: 3000 },
    );
  });
});
