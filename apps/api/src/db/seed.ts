/** Seeds demo data from @quefome/fixtures (idempotent). Also used by the test reset. */
import { CUISINE_TYPES, DEMO_PASSWORD, STAFF, createStoreFixtures } from "@quefome/fixtures";
import { sql } from "drizzle-orm";
import { hashPassword } from "../lib/password";
import type { Db } from "./client";
import { categories, cuisineTypes, memberships, products, schedules, storeCuisineTypes, stores, users } from "./schema";

let demoHash: Promise<string> | null = null;
const passwordHash = (password: string) => (password === DEMO_PASSWORD ? (demoHash ??= hashPassword(password)) : hashPassword(password));

export async function isSeeded(db: Db): Promise<boolean> {
  const rows = await db.select({ n: sql<number>`count(*)` }).from(stores);
  return Number(rows[0]?.n ?? 0) > 0;
}

export async function seed(db: Db) {
  await db.insert(cuisineTypes).values(CUISINE_TYPES).onConflictDoNothing();
  for (const fx of createStoreFixtures()) {
    const s = fx.settings;
    await db
      .insert(stores)
      .values({
        id: fx.id, slug: s.slug, name: s.name, description: s.description, imageUrl: fx.imageUrl, whatsapp: s.whatsapp, timeZone: s.timeZone,
        address: s.address, published: s.published, statusOverride: s.statusOverride, deliveryEnabled: s.deliveryEnabled,
        deliveryFeeCents: s.deliveryFeeCents, minimumOrderCents: s.minimumOrderCents, deliveryArea: s.deliveryArea,
        deliveryMinMinutes: s.deliveryTime.minMinutes, deliveryMaxMinutes: s.deliveryTime.maxMinutes, pickupEnabled: s.pickupEnabled,
        payment: s.payment, popularity: fx.popularity,
      })
      .onConflictDoNothing();
    if (s.cuisineTypeIds.length) await db.insert(storeCuisineTypes).values(s.cuisineTypeIds.map((cuisineTypeId) => ({ storeId: fx.id, cuisineTypeId }))).onConflictDoNothing();
    await db.delete(schedules).where(sql`${schedules.storeId} = ${fx.id}`);
    if (s.schedules.length) await db.insert(schedules).values(s.schedules.map((x) => ({ storeId: fx.id, ...x })));
    for (const cat of fx.menu.categories) await db.insert(categories).values({ ...cat, storeId: fx.id }).onConflictDoNothing();
    for (const [i, p] of fx.menu.products.entries()) {
      await db
        .insert(products)
        .values({
          id: p.id, storeId: fx.id, categoryId: p.categoryId, name: p.name, description: p.description, imageUrl: p.imageUrl, priceCents: p.priceCents,
          flavorBilling: p.flavorBilling, maxFlavors: p.maxFlavors, flavors: p.flavors, components: p.components, available: p.available, sequence: i,
        })
        .onConflictDoNothing();
    }
  }
  for (const st of STAFF) {
    await db.insert(users).values({ id: st.id, email: st.email, passwordHash: await passwordHash(st.password), name: st.name }).onConflictDoNothing();
    await db.insert(memberships).values({ userId: st.id, storeId: st.storeId, role: "OWNER" }).onConflictDoNothing();
  }
}

/** Test control: wipe everything and reseed. */
export async function resetAndSeed(db: Db) {
  await db.execute(sql`TRUNCATE messages, order_events, orders, sessions, memberships, products, categories, schedules, store_cuisine_types, stores, cuisine_types, users RESTART IDENTITY CASCADE`);
  await seed(db);
}
