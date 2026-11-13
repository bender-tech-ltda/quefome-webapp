import { defineConfig, devices } from "@playwright/test";

/**
 * E2E on production scenarios, against the real API (in-memory PGlite, dev WhatsApp "log" provider,
 * test-control endpoints). `pnpm build` must have run (the web app starts with `next start`).
 * PW_CHROMIUM_PATH lets CI/sandboxes use a preinstalled Chromium instead of `playwright install`.
 */
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const API_PORT = Number(process.env.E2E_API_PORT ?? 4110);
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : {};

export const API_URL = `http://localhost:${API_PORT}`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1, // tests share one API/database (reset before each test)
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { baseURL: WEB_URL, trace: "retain-on-failure", screenshot: "only-on-failure", locale: "pt-BR", timezoneId: "America/Sao_Paulo", launchOptions },
  projects: [
    // customers are on phones; merchants on phones and on the counter PC
    { name: "phone", use: { ...devices["Pixel 7"], launchOptions } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions }, testMatch: /merchant-.*\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "pnpm --filter @quefome/api start",
      url: `${API_URL}/health`,
      env: {
        NODE_ENV: "test", PORT: String(API_PORT), API_TEST_CONTROL: "1", ADDRESS_PROVIDER: "fixtures", PGLITE_DIR: "memory",
        MESSAGING_PROVIDER: "log", OUTBOX_POLL_MS: "200", PUBLIC_APP_URL: WEB_URL, ALLOWED_ORIGINS: WEB_URL, LOG_LEVEL: "warn",
      },
      reuseExistingServer: !process.env.CI,
      cwd: "..",
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @quefome/web exec next start --port ${WEB_PORT}`,
      url: `${WEB_URL}/robots.txt`,
      env: { API_BASE_URL: API_URL, NEXT_PUBLIC_SITE_URL: WEB_URL },
      reuseExistingServer: !process.env.CI,
      cwd: "..",
      timeout: 120_000,
    },
  ],
});
