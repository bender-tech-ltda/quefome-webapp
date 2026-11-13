/** Merchant menu management: categories, products, availability (always scoped by store). */
import type { CategoryInput, Product, ProductInput } from "@quefome/contract";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { categories, products } from "../db/schema";
import type { Clock } from "../lib/clock";
import { ApiError, invalid } from "../lib/errors";

type ProductRow = typeof products.$inferSelect;

export function toProduct(p: ProductRow): Product {
  return {
    id: p.id, categoryId: p.categoryId, name: p.name, description: p.description, imageUrl: p.imageUrl, priceCents: p.priceCents,
    flavorBilling: p.flavorBilling, maxFlavors: p.maxFlavors, flavors: p.flavors, components: p.components, available: p.available,
  };
}

export class CatalogService {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  private async category(storeId: string, categoryId: string) {
    const row = await this.db.query.categories.findFirst({ where: and(eq(categories.storeId, storeId), eq(categories.id, categoryId)) });
    if (!row) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Categoria não encontrada");
    return row;
  }

  private async productRow(storeId: string, productId: string) {
    const row = await this.db.query.products.findFirst({ where: and(eq(products.storeId, storeId), eq(products.id, productId), isNull(products.archivedAt)) });
    if (!row) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Produto não encontrado");
    return row;
  }

  async createCategory(storeId: string, input: CategoryInput) {
    const [row] = await this.db.insert(categories).values({ id: crypto.randomUUID(), storeId, ...input }).returning();
    return { id: row!.id, name: row!.name, icon: row!.icon, sequence: row!.sequence };
  }

  async updateCategory(storeId: string, categoryId: string, input: CategoryInput) {
    await this.category(storeId, categoryId);
    const [row] = await this.db.update(categories).set(input).where(and(eq(categories.id, categoryId), eq(categories.storeId, storeId))).returning();
    return { id: row!.id, name: row!.name, icon: row!.icon, sequence: row!.sequence };
  }

  async deleteCategory(storeId: string, categoryId: string) {
    await this.category(storeId, categoryId);
    const [count] = await this.db.select({ n: sql<number>`count(*)` }).from(products).where(and(eq(products.categoryId, categoryId), isNull(products.archivedAt)));
    if (Number(count?.n ?? 0) > 0) throw new ApiError(409, "CATEGORY_NOT_EMPTY", "Remova ou mova os produtos dessa categoria antes de excluí-la.");
    // archived products keep history in past orders (snapshots); detach them from the category
    await this.db.delete(products).where(and(eq(products.categoryId, categoryId), eq(products.storeId, storeId)));
    await this.db.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.storeId, storeId)));
  }

  private validateOptions(input: ProductInput) {
    const flavors = input.flavors ?? [];
    if (input.maxFlavors && flavors.length === 0) throw invalid("PRODUCT_INVALID", "Informe os sabores ou remova o limite de sabores.");
  }

  async createProduct(storeId: string, input: ProductInput): Promise<Product> {
    await this.category(storeId, input.categoryId);
    this.validateOptions(input);
    const [row] = await this.db
      .insert(products)
      .values({
        id: crypto.randomUUID(), storeId, categoryId: input.categoryId, name: input.name, description: input.description,
        priceCents: input.priceCents, available: input.available, sequence: input.sequence,
        flavorBilling: input.flavorBilling ?? "SUM", maxFlavors: input.maxFlavors ?? null, flavors: input.flavors ?? [], components: input.components ?? [],
      })
      .returning();
    return toProduct(row!);
  }

  /** Omitted advanced options (flavors/components) are kept as they are. */
  async updateProduct(storeId: string, productId: string, input: ProductInput): Promise<Product> {
    const current = await this.productRow(storeId, productId);
    await this.category(storeId, input.categoryId);
    this.validateOptions({ ...input, flavors: input.flavors ?? current.flavors });
    const [row] = await this.db
      .update(products)
      .set({
        categoryId: input.categoryId, name: input.name, description: input.description, priceCents: input.priceCents, available: input.available, sequence: input.sequence,
        ...(input.flavorBilling !== undefined ? { flavorBilling: input.flavorBilling } : {}),
        ...(input.maxFlavors !== undefined ? { maxFlavors: input.maxFlavors } : {}),
        ...(input.flavors !== undefined ? { flavors: input.flavors } : {}),
        ...(input.components !== undefined ? { components: input.components } : {}),
      })
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .returning();
    return toProduct(row!);
  }

  async setAvailability(storeId: string, productId: string, available: boolean): Promise<Product> {
    await this.productRow(storeId, productId);
    const [row] = await this.db.update(products).set({ available }).where(and(eq(products.id, productId), eq(products.storeId, storeId))).returning();
    return toProduct(row!);
  }

  /** Soft delete: past orders keep their snapshot. */
  async deleteProduct(storeId: string, productId: string) {
    await this.productRow(storeId, productId);
    await this.db.update(products).set({ archivedAt: this.clock.now() }).where(and(eq(products.id, productId), eq(products.storeId, storeId)));
  }
}
