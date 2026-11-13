/**
 * Database schema v1 (Drizzle, PostgreSQL). Conventions:
 * - text ids (UUIDs in production, readable ids in fixtures); money in integer cents; timestamptz
 * - every store-owned row carries store_id and every merchant query is scoped by it
 * - JSONB columns use contract types so the database can't hold shapes the API can't serve
 * - no customer accounts: orders carry the customer's name + WhatsApp (E.164)
 */
import type { DeliveryAddress, OrderLine, PaymentSettingsDto, Product, StoreAddress } from "@quefome/contract";
import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

type Flavor = Product["flavors"][number];
type DeliveryArea = { mode: "CITY" | "NEIGHBORHOODS"; neighborhoods: string[] };

const id = () => text("id").primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** Merchant users (owners and staff). */
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const cuisineTypes = pgTable("cuisine_types", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  sequence: integer("sequence").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
});

export const stores = pgTable("stores", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  whatsapp: text("whatsapp"),
  timeZone: text("time_zone").notNull().default("America/Sao_Paulo"),
  address: jsonb("address").$type<StoreAddress>().notNull(),
  /** Listed in the marketplace and reachable by its link. New stores start unpublished. */
  published: boolean("published").notNull().default(false),
  /** Manual override: CLOSED = paused, OPEN = open outside schedule, null = schedule. */
  statusOverride: text("status_override", { enum: ["OPEN", "CLOSED"] }),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(true),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  minimumOrderCents: integer("minimum_order_cents"),
  deliveryArea: jsonb("delivery_area").$type<DeliveryArea>().notNull().default({ mode: "CITY", neighborhoods: [] }),
  deliveryMinMinutes: integer("delivery_min_minutes"),
  deliveryMaxMinutes: integer("delivery_max_minutes"),
  pickupEnabled: boolean("pickup_enabled").notNull().default(false),
  payment: jsonb("payment").$type<PaymentSettingsDto>().notNull().default({ cash: true, card: true, pix: null }),
  popularity: integer("popularity").notNull().default(0),
  orderSeq: integer("order_seq").notNull().default(0),
  createdAt: createdAt(),
});

export const storeCuisineTypes = pgTable(
  "store_cuisine_types",
  {
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    cuisineTypeId: text("cuisine_type_id").notNull().references(() => cuisineTypes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.storeId, t.cuisineTypeId] })],
);

export const memberships = pgTable(
  "memberships",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["OWNER", "STAFF"] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.storeId] })],
);

export const schedules = pgTable(
  "schedules",
  {
    id: serial("id").primaryKey(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    weekDay: integer("week_day").notNull(),
    opensAt: text("opens_at").notNull(),
    closesAt: text("closes_at").notNull(),
  },
  (t) => [index("schedules_store_idx").on(t.storeId)],
);

export const categories = pgTable(
  "categories",
  {
    id: id(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon"),
    sequence: integer("sequence").notNull().default(0),
  },
  (t) => [index("categories_store_idx").on(t.storeId)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => categories.id),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    priceCents: integer("price_cents").notNull(),
    flavorBilling: text("flavor_billing", { enum: ["SUM", "HIGHEST_PRICE", "AVERAGE_PRICE"] }).notNull().default("SUM"),
    maxFlavors: integer("max_flavors"),
    flavors: jsonb("flavors").$type<Flavor[]>().notNull().default([]),
    components: jsonb("components").$type<Product["components"]>().notNull().default([]),
    available: boolean("available").notNull().default(true),
    sequence: integer("sequence").notNull().default(0),
    /** Soft delete: past orders keep their snapshot; archived products disappear from the menu. */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [index("products_store_idx").on(t.storeId)],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    storeId: text("store_id").notNull().references(() => stores.id),
    number: integer("number").notNull(),
    trackingToken: text("tracking_token").notNull().unique(),
    idempotencyKey: text("idempotency_key"),
    status: text("status").notNull(),
    version: integer("version").notNull().default(0),
    customerName: text("customer_name").notNull(),
    customerWhatsapp: text("customer_whatsapp").notNull(),
    fulfillment: text("fulfillment", { enum: ["DELIVERY", "PICKUP"] }).notNull(),
    address: jsonb("address").$type<DeliveryAddress | null>(),
    paymentKind: text("payment_kind", { enum: ["CASH", "PIX", "CARD"] }).notNull(),
    changeForCents: integer("change_for_cents"),
    notes: text("notes").notNull().default(""),
    items: jsonb("items").$type<OrderLine[]>().notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    cancelReason: text("cancel_reason"),
    estimatedDeliveryAt: timestamp("estimated_delivery_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("orders_store_number_idx").on(t.storeId, t.number),
    uniqueIndex("orders_idempotency_idx").on(t.storeId, t.idempotencyKey),
    index("orders_store_created_idx").on(t.storeId, t.createdAt),
    index("orders_customer_idx").on(t.customerWhatsapp, t.createdAt),
  ],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    storeId: text("store_id").notNull(),
    type: text("type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    actorUserId: text("actor_user_id"),
    at: timestamp("at", { withTimezone: true }).notNull(),
  },
  (t) => [index("order_events_store_idx").on(t.storeId, t.id), index("order_events_order_idx").on(t.orderId)],
);

/**
 * WhatsApp outbox: written in the same transaction as the order change, delivered by a background
 * worker with retries. An order never fails because WhatsApp is slow or down.
 */
export const messages = pgTable(
  "messages",
  {
    id: id(),
    storeId: text("store_id").notNull(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
    /** Dedupe: one message per (order, event, recipient). */
    dedupeKey: text("dedupe_key").notNull().unique(),
    recipient: text("recipient", { enum: ["STORE", "CUSTOMER"] }).notNull(),
    to: text("to").notNull(),
    event: text("event").notNull(),
    text: text("text").notNull(),
    templateName: text("template_name"),
    templateParams: jsonb("template_params").$type<string[]>().notNull().default([]),
    status: text("status", { enum: ["PENDING", "SENT", "FAILED"] }).notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull(),
    lastError: text("last_error"),
    providerMessageId: text("provider_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("messages_due_idx").on(t.status, t.nextAttemptAt), index("messages_order_idx").on(t.orderId)],
);

export const schema = { users, sessions, cuisineTypes, stores, storeCuisineTypes, memberships, schedules, categories, products, orders, orderEvents, messages };
