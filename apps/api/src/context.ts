import type { Config } from "./config";
import type { Database } from "./db/client";
import type { AddressProvider } from "./modules/addresses";
import type { Outbox, OutboxWorker } from "./modules/messaging";
import type { Clock } from "./lib/clock";
import type { EventBus } from "./lib/events";
import type { Logger } from "./lib/logger";
import type { RateLimiter } from "./lib/rate-limit";
import type { SessionService } from "./lib/sessions";

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
  at: string;
}

/** Everything a route needs; built once in createApi(). */
export interface AppContext {
  config: Config;
  database: Database;
  clock: Clock;
  sessions: SessionService;
  events: EventBus;
  logger: Logger;
  addresses: AddressProvider;
  limiters: { login: RateLimiter; ordersByIp: RateLimiter; ordersByPhone: RateLimiter; signup: RateLimiter };
  outbox: Outbox;
  worker: OutboxWorker;
  /** Test mode only: ring buffer of API requests for E2E payload assertions. */
  requestLog: RecordedRequest[];
}
