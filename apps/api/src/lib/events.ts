/**
 * Order events for the merchant SSE stream. In-process fan-out; with real Postgres, NOTIFY/LISTEN also
 * propagates events across API instances.
 */
import type { Database } from "../db/client";

export interface OrderEvent {
  id: number;
  type: "order.created" | "order.updated";
  storeId: string;
  orderId: string;
  status: string;
  version: number;
  at: string;
}

type Handler = (event: OrderEvent) => void;
const CHANNEL = "quefome_orders";

export class EventBus {
  private readonly handlers = new Map<string, Set<Handler>>();
  private stopListening: (() => Promise<void>) | null = null;

  constructor(private readonly database: Database) {}

  async start() {
    if (this.database.listen) {
      this.stopListening = await this.database.listen(CHANNEL, (payload) => {
        try {
          this.dispatch(JSON.parse(payload) as OrderEvent);
        } catch {
          // malformed payload from another instance: ignore
        }
      });
    }
  }

  async stop() {
    await this.stopListening?.();
    this.handlers.clear();
  }

  subscribe(storeId: string, handler: Handler): () => void {
    const set = this.handlers.get(storeId) ?? new Set();
    set.add(handler);
    this.handlers.set(storeId, set);
    return () => set.delete(handler);
  }

  async publish(event: OrderEvent) {
    if (this.database.notify) {
      await this.database.notify(CHANNEL, JSON.stringify(event)); // comes back through LISTEN on every instance
    } else {
      this.dispatch(event);
    }
  }

  private dispatch(event: OrderEvent) {
    for (const handler of this.handlers.get(event.storeId) ?? []) handler(event);
  }
}
