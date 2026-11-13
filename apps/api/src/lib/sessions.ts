import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Db } from "../db/client";
import { sessions } from "../db/schema";
import type { Clock } from "./clock";

const COOKIE = "qf_admin_session";
const hash = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Merchant sessions: opaque random token in an httpOnly cookie; only its hash is stored. */
export class SessionService {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly ttlDays: number,
    private readonly secureCookies: boolean,
  ) {}

  async start(c: Context, userId: string, keepLoggedIn: boolean) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(this.clock.now().getTime() + this.ttlDays * 86_400_000);
    await this.db.insert(sessions).values({ tokenHash: hash(token), userId, expiresAt });
    setCookie(c, COOKIE, token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: this.secureCookies,
      path: "/",
      ...(keepLoggedIn ? { maxAge: this.ttlDays * 86_400 } : {}),
    });
  }

  async resolve(c: Context): Promise<string | null> {
    const token = getCookie(c, COOKIE);
    if (!token) return null;
    const row = await this.db.query.sessions.findFirst({ where: and(eq(sessions.tokenHash, hash(token)), gt(sessions.expiresAt, this.clock.now())) });
    return row?.userId ?? null;
  }

  async end(c: Context) {
    const token = getCookie(c, COOKIE);
    if (token) await this.db.delete(sessions).where(eq(sessions.tokenHash, hash(token)));
    deleteCookie(c, COOKIE, { path: "/" });
  }
}
