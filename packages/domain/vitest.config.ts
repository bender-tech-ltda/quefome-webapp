import { defineConfig } from "vitest/config";

// Legacy filters read the *browser* clock; the differential tests emulate a browser in São Paulo.
process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"],
      reporter: ["text-summary", "text"],
      // Floor, not a goal: uncovered code is mostly display labels and defensive `??` guards (docs/TEST_STRATEGY.md).
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
