# Quefome (new stack)

Next.js 16 / React 19 / TypeScript frontend (migrated from the AngularJS `quefome-webapp`) and a Hono +
PostgreSQL backend, sharing one tested `domain` package (business rules) and one `contract` package (API schemas).
The app runs end to end locally with **no Docker and no database install** (embedded PGlite).

## Quick start

```bash
# Node >= 22 and pnpm 12 (npm i -g pnpm@12)
pnpm install
pnpm dev            # API on :4020 (embedded PGlite, auto-migrated + demo data) + web on :3000
```

Try the MVP flow:

| Open | What |
|---|---|
| http://localhost:3000/burger-do-ze | A restaurant's link: menu, cart, checkout (no account), order page |
| http://localhost:3000/admin | Merchant area: live board with sound, menu, store settings + QR code, history (`ze@burgerdoze.com.br` / `senha123`) |
| http://localhost:3000/dev/whatsapp | Every WhatsApp message the platform sends (restaurant summaries, customer updates), simulated in dev |
| http://localhost:3000/admin/cadastro | Sign up a new restaurant |
| http://localhost:3000/ | Marketplace (secondary channel) |

Other demo stores:
- `pizzaria-bella`: closed, schedule after midnight, free delivery
- `sushi-kazu`: open
- their merchants: `bella@pizzariabella.com.br`, `kazu@sushikazu.com.br` (password `senha123`)

Offline CEPs in dev:
- `92010-000` and `92020-000`: delivered
- `92200-000`: outside Burger do Zé's area

> Ran a previous version? The pre-production schema was squashed: `rm -rf apps/api/.data` once.

Production-like run: `pnpm build && pnpm start`. Real PostgreSQL: `DATABASE_URL=postgres://… pnpm --filter @quefome/api start`.

## Layout

```
apps/web            Next.js app: store page /[slug], checkout, order page /[slug]/pedido/[token], merchant area
                    /admin (board, cardápio, loja, histórico, cadastro), marketplace, dev WhatsApp inbox,
                    api/[...path] runtime proxy to API_BASE_URL
apps/api            The backend: Hono + Drizzle; PostgreSQL or embedded PGlite; merchant auth, store setup, menu CRUD,
                    guest orders priced on the server, WhatsApp outbox (Cloud API / dev log), SSE order feed, ViaCEP
packages/domain     Pure business rules (pricing, validation, schedules, lifecycle, formatting). Zero deps;
                    used by web and api
packages/contract   zod schemas + endpoint table (API v1)
packages/fixtures   Demo data (API seed, tests)
e2e                 Playwright, production scenarios, phone (Pixel 7) + desktop, against the real API
tools/              legacy reference env (runs the ORIGINAL app for comparison)
docs/               MVP scope, mobile-first plan, test strategy, backend plan, ADRs, history
```

## Scripts (root)

| Command | What |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Run, build, serve |
| `pnpm test` | Unit/integration tests of all packages (API on PGlite; domain enforces coverage thresholds) |
| `pnpm test:pg` | API suites on real PostgreSQL (`TEST_DATABASE_URL`) |
| `pnpm test:e2e` | Playwright (needs `pnpm build`; run `pnpm --filter @quefome/e2e exec playwright install chromium` once) |
| `pnpm --filter @quefome/api db:reset` | Wipe + reseed the local database (`db:generate` after schema changes) |
| `pnpm typecheck` / `pnpm lint` | Strict TS / ESLint |
| `pnpm run verify` | Everything, as CI runs it (⚠️ `pnpm ci` is a built-in pnpm command, not this script) |

## Configuration

| Variable | Default | Used by |
|---|---|---|
| `API_BASE_URL` | `http://localhost:4020` | web: server rendering **and** the `/api` proxy, read at runtime (ADR-0005) |
| `DATABASE_URL` | unset → PGlite in `apps/api/.data/pglite` | api (required in production) |
| `ADDRESS_PROVIDER` | `auto` (ViaCEP, fixtures fallback) | api; `viacep` required in production, `fixtures` in tests |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | api: CSRF origin allow-list for cookie-authenticated mutations |
| `API_TEST_CONTROL` | `0` | api: exposes `/__control/*` for tests (refused in production) |
| `PUBLIC_APP_URL` | `http://localhost:3000` | api: links inside WhatsApp messages |
| `MESSAGING_PROVIDER` | `log` | api: `log` (dev inbox) or `cloud-api` (required in production) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` | unset, unset, `v21.0` | api: WhatsApp Business Cloud API |
| `WHATSAPP_TEMPLATE_NEW_ORDER`, `WHATSAPP_TEMPLATE_STATUS_UPDATE`, `WHATSAPP_TEMPLATE_LANGUAGE` | unset, unset, `pt_BR` | api: approved templates (business-initiated messages outside the 24 h window) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | canonical / OpenGraph URLs |
| `NEXT_PUBLIC_BRAND_NAME`, `…_TITLE`, `…_DESCRIPTION` | Quefo.me texts | branding (the legacy hard-coded them) |
| `NEXT_PUBLIC_MERCHANT_LANDING_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_TWITTER_URL` | unset (hidden) | legacy footer links |
| `ALLOW_ROBOTS` | unset (disallow all) | `robots.txt` |
| `PW_CHROMIUM_PATH` | unset | E2E: use a preinstalled Chromium instead of `playwright install` |

## Documentation

| Doc | Purpose |
|---|---|
| [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md) | **Start here:** what is built, what needs discussion, what is isolated |
| [docs/MOBILE_FIRST_PLAN.md](docs/MOBILE_FIRST_PLAN.md) | Draft plan for the mostly-mobile, straightforward product |
| [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md) | What each suite guards, what was removed and why, gaps |
| [docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md) | Backend phases and status |
| [docs/adr/](docs/adr) | Decisions (toolchain, shared packages, cents, CSS, proxy, PGlite, WhatsApp outbox, guest checkout, mock retired) |
| [docs/history/](docs/history) | Modernization-phase documents (deprecations, deviations, migration status, requirements gap) |

## Notes

- The differential tests execute the **original** legacy JS from `../quefome-webapp`. If it is not checked out next to this folder, they are skipped (set `LEGACY_SRC` to point elsewhere).
- pnpm 12 refuses unapproved build scripts; `esbuild` is approved in `pnpm-workspace.yaml`.
