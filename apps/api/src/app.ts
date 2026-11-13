import { type EndpointDef, ORDER_STREAM_PATH, endpoints } from "@quefome/contract";
import { normalizeBrazilianMobile } from "@quefome/domain";
import { eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z } from "zod";
import type { Config } from "./config";
import type { AppContext } from "./context";
import type { Database } from "./db/client";
import { stores } from "./db/schema";
import { resetAndSeed } from "./db/seed";
import { Clock } from "./lib/clock";
import { ApiError, invalid, sendError, unauthenticated } from "./lib/errors";
import { EventBus } from "./lib/events";
import { type Logger, createLogger } from "./lib/logger";
import { RateLimiter } from "./lib/rate-limit";
import { SessionService } from "./lib/sessions";
import { FallbackAddressProvider, FixtureAddressProvider, ViaCepAddressProvider } from "./modules/addresses";
import { CatalogService } from "./modules/catalog";
import { IdentityService } from "./modules/identity";
import { MarketplaceService } from "./modules/marketplace";
import { CloudApiProvider, LogProvider, type MessagingProvider, Outbox, OutboxWorker } from "./modules/messaging";
import { OrderService } from "./modules/orders";
import { StoreService } from "./modules/stores";

export interface Api {
  app: Hono;
  ctx: AppContext;
  orders: OrderService;
  stop(): Promise<void>;
}

export interface ApiOverrides {
  /** Tests inject a fake WhatsApp provider. */
  messagingProvider?: MessagingProvider;
}

export async function createApi(config: Config, database: Database, logger: Logger = createLogger(config.LOG_LEVEL), overrides: ApiOverrides = {}): Promise<Api> {
  const clock = new Clock();
  const events = new EventBus(database);
  await events.start();
  const db = database.db;
  const sessions = new SessionService(db, clock, config.SESSION_TTL_DAYS, config.NODE_ENV === "production");
  const fixtures = new FixtureAddressProvider();
  const addresses =
    config.ADDRESS_PROVIDER === "fixtures" ? fixtures
    : config.ADDRESS_PROVIDER === "viacep" ? new ViaCepAddressProvider(logger)
    : new FallbackAddressProvider(new ViaCepAddressProvider(logger), fixtures, logger);
  const provider: MessagingProvider =
    overrides.messagingProvider ??
    (config.MESSAGING_PROVIDER === "cloud-api"
      ? new CloudApiProvider({ apiUrl: config.WHATSAPP_API_URL, version: config.WHATSAPP_API_VERSION, token: config.WHATSAPP_TOKEN!, phoneNumberId: config.WHATSAPP_PHONE_NUMBER_ID! })
      : new LogProvider(logger));
  const outbox = new Outbox(db, clock, provider, config.WHATSAPP_TEMPLATE_LANGUAGE, logger);
  const worker = new OutboxWorker(outbox, config.OUTBOX_POLL_MS, logger);
  const limiters = {
    login: new RateLimiter(10, 60_000),
    signup: new RateLimiter(5, 60 * 60_000),
    ordersByIp: new RateLimiter(20, 10 * 60_000),
    ordersByPhone: new RateLimiter(5, 10 * 60_000),
  };
  const ctx: AppContext = { config, database, clock, sessions, events, logger, addresses, limiters, requestLog: [], outbox, worker };

  const storeService = new StoreService(db, clock);
  const marketplace = new MarketplaceService(db, storeService);
  const identity = new IdentityService(db);
  const catalog = new CatalogService(db, clock);
  const orders = new OrderService(
    db, clock, storeService, events, outbox,
    { appUrl: config.PUBLIC_APP_URL.replace(/\/$/, ""), templates: { newOrder: config.WHATSAPP_TEMPLATE_NEW_ORDER ?? null, statusUpdate: config.WHATSAPP_TEMPLATE_STATUS_UPDATE ?? null } },
    () => void worker.tick(),
  );
  const allowedOrigins = new Set(config.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean));
  const testMode = config.API_TEST_CONTROL === "1";
  const devInbox = config.MESSAGING_PROVIDER === "log" && config.NODE_ENV !== "production";

  const app = new Hono();

  // ------------------------------------------------------------------ helpers
  const reply = (c: Context, endpoint: EndpointDef, data: unknown, status: 200 | 201 = 200) => {
    const parsed = endpoint.response.safeParse(data);
    if (!parsed.success) {
      logger.error({ endpoint: `${endpoint.method} ${endpoint.path}`, issues: parsed.error.issues }, "response violates the contract");
      return c.json({ code: "CONTRACT_VIOLATION", message: "Resposta inválida do servidor" }, 500);
    }
    return c.json(parsed.data as object, status as ContentfulStatusCode);
  };
  const body = async <S extends z.ZodType>(c: Context, endpoint: EndpointDef & { request: S }): Promise<z.infer<S>> => {
    const raw = await c.req.json().catch(() => undefined);
    const parsed = endpoint.request.safeParse(raw);
    if (!parsed.success) throw invalid("VALIDATION_ERROR", "Dados inválidos", parsed.error.issues);
    return parsed.data as z.infer<S>;
  };
  const query = <S extends z.ZodType>(c: Context, schema: S): z.infer<S> => {
    const parsed = schema.safeParse(c.req.query());
    if (!parsed.success) throw invalid("VALIDATION_ERROR", "Filtro inválido", parsed.error.issues);
    return parsed.data as z.infer<S>;
  };
  const requireStaff = async (c: Context) => {
    const userId = await sessions.resolve(c);
    const staff = userId ? await identity.staff(userId) : null;
    if (!staff) throw unauthenticated();
    return staff;
  };
  const clientIp = (c: Context) => c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = (limiter: RateLimiter, key: string, message: string) => {
    if (!limiter.hit(key)) throw new ApiError(429, "RATE_LIMITED", message);
  };

  // ------------------------------------------------------------------ middleware
  app.onError((error, c) => {
    if (error instanceof ApiError) return sendError(c, error);
    logger.error({ err: error, path: c.req.path }, "unhandled error");
    return c.json({ code: "INTERNAL", message: "Erro interno" }, 500);
  });
  app.notFound((c) => c.json({ code: "NOT_FOUND", message: "Recurso não encontrado" }, 404));
  app.use("*", async (c, next) => {
    const started = Date.now();
    const origin = c.req.header("origin");
    if (origin && !["GET", "HEAD", "OPTIONS"].includes(c.req.method) && !allowedOrigins.has(origin)) {
      return c.json({ code: "FORBIDDEN_ORIGIN", message: "Origem não permitida" }, 403);
    }
    if (testMode && c.req.path.startsWith("/api/")) {
      const json = ["POST", "PATCH", "PUT"].includes(c.req.method) ? await c.req.raw.clone().json().catch(() => null) : null;
      ctx.requestLog.push({ method: c.req.method, path: c.req.path + (new URL(c.req.url).search || ""), body: json, at: clock.now().toISOString() });
      if (ctx.requestLog.length > 500) ctx.requestLog.shift();
    }
    await next();
    logger.info({ method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - started }, "request");
  });

  app.get("/health", (c) => c.json({ ok: true, db: database.kind, messaging: provider.name }));
  app.get("/ready", async (c) => {
    await db.execute("select 1");
    return c.json({ ok: true });
  });

  // ------------------------------------------------------------------ marketplace
  app.get("/api/cuisine-types", async (c) => reply(c, endpoints.listCuisineTypes, await marketplace.cuisineTypes()));
  app.get("/api/stores/names", async (c) => {
    const q = query(c, endpoints.suggestStoreNames.query);
    return reply(c, endpoints.suggestStoreNames, await marketplace.suggestNames(q.q, q.limit ?? 10));
  });
  app.get("/api/stores", async (c) => {
    const q = query(c, endpoints.searchStores.query);
    return reply(c, endpoints.searchStores, await marketplace.search(q.q, q.cuisine));
  });

  // ------------------------------------------------------------------ customer (no account)
  app.get("/api/stores/:slug", async (c) => reply(c, endpoints.getStore, await storeService.toStore(await storeService.findPublishedBySlug(c.req.param("slug")))));
  app.get("/api/stores/:slug/menu", async (c) => reply(c, endpoints.getMenu, await storeService.menu((await storeService.findPublishedBySlug(c.req.param("slug"))).id)));
  app.post("/api/stores/:slug/delivery-check", async (c) => {
    const row = await storeService.findPublishedBySlug(c.req.param("slug"));
    const address = await body(c, endpoints.checkDelivery);
    return reply(c, endpoints.checkDelivery, { attended: storeService.attends(row, address) });
  });
  app.get("/api/addresses/zip-code/:zipCode", async (c) => {
    const found = await addresses.lookupZipCode(c.req.param("zipCode"));
    if (!found) throw new ApiError(404, "ZIP_CODE_NOT_FOUND", `CEP ${c.req.param("zipCode")} não encontrado.`);
    return reply(c, endpoints.lookupZipCode, found);
  });
  app.post("/api/addresses/search", async (c) => {
    const q = await body(c, endpoints.searchAddress);
    const found = await addresses.searchStreet(q.street, q.city, q.state);
    if (!found) throw new ApiError(404, "ADDRESS_NOT_FOUND", "Endereço não encontrado");
    return reply(c, endpoints.searchAddress, found);
  });
  app.post("/api/stores/:slug/orders", async (c) => {
    const row = await storeService.findPublishedBySlug(c.req.param("slug"));
    const req = await body(c, endpoints.createOrder);
    limit(ctx.limiters.ordersByIp, `ip:${clientIp(c)}`, "Muitos pedidos em pouco tempo. Aguarde alguns minutos.");
    limit(ctx.limiters.ordersByPhone, `phone:${normalizeBrazilianMobile(req.customer.whatsapp) ?? req.customer.whatsapp}`, "Muitos pedidos em pouco tempo. Aguarde alguns minutos.");
    const { order, created } = await orders.create(row, await storeService.toStore(row), req, c.req.header("idempotency-key") ?? null);
    return reply(c, endpoints.createOrder, order, created ? 201 : 200);
  });
  app.get("/api/orders/:token", async (c) => reply(c, endpoints.getPublicOrder, await orders.getPublic(c.req.param("token"))));

  // ------------------------------------------------------------------ merchant: identity
  app.post("/api/merchant/signup", async (c) => {
    const input = await body(c, endpoints.signup);
    limit(ctx.limiters.signup, `signup:${clientIp(c)}`, "Muitos cadastros a partir da sua rede. Tente mais tarde.");
    const userId = await identity.signup(input);
    await sessions.start(c, userId, true);
    return reply(c, endpoints.signup, await identity.staff(userId), 201);
  });
  app.get("/api/admin/session", async (c) => {
    const userId = await sessions.resolve(c);
    return reply(c, endpoints.getStaffSession, { user: userId ? await identity.staff(userId) : null });
  });
  app.post("/api/admin/session", async (c) => {
    const { email, password, keepLoggedIn } = await body(c, endpoints.staffLogin);
    limit(ctx.limiters.login, `login:${clientIp(c)}`, "Muitas tentativas. Aguarde um minuto.");
    const user = await identity.authenticate(email, password);
    const staff = await identity.staff(user.id);
    if (!staff) throw new ApiError(403, "NO_STORE", "Seu usuário não está vinculado a nenhuma loja");
    await sessions.start(c, user.id, keepLoggedIn);
    return reply(c, endpoints.staffLogin, staff);
  });
  app.delete("/api/admin/session", async (c) => {
    await sessions.end(c);
    return reply(c, endpoints.staffLogout, { ok: true });
  });

  // ------------------------------------------------------------------ merchant: store setup
  app.get("/api/admin/store", async (c) => reply(c, endpoints.getStoreSettings, await storeService.settings((await requireStaff(c)).store.id)));
  app.put("/api/admin/store", async (c) => {
    const staff = await requireStaff(c);
    const input = await body(c, endpoints.updateStoreSettings);
    if (input.published && (!input.address.city || input.address.state.length !== 2 || !input.address.street)) {
      throw invalid("STORE_SETTINGS_INVALID", "Complete o endereço da loja antes de publicar.");
    }
    return reply(c, endpoints.updateStoreSettings, await storeService.updateSettings(staff.store.id, input));
  });
  app.post("/api/admin/store/status", async (c) => {
    const staff = await requireStaff(c);
    const { override } = await body(c, endpoints.setStoreStatus);
    return reply(c, endpoints.setStoreStatus, await storeService.setStatusOverride(staff.store.id, override));
  });

  // ------------------------------------------------------------------ merchant: menu
  app.get("/api/admin/catalog", async (c) => reply(c, endpoints.getCatalog, await storeService.menu((await requireStaff(c)).store.id)));
  app.post("/api/admin/categories", async (c) => {
    const staff = await requireStaff(c);
    return reply(c, endpoints.createCategory, await catalog.createCategory(staff.store.id, await body(c, endpoints.createCategory)), 201);
  });
  app.put("/api/admin/categories/:categoryId", async (c) => {
    const staff = await requireStaff(c);
    return reply(c, endpoints.updateCategory, await catalog.updateCategory(staff.store.id, c.req.param("categoryId"), await body(c, endpoints.updateCategory)));
  });
  app.delete("/api/admin/categories/:categoryId", async (c) => {
    const staff = await requireStaff(c);
    await catalog.deleteCategory(staff.store.id, c.req.param("categoryId"));
    return reply(c, endpoints.deleteCategory, { ok: true });
  });
  app.post("/api/admin/products", async (c) => {
    const staff = await requireStaff(c);
    return reply(c, endpoints.createProduct, await catalog.createProduct(staff.store.id, await body(c, endpoints.createProduct)), 201);
  });
  app.put("/api/admin/products/:productId", async (c) => {
    const staff = await requireStaff(c);
    return reply(c, endpoints.updateProduct, await catalog.updateProduct(staff.store.id, c.req.param("productId"), await body(c, endpoints.updateProduct)));
  });
  app.patch("/api/admin/products/:productId/availability", async (c) => {
    const staff = await requireStaff(c);
    const { available } = await body(c, endpoints.setProductAvailability);
    return reply(c, endpoints.setProductAvailability, await catalog.setAvailability(staff.store.id, c.req.param("productId"), available));
  });
  app.delete("/api/admin/products/:productId", async (c) => {
    const staff = await requireStaff(c);
    await catalog.deleteProduct(staff.store.id, c.req.param("productId"));
    return reply(c, endpoints.deleteProduct, { ok: true });
  });

  // ------------------------------------------------------------------ merchant: orders
  app.get("/api/admin/orders", async (c) => {
    const staff = await requireStaff(c);
    return reply(c, endpoints.listStoreOrders, await orders.listForStore(staff.store.id, query(c, endpoints.listStoreOrders.query), staff.store.timeZone));
  });

  /** Realtime feed for the board (SSE). The board also polls as a fallback. */
  app.get(ORDER_STREAM_PATH, async (c) => {
    const staff = await requireStaff(c);
    const lastEventHeader = c.req.header("last-event-id");
    const lastEventId = lastEventHeader === undefined ? null : Number(lastEventHeader) || 0;
    return streamSSE(c, async (stream) => {
      let closed = false;
      stream.onAbort(() => {
        closed = true;
      });
      await stream.writeSSE({ event: "ready", data: JSON.stringify({ storeId: staff.store.id, at: clock.now().toISOString() }) });
      if (lastEventId !== null) {
        for (const ev of await orders.eventsSince(staff.store.id, lastEventId)) {
          await stream.writeSSE({ id: String(ev.id), event: ev.type, data: JSON.stringify({ orderId: ev.orderId, status: ev.toStatus, at: ev.at.toISOString() }) });
        }
      }
      const unsubscribe = events.subscribe(staff.store.id, (ev) => {
        void stream.writeSSE({ id: String(ev.id), event: ev.type, data: JSON.stringify({ orderId: ev.orderId, status: ev.status, version: ev.version, at: ev.at }) });
      });
      try {
        while (!closed) {
          await stream.sleep(20_000);
          if (!closed) await stream.writeSSE({ event: "heartbeat", data: clock.now().toISOString() });
        }
      } finally {
        unsubscribe();
      }
    });
  });

  app.get("/api/admin/orders/:orderId", async (c) => {
    const staff = await requireStaff(c);
    return reply(c, endpoints.getStoreOrder, await orders.getForStore(staff.store.id, c.req.param("orderId")));
  });
  app.patch("/api/admin/orders/:orderId/status", async (c) => {
    const staff = await requireStaff(c);
    const input = await body(c, endpoints.updateOrderStatus);
    return reply(c, endpoints.updateOrderStatus, await orders.changeStatus(staff.store.id, c.req.param("orderId"), input, staff.id));
  });

  // ------------------------------------------------------------------ dev WhatsApp inbox (log provider, never in production)
  if (devInbox) {
    app.get("/api/dev/messages", async (c) => {
      await worker.tick();
      const rows = await outbox.recent(100);
      const numbers = new Map<string, number>();
      if (rows.length) {
        const { orders: ordersTable } = await import("./db/schema");
        const { inArray } = await import("drizzle-orm");
        const ids = [...new Set(rows.map((r) => r.message.orderId).filter((x): x is string => !!x))];
        if (ids.length) for (const o of await db.select({ id: ordersTable.id, number: ordersTable.number }).from(ordersTable).where(inArray(ordersTable.id, ids))) numbers.set(o.id, o.number);
      }
      return reply(
        c,
        endpoints.listDevMessages,
        rows.map(({ message: m, storeName }) => ({
          id: m.id, recipient: m.recipient, to: m.to, event: m.event, status: m.status, text: m.text,
          orderNumber: m.orderId ? (numbers.get(m.orderId) ?? null) : null, storeName, createdAt: m.createdAt.toISOString(),
        })),
      );
    });
  }

  // ------------------------------------------------------------------ test control (API_TEST_CONTROL=1 only)
  if (testMode) {
    app.post("/__control/reset", async (c) => {
      await resetAndSeed(db);
      clock.set(null);
      for (const l of Object.values(limiters)) l.reset();
      ctx.requestLog.length = 0;
      return c.json({ ok: true });
    });
    app.post("/__control/clock", async (c) => {
      const { now } = (await c.req.json().catch(() => ({}))) as { now?: string | null };
      clock.set(now ? new Date(now) : null);
      return c.json({ ok: true, now: clock.now().toISOString() });
    });
    app.get("/__control/requests", (c) => c.json(ctx.requestLog));
    app.post("/__control/stores/:slug/status", async (c) => {
      const { status } = (await c.req.json()) as { status: "OPEN" | "CLOSED" | null };
      const updated = await db.update(stores).set({ statusOverride: status ?? null }).where(eq(stores.slug, c.req.param("slug"))).returning({ id: stores.id });
      return updated.length ? c.json({ ok: true }) : c.json({ ok: false }, 404);
    });
    app.post("/__control/outbox/deliver", async (c) => c.json({ processed: await outbox.deliverDue() }));
  }

  worker.start();

  return {
    app,
    ctx,
    orders,
    stop: async () => {
      worker.stop();
      await events.stop();
    },
  };
}
