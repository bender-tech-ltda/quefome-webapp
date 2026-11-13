/** Typed API surface (contract v1). One function per endpoint; nothing else talks HTTP. */
import {
  type AddressSearchRequest,
  type AdminOrderQuery,
  type CategoryInput,
  type CreateOrderRequest,
  type DeliveryCheckRequest,
  type LoginRequest,
  type OrderStatusUpdate,
  type ProductInput,
  type SignupRequest,
  type StoreSearchQuery,
  type StoreSettingsUpdate,
  endpoints,
} from "@quefome/contract";
import { request } from "./http";

export { ApiRequestError } from "./http";

export const api = {
  // marketplace
  listCuisineTypes: () => request(endpoints.listCuisineTypes),
  searchStores: (query: StoreSearchQuery) => request(endpoints.searchStores, { query }),
  suggestStoreNames: (q: string, limit = 8, signal?: AbortSignal) => request(endpoints.suggestStoreNames, { query: { q, limit: String(limit) }, signal }),

  // customer
  getStore: (slug: string) => request(endpoints.getStore, { params: { slug } }),
  getMenu: (slug: string) => request(endpoints.getMenu, { params: { slug } }),
  checkDelivery: (slug: string, body: DeliveryCheckRequest) => request(endpoints.checkDelivery, { params: { slug }, body }),
  lookupZipCode: (zipCode: string) => request(endpoints.lookupZipCode, { params: { zipCode: zipCode.replace(/[^0-9]/g, "") } }),
  searchAddress: (body: AddressSearchRequest) => request(endpoints.searchAddress, { body }),
  /** `idempotencyKey`: one UUID per checkout, reused on retry, so a double tap never creates two orders. */
  createOrder: (slug: string, body: CreateOrderRequest, idempotencyKey: string) =>
    request(endpoints.createOrder, { params: { slug }, body, headers: { "Idempotency-Key": idempotencyKey } }),
  getPublicOrder: (token: string) => request(endpoints.getPublicOrder, { params: { token } }),

  // merchant
  admin: {
    signup: (body: SignupRequest) => request(endpoints.signup, { body }),
    getSession: () => request(endpoints.getStaffSession),
    login: (body: LoginRequest) => request(endpoints.staffLogin, { body }),
    logout: () => request(endpoints.staffLogout),
    getSettings: () => request(endpoints.getStoreSettings),
    updateSettings: (body: StoreSettingsUpdate) => request(endpoints.updateStoreSettings, { body }),
    setStoreStatus: (override: "OPEN" | "CLOSED" | null) => request(endpoints.setStoreStatus, { body: { override } }),
    getCatalog: () => request(endpoints.getCatalog),
    createCategory: (body: CategoryInput) => request(endpoints.createCategory, { body }),
    updateCategory: (categoryId: string, body: CategoryInput) => request(endpoints.updateCategory, { params: { categoryId }, body }),
    deleteCategory: (categoryId: string) => request(endpoints.deleteCategory, { params: { categoryId } }),
    createProduct: (body: ProductInput) => request(endpoints.createProduct, { body }),
    updateProduct: (productId: string, body: ProductInput) => request(endpoints.updateProduct, { params: { productId }, body }),
    setAvailability: (productId: string, available: boolean) => request(endpoints.setProductAvailability, { params: { productId }, body: { available } }),
    deleteProduct: (productId: string) => request(endpoints.deleteProduct, { params: { productId } }),
    listOrders: (query: AdminOrderQuery = {}) => request(endpoints.listStoreOrders, { query }),
    getOrder: (orderId: string) => request(endpoints.getStoreOrder, { params: { orderId } }),
    updateOrderStatus: (orderId: string, body: OrderStatusUpdate) => request(endpoints.updateOrderStatus, { params: { orderId }, body }),
  },

  dev: { messages: () => request(endpoints.listDevMessages) },
};
