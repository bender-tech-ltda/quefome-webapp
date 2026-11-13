import { serve } from "@hono/node-server";
import type { AddressInfo } from "node:net";
import { type Api, createApi } from "../src/app";
import { loadConfig } from "../src/config";
import { type Database, createDatabase } from "../src/db/client";
import { seed } from "../src/db/seed";
import { createLogger } from "../src/lib/logger";
import { type MessagingProvider, type OutgoingMessage, ProviderError } from "../src/modules/messaging";

/** Fake WhatsApp: records what would be sent; can be told to fail. */
export class FakeWhatsApp implements MessagingProvider {
  readonly name = "fake";
  sent: OutgoingMessage[] = [];
  failNext: { times: number; retryable: boolean } = { times: 0, retryable: true };
  async send(message: OutgoingMessage) {
    if (this.failNext.times > 0) {
      this.failNext.times--;
      throw new ProviderError("simulated failure", this.failNext.retryable);
    }
    this.sent.push(message);
    return { providerMessageId: `fake-${this.sent.length}` };
  }
  to(e164: string) {
    return this.sent.filter((m) => m.to === e164);
  }
  reset() {
    this.sent = [];
    this.failNext = { times: 0, retryable: true };
  }
}

export interface RunningApi {
  baseUrl: string;
  api: Api;
  database: Database;
  whatsapp: FakeWhatsApp;
  /** Deliver everything due in the outbox (the worker is disabled in tests). */
  flush(): Promise<void>;
  stop(): Promise<void>;
}

/** Boots the API on an ephemeral port. PGlite in memory; TEST_DATABASE_URL = real Postgres. */
export async function startTestApi(overrides: Partial<NodeJS.ProcessEnv> = {}): Promise<RunningApi> {
  const config = loadConfig({
    NODE_ENV: "test",
    API_TEST_CONTROL: "1",
    ADDRESS_PROVIDER: "fixtures",
    ALLOWED_ORIGINS: "http://localhost:3000",
    LOG_LEVEL: "silent",
    PGLITE_DIR: "memory",
    OUTBOX_POLL_MS: "0",
    PUBLIC_APP_URL: "https://app.test",
    ...(process.env.TEST_DATABASE_URL ? { DATABASE_URL: process.env.TEST_DATABASE_URL } : {}),
    ...overrides,
  });
  const database = await createDatabase({ databaseUrl: config.DATABASE_URL, pgliteDir: config.PGLITE_DIR });
  await database.migrate();
  await seed(database.db);
  const whatsapp = new FakeWhatsApp();
  const api = await createApi(config, database, createLogger("silent"), { messagingProvider: whatsapp });
  const { server, baseUrl } = await new Promise<{ server: ReturnType<typeof serve>; baseUrl: string }>((resolve) => {
    const s = serve({ fetch: api.app.fetch, port: 0, hostname: "127.0.0.1" }, (info: AddressInfo) => resolve({ server: s, baseUrl: `http://127.0.0.1:${info.port}` }));
  });
  return {
    baseUrl,
    api,
    database,
    whatsapp,
    flush: async () => {
      await api.ctx.worker.tick();
      await api.ctx.outbox.deliverDue();
    },
    stop: async () => {
      await new Promise<void>((r) => server.close(() => r()));
      await api.stop();
      await database.close();
    },
  };
}

/** Minimal HTTP client with a cookie jar (behaves like a browser for the merchant session). */
export class Client {
  cookies = new Map<string, string>();
  constructor(private readonly baseUrl: () => string) {}

  async call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(this.baseUrl() + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(this.cookies.size ? { cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const raw of res.headers.getSetCookie()) {
      const [pair, ...attrs] = raw.split(";");
      const [name, value] = pair!.split("=");
      if (attrs.some((a) => /max-age=0/i.test(a)) || !value) this.cookies.delete(name!.trim());
      else this.cookies.set(name!.trim(), value);
    }
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- assertions inspect arbitrary JSON
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, json, headers: res.headers };
  }
  get = (path: string, headers?: Record<string, string>) => this.call("GET", path, undefined, headers);
  post = (path: string, body?: unknown, headers?: Record<string, string>) => this.call("POST", path, body, headers);
  put = (path: string, body?: unknown) => this.call("PUT", path, body);
  patch = (path: string, body?: unknown) => this.call("PATCH", path, body);
  delete = (path: string) => this.call("DELETE", path);
  cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

export const STAFF = { email: "ze@burgerdoze.com.br", password: "senha123" };
export const OTHER_STAFF = { email: "bella@pizzariabella.com.br", password: "senha123" };
export const STORE_WHATSAPP = "+5551988887777";
export const CUSTOMER_WHATSAPP = "+5551999998888";
/** Friday 2024-03-15 20:00 in São Paulo. */
export const FIXED_NOW = "2024-03-15T23:00:00.000Z";

export const deliveryOrder = {
  fulfillment: "DELIVERY" as const,
  address: { zipCode: "92010-000", street: "Rua Quinze de Janeiro", number: "10", complement: "ap 2", neighborhood: "Centro", city: "Canoas", state: "RS" },
  customer: { name: "Ana Cliente", whatsapp: "(51) 99999-8888" },
  paymentKind: "CASH" as const,
  changeForCents: 10000,
  notes: "",
  items: [
    { productId: "101", quantity: 1, instructions: "sem tomate", flavorIds: [], components: [{ componentId: "1011", optionId: "10112" }, { componentId: "1012", on: true }] },
    { productId: "201", quantity: 1, instructions: "", flavorIds: ["2011", "2012"], components: [{ componentId: "2014", optionId: "20141" }] },
  ],
};
