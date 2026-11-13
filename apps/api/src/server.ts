import { serve } from "@hono/node-server";
import { createApi } from "./app";
import { loadConfig } from "./config";
import { createDatabase } from "./db/client";
import { isSeeded, seed } from "./db/seed";
import { createLogger } from "./lib/logger";

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const database = await createDatabase({ databaseUrl: config.DATABASE_URL, pgliteDir: config.PGLITE_DIR });

if (config.MIGRATE_ON_START === "1") await database.migrate();
if (config.SEED_ON_START === "1" && config.NODE_ENV !== "production" && !(await isSeeded(database.db))) {
  await seed(database.db);
  logger.info("database seeded with demo data");
}

const api = await createApi(config, database, logger);
const server = serve({ fetch: api.app.fetch, port: config.PORT, hostname: "0.0.0.0" }, (info) => {
  logger.info({ port: info.port, db: database.kind, testControl: config.API_TEST_CONTROL === "1" }, "api listening");
  if (config.NODE_ENV !== "production") console.log(`[api] http://localhost:${info.port}  db=${database.kind}  customer: ana@example.com / senha123  staff: ze@burgerdoze.com.br / senha123`);
});

const shutdown = async () => {
  server.close();
  await api.stop();
  await database.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
