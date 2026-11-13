import { loadConfig } from "../config";
import { createDatabase } from "./client";
import { resetAndSeed, seed } from "./seed";

const command = process.argv[2];
const config = loadConfig();
const database = await createDatabase({ databaseUrl: config.DATABASE_URL, pgliteDir: config.PGLITE_DIR });
try {
  if (command === "migrate") await database.migrate();
  else if (command === "seed") await seed(database.db);
  else if (command === "reset") {
    await database.migrate();
    await resetAndSeed(database.db);
  } else throw new Error(`unknown command: ${command} (migrate | seed | reset)`);
  console.log(`[api] ${command}: done (${database.kind})`);
} finally {
  await database.close();
}
