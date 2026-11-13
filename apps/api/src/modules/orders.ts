import type { AdminOrder, CreateOrderRequest, OrderLine, PublicOrder, Store } from "@quefome/contract";
import {
  type CatalogProduct,
  type MessageOrder,
  canTransition,
  cartIssueMessage,
  deliveryFeeFor,
  isOrderStatus,
  newOrderMessage,
  normalizeBrazilianMobile,
  statusUpdateMessage,
  unitPriceCents,
  validateItem,
} from "@quefome/domain";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { messages, orderEvents, orders, stores } from "../db/schema";
import type { Clock } from "../lib/clock";
import { ApiError, invalid, notFound } from "../lib/errors";
import type { EventBus } from "../lib/events";
import type { Outbox } from "./messaging";
import type { StoreRow, StoreService } from "./stores";

type OrderRow = typeof orders.$inferSelect;
type MessageRow = typeof messages.$inferSelect;
const DAY_MS = 86_400_000;

export interface OrderLinks {
  appUrl: string;
  templates: { newOrder: string | null; statusUpdate: string | null };
}

function toMessageOrder(row: OrderRow): MessageOrder {
  return {
    number: row.number,
    status: row.status as MessageOrder["status"],
    fulfillment: row.fulfillment,
    customer: { name: row.customerName, whatsapp: row.customerWhatsapp },
    address: row.address ?? null,
    items: row.items,
    subtotalCents: row.subtotalCents,
    deliveryFeeCents: row.deliveryFeeCents,
    totalCents: row.totalCents,
    payment: { kind: row.paymentKind, changeForCents: row.changeForCents },
    notes: row.notes,
    cancelReason: row.cancelReason,
  };
}

const core = (row: OrderRow) => ({
  number: row.number,
  status: row.status as PublicOrder["status"],
  createdAt: row.createdAt.toISOString(),
  estimatedDeliveryAt: row.estimatedDeliveryAt?.toISOString() ?? null,
  fulfillment: row.fulfillment,
  items: row.items,
  subtotalCents: row.subtotalCents,
  deliveryFeeCents: row.deliveryFeeCents,
  totalCents: row.totalCents,
  payment: { kind: row.paymentKind, changeForCents: row.changeForCents },
  notes: row.notes,
  cancelReason: row.cancelReason,
});

export function toAdminOrder(row: OrderRow, notifications: MessageRow[]): AdminOrder {
  return {
    ...core(row),
    id: row.id,
    storeId: row.storeId,
    trackingToken: row.trackingToken,
    version: row.version,
    statusChangedAt: row.statusChangedAt.toISOString(),
    customer: { name: row.customerName, whatsapp: row.customerWhatsapp },
    address: row.address ?? null,
    notifications: notifications.map((m) => ({ recipient: m.recipient, event: m.event, status: m.status, at: (m.sentAt ?? m.createdAt).toISOString() })),
  };
}

export class OrderService {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly storeService: StoreService,
    private readonly events: EventBus,
    private readonly outbox: Outbox,
    private readonly links: OrderLinks,
    /** Called after commits that enqueued messages (kicks the worker immediately). */
    private readonly onMessagesQueued: () => void,
  ) {}

  trackingUrl(storeSlug: string, token: string) {
    return `${this.links.appUrl}/${storeSlug}/pedido/${token}`;
  }

  /**
   * Guest checkout. Prices, availability, area and payment are re-validated on the server (@quefome/domain).
   * Idempotent per (store, Idempotency-Key). Numbered per store. The restaurant's WhatsApp message is
   * enqueued in the same transaction.
   */
  async create(storeRow: StoreRow, store: Store, req: CreateOrderRequest, idempotencyKey: string | null): Promise<{ order: PublicOrder; created: boolean }> {
    if (idempotencyKey) {
      const existing = await this.db.query.orders.findFirst({ where: and(eq(orders.storeId, store.id), eq(orders.idempotencyKey, idempotencyKey)) });
      if (existing) return { order: await this.toPublic(existing, storeRow), created: false };
    }

    const whatsapp = normalizeBrazilianMobile(req.customer.whatsapp);
    if (!whatsapp) throw invalid("WHATSAPP_INVALID", "Informe um celular com DDD, por exemplo (51) 99999-8888.");
    if (store.status !== "OPEN") throw invalid("STORE_CLOSED", "O estabelecimento está fechado no momento.");
    if (req.fulfillment === "PICKUP" && !store.pickupEnabled) throw invalid("PICKUP_NOT_AVAILABLE", "Esse estabelecimento não aceita retirada no balcão.");
    if (req.fulfillment === "DELIVERY") {
      if (!store.deliveryEnabled) throw invalid("DELIVERY_NOT_AVAILABLE", "Esse estabelecimento não faz entregas.");
      if (!req.address) throw invalid("ADDRESS_REQUIRED", "Informe o endereço de entrega.");
      if (!this.storeService.attends(storeRow, req.address)) throw invalid("ADDRESS_NOT_ATTENDED", "O restaurante não entrega nesse endereço.");
    }
    if (!store.paymentKinds.includes(req.paymentKind)) throw invalid("PAYMENT_METHOD_INVALID", "Forma de pagamento não aceita por esse estabelecimento.");

    const lines: OrderLine[] = [];
    for (const item of req.items) {
      const product = (await this.storeService.product(store.id, item.productId)) as (CatalogProduct & { available: boolean }) | null;
      if (!product) throw invalid("PRODUCT_NOT_FOUND", "Um dos produtos do seu pedido não existe mais.");
      if (!product.available) throw invalid("PRODUCT_UNAVAILABLE", `${product.name} acabou de ficar indisponível.`);
      const issues = validateItem(product, item);
      if (issues.length) throw invalid("ITEM_INVALID", `Item inválido: ${product.name}`, issues);
      const unit = unitPriceCents(product, item);
      lines.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        instructions: item.instructions,
        flavors: item.flavorIds.map((id) => product.flavors.find((f) => f.id === id)!),
        components: item.components.map((chosen) => {
          const comp = product.components.find((x) => x.id === chosen.componentId)!;
          if (comp.kind === "toggle") return { componentId: comp.id, name: comp.name, value: { kind: "toggle" as const, on: "on" in chosen && chosen.on, defaultOn: comp.defaultOn } };
          const optionId = "optionId" in chosen ? chosen.optionId : null;
          const option = optionId ? comp.options.find((o) => o.id === optionId) : undefined;
          return { componentId: comp.id, name: comp.name, value: { kind: "choice" as const, optionId: option?.id ?? null, optionName: option?.name ?? null } };
        }),
        unitPriceCents: unit,
        totalCents: unit * item.quantity,
      });
    }

    const subtotalCents = lines.reduce((s, l) => s + l.totalCents, 0);
    const belowMinimum = cartIssueMessage({ storeOpen: true, itemCount: lines.length, subtotalCents, minimumOrderCents: store.minimumOrderCents });
    if (belowMinimum) throw invalid("BELOW_MINIMUM", belowMinimum);
    const deliveryFeeCents = deliveryFeeFor(req.fulfillment, store.deliveryFeeCents);
    const totalCents = subtotalCents + deliveryFeeCents;
    const changeForCents = req.paymentKind === "CASH" ? req.changeForCents : null;
    if (changeForCents !== null && changeForCents < totalCents) throw invalid("CHANGE_TOO_LOW", "O valor para troco deve ser maior que o total do pedido.");

    const now = this.clock.now();
    const id = crypto.randomUUID();
    const trackingToken = randomBytes(18).toString("base64url");
    let row: OrderRow;
    try {
      row = await this.db.transaction(async (tx) => {
        const [seq] = await tx.update(stores).set({ orderSeq: sql`${stores.orderSeq} + 1` }).where(eq(stores.id, store.id)).returning({ n: stores.orderSeq });
        const [inserted] = await tx
          .insert(orders)
          .values({
            id, storeId: store.id, number: seq!.n, trackingToken, idempotencyKey, status: "PENDING", version: 0,
            customerName: req.customer.name.trim(), customerWhatsapp: whatsapp, fulfillment: req.fulfillment,
            address: req.fulfillment === "DELIVERY" ? req.address : null, paymentKind: req.paymentKind, changeForCents, notes: req.notes.trim(),
            items: lines, subtotalCents, deliveryFeeCents, totalCents,
            estimatedDeliveryAt: store.deliveryTime.maxMinutes ? new Date(now.getTime() + store.deliveryTime.maxMinutes * 60_000) : null,
            createdAt: now, statusChangedAt: now,
          })
          .returning();
        await tx.insert(orderEvents).values({ orderId: id, storeId: store.id, type: "order.created", fromStatus: null, toStatus: "PENDING", actorUserId: null, at: now });
        if (storeRow.whatsapp) {
          const msg = newOrderMessage(toMessageOrder(inserted!), storeRow.name, `${this.links.appUrl}/admin`);
          await this.outbox.enqueue(tx, {
            storeId: store.id, orderId: id, dedupeKey: `${id}:created:store`, recipient: "STORE", to: storeRow.whatsapp, event: "order.created",
            text: msg.text, templateName: this.links.templates.newOrder, templateParams: msg.params,
          });
        }
        return inserted!;
      });
    } catch (error) {
      if (idempotencyKey && isUniqueViolation(error)) {
        const existing = await this.db.query.orders.findFirst({ where: and(eq(orders.storeId, store.id), eq(orders.idempotencyKey, idempotencyKey)) });
        if (existing) return { order: await this.toPublic(existing, storeRow), created: false };
      }
      throw error;
    }
    await this.publish("order.created", row);
    this.onMessagesQueued();
    return { order: await this.toPublic(row, storeRow), created: true };
  }

  async toPublic(row: OrderRow, storeRow: StoreRow): Promise<PublicOrder> {
    const [history, storeMessages] = await Promise.all([
      this.db.select().from(orderEvents).where(eq(orderEvents.orderId, row.id)).orderBy(asc(orderEvents.id)),
      this.db.select().from(messages).where(and(eq(messages.orderId, row.id), eq(messages.recipient, "STORE"))),
    ]);
    return {
      ...core(row),
      trackingToken: row.trackingToken,
      store: { slug: storeRow.slug, name: storeRow.name, whatsapp: storeRow.whatsapp },
      statusHistory: history.filter((e) => e.toStatus && isOrderStatus(e.toStatus)).map((e) => ({ status: e.toStatus as PublicOrder["status"], at: e.at.toISOString() })),
      pix: row.paymentKind === "PIX" ? storeRow.payment.pix : null,
      restaurantNotified: storeMessages.some((m) => m.status === "SENT"),
    };
  }

  async getPublic(token: string): Promise<PublicOrder> {
    const row = await this.db.query.orders.findFirst({ where: eq(orders.trackingToken, token) });
    if (!row) throw notFound("ORDER_NOT_FOUND", "Pedido não encontrado");
    const storeRow = await this.storeService.findById(row.storeId);
    return this.toPublic(row, storeRow!);
  }

  async listForStore(storeId: string, filter: { status?: string; from?: string; to?: string }, timeZone: string): Promise<AdminOrder[]> {
    const conditions = [eq(orders.storeId, storeId)];
    if (filter.status) conditions.push(eq(orders.status, filter.status));
    if (!filter.from && !filter.to) conditions.push(gte(orders.createdAt, new Date(this.clock.now().getTime() - DAY_MS))); // board: last 24h
    if (filter.from) conditions.push(sql`(${orders.createdAt} AT TIME ZONE ${timeZone})::date >= ${filter.from}::date`);
    if (filter.to) conditions.push(sql`(${orders.createdAt} AT TIME ZONE ${timeZone})::date <= ${filter.to}::date`);
    const rows = await this.db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt)).limit(500);
    if (rows.length === 0) return [];
    const msgs = await this.db.select().from(messages).where(and(eq(messages.storeId, storeId), sql`${messages.orderId} in ${rows.map((r) => r.id)}`)).orderBy(asc(messages.createdAt));
    return rows.map((r) => toAdminOrder(r, msgs.filter((m) => m.orderId === r.id)));
  }

  async getForStore(storeId: string, orderId: string): Promise<AdminOrder> {
    const row = await this.rowForStore(storeId, orderId);
    return toAdminOrder(row, await this.outbox.forOrder(row.id));
  }

  private async rowForStore(storeId: string, orderId: string) {
    const row = await this.db.query.orders.findFirst({ where: and(eq(orders.storeId, storeId), eq(orders.id, orderId)) });
    if (!row) throw notFound("ORDER_NOT_FOUND", "Pedido não encontrado");
    return row;
  }

  /**
   * Optimistic locking (`version`), allowed transitions only, and the customer's WhatsApp message enqueued
   * in the same transaction.
   */
  async changeStatus(storeId: string, orderId: string, input: { status: string; version: number; reason?: string }, actorUserId: string | null): Promise<AdminOrder> {
    const current = await this.rowForStore(storeId, orderId);
    if (current.version !== input.version) {
      throw new ApiError(409, "VERSION_CONFLICT", "Esse pedido foi alterado por outra pessoa. Atualize e tente novamente.", { current: await this.getForStore(storeId, orderId) });
    }
    if (!isOrderStatus(input.status) || !isOrderStatus(current.status) || !canTransition(current.status, input.status)) {
      throw invalid("INVALID_TRANSITION", `Não é possível mudar o pedido de ${current.status} para ${input.status}.`);
    }
    const reason = input.reason?.trim() || null;
    if (input.status === "CANCELED" && !reason) throw invalid("REASON_REQUIRED", "Informe o motivo do cancelamento (o cliente vai receber).");
    const storeRow = (await this.storeService.findById(storeId))!;
    const now = this.clock.now();

    const updated = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(orders)
        .set({ status: input.status, version: sql`${orders.version} + 1`, statusChangedAt: now, ...(input.status === "CANCELED" ? { cancelReason: reason } : {}) })
        .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId), eq(orders.version, input.version)))
        .returning();
      if (!row) return null;
      await tx.insert(orderEvents).values({ orderId, storeId, type: "order.updated", fromStatus: current.status, toStatus: input.status, actorUserId, at: now });
      const msg = statusUpdateMessage(toMessageOrder(row), storeRow.name, this.trackingUrl(storeRow.slug, row.trackingToken));
      await this.outbox.enqueue(tx, {
        storeId, orderId, dedupeKey: `${orderId}:status:${input.status}:customer`, recipient: "CUSTOMER", to: row.customerWhatsapp, event: `order.${input.status.toLowerCase()}`,
        text: msg.text, templateName: this.links.templates.statusUpdate, templateParams: msg.params,
      });
      return row;
    });
    if (!updated) {
      throw new ApiError(409, "VERSION_CONFLICT", "Esse pedido foi alterado por outra pessoa. Atualize e tente novamente.", { current: await this.getForStore(storeId, orderId) });
    }
    await this.publish("order.updated", updated);
    this.onMessagesQueued();
    return this.getForStore(storeId, orderId);
  }

  async eventsSince(storeId: string, afterId: number) {
    return this.db.select().from(orderEvents).where(and(eq(orderEvents.storeId, storeId), sql`${orderEvents.id} > ${afterId}`)).orderBy(orderEvents.id).limit(200);
  }

  private async publish(type: "order.created" | "order.updated", row: OrderRow) {
    const [last] = await this.db.select({ id: orderEvents.id }).from(orderEvents).where(eq(orderEvents.orderId, row.id)).orderBy(desc(orderEvents.id)).limit(1);
    await this.events.publish({ id: last?.id ?? 0, type, storeId: row.storeId, orderId: row.id, status: row.status, version: row.version, at: this.clock.now().toISOString() });
  }
}

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  return e?.code === "23505" || e?.cause?.code === "23505" || /duplicate key|unique constraint/i.test(e?.message ?? "");
}
