/**
 * WhatsApp notifications: outbox + background delivery.
 *
 *   order created ─┐                    ┌─> provider "cloud-api": WhatsApp Business Cloud API (templates or text)
 *   status changed ┴─> messages (outbox) ┤
 *        (same DB transaction)           └─> provider "log": records only (dev inbox at /dev/whatsapp)
 *
 * The worker retries with exponential backoff and gives up after MAX_ATTEMPTS (status FAILED, visible to
 * the merchant on the order card). Sending never blocks or fails an order.
 */
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { Db } from "../db/client";
import { messages, stores } from "../db/schema";
import type { Clock } from "../lib/clock";
import type { Logger } from "../lib/logger";

export const MAX_ATTEMPTS = 5;

export interface OutgoingMessage {
  to: string; // E.164
  text: string;
  template: { name: string; language: string; params: string[] } | null;
}

export interface MessagingProvider {
  readonly name: string;
  send(message: OutgoingMessage): Promise<{ providerMessageId: string }>;
}

/** Records messages without sending them (development, tests, demos). */
export class LogProvider implements MessagingProvider {
  readonly name = "log";
  constructor(private readonly logger: Logger) {}
  async send(message: OutgoingMessage) {
    this.logger.info({ to: `${message.to.slice(0, 6)}…`, template: message.template?.name ?? null }, "whatsapp (log provider): message recorded");
    return { providerMessageId: `log-${crypto.randomUUID()}` };
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    /** false = don't retry (bad number, rejected template, auth). */
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

/**
 * WhatsApp Business Platform, Cloud API: POST {api}/{version}/{phone-number-id}/messages.
 * Business-initiated messages outside the 24h customer-service window must be approved TEMPLATES.
 */
export class CloudApiProvider implements MessagingProvider {
  readonly name = "cloud-api";
  constructor(
    private readonly opts: { apiUrl: string; version: string; token: string; phoneNumberId: string },
    private readonly timeoutMs = 10_000,
  ) {}

  async send(message: OutgoingMessage) {
    const to = message.to.replace(/^\+/, "");
    const body = message.template
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: message.template.name,
            language: { code: message.template.language },
            components: [{ type: "body", parameters: message.template.params.map((text) => ({ type: "text", text })) }],
          },
        }
      : { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: message.text } };

    let res: Response;
    try {
      res = await fetch(`${this.opts.apiUrl}/${this.opts.version}/${this.opts.phoneNumberId}/messages`, {
        method: "POST",
        headers: { authorization: `Bearer ${this.opts.token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ProviderError(`network: ${(error as Error).message}`, true);
    }
    const payload = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string; code?: number } };
    if (!res.ok) {
      // 429 / 5xx are transient; 4xx (invalid number, template rejected, auth) are not.
      const retryable = res.status === 429 || res.status >= 500;
      throw new ProviderError(`cloud-api ${res.status}: ${payload.error?.message ?? "unknown error"}`, retryable);
    }
    const providerMessageId = payload.messages?.[0]?.id;
    if (!providerMessageId) throw new ProviderError("cloud-api: response without message id", true);
    return { providerMessageId };
  }
}

export interface EnqueueInput {
  storeId: string;
  orderId: string | null;
  dedupeKey: string;
  recipient: "STORE" | "CUSTOMER";
  to: string;
  event: string;
  text: string;
  templateName: string | null;
  templateParams: string[];
}

type Tx = Pick<Db, "insert">;

export class Outbox {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly provider: MessagingProvider,
    private readonly templateLanguage: string,
    private readonly logger: Logger,
  ) {}

  /** Call inside the transaction that changes the order. Duplicate dedupe keys are ignored. */
  async enqueue(tx: Tx, input: EnqueueInput) {
    const now = this.clock.now();
    await tx
      .insert(messages)
      .values({ id: crypto.randomUUID(), ...input, status: "PENDING", attempts: 0, nextAttemptAt: now, createdAt: now })
      .onConflictDoNothing({ target: messages.dedupeKey });
  }

  /** Delivers due messages once. Returns how many were processed. */
  async deliverDue(limit = 20): Promise<number> {
    const due = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.status, "PENDING"), lte(messages.nextAttemptAt, this.clock.now())))
      .orderBy(asc(messages.createdAt))
      .limit(limit);
    for (const msg of due) {
      // claim: only one worker (instance) processes a given attempt
      const [claimed] = await this.db
        .update(messages)
        .set({ attempts: msg.attempts + 1, nextAttemptAt: new Date(this.clock.now().getTime() + 60_000) })
        .where(and(eq(messages.id, msg.id), eq(messages.status, "PENDING"), eq(messages.attempts, msg.attempts)))
        .returning();
      if (!claimed) continue;
      try {
        const { providerMessageId } = await this.provider.send({
          to: msg.to,
          text: msg.text,
          template: msg.templateName ? { name: msg.templateName, language: this.templateLanguage, params: msg.templateParams } : null,
        });
        await this.db.update(messages).set({ status: "SENT", sentAt: this.clock.now(), providerMessageId, lastError: null }).where(eq(messages.id, msg.id));
      } catch (error) {
        const retryable = !(error instanceof ProviderError) || error.retryable;
        const giveUp = !retryable || claimed.attempts >= MAX_ATTEMPTS;
        const backoffMs = Math.min(2 ** claimed.attempts * 5_000, 10 * 60_000); // 10s, 20s, 40s, 80s…
        await this.db
          .update(messages)
          .set({ status: giveUp ? "FAILED" : "PENDING", lastError: (error as Error).message.slice(0, 500), nextAttemptAt: new Date(this.clock.now().getTime() + backoffMs) })
          .where(eq(messages.id, msg.id));
        this.logger.warn({ messageId: msg.id, attempt: claimed.attempts, giveUp, err: (error as Error).message }, "whatsapp delivery failed");
      }
    }
    return due.length;
  }

  async forOrder(orderId: string) {
    return this.db.select().from(messages).where(eq(messages.orderId, orderId)).orderBy(asc(messages.createdAt));
  }

  /** Dev inbox (log provider only). */
  async recent(limit = 100) {
    return this.db
      .select({ message: messages, storeName: stores.name })
      .from(messages)
      .innerJoin(stores, eq(stores.id, messages.storeId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }
}

/** Polls the outbox. One per API instance; claims make concurrent instances safe. */
export class OutboxWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly outbox: Outbox,
    private readonly intervalMs: number,
    private readonly logger: Logger,
  ) {}

  start() {
    if (this.intervalMs <= 0 || this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    this.timer.unref();
  }

  /** Also called right after an order change, so messages go out immediately. */
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.outbox.deliverDue();
    } catch (error) {
      this.logger.error({ err: (error as Error).message }, "outbox worker error");
    } finally {
      this.running = false;
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
