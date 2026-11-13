import type { CuisineType, StoreNameSuggestion, StoreSummary } from "@quefome/contract";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { cuisineTypes, stores } from "../db/schema";
import type { StoreService } from "./stores";

export const normalizeText = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Legacy marketplace: cuisine types, establishment search and name suggestions. */
export class MarketplaceService {
  constructor(
    private readonly db: Db,
    private readonly storeService: StoreService,
  ) {}

  async cuisineTypes(): Promise<CuisineType[]> {
    return this.db.select().from(cuisineTypes).orderBy(asc(cuisineTypes.sequence), asc(cuisineTypes.name));
  }

  /** Small catalog for now: filter in memory (accent-insensitive). Move to tsvector/pg_trgm when it grows. */
  async search(q: string | undefined, cuisineSlug: string | undefined): Promise<StoreSummary[]> {
    let cuisineId: string | null = null;
    if (cuisineSlug) {
      const type = await this.db.query.cuisineTypes.findFirst({ where: eq(cuisineTypes.slug, cuisineSlug) });
      if (!type) return [];
      cuisineId = type.id;
    }
    const rows = await this.db.select().from(stores).where(eq(stores.published, true));
    const needle = normalizeText(q ?? "");
    const views = await this.storeService.toStores(rows.filter((r) => !needle || normalizeText(r.name).includes(needle)));
    const popularity = new Map(rows.map((r) => [r.id, r.popularity]));
    return views
      .filter((s) => !cuisineId || s.cuisineTypeIds.includes(cuisineId))
      .map((s) => this.storeService.toSummary(s, popularity.get(s.id) ?? 0))
      .sort((a, b) => b.popularity - a.popularity || (a.status === "OPEN" ? -1 : 1) - (b.status === "OPEN" ? -1 : 1));
  }

  async suggestNames(q: string | undefined, limit = 10): Promise<StoreNameSuggestion[]> {
    const rows = await this.db.select({ slug: stores.slug, name: stores.name, popularity: stores.popularity }).from(stores).where(and(eq(stores.published, true)));
    const needle = normalizeText(q ?? "");
    return rows
      .filter((r) => !needle || normalizeText(r.name).includes(needle))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
      .map(({ slug, name }) => ({ slug, name }));
  }
}
