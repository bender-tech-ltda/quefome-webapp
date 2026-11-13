import { describe, expect, it } from "vitest";
import { allowedFulfillment, reconcileCart } from "@/features/store/useCart";
import { burger, menu, pizza } from "./fixtures";

const line = (over: object) => ({ lineId: "l", product: burger, selection: { productId: burger.id, quantity: 1, instructions: "", flavorIds: [], components: [] }, ...over });
const both = { pickupEnabled: true, deliveryEnabled: true };

describe("saved cart vs current menu", () => {
  it("prices always come from the current menu", () => {
    const { cart } = reconcileCart({ lines: [line({ product: { ...burger, priceCents: 1 } })], fulfillment: "DELIVERY" }, menu, both);
    expect(cart.lines[0]!.product.priceCents).toBe(2790);
  });
  it("removes (and reports) items that went out of stock or no longer exist", () => {
    const soldOut = { ...menu, products: [{ ...burger, available: false }, pizza] };
    const badFlavor = line({ product: pizza, selection: { productId: pizza.id, quantity: 1, instructions: "", flavorIds: ["nope"], components: [] } });
    const result = reconcileCart({ lines: [line({}), badFlavor], fulfillment: "DELIVERY" }, soldOut, both);
    expect(result.cart.lines).toHaveLength(0);
    expect(result.removed).toEqual(["X-Bacon", "Pizza Grande"]);
  });
  it("falls back to what the store offers", () => {
    expect(allowedFulfillment("PICKUP", { pickupEnabled: false, deliveryEnabled: true })).toBe("DELIVERY");
    expect(allowedFulfillment("DELIVERY", { pickupEnabled: true, deliveryEnabled: false })).toBe("PICKUP");
  });
});
