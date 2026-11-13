import type { CatalogProduct, ItemSelection, MessageOrderItem, PaymentSettings, Schedule } from "@quefome/domain";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  CreateOrderRequestSchema,
  type ItemSelectionDto,
  type OrderLine,
  type PaymentSettingsDto,
  type Product,
  ProductSchema,
  RESERVED_SLUGS,
  type ScheduleDto,
  StoreSettingsSchema,
  buildPath,
  endpoints,
  matchPath,
} from "../src";

describe("contract <-> domain compatibility (enforced by `tsc`, not at runtime)", () => {
  it("the server prices contract products with the domain", () => expectTypeOf<Product>().toExtend<CatalogProduct>());
  it("the domain selection is exactly what the API accepts", () => expectTypeOf<ItemSelection>().toExtend<ItemSelectionDto>());
  it("order lines feed the WhatsApp message builders", () => expectTypeOf<OrderLine>().toExtend<MessageOrderItem>());
  it("schedules and payment settings are shared", () => {
    expectTypeOf<ScheduleDto>().toExtend<Schedule>();
    expectTypeOf<PaymentSettingsDto>().toExtend<PaymentSettings>();
  });
});

describe("schemas", () => {
  it("money is integer cents", () => {
    const product = { id: "1", categoryId: "1", name: "X", description: "", imageUrl: null, priceCents: 22.9, flavorBilling: "SUM", maxFlavors: null, flavors: [], components: [], available: true };
    expect(ProductSchema.safeParse(product).success).toBe(false);
  });

  it("orders carry ids and choices only: client-sent prices are stripped", () => {
    const parsed = CreateOrderRequestSchema.parse({
      fulfillment: "PICKUP", address: null, customer: { name: "Ana", whatsapp: "51999998888" }, paymentKind: "PIX", changeForCents: null, notes: "",
      items: [{ productId: "1", quantity: 1, instructions: "", flavorIds: [], components: [], priceCents: 1 }],
    });
    expect(parsed.items[0]).not.toHaveProperty("priceCents");
  });

  it("store WhatsApp must be E.164 (+55DDNNNNNNNNN)", () => {
    expect(StoreSettingsSchema.shape.whatsapp.safeParse("+5551999998888").success).toBe(true);
    expect(StoreSettingsSchema.shape.whatsapp.safeParse("51999998888").success).toBe(false);
  });
});

describe("endpoint table", () => {
  it("builds and matches paths", () => {
    expect(buildPath(endpoints.getStore.path, { slug: "burger do zé" })).toBe("/api/stores/burger%20do%20z%C3%A9");
    expect(matchPath(endpoints.updateOrderStatus.path, "/api/admin/orders/42/status")).toEqual({ orderId: "42" });
  });
  it("no personal data in URLs (phones, addresses and credentials travel in bodies)", () => {
    for (const [name, def] of Object.entries(endpoints)) expect(def.path, name).not.toMatch(/:(email|password|street|address|phone|whatsapp)/);
  });
  it("reserved slugs cover the app's root routes", () => expect(RESERVED_SLUGS).toEqual(expect.arrayContaining(["admin", "api", "restaurantes", "cadastro", "dev"])));
});
