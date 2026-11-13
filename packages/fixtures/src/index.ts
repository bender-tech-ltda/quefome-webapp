/**
 * Demo/seed data (pt-BR), derived from what the legacy UI consumed, in the v1 contract shape.
 * Used by: apps/api seed (dev + tests) and the E2E suite.
 */
import type { AddressLookup, CuisineType, Menu, StoreSettings } from "@quefome/contract";

export interface StoreFixture {
  id: string;
  imageUrl: string | null;
  settings: StoreSettings;
  menu: Menu;
  /** Marketplace ranking (legacy `totalOrders`). */
  popularity: number;
}

export const CUISINE_TYPES: CuisineType[] = [
  { id: "ct1", slug: "lanches", name: "Lanches", icon: "burger", sequence: 1, featured: true },
  { id: "ct2", slug: "pizzas", name: "Pizzas", icon: "pizza", sequence: 2, featured: true },
  { id: "ct3", slug: "japonesa", name: "Japonesa", icon: "sushi", sequence: 3, featured: true },
  { id: "ct4", slug: "saudavel", name: "Saudável", icon: "salad", sequence: 4, featured: true },
  { id: "ct5", slug: "bebidas", name: "Bebidas", icon: "drink", sequence: 9, featured: false },
];

const everyDay = (opensAt: string, closesAt: string) => [0, 1, 2, 3, 4, 5, 6].map((weekDay) => ({ weekDay, opensAt, closesAt }));
const available = <T extends object>(p: T) => ({ ...p, available: true });

export function createStoreFixtures(): StoreFixture[] {
  return [
    {
      id: "1",
      imageUrl: null,
      popularity: 120,
      settings: {
        slug: "burger-do-ze",
        name: "Burger do Zé",
        description: "Hambúrgueres artesanais e pizzas no capricho",
        whatsapp: "+5551988887777",
        address: { zipCode: "92010-000", street: "Rua Quinze de Janeiro", number: "100", complement: "", neighborhood: "Centro", city: "Canoas", state: "RS" },
        timeZone: "America/Sao_Paulo",
        schedules: everyDay("18:00", "23:30"),
        deliveryEnabled: true,
        deliveryFeeCents: 500,
        minimumOrderCents: 2000,
        deliveryArea: { mode: "NEIGHBORHOODS", neighborhoods: ["Centro", "Niterói", "Marechal Rondon"] },
        deliveryTime: { minMinutes: 30, maxMinutes: 50 },
        pickupEnabled: true,
        payment: { cash: true, card: true, pix: { keyType: "EMAIL", key: "pix@burgerdoze.com.br", holderName: "Burger do Zé Ltda" } },
        cuisineTypeIds: ["ct1", "ct2", "ct5"],
        published: true,
        statusOverride: "OPEN",
      },
      menu: {
        categories: [
          { id: "10", name: "Lanches", icon: "burger", sequence: 1 },
          { id: "20", name: "Pizzas", icon: "pizza", sequence: 2 },
          { id: "30", name: "Bebidas", icon: "drink", sequence: 3 },
        ],
        products: [
          available({
            id: "101", categoryId: "10", name: "X-Salada", description: "Pão, hambúrguer 150g, queijo, alface e tomate", imageUrl: null,
            priceCents: 2290, flavorBilling: "SUM" as const, maxFlavors: null, flavors: [],
            components: [
              { kind: "choice" as const, id: "1011", name: "Ponto da carne", sequence: 1, options: [
                { id: "10111", name: "Ao ponto", priceCents: 0, isDefault: true, sequence: 1 },
                { id: "10112", name: "Bem passado", priceCents: 0, isDefault: false, sequence: 2 },
              ] },
              { kind: "toggle" as const, id: "1012", name: "Bacon", group: "Adicionais", groupSequence: 2, sequence: 1, priceCents: 400, defaultOn: false },
              { kind: "toggle" as const, id: "1013", name: "Ovo", group: "Adicionais", groupSequence: 2, sequence: 2, priceCents: 250, defaultOn: false },
              { kind: "toggle" as const, id: "1014", name: "Cebola", group: "Ingredientes", groupSequence: 3, sequence: 1, priceCents: null, defaultOn: true },
            ],
          }),
          available({ id: "102", categoryId: "10", name: "X-Bacon", description: "Pão, hambúrguer 150g, queijo e muito bacon", imageUrl: null, priceCents: 2790, flavorBilling: "SUM" as const, maxFlavors: null, flavors: [], components: [] }),
          available({
            id: "201", categoryId: "20", name: "Pizza Grande", description: "8 fatias, até 2 sabores (cobra o sabor mais caro)", imageUrl: null,
            priceCents: 0, flavorBilling: "HIGHEST_PRICE" as const, maxFlavors: 2,
            flavors: [
              { id: "2011", name: "Calabresa", priceCents: 4590 },
              { id: "2012", name: "Quatro queijos", priceCents: 4990 },
              { id: "2013", name: "Marguerita", priceCents: 4790 },
            ],
            components: [
              { kind: "choice" as const, id: "2014", name: "Borda", sequence: 1, options: [
                { id: "20141", name: "Sem borda", priceCents: 0, isDefault: true, sequence: 1 },
                { id: "20142", name: "Catupiry", priceCents: 800, isDefault: false, sequence: 2 },
              ] },
            ],
          }),
          available({
            id: "202", categoryId: "20", name: "Pizza Média Meio a Meio", description: "6 fatias, 2 sabores (cobra a média)", imageUrl: null,
            priceCents: 0, flavorBilling: "AVERAGE_PRICE" as const, maxFlavors: 2,
            flavors: [{ id: "2021", name: "Calabresa", priceCents: 3990 }, { id: "2022", name: "Frango com catupiry", priceCents: 4495 }],
            components: [],
          }),
          available({ id: "301", categoryId: "30", name: "Refrigerante lata", description: "350ml", imageUrl: null, priceCents: 600, flavorBilling: "SUM" as const, maxFlavors: null, flavors: [], components: [] }),
        ],
      },
    },
    {
      id: "2",
      imageUrl: null,
      popularity: 35,
      settings: {
        slug: "pizzaria-bella",
        name: "Pizzaria Bella",
        description: "Pizzas no forno a lenha até tarde",
        whatsapp: "+5551977776666",
        address: { zipCode: "92010-000", street: "Avenida Guilherme Schell", number: "2000", complement: "", neighborhood: "Centro", city: "Canoas", state: "RS" },
        timeZone: "America/Sao_Paulo",
        schedules: [5, 6].map((weekDay) => ({ weekDay, opensAt: "18:00", closesAt: "02:00" })),
        deliveryEnabled: true,
        deliveryFeeCents: 0,
        minimumOrderCents: null,
        deliveryArea: { mode: "CITY", neighborhoods: [] },
        deliveryTime: { minMinutes: 40, maxMinutes: 40 },
        pickupEnabled: false,
        payment: { cash: true, card: false, pix: null },
        cuisineTypeIds: ["ct2"],
        published: true,
        statusOverride: "CLOSED",
      },
      menu: {
        categories: [{ id: "40", name: "Pizzas", icon: "pizza", sequence: 1 }],
        products: [available({ id: "401", categoryId: "40", name: "Pizza Família", description: "12 fatias", imageUrl: null, priceCents: 6990, flavorBilling: "SUM" as const, maxFlavors: null, flavors: [], components: [] })],
      },
    },
    {
      id: "3",
      imageUrl: null,
      popularity: 80,
      settings: {
        slug: "sushi-kazu",
        name: "Sushi Kazu",
        description: "Combinados e temakis",
        whatsapp: "+5551966665555",
        address: { zipCode: "92020-000", street: "Avenida Getúlio Vargas", number: "900", complement: "", neighborhood: "Niterói", city: "Canoas", state: "RS" },
        timeZone: "America/Sao_Paulo",
        schedules: everyDay("11:00", "23:00"),
        deliveryEnabled: true,
        deliveryFeeCents: 800,
        minimumOrderCents: 4000,
        deliveryArea: { mode: "NEIGHBORHOODS", neighborhoods: ["Centro", "Niterói"] },
        deliveryTime: { minMinutes: 45, maxMinutes: 60 },
        pickupEnabled: true,
        payment: { cash: true, card: true, pix: null },
        cuisineTypeIds: ["ct3", "ct4"],
        published: true,
        statusOverride: "OPEN",
      },
      menu: {
        categories: [{ id: "50", name: "Combinados", icon: "sushi", sequence: 1 }],
        products: [available({ id: "501", categoryId: "50", name: "Combinado 20 peças", description: "Sashimi, niguiri e uramaki", imageUrl: null, priceCents: 6990, flavorBilling: "SUM" as const, maxFlavors: null, flavors: [], components: [] })],
      },
    },
  ];
}

/** Offline CEP base (tests and dev without network; production uses ViaCEP). */
export const ADDRESSES: AddressLookup[] = [
  { zipCode: "92010-000", street: "Rua Quinze de Janeiro", neighborhood: "Centro", city: "Canoas", state: "RS" },
  { zipCode: "92020-000", street: "Avenida Getúlio Vargas", neighborhood: "Niterói", city: "Canoas", state: "RS" },
  { zipCode: "92200-000", street: "Rua Boqueirão", neighborhood: "Estância Velha", city: "Canoas", state: "RS" },
  { zipCode: "01310-100", street: "Avenida Paulista", neighborhood: "Bela Vista", city: "São Paulo", state: "SP" },
];

export interface StaffFixture {
  id: string;
  name: string;
  email: string;
  password: string;
  storeId: string;
}

export const DEMO_PASSWORD = "senha123";
export const STAFF: StaffFixture[] = [
  { id: "s1", name: "Zé", email: "ze@burgerdoze.com.br", password: DEMO_PASSWORD, storeId: "1" },
  { id: "s2", name: "Bella", email: "bella@pizzariabella.com.br", password: DEMO_PASSWORD, storeId: "2" },
  { id: "s3", name: "Kazu", email: "kazu@sushikazu.com.br", password: DEMO_PASSWORD, storeId: "3" },
];

/** A customer persona for tests and demos (no account: just a name and a WhatsApp number). */
export const DEMO_CUSTOMER = { name: "Ana Cliente", whatsapp: "(51) 99999-8888", e164: "+5551999998888" };
