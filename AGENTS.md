# DMForge — Project Rules

AI DM appointment-setter SaaS for online coaches. Next.js App Router serverless app deployed on Vercel.

## Stack

- **Next.js 16 stable (App Router), React 18, plain JavaScript** — no TypeScript. Do not introduce `.ts`/`.tsx` files.
- **Firebase**: Auth (email/password + Google) on the client, Admin SDK on the server. Firestore uses the **named database `dmforge`** (not `(default)`) — always go through [lib/firebaseAdmin.js](lib/firebaseAdmin.js) server-side and [lib/firebase.js](lib/firebase.js) client-side.
- **LLM**: Google Gemini via a hand-rolled `fetch` to the REST API (no AI SDK) — see [lib/llm.js](lib/llm.js). `GEMINI_BASE_URL` optionally routes traffic through Cloudflare AI Gateway.
- **Payments**: Stripe subscriptions — see [lib/stripe.js](lib/stripe.js) and the webhook handler under `app/api`.
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS. Components live in `components/`, shadcn config in [components.json](components.json).

## Commands

- `yarn dev` — dev server on port 3000 (memory-capped for low-RAM environments)
- `yarn build` — production build (must pass before shipping)
- `yarn test:e2e` — Playwright e2e; targets **production** by default, override with `BASE_URL=http://localhost:3000`
- Package manager is **yarn 1.x** (`packageManager` pinned). Never use npm/pnpm; never touch `yarn.lock` by hand.

## Layout

- `app/` — routes; API routes under `app/api` (a catch-all `[[...path]]` handles most endpoints)
- `lib/` — server/shared logic: `firebaseAdmin`, `llm`, `stripe`, `ghl`, `rateLimit`, `encryption`, `webhooks`, …
- `components/` — React components (shadcn/ui in `components/ui`)
- `tests/e2e/` — Playwright specs
- Path aliases: `@/lib/*`, `@/components/*`, `@/app/*` (see [jsconfig.json](jsconfig.json)) — prefer them over relative `../..` imports.

## Rules

1. **Secrets**: never commit `.env.local` or service-account JSON. Client-exposed vars must be prefixed `NEXT_PUBLIC_`; server secrets (`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `STRIPE_WEBHOOK_SECRET`) are read only at request time — the build must succeed without them. When adding an env var, update [.env.example](.env.example) and the CI placeholders in [.github/workflows/ci.yml](.github/workflows/ci.yml).
2. **Serverless constraints**: API routes run on Vercel serverless — no long-lived state, no filesystem writes; reuse the module-scope Firebase Admin singleton.
3. **Stripe webhooks**: always verify signatures with `STRIPE_WEBHOOK_SECRET`; test mode uses `sk_test_` keys.
4. **Verify before shipping**: `yarn build` locally; after deploying, use the `prod-verify` skill (`.agents/skills/prod-verify`) for black-box production checks.
5. **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`), imperative mood, small and scoped.
6. **Tracked work**: sprint/task state lives in [TASKS.md](TASKS.md) — update it when completing a tracked task.

## Shared Skills

Skills in `.agents/skills/` are shared across agents (Antigravity, Claude Code). The canonical source is `.claude/skills/`; the `.agents/skills/` copies mirror them for Antigravity discovery. When adding or updating a skill, update both locations or use the sync reference in `.agents/skills.json`.
