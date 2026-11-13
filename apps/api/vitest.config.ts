import { defineConfig } from "vitest/config";
process.env.TZ = "UTC"; // the API must not depend on the machine time zone
export default defineConfig({ test: { include: ["test/**/*.test.ts"], testTimeout: 30_000, hookTimeout: 60_000, fileParallelism: false } });
