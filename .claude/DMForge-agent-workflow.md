# DMForge — Ship-Faster Agent Workflow

> Built 2026-07-02. Two things in one doc:
>
> 1. **Bright Data onboarding** — set up as lead-enrichment infrastructure for DMForge.
> 2. **Area-scoped agents** — a set of specialized Claude Code agents (one per slice of
>    DMForge) plus the dispatch model that actually parallelizes shipping.
>
> Everything here was checked against ground truth, not memory: the Claude Code
> subagent mechanism against the official docs (`code.claude.com/docs/en/sub-agents`),
> the Bright Data flow against the Bright Data onboarding skill, and the DMForge areas
> against a full read of `main`. Where a fact is version-sensitive or I couldn't run it
> from here, it's flagged.

---

## Read this first — subagents vs parallel sessions (the thing most people get wrong)

Claude Code has **two different tools** that both look like "an agent per area." Using the
wrong one is why "spin up 6 agents to ship 6 features at once" usually disappoints.

| | **Subagents** (`.claude/agents/*.md`) | **Parallel sessions** (your `claude-bridge` dispatcher) |
|---|---|---|
| What it is | A specialist the *main session* delegates to | Independent CC processes, one per task |
| Context | Own isolated window; returns one result to the parent | Fully separate conversations |
| Can they talk to each other? | **No** — report only to the parent thread | No, but they don't need to — they own different files |
| Runs in parallel? | Within one session, yes — but all report to one parent | **Yes, truly independent** |
| Best for | "Load the right expert + tool scope for *this* area," reviews, scoped research/impl inside a session | Shipping **non-overlapping** areas concurrently |
| Cost model | Cheap to route (can pin Haiku per agent) | N sessions = N times the tokens |

**The combination that ships faster:**

- **Subagents** are the durable, checked-in asset: any CC session working in DMForge
  automatically gets the right expert (correct files loaded, known gotchas baked in,
  tools scoped) without you re-explaining the area every time.
- **Parallel sessions** (dispatched via `claude-bridge` → CC, ideally each in its own
  **git worktree**) are how you actually run several areas at once — *as long as their
  files don't overlap.* Two sessions editing `app/api/[[...path]]/route.js` at the same
  time will collide; the monolithic route is the main hazard here (see `api-security`).

So: define the subagents once (below), then dispatch parallel sessions per **worktree**
for the areas that don't touch the same files.

---

## Part 1 — Bright Data onboarding (lead enrichment for DMForge)

### Why Bright Data fits DMForge

DMForge qualifies inbound DM leads. Bright Data can turn a bare IG/LinkedIn handle into a
qualification signal (follower count, bio, business category, recent activity), which
directly improves the core qualify-and-book loop. Three candidate jobs — **pick which one
becomes the productized agent** (I'd start with the first, it's the most on-mission):

1. **Inbound lead enrichment** — enrich a lead when they DM in, feed signals into the
   qualification prompt / lead score. *(Highest leverage; ties to the `leads-model` work.)*
2. **Outbound prospecting** — find coaches to sell DMForge *to* (pairs with the installed
   `vibe-prospecting` / `sales:*` skills).
3. **Competitive intel** — monitor rival DM-setter SaaS pricing/features
   (`competitive-intel` skill).

### Setup steps (run on your machine — this is not something I can do for you)

OAuth signs into *your* Bright Data account and issues a key. Per secrets discipline, that
step is yours; I don't paste keys or drive third-party logins.

```bash
# 1. Install CLI (Node >= 20). Gives you `brightdata` and `bdata`.
npm install -g @brightdata/cli
#   or:  curl -fsSL https://cli.brightdata.com/install.sh | bash

# 2. Authenticate once (opens browser; use --device on a headless box).
bdata login
#   Saves the key locally, auto-creates zones cli_unlocker / cli_browser.

# 3. Verify BEFORE writing any integration code — branch on the result, don't eyeball.
bdata version
bdata config      # must show authenticated account
bdata zones       # must list cli_unlocker, cli_browser
bdata budget      # must return balance/credits
```

If `bdata config` or `bdata budget` exits non-zero, or prints `unauthorized` / `invalid
api key` / `not logged in` / `zone not found`, stop and fix auth first — don't proceed.

### The SDK note (verified against DMForge's package.json)

`@brightdata/sdk` is **not in DMForge's `package.json`** — I checked the full dependency
list. So "the SDK is installed" means one of:

- **The global CLI** (`@brightdata/cli`) is installed → the `lead-enricher` agent shells
  out to `bdata` (no repo dependency needed). Simplest; good for enrichment jobs.
- **You want enrichment inside the DMForge app** → add the JS SDK to the repo:
  `cd DMForge && yarn add @brightdata/sdk`, then consult the installed
  `brightdata-plugin:brightdata-sdk-js` skill for the exact client API (`bdclient`, method
  names) — **do not guess the SDK surface; verify it against that skill before coding.**

### Credentials for DMForge (if enrichment runs in-app)

```dotenv
# add to Vercel env + local .env.local (NEVER commit real values)
BRIGHTDATA_API_KEY=...
BRIGHTDATA_UNLOCKER_ZONE=cli_unlocker
```

> Free-tier figures (5,000 credits/mo shared pool, resets on the 1st, no rollover) come
> from the Bright Data onboarding skill, which itself points to
> `docs.brightdata.com/general/account/billing-and-pricing/free-tier` as the source of
> truth. **Confirm the current numbers there before relying on them** — pricing pages move.

### Smoke test before scaling

```bash
# one real request proves auth + zone + quota work
bdata scrape "https://www.instagram.com/some_public_handle" -f markdown | head -40
#   or a platform pipeline for structured JSON:
bdata pipelines instagram_profile "https://www.instagram.com/some_public_handle"
```

Hand off deeper Bright Data work to the installed skills: `data-feeds` (platform datasets),
`scrape` (arbitrary URLs), `brightdata-sdk-js` (in-app), `bright-data-mcp` (if you wire the
BD MCP server into CC as a tool layer).

---

## Part 2 — The DMForge area → agent map

Six agents, each mapped to a real slice of the codebase and to the backlog from the audit.
Kept deliberately tight (six, not twelve) — an over-large agent roster is its own kind of
bloat. Files are in `.claude/agents/` next to this doc.

| Agent | Owns (files) | First jobs it should pick up |
|---|---|---|
| **billing-stripe** | `lib/stripe.js`, `app/api/stripe/webhook/route.js`, billing endpoints in the catch-all route | Verify + fix the `current_period_end` field-location bug; de-dupe the two `syncSubscription` copies |
| **channels-integrations** | `lib/email.js` `lib/sms.js` `lib/linkedin.js` `lib/ghl.js` `lib/encryption.js` + channel/integration endpoints | Confirm LinkedIn (OIDC vs legacy) + GHL (v1 vs v2) API shapes; add key-version tag to `encryption.js` |
| **leads-model** | *new* `leads/{uid}/prospects` subsystem + inbound-reply ingestion; then inbox + auto-triggers | Design the lead/prospect model; wire SMS-on-booked, GHL-sync-on-booked, and the inbox |
| **api-security** | `app/api/[[...path]]/route.js`, `lib/rateLimit.js`, `next.config.js` CORS/headers | Add auth guards to `/agent/create` + `/agent/chat`; lock CORS default; wrap fire-and-forget in `after()` |
| **lead-enricher** | Bright Data integration (CLI or `@brightdata/sdk`); enrichment endpoint/util | Stand up enrichment; feed signals into qualification/scoring (depends on `leads-model`) |
| **verifier** | *read-only* — builds, e2e, prod probes | Gate every change: `yarn build`, Playwright vs preview, prod HTTP/Firestore probes; report only |

**Dependency note:** `leads-model` is the keystone — `lead-enricher` and the auto-trigger
halves of `channels-integrations` all depend on it existing. Sequence it first (or in its
own session) so the others have something to hang off.

---

## Part 3 — Install the agents

```bash
# from the DMForge repo root
cp -r /path/to/dmforge-agents/.claude/agents/* .claude/agents/   # merge into existing .claude/
git add .claude/agents && git commit -m "add area-scoped subagents"
```

- Restart the CC session (file-based agents load at startup).
- Run `/agents` → **Library** tab to confirm all six loaded with unique names.
- `/doctor` (v2.1.196+) reports any same-name duplicates.

Tune each file's `model:` and `tools:` to taste — they're set conservatively (read-only
agents have no `Write`/`Edit`; mechanical agents can drop to a cheaper model).

---

## Part 4 — The ship-faster loop (day to day)

1. **Plan in this chat.** Produce the per-area spec/PR brief (like the TODO list) — this is
   the strategy layer. Feed it to CC.
2. **Parallelize the non-overlapping areas** via `claude-bridge`, one CC session per **git
   worktree** so they don't fight over files:

   ```bash
   git worktree add ../dmforge-leads   -b feat/leads-model
   git worktree add ../dmforge-billing -b fix/stripe-period-end
   # dispatch a CC session in each cwd via claude-bridge (point cwd at the WORKTREE, and
   # remember DMForge's real path is D:\Dev\Workspaces\Active\DMForge — earlier dispatch
   # examples used a wrong path)
   ```

   Keep `api-security` **serialized** if other work touches the monolithic route — that
   file is the collision point.
3. **Inside each session**, the matching subagent auto-engages (or invoke by name:
   "use the billing-stripe agent to fix current_period_end"). It has the files + gotchas
   loaded, so no re-explaining.
4. **Gate with `verifier`** before any merge — it runs the build + e2e + prod probes and
   reports. Read-only by design, so it can't paper over a failure by editing code.
5. **Merge serially**, rebasing each worktree branch onto updated `main` (this is exactly
   the discipline the stale PR #2 needed).

---

## Assumptions & honesty box

- **"Custom agents" = Claude Code subagents (dev-side), not DMForge's product `agents`
  collection.** Read from "to ship faster." If you actually meant per-niche *product* DM
  setters, say so — that's a different build.
- **"SDK installed" = CLI or a global install**, since `@brightdata/sdk` isn't in DMForge's
  `package.json` (verified). The enricher agent covers both.
- **Verified:** the subagent file mechanism + frontmatter + the load-at-startup gotcha
  (official docs); DMForge's dep list and area boundaries (full read of `main`); the
  subagent-vs-parallel-session distinction (official docs explicitly separate these).
- **Believe but couldn't run from here:** Bright Data free-tier numbers (confirm on the
  docs pricing page) and the exact `@brightdata/sdk` JS API surface (the enricher agent is
  instructed to verify it against the `brightdata-sdk-js` skill rather than assume).
- **Boundary:** I did not run `bdata login` or touch any key — OAuth into your account is
  yours to do.
