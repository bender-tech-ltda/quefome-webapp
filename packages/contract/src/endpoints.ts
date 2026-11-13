import { z } from "zod";
import {
  AddressLookupSchema,
  AddressSearchRequestSchema,
  AdminOrderQuerySchema,
  AdminOrderSchema,
  AvailabilitySchema,
  CategoryInputSchema,
  CreateOrderRequestSchema,
  CuisineTypeSchema,
  DeliveryCheckRequestSchema,
  DeliveryCheckResponseSchema,
  DevMessageSchema,
  LoginRequestSchema,
  MenuCategorySchema,
  MenuSchema,
  OrderStatusUpdateSchema,
  ProductInputSchema,
  ProductSchema,
  PublicOrderSchema,
  SignupRequestSchema,
  StaffUserSchema,
  StoreNameSuggestionSchema,
  StoreSchema,
  StoreSearchQuerySchema,
  StoreSettingsSchema,
  StoreSettingsUpdateSchema,
  StoreStatusOverrideSchema,
  StoreSummarySchema,
} from "./schemas";

export interface EndpointDef {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  auth: "public" | "staff" | "dev";
  request?: z.ZodType;
  query?: z.ZodType;
  response: z.ZodType;
}

const Ok = z.object({ ok: z.literal(true) });

/** Every endpoint of API v1. Path params use `:name`. */
export const endpoints = {
  // ---- marketplace (secondary channel)
  listCuisineTypes: { method: "GET", path: "/api/cuisine-types", auth: "public", response: z.array(CuisineTypeSchema) },
  searchStores: { method: "GET", path: "/api/stores", auth: "public", query: StoreSearchQuerySchema, response: z.array(StoreSummarySchema) },
  suggestStoreNames: {
    method: "GET", path: "/api/stores/names", auth: "public",
    query: z.object({ q: z.string().max(100).optional(), limit: z.coerce.number().int().min(1).max(20).optional() }),
    response: z.array(StoreNameSuggestionSchema),
  },

  // ---- customer (no account)
  getStore: { method: "GET", path: "/api/stores/:slug", auth: "public", response: StoreSchema },
  getMenu: { method: "GET", path: "/api/stores/:slug/menu", auth: "public", response: MenuSchema },
  checkDelivery: { method: "POST", path: "/api/stores/:slug/delivery-check", auth: "public", request: DeliveryCheckRequestSchema, response: DeliveryCheckResponseSchema },
  lookupZipCode: { method: "GET", path: "/api/addresses/zip-code/:zipCode", auth: "public", response: AddressLookupSchema },
  searchAddress: { method: "POST", path: "/api/addresses/search", auth: "public", request: AddressSearchRequestSchema, response: AddressLookupSchema },
  /** Send `Idempotency-Key` (one UUID per checkout): the same key returns the same order. */
  createOrder: { method: "POST", path: "/api/stores/:slug/orders", auth: "public", request: CreateOrderRequestSchema, response: PublicOrderSchema },
  getPublicOrder: { method: "GET", path: "/api/orders/:token", auth: "public", response: PublicOrderSchema },

  // ---- merchant
  signup: { method: "POST", path: "/api/merchant/signup", auth: "public", request: SignupRequestSchema, response: StaffUserSchema },
  getStaffSession: { method: "GET", path: "/api/admin/session", auth: "public", response: z.object({ user: StaffUserSchema.nullable() }) },
  staffLogin: { method: "POST", path: "/api/admin/session", auth: "public", request: LoginRequestSchema, response: StaffUserSchema },
  staffLogout: { method: "DELETE", path: "/api/admin/session", auth: "public", response: Ok },

  getStoreSettings: { method: "GET", path: "/api/admin/store", auth: "staff", response: StoreSettingsSchema },
  updateStoreSettings: { method: "PUT", path: "/api/admin/store", auth: "staff", request: StoreSettingsUpdateSchema, response: StoreSettingsSchema },
  setStoreStatus: { method: "POST", path: "/api/admin/store/status", auth: "staff", request: StoreStatusOverrideSchema, response: StoreSchema },

  getCatalog: { method: "GET", path: "/api/admin/catalog", auth: "staff", response: MenuSchema },
  createCategory: { method: "POST", path: "/api/admin/categories", auth: "staff", request: CategoryInputSchema, response: MenuCategorySchema },
  updateCategory: { method: "PUT", path: "/api/admin/categories/:categoryId", auth: "staff", request: CategoryInputSchema, response: MenuCategorySchema },
  deleteCategory: { method: "DELETE", path: "/api/admin/categories/:categoryId", auth: "staff", response: Ok },
  createProduct: { method: "POST", path: "/api/admin/products", auth: "staff", request: ProductInputSchema, response: ProductSchema },
  updateProduct: { method: "PUT", path: "/api/admin/products/:productId", auth: "staff", request: ProductInputSchema, response: ProductSchema },
  setProductAvailability: { method: "PATCH", path: "/api/admin/products/:productId/availability", auth: "staff", request: AvailabilitySchema, response: ProductSchema },
  deleteProduct: { method: "DELETE", path: "/api/admin/products/:productId", auth: "staff", response: Ok },

  listStoreOrders: { method: "GET", path: "/api/admin/orders", auth: "staff", query: AdminOrderQuerySchema, response: z.array(AdminOrderSchema) },
  getStoreOrder: { method: "GET", path: "/api/admin/orders/:orderId", auth: "staff", response: AdminOrderSchema },
  updateOrderStatus: { method: "PATCH", path: "/api/admin/orders/:orderId/status", auth: "staff", request: OrderStatusUpdateSchema, response: AdminOrderSchema },

  // ---- development only (dev WhatsApp inbox)
  listDevMessages: { method: "GET", path: "/api/dev/messages", auth: "dev", response: z.array(DevMessageSchema) },
} as const satisfies Record<string, EndpointDef>;

export type EndpointName = keyof typeof endpoints;

/** SSE stream of order events for the merchant board (not JSON, so outside the table). */
export const ORDER_STREAM_PATH = "/api/admin/orders/stream";

export function buildPath(path: string, params: Record<string, string> = {}): string {
  return path.replace(/:([a-zA-Z]+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path param "${name}" for ${path}`);
    return encodeURIComponent(value);
  });
}

export function matchPath(template: string, concrete: string): Record<string, string> | null {
  const names: string[] = [];
  const pattern = template.replace(/:([a-zA-Z]+)/g, (_, name: string) => {
    names.push(name);
    return "([^/]+)";
  });
  const match = new RegExp(`^${pattern}$`).exec(concrete);
  if (!match) return null;
  return Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(match[i + 1] ?? "")]));
}

/** Slugs a store can't use (they collide with app routes at the root). */
export const RESERVED_SLUGS = [
  "admin", "api", "_next", "assets", "vendor", "fonts", "names", "dev", "pedido", "pedidos", "usuario", "restaurantes",
  "cadastro", "robots.txt", "favicon.ico", "sitemap.xml",
] as const;
