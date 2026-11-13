import { RESERVED_SLUGS, type SignupRequest, type StaffUser } from "@quefome/contract";
import { normalizeBrazilianPhone } from "@quefome/domain";
import { eq, like } from "drizzle-orm";
import type { Db } from "../db/client";
import { memberships, stores, users } from "../db/schema";
import { ApiError, invalid } from "../lib/errors";
import { hashPassword, verifyPassword } from "../lib/password";

/** "Burger do Zé!" -> "burger-do-ze" */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "loja";
}

const DUMMY_HASH = "scrypt$32768$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export class IdentityService {
  constructor(private readonly db: Db) {}

  async authenticate(email: string, password: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, email.trim().toLowerCase()) });
    // always verify, so response time does not reveal which e-mails exist
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new ApiError(401, "INVALID_CREDENTIALS", "Email ou senha inválidos");
    return user;
  }

  private async uniqueSlug(base: string): Promise<string> {
    const taken = new Set((await this.db.select({ slug: stores.slug }).from(stores).where(like(stores.slug, `${base}%`))).map((r) => r.slug));
    const reserved = new Set<string>(RESERVED_SLUGS);
    let candidate = base;
    for (let i = 2; taken.has(candidate) || reserved.has(candidate); i++) candidate = `${base}-${i}`;
    return candidate;
  }

  /** Merchant sign-up: user + unpublished store + OWNER membership, atomically. */
  async signup(input: SignupRequest): Promise<string> {
    const email = input.email.trim().toLowerCase();
    const whatsapp = normalizeBrazilianPhone(input.whatsapp);
    if (!whatsapp) throw invalid("WHATSAPP_INVALID", "Informe o WhatsApp da loja com DDD, por exemplo (51) 99999-8888.");
    if (await this.db.query.users.findFirst({ where: eq(users.email, email) })) throw new ApiError(409, "EMAIL_IN_USE", "Esse email já está cadastrado");
    const slug = await this.uniqueSlug(slugify(input.storeName));
    const userId = crypto.randomUUID();
    const storeId = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);
    await this.db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, email, name: input.name.trim(), passwordHash });
      await tx.insert(stores).values({
        id: storeId, slug, name: input.storeName.trim(), whatsapp, published: false,
        address: { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
        payment: { cash: true, card: true, pix: null },
      });
      await tx.insert(memberships).values({ userId, storeId, role: "OWNER" });
    });
    return userId;
  }

  /** Staff user + the store they operate (first membership; multi-store switching is a later feature). */
  async staff(userId: string): Promise<StaffUser | null> {
    const rows = await this.db
      .select({ user: users, role: memberships.role, store: stores })
      .from(users)
      .innerJoin(memberships, eq(memberships.userId, users.id))
      .innerJoin(stores, eq(stores.id, memberships.storeId))
      .where(eq(users.id, userId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.user.id, name: row.user.name, email: row.user.email, role: row.role,
      store: { id: row.store.id, slug: row.store.slug, name: row.store.name, imageUrl: row.store.imageUrl, timeZone: row.store.timeZone, published: row.store.published },
    };
  }
}
