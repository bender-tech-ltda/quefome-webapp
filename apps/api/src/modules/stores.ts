import type { Menu, Store, StoreSettings, StoreSettingsUpdate, StoreSummary } from "@quefome/contract";
import { availablePaymentKinds, computeOpenState } from "@quefome/domain";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { categories, products, schedules, storeCuisineTypes, stores } from "../db/schema";
import type { Clock } from "../lib/clock";
import { ApiError, invalid } from "../lib/errors";

export type StoreRow = typeof stores.$inferSelect;

const normalize = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export class StoreService {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  /** Public access: only published stores exist for customers. */
  async findPublishedBySlug(slug: string): Promise<StoreRow> {
    const row = await this.db.query.stores.findFirst({ where: and(eq(stores.slug, slug), eq(stores.published, true)) });
    if (!row) throw new ApiError(404, "STORE_NOT_FOUND", "Estabelecimento não encontrado");
    return row;
  }

  async findById(id: string): Promise<StoreRow | null> {
    return (await this.db.query.stores.findFirst({ where: eq(stores.id, id) })) ?? null;
  }

  private async relations(storeIds: string[]) {
    const schedulesByStore = new Map<string, Store["schedules"]>();
    const cuisinesByStore = new Map<string, string[]>();
    if (storeIds.length === 0) return { schedulesByStore, cuisinesByStore };
    const [sched, cuis] = await Promise.all([
      this.db.select().from(schedules).where(inArray(schedules.storeId, storeIds)).orderBy(asc(schedules.weekDay), asc(schedules.opensAt)),
      this.db.select().from(storeCuisineTypes).where(inArray(storeCuisineTypes.storeId, storeIds)),
    ]);
    for (const s of sched) schedulesByStore.set(s.storeId, [...(schedulesByStore.get(s.storeId) ?? []), { weekDay: s.weekDay, opensAt: s.opensAt, closesAt: s.closesAt }]);
    for (const c of cuis) cuisinesByStore.set(c.storeId, [...(cuisinesByStore.get(c.storeId) ?? []), c.cuisineTypeId]);
    return { schedulesByStore, cuisinesByStore };
  }

  async toStores(rows: StoreRow[]): Promise<Store[]> {
    const { schedulesByStore, cuisinesByStore } = await this.relations(rows.map((r) => r.id));
    return rows.map((row) => {
      const sched = schedulesByStore.get(row.id) ?? [];
      const computed = computeOpenState(sched, this.clock.now(), row.timeZone);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        timeZone: row.timeZone,
        address: row.address,
        cuisineTypeIds: cuisinesByStore.get(row.id) ?? [],
        status: row.statusOverride ?? computed.status,
        currentSchedule: computed.currentSchedule,
        schedules: sched,
        deliveryEnabled: row.deliveryEnabled,
        deliveryFeeCents: row.deliveryFeeCents,
        minimumOrderCents: row.minimumOrderCents,
        pickupEnabled: row.pickupEnabled,
        deliveryTime: { minMinutes: row.deliveryMinMinutes, maxMinutes: row.deliveryMaxMinutes },
        paymentKinds: availablePaymentKinds(row.payment),
        whatsapp: row.whatsapp,
      };
    });
  }

  async toStore(row: StoreRow): Promise<Store> {
    return (await this.toStores([row]))[0]!;
  }

  toSummary(store: Store, popularity: number): StoreSummary {
    const { id, slug, name, description, imageUrl, timeZone, address, status, currentSchedule, deliveryFeeCents, minimumOrderCents, deliveryTime, cuisineTypeIds } = store;
    return { id, slug, name, description, imageUrl, timeZone, address, status, currentSchedule, deliveryFeeCents, minimumOrderCents, deliveryTime, cuisineTypeIds, popularity };
  }

  /** Menu as customers see it (archived products hidden; out-of-stock listed as unavailable). */
  async menu(storeId: string): Promise<Menu> {
    const [cats, prods] = await Promise.all([
      this.db.select().from(categories).where(eq(categories.storeId, storeId)).orderBy(asc(categories.sequence), asc(categories.name)),
      this.db.select().from(products).where(and(eq(products.storeId, storeId), isNull(products.archivedAt))).orderBy(asc(products.sequence), asc(products.name)),
    ]);
    return {
      categories: cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon, sequence: c.sequence })),
      products: prods.map((p) => ({
        id: p.id, categoryId: p.categoryId, name: p.name, description: p.description, imageUrl: p.imageUrl, priceCents: p.priceCents,
        flavorBilling: p.flavorBilling, maxFlavors: p.maxFlavors, flavors: p.flavors, components: p.components, available: p.available,
      })),
    };
  }

  async product(storeId: string, productId: string) {
    return (await this.db.query.products.findFirst({ where: and(eq(products.storeId, storeId), eq(products.id, productId), isNull(products.archivedAt)) })) ?? null;
  }

  /** MVP delivery area: same city/state, and (in NEIGHBORHOODS mode) a listed neighborhood. */
  attends(row: StoreRow, address: { neighborhood: string; city: string; state: string }): boolean {
    if (!row.deliveryEnabled) return false;
    if (normalize(address.city) !== normalize(row.address.city) || normalize(address.state) !== normalize(row.address.state)) return false;
    if (row.deliveryArea.mode === "CITY") return true;
    return row.deliveryArea.neighborhoods.some((n) => normalize(n) === normalize(address.neighborhood));
  }

  // ------------------------------------------------------------------ merchant settings

  async settings(storeId: string): Promise<StoreSettings> {
    const row = await this.findById(storeId);
    if (!row) throw new ApiError(404, "STORE_NOT_FOUND", "Estabelecimento não encontrado");
    const [view] = await this.toStores([row]);
    return {
      slug: row.slug,
      name: row.name,
      description: row.description,
      whatsapp: row.whatsapp ?? "+5500000000000",
      address: row.address,
      timeZone: row.timeZone,
      schedules: view!.schedules,
      deliveryEnabled: row.deliveryEnabled,
      deliveryFeeCents: row.deliveryFeeCents,
      minimumOrderCents: row.minimumOrderCents,
      deliveryArea: row.deliveryArea,
      deliveryTime: { minMinutes: row.deliveryMinMinutes, maxMinutes: row.deliveryMaxMinutes },
      pickupEnabled: row.pickupEnabled,
      payment: row.payment,
      cuisineTypeIds: view!.cuisineTypeIds,
      published: row.published,
      statusOverride: row.statusOverride,
    };
  }

  /** Rules that make a store orderable are enforced here (not only in the UI). */
  async updateSettings(storeId: string, input: StoreSettingsUpdate): Promise<StoreSettings> {
    const problems: string[] = [];
    if (!input.deliveryEnabled && !input.pickupEnabled) problems.push("Ative a entrega ou a retirada no balcão.");
    if (input.deliveryEnabled && input.deliveryArea.mode === "NEIGHBORHOODS" && input.deliveryArea.neighborhoods.length === 0) problems.push("Informe os bairros atendidos ou escolha entregar na cidade toda.");
    if (availablePaymentKinds(input.payment).length === 0) problems.push("Aceite pelo menos uma forma de pagamento.");
    if (input.deliveryTime.minMinutes !== null && input.deliveryTime.maxMinutes !== null && input.deliveryTime.minMinutes > input.deliveryTime.maxMinutes) problems.push("O tempo mínimo de entrega não pode ser maior que o máximo.");
    if (input.published) {
      const [count] = await this.db.select({ n: sql<number>`count(*)` }).from(products).where(and(eq(products.storeId, storeId), isNull(products.archivedAt)));
      if (Number(count?.n ?? 0) === 0) problems.push("Cadastre pelo menos um produto antes de publicar a loja.");
    }
    if (problems.length) throw invalid("STORE_SETTINGS_INVALID", problems[0]!, problems);

    await this.db.transaction(async (tx) => {
      await tx
        .update(stores)
        .set({
          name: input.name, description: input.description, whatsapp: input.whatsapp, address: input.address, timeZone: input.timeZone,
          deliveryEnabled: input.deliveryEnabled, deliveryFeeCents: input.deliveryFeeCents, minimumOrderCents: input.minimumOrderCents,
          deliveryArea: input.deliveryArea, deliveryMinMinutes: input.deliveryTime.minMinutes, deliveryMaxMinutes: input.deliveryTime.maxMinutes,
          pickupEnabled: input.pickupEnabled, payment: input.payment, published: input.published,
        })
        .where(eq(stores.id, storeId));
      await tx.delete(schedules).where(eq(schedules.storeId, storeId));
      if (input.schedules.length) await tx.insert(schedules).values(input.schedules.map((s) => ({ storeId, ...s })));
      await tx.delete(storeCuisineTypes).where(eq(storeCuisineTypes.storeId, storeId));
      if (input.cuisineTypeIds.length) await tx.insert(storeCuisineTypes).values(input.cuisineTypeIds.map((cuisineTypeId) => ({ storeId, cuisineTypeId }))).onConflictDoNothing();
    });
    return this.settings(storeId);
  }

  async setStatusOverride(storeId: string, override: "OPEN" | "CLOSED" | null): Promise<Store> {
    const [row] = await this.db.update(stores).set({ statusOverride: override }).where(eq(stores.id, storeId)).returning();
    return this.toStore(row!);
  }
}
