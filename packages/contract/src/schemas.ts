import { z } from "zod";

/**
 * API CONTRACT v1 (MVP). Conventions: ids are strings, money is integer cents (`*Cents`), dates are ISO-8601,
 * phone numbers are E.164 (+55...), business errors are 4xx + ApiError.
 * Changes from v0: guest checkout (no customer accounts), public order page by token, MVP statuses,
 * merchant sign-up / store settings / menu CRUD, WhatsApp notifications.
 */

const id = z.string().min(1);
const cents = z.number().int();
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:mm");
const isoDateTime = z.string().datetime({ offset: true });
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
/** +55 + DDD + 8/9 digits. Stores may use WhatsApp Business on a landline; customers must use mobiles. */
const e164 = z.string().regex(/^\+55\d{10,11}$/, "WhatsApp em formato +55DDNNNNNNNNN");

// ----------------------------------------------------------------------------- errors
export const ApiErrorSchema = z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() });
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ----------------------------------------------------------------------------- store
export const ScheduleSchema = z.object({ weekDay: z.number().int().min(0).max(6), opensAt: hhmm, closesAt: hhmm });
export type ScheduleDto = z.infer<typeof ScheduleSchema>;

/** Store address: may be incomplete until the store is published. */
export const StoreAddressSchema = z.object({
  zipCode: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string().max(2),
});
export type StoreAddress = z.infer<typeof StoreAddressSchema>;

export const PaymentKindSchema = z.enum(["CASH", "PIX", "CARD"]);
export const PixSettingsSchema = z.object({
  keyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
  key: z.string().min(1).max(140),
  holderName: z.string().min(1).max(100),
});
export const PaymentSettingsSchema = z.object({ cash: z.boolean(), card: z.boolean(), pix: PixSettingsSchema.nullable() });
export type PaymentSettingsDto = z.infer<typeof PaymentSettingsSchema>;

/** MVP delivery area: the whole city of the store, or a list of neighborhoods. */
export const DeliveryAreaSchema = z.object({ mode: z.enum(["CITY", "NEIGHBORHOODS"]), neighborhoods: z.array(z.string().min(1)) });

export const CuisineTypeSchema = z.object({ id, slug, name: z.string(), icon: z.string().nullable(), sequence: z.number().int(), featured: z.boolean() });
export type CuisineType = z.infer<typeof CuisineTypeSchema>;

/** Public store (menu page). */
export const StoreSchema = z.object({
  id,
  slug,
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  timeZone: z.string(),
  address: StoreAddressSchema,
  cuisineTypeIds: z.array(id),
  /** Computed from schedules and the manual pause/open override. */
  status: z.enum(["OPEN", "CLOSED"]),
  currentSchedule: ScheduleSchema.nullable(),
  schedules: z.array(ScheduleSchema),
  deliveryEnabled: z.boolean(),
  deliveryFeeCents: cents,
  minimumOrderCents: cents.nullable(),
  pickupEnabled: z.boolean(),
  deliveryTime: z.object({ minMinutes: z.number().int().nullable(), maxMinutes: z.number().int().nullable() }),
  paymentKinds: z.array(PaymentKindSchema),
  /** For the "talk to the restaurant" button. */
  whatsapp: e164.nullable(),
});
export type Store = z.infer<typeof StoreSchema>;

export const StoreSummarySchema = StoreSchema.pick({
  id: true, slug: true, name: true, description: true, imageUrl: true, timeZone: true, address: true,
  status: true, currentSchedule: true, deliveryFeeCents: true, minimumOrderCents: true, deliveryTime: true, cuisineTypeIds: true,
}).extend({ popularity: z.number().int().min(0) });
export type StoreSummary = z.infer<typeof StoreSummarySchema>;

export const StoreSearchQuerySchema = z.object({ q: z.string().max(100).optional(), cuisine: z.string().max(50).optional() });
export type StoreSearchQuery = z.infer<typeof StoreSearchQuerySchema>;
export const StoreNameSuggestionSchema = z.object({ slug: z.string(), name: z.string() });
export type StoreNameSuggestion = z.infer<typeof StoreNameSuggestionSchema>;

// ----------------------------------------------------------------------------- menu
export const MenuCategorySchema = z.object({ id, name: z.string(), icon: z.string().nullable(), sequence: z.number().int() });
export const FlavorSchema = z.object({ id, name: z.string(), priceCents: cents.nullable() });
export const ToggleComponentSchema = z.object({
  kind: z.literal("toggle"), id, name: z.string(), group: z.string(), groupSequence: z.number().int(), sequence: z.number().int(),
  priceCents: cents.nullable(), defaultOn: z.boolean(),
});
export const OptionSchema = z.object({ id, name: z.string(), priceCents: cents.nullable(), isDefault: z.boolean(), sequence: z.number().int() });
export const ChoiceComponentSchema = z.object({ kind: z.literal("choice"), id, name: z.string(), sequence: z.number().int(), options: z.array(OptionSchema).min(1) });
export const ComponentSchema = z.discriminatedUnion("kind", [ToggleComponentSchema, ChoiceComponentSchema]);

export const ProductSchema = z.object({
  id,
  categoryId: id,
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  priceCents: cents,
  flavorBilling: z.enum(["SUM", "HIGHEST_PRICE", "AVERAGE_PRICE"]),
  maxFlavors: z.number().int().positive().nullable(),
  flavors: z.array(FlavorSchema),
  components: z.array(ComponentSchema),
  /** Out of stock products are listed but can't be ordered. */
  available: z.boolean(),
});
export type Product = z.infer<typeof ProductSchema>;
export const MenuSchema = z.object({ categories: z.array(MenuCategorySchema), products: z.array(ProductSchema) });
export type Menu = z.infer<typeof MenuSchema>;

// ----------------------------------------------------------------------------- addresses
export const AddressLookupSchema = z.object({ zipCode: z.string(), street: z.string(), neighborhood: z.string(), city: z.string(), state: z.string().length(2) });
export type AddressLookup = z.infer<typeof AddressLookupSchema>;
export const AddressSearchRequestSchema = z.object({ street: z.string().min(1), city: z.string().min(1), state: z.string().length(2) });
export type AddressSearchRequest = z.infer<typeof AddressSearchRequestSchema>;
export const DeliveryCheckRequestSchema = AddressLookupSchema;
export type DeliveryCheckRequest = z.infer<typeof DeliveryCheckRequestSchema>;
export const DeliveryCheckResponseSchema = z.object({ attended: z.boolean() });

// ----------------------------------------------------------------------------- orders
export const ComponentSelectionSchema = z.union([z.object({ componentId: id, on: z.boolean() }), z.object({ componentId: id, optionId: id.nullable() })]);
export const ItemSelectionSchema = z.object({
  productId: id,
  quantity: z.number().int().min(1).max(99),
  instructions: z.string().max(300),
  flavorIds: z.array(id),
  components: z.array(ComponentSelectionSchema),
});
export type ItemSelectionDto = z.infer<typeof ItemSelectionSchema>;
export const DeliveryAddressSchema = StoreAddressSchema.extend({
  street: z.string().min(1),
  number: z.string().min(1),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
});
export type DeliveryAddress = z.infer<typeof DeliveryAddressSchema>;

/** Guest checkout: ids and choices only; prices are ALWAYS recomputed by the server. */
export const CreateOrderRequestSchema = z.object({
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  address: DeliveryAddressSchema.nullable(),
  customer: z.object({ name: z.string().trim().min(1).max(80), whatsapp: z.string().min(8).max(30) }),
  paymentKind: PaymentKindSchema,
  changeForCents: cents.nullable(),
  notes: z.string().max(500),
  items: z.array(ItemSelectionSchema).min(1).max(50),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const OrderStatusSchema = z.enum(["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELED"]);

export const OrderLineSchema = z.object({
  productId: id,
  productName: z.string(),
  quantity: z.number().int().min(1),
  instructions: z.string(),
  flavors: z.array(FlavorSchema),
  components: z.array(
    z.object({
      componentId: id,
      name: z.string(),
      value: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("toggle"), on: z.boolean(), defaultOn: z.boolean() }),
        z.object({ kind: z.literal("choice"), optionId: id.nullable(), optionName: z.string().nullable() }),
      ]),
    }),
  ),
  unitPriceCents: cents,
  totalCents: cents,
});
export type OrderLine = z.infer<typeof OrderLineSchema>;

const orderCore = {
  number: z.number().int().positive(),
  status: OrderStatusSchema,
  createdAt: isoDateTime,
  estimatedDeliveryAt: isoDateTime.nullable(),
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  items: z.array(OrderLineSchema).min(1),
  subtotalCents: cents,
  deliveryFeeCents: cents,
  totalCents: cents,
  payment: z.object({ kind: PaymentKindSchema, changeForCents: cents.nullable() }),
  notes: z.string(),
  cancelReason: z.string().nullable(),
};

/** Customer's order page (capability URL: whoever has the token sees it; no address or phone inside). */
export const PublicOrderSchema = z.object({
  ...orderCore,
  trackingToken: z.string().min(16),
  store: z.object({ slug: z.string(), name: z.string(), whatsapp: e164.nullable() }),
  statusHistory: z.array(z.object({ status: OrderStatusSchema, at: isoDateTime })),
  /** Pix key to pay, only when the customer chose Pix. */
  pix: PixSettingsSchema.nullable(),
  /** The WhatsApp message with the order reached the restaurant. */
  restaurantNotified: z.boolean(),
});
export type PublicOrder = z.infer<typeof PublicOrderSchema>;

export const NotificationSchema = z.object({
  recipient: z.enum(["STORE", "CUSTOMER"]),
  event: z.string(),
  status: z.enum(["PENDING", "SENT", "FAILED"]),
  at: isoDateTime,
});

/** Merchant view of an order. */
export const AdminOrderSchema = z.object({
  ...orderCore,
  id,
  storeId: id,
  trackingToken: z.string(),
  version: z.number().int().min(0),
  statusChangedAt: isoDateTime,
  customer: z.object({ name: z.string(), whatsapp: e164 }),
  address: DeliveryAddressSchema.nullable(),
  notifications: z.array(NotificationSchema),
});
export type AdminOrder = z.infer<typeof AdminOrderSchema>;

export const OrderStatusUpdateSchema = z.object({ status: OrderStatusSchema, version: z.number().int().min(0), reason: z.string().max(200).optional() });
export type OrderStatusUpdate = z.infer<typeof OrderStatusUpdateSchema>;

export const AdminOrderQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AdminOrderQuery = z.infer<typeof AdminOrderQuerySchema>;

// ----------------------------------------------------------------------------- merchant
export const StaffUserSchema = z.object({
  id,
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["OWNER", "STAFF"]),
  store: z.object({ id, slug: z.string(), name: z.string(), imageUrl: z.string().nullable(), timeZone: z.string(), published: z.boolean() }),
});
export type StaffUser = z.infer<typeof StaffUserSchema>;

export const LoginRequestSchema = z.object({ email: z.string().email(), password: z.string().min(1), keepLoggedIn: z.boolean() });
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SignupRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  storeName: z.string().trim().min(2).max(60),
  whatsapp: z.string().min(8).max(30),
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

/** Everything the merchant configures (GET + PUT /api/admin/store). */
export const StoreSettingsSchema = z.object({
  slug,
  name: z.string().trim().min(2).max(60),
  description: z.string().max(300),
  whatsapp: e164,
  address: StoreAddressSchema,
  timeZone: z.string(),
  schedules: z.array(ScheduleSchema),
  deliveryEnabled: z.boolean(),
  deliveryFeeCents: cents.min(0),
  minimumOrderCents: cents.min(0).nullable(),
  deliveryArea: DeliveryAreaSchema,
  deliveryTime: z.object({ minMinutes: z.number().int().min(0).nullable(), maxMinutes: z.number().int().min(0).nullable() }),
  pickupEnabled: z.boolean(),
  payment: PaymentSettingsSchema,
  cuisineTypeIds: z.array(id),
  /** Listed in the marketplace and reachable by its link. */
  published: z.boolean(),
  /** Manual override: CLOSED = paused, OPEN = open outside the schedule, null = follow the schedule. */
  statusOverride: z.enum(["OPEN", "CLOSED"]).nullable(),
});
export type StoreSettings = z.infer<typeof StoreSettingsSchema>;
export const StoreSettingsUpdateSchema = StoreSettingsSchema.omit({ slug: true, statusOverride: true });
export type StoreSettingsUpdate = z.infer<typeof StoreSettingsUpdateSchema>;
export const StoreStatusOverrideSchema = z.object({ override: z.enum(["OPEN", "CLOSED"]).nullable() });

export const CategoryInputSchema = z.object({ name: z.string().trim().min(1).max(60), icon: z.string().max(30).nullable(), sequence: z.number().int().min(0).max(999) });
export type CategoryInput = z.infer<typeof CategoryInputSchema>;
export const ProductInputSchema = z.object({
  categoryId: id,
  name: z.string().trim().min(1).max(80),
  description: z.string().max(300),
  priceCents: cents.min(0),
  available: z.boolean(),
  sequence: z.number().int().min(0).max(999),
  /** Advanced options (flavors, option groups, extras): optional; omitted on update = keep current. */
  flavorBilling: z.enum(["SUM", "HIGHEST_PRICE", "AVERAGE_PRICE"]).optional(),
  maxFlavors: z.number().int().positive().nullable().optional(),
  flavors: z.array(FlavorSchema).optional(),
  components: z.array(ComponentSchema).optional(),
});
export type ProductInput = z.infer<typeof ProductInputSchema>;
export const AvailabilitySchema = z.object({ available: z.boolean() });

// ----------------------------------------------------------------------------- dev
/** Messages recorded by the dev "log" WhatsApp provider (not available in production). */
export const DevMessageSchema = z.object({
  id,
  recipient: z.enum(["STORE", "CUSTOMER"]),
  to: z.string(),
  event: z.string(),
  status: z.enum(["PENDING", "SENT", "FAILED"]),
  text: z.string(),
  orderNumber: z.number().int().nullable(),
  storeName: z.string(),
  createdAt: isoDateTime,
});
export type DevMessage = z.infer<typeof DevMessageSchema>;
