import { type CatalogFlavor, type CatalogProduct, type FlavorBilling, type ItemSelection, isToggleSelection } from "./catalog";
import { type Cents, roundCents } from "./money";

/**
 * Legacy OrderService.getFlavorsPrice / CustomizeProductController.getFlavorsPrice (one implementation now).
 * - SUM: sum of flavor prices
 * - HIGHEST_PRICE: the most expensive flavor
 * - AVERAGE_PRICE: sum / number of selected flavors. Flavors WITHOUT price still count in the
 *   denominator (legacy behavior, kept on purpose; flagged for the rules refinement).
 */
export function flavorsPriceCents(flavors: Pick<CatalogFlavor, "priceCents">[], billing: FlavorBilling = "SUM"): Cents {
  if (flavors.length === 0) return 0;
  const prices = flavors.map((f) => f.priceCents ?? 0);
  switch (billing) {
    case "HIGHEST_PRICE":
      return Math.max(0, ...prices);
    case "AVERAGE_PRICE":
      return roundCents(prices.reduce((a, b) => a + b, 0) / prices.length);
    case "SUM":
    default:
      return prices.reduce((a, b) => a + b, 0);
  }
}

export class UnknownReferenceError extends Error {
  constructor(
    readonly kind: "flavor" | "component" | "option",
    readonly id: string,
  ) {
    super(`Unknown ${kind}: ${id}`);
    this.name = "UnknownReferenceError";
  }
}

/** Price of the chosen components (toggles that are on + chosen options). */
export function componentsPriceCents(product: CatalogProduct, selection: ItemSelection): Cents {
  let total = 0;
  for (const chosen of selection.components) {
    const component = product.components.find((c) => c.id === chosen.componentId);
    if (!component) throw new UnknownReferenceError("component", chosen.componentId);
    if (component.kind === "toggle") {
      if (isToggleSelection(chosen) && chosen.on) total += component.priceCents ?? 0;
    } else if (!isToggleSelection(chosen) && chosen.optionId) {
      const option = component.options.find((o) => o.id === chosen.optionId);
      if (!option) throw new UnknownReferenceError("option", chosen.optionId);
      total += option.priceCents ?? 0;
    }
  }
  return total;
}

export function selectedFlavors(product: CatalogProduct, selection: ItemSelection): CatalogFlavor[] {
  return selection.flavorIds.map((id) => {
    const flavor = product.flavors.find((f) => f.id === id);
    if (!flavor) throw new UnknownReferenceError("flavor", id);
    return flavor;
  });
}

/** Price of ONE unit: product + flavors + components. Rounded per unit so receipts always add up. */
export function unitPriceCents(product: CatalogProduct, selection: ItemSelection): Cents {
  return (
    product.priceCents +
    flavorsPriceCents(selectedFlavors(product, selection), product.flavorBilling) +
    componentsPriceCents(product, selection)
  );
}

/**
 * Item total = unit price x quantity.
 * Legacy divergence fixed: the dialog priced a missing quantity as 0 while the cart priced it as 1.
 * Here an invalid quantity is a validation error (see validation.ts) and prices as 0.
 */
export function itemTotalCents(product: CatalogProduct, selection: ItemSelection): Cents {
  const quantity = Number.isInteger(selection.quantity) && selection.quantity > 0 ? selection.quantity : 0;
  return unitPriceCents(product, selection) * quantity;
}

export type Fulfillment = "DELIVERY" | "PICKUP";

export interface PricedLine {
  totalCents: Cents;
}

export function subtotalCents(lines: PricedLine[]): Cents {
  return lines.reduce((sum, line) => sum + line.totalCents, 0);
}

/**
 * Delivery fee applied to an order. Pickup is free.
 * Deviation: legacy ADDED a negative fee (lowering the total); a fee <= 0 is now simply "free".
 */
export function deliveryFeeFor(fulfillment: Fulfillment, storeDeliveryFeeCents: Cents | null): Cents {
  if (fulfillment === "PICKUP") return 0;
  return Math.max(0, storeDeliveryFeeCents ?? 0);
}

export function orderTotalCents(lines: PricedLine[], fulfillment: Fulfillment, storeDeliveryFeeCents: Cents | null): Cents {
  return subtotalCents(lines) + deliveryFeeFor(fulfillment, storeDeliveryFeeCents);
}

/** Troco (change). Only meaningful for payment categories that allow change. */
export function changeDueCents(changeForCents: Cents | null, totalCents: Cents): Cents | null {
  if (changeForCents === null || changeForCents === undefined) return null;
  return changeForCents - totalCents;
}
