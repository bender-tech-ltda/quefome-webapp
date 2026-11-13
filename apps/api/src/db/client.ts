/**
 * Database client: real Postgres (DATABASE_URL) or embedded PGlite (default, zero setup).
 * Both are PostgreSQL, so the schema, migrations and queries are identical.
 */
import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { schema } from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface Database {
  db: Db;
  kind: "pg" | "pglite";
  migrate(): Promise<void>;
  /** Raw LISTEN/NOTIFY support (pg only); PGlite deployments are single-process. */
  listen?(channel: string, handler: (payload: string) => void): Promise<() => Promise<void>>;
  notify?(channel: string, payload: string): Promise<void>;
  close(): Promise<void>;
}

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../../drizzle");

export async function createDatabase(options: { databaseUrl?: string; pgliteDir?: string }): Promise<Database> {
  if (options.databaseUrl) {
    const pool = new pg.Pool({ connectionString: options.databaseUrl, max: 10 });
    const db = drizzlePg(pool, { schema });
    return {
      db: db as unknown as Db,
      kind: "pg",
      migrate: () => migratePg(db, { migrationsFolder }),
      async listen(channel, handler) {
        const client = await pool.connect();
        client.on("notification", (msg) => {
          if (msg.channel === channel) handler(msg.payload ?? "");
        });
        await client.query(`LISTEN ${channel}`);
        return async () => {
          await client.query(`UNLISTEN ${channel}`).catch(() => undefined);
          client.release();
        };
      },
      async notify(channel, payload) {
        await pool.query("SELECT pg_notify($1, $2)", [channel, payload]);
      },
      close: () => pool.end(),
    };
  }

  const dir = options.pgliteDir ?? "memory";
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  const client = dir === "memory" ? new PGlite() : new PGlite(dir);
  await client.waitReady;
  const db = drizzlePglite(client, { schema });
  return {
    db: db as unknown as Db,
    kind: "pglite",
    migrate: () => migratePglite(db, { migrationsFolder }),
    close: () => client.close(),
  };
}
