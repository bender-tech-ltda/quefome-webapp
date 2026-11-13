import type { AdminOrder, Menu, Product, Store } from "@quefome/contract";

export const pizza: Product = {
  id: "201", categoryId: "20", name: "Pizza Grande", description: "até 2 sabores", imageUrl: null, available: true,
  priceCents: 0, flavorBilling: "HIGHEST_PRICE", maxFlavors: 2,
  flavors: [
    { id: "2011", name: "Calabresa", priceCents: 4590 },
    { id: "2012", name: "Quatro queijos", priceCents: 4990 },
    { id: "2013", name: "Marguerita", priceCents: 4790 },
  ],
  components: [
    { kind: "choice", id: "2014", name: "Borda", sequence: 1, options: [
      { id: "20141", name: "Sem borda", priceCents: 0, isDefault: true, sequence: 1 },
      { id: "20142", name: "Catupiry", priceCents: 800, isDefault: false, sequence: 2 },
    ] },
    { kind: "toggle", id: "2015", name: "Orégano extra", group: "Adicionais", groupSequence: 2, sequence: 1, priceCents: 150, defaultOn: false },
  ],
};

export const burger: Product = { id: "102", categoryId: "10", name: "X-Bacon", description: "", imageUrl: null, available: true, priceCents: 2790, flavorBilling: "SUM", maxFlavors: null, flavors: [], components: [] };

export const menu: Menu = { categories: [{ id: "10", name: "Lanches", icon: "burger", sequence: 1 }, { id: "20", name: "Pizzas", icon: "pizza", sequence: 2 }], products: [burger, pizza] };

export const store: Store = {
  id: "1", slug: "burger-do-ze", cuisineTypeIds: ["ct1"], name: "Burger do Zé", description: "", imageUrl: null, timeZone: "America/Sao_Paulo",
  address: { zipCode: "92010-000", street: "Rua A", number: "1", complement: "", neighborhood: "Centro", city: "Canoas", state: "RS" },
  status: "OPEN", currentSchedule: null, schedules: [], deliveryEnabled: true, deliveryFeeCents: 500, minimumOrderCents: 2000, pickupEnabled: true,
  deliveryTime: { minMinutes: 30, maxMinutes: 50 }, paymentKinds: ["PIX", "CARD", "CASH"], whatsapp: "+5551988887777",
};

export const order: AdminOrder = {
  id: "o1", number: 12, storeId: "1", trackingToken: "tok", status: "PENDING", version: 0,
  createdAt: "2024-03-15T23:05:00.000Z", statusChangedAt: "2024-03-15T23:05:00.000Z", estimatedDeliveryAt: null,
  customer: { name: "Ana <b>Cliente</b>", whatsapp: "+5551999998888" },
  fulfillment: "DELIVERY",
  address: { zipCode: "92010-000", street: "Rua Quinze de Janeiro", number: "10", complement: "ap 2", neighborhood: "Centro", city: "Canoas", state: "RS" },
  payment: { kind: "CASH", changeForCents: 10000 }, notes: "Interfone quebrado", cancelReason: null, notifications: [],
  items: [{
    productId: "201", productName: "Pizza Grande", quantity: 1, instructions: "bem assada",
    flavors: [{ id: "2011", name: "Calabresa", priceCents: 4590 }, { id: "2012", name: "Quatro queijos", priceCents: 4990 }],
    components: [
      { componentId: "2014", name: "Borda", value: { kind: "choice", optionId: "20142", optionName: "Catupiry" } },
      { componentId: "2015", name: "Orégano extra", value: { kind: "toggle", on: false, defaultOn: false } },
    ],
    unitPriceCents: 5790, totalCents: 5790,
  }],
  subtotalCents: 5790, deliveryFeeCents: 500, totalCents: 6290,
};
