import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4020),
  /** postgres://… for real Postgres. Unset = embedded PGlite (zero setup). */
  DATABASE_URL: z.string().optional(),
  /** PGlite data directory (ignored with DATABASE_URL). "memory" = in-memory. */
  PGLITE_DIR: z.string().default(".data/pglite"),
  LOG_LEVEL: z.string().default("info"),
  /** viacep = real lookups; fixtures = offline table; auto = viacep with fixtures fallback (never in production). */
  ADDRESS_PROVIDER: z.enum(["auto", "viacep", "fixtures"]).default("auto"),
  /** Comma-separated browser origins allowed to perform cookie-authenticated mutations (CSRF). */
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  /** Exposes /__control/* (reset, clock, force statuses). Never enable in production. */
  API_TEST_CONTROL: z.enum(["0", "1"]).default("0"),
  /** Apply pending migrations and seed an empty database on boot (dev/test convenience). */
  MIGRATE_ON_START: z.enum(["0", "1"]).default("1"),
  SEED_ON_START: z.enum(["0", "1"]).default("1"),
  SESSION_TTL_DAYS: z.coerce.number().default(30),
  /** Public web URL used in WhatsApp messages (tracking / dashboard links). */
  PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  /** log = record messages only (dev inbox at /dev/whatsapp); cloud-api = WhatsApp Business Cloud API. */
  MESSAGING_PROVIDER: z.enum(["log", "cloud-api"]).default("log"),
  WHATSAPP_API_URL: z.string().url().default("https://graph.facebook.com"),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  /** Approved template names. Without them, free-form text is sent (only delivered inside the 24h window). */
  WHATSAPP_TEMPLATE_NEW_ORDER: z.string().optional(),
  WHATSAPP_TEMPLATE_STATUS_UPDATE: z.string().optional(),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().default("pt_BR"),
  /** Outbox worker poll interval; 0 disables the worker (tests drive it manually). */
  OUTBOX_POLL_MS: z.coerce.number().int().min(0).default(1000),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const config = schema.parse(env);
  if (config.NODE_ENV === "production") {
    if (config.API_TEST_CONTROL === "1") throw new Error("API_TEST_CONTROL must be 0 in production");
    if (!config.DATABASE_URL) throw new Error("DATABASE_URL is required in production (PGlite is for local use)");
    if (config.ADDRESS_PROVIDER !== "viacep") throw new Error("ADDRESS_PROVIDER must be viacep in production");
    if (config.MESSAGING_PROVIDER !== "cloud-api") throw new Error("MESSAGING_PROVIDER must be cloud-api in production (log only records messages)");
  }
  if (config.MESSAGING_PROVIDER === "cloud-api" && (!config.WHATSAPP_TOKEN || !config.WHATSAPP_PHONE_NUMBER_ID)) {
    throw new Error("MESSAGING_PROVIDER=cloud-api requires WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID");
  }
  return config;
}
