# graphify in DMForge

How the code knowledge graph in `graphify-out/` is wired, what it is good at, where it
is blind, and which DMForge questions to send to which command. Every example below was
run against this repo with graphify **0.9.65** on 2026-10-16.

## What it is

graphify parses the repo with an AST extractor (no LLM, no API cost) into
`graphify-out/graph.json`: one node per file, function, class, export or dependency,
and edges for `calls`, `imports`, `imports_from`, `contains`, `references`, `inherits`.
Nodes are clustered into communities and summarised in `GRAPH_REPORT.md`.

| File | Purpose |
|------|---------|
| `graph.json` | The graph itself; what every CLI command reads |
| `GRAPH_REPORT.md` | Hubs ("god nodes"), communities, surprising links, import cycles, freshness |
| `graph.html` | Interactive visual of the graph (open in a browser) |
| `manifest.json` | Per-file hashes used for incremental rebuilds |
| `YYYY-MM-DD/` | Automatic backups taken before a rebuild shrinks the graph |

Current shape: ~1,230 nodes, ~2,690 edges, 75 communities, 99% of edges `EXTRACTED`
(read straight from source, not inferred). No import cycles.

## How it stays fresh

```
git commit ─▶ post-commit hook ─▶ graphify update (changed code files only) ─▶ graph.json
git checkout ─▶ post-checkout hook ─▶ same
Claude Code Grep/Read ─▶ .claude/settings.json PreToolUse "graphify hook-guard" ─▶ reminder to query first
```

- `graphify hook status` shows the git hooks. The hooks are installed in each clone's
  `.git/hooks`, not in the repo, so set them up again on a fresh clone with
  `graphify hook install`.
- `GRAPH_REPORT.md` → "Graph Freshness" records the commit it was built from. Compare it
  with `git rev-parse HEAD`.
- Manual rebuild: `graphify update .`. Add `--force` when the rebuild has fewer nodes
  (after deleting code or adding ignore rules), otherwise graphify refuses to shrink it.
- Doc-only changes are skipped by the hook. Run `/graphify --update` for those.

### Committing the graph

`graphify-out/` is committed on purpose (see `.gitignore`). The post-commit hook rebuilds
it *after* a code commit, so the working tree shows `graphify-out/*` as modified right
after you commit code. That is expected, not drift:

1. Commit your code as usual.
2. Wait for the background rebuild (`tail ~/.cache/graphify-rebuild.log` → "updated in graphify-out").
3. `git add -u graphify-out && git commit -m "chore(graphify): refresh knowledge graph"`.

The rebuild is deterministic (the hook pins `PYTHONHASHSEED=0`), so committing the
refresh leaves the tree clean. Set `GRAPHIFY_SKIP_HOOK=1` to skip a rebuild, e.g. during
a long rebase series.

**Merge conflicts:** `.gitattributes` maps `graphify-out/graph.json` to the `graphify`
union merge driver. Each machine needs the driver in its git config once:
`graphify hook install` (installs the hooks too). On a machine without it, git falls
back to a normal text merge, and you resolve with `graphify update . --force`.

### What is excluded (`.graphifyignore`)

Uses gitignore syntax. Besides build output, it excludes `.claude/`, `.agents/` and
`.github/agents/`. Those folders held ~1,490 nodes of agent/skill persona markdown, 55% of
the graph. They pulled free-text queries toward prompt files: "how does the stripe
webhook update user subscriptions" started from a benchmarker persona and never reached
the webhook handler. `.github/workflows/` stays in the graph.

## Health check (2026-10-16)

| Capability | Verdict | Evidence |
|------------|---------|----------|
| Extraction accuracy | Good | Webhook `POST()` → `getStripe`, `getAdminDb`, `getAdminFieldValue`, `logError`; all correct with line numbers |
| `affected` (impact) | Excellent | `affected "getAdminDb()"` listed all 7 importing files; `grep -rl getAdminDb` found the same 7 |
| `explain` | Excellent | 17 callers and callees of `getAdminDb()` with file:line |
| `god-nodes` | Good | `cn`, `authFetch`, `UnauthorizedError`, `handleRoute`, `ValidationError`, `logError` match the real core |
| `query` (free text) | Weak unless you name symbols | Start nodes are picked by label keywords; prose questions land on README headings |
| `path` | Ambiguous on common names | `path "POST()" ...` fails (dozens of `POST()` nodes); file labels work: `path "webhook/route.js" "firebaseAdmin.js"` |

### Blind spots (static analysis limits)

1. **Injected dependencies.** `lib/services/*` take `db` and `FieldValue` as arguments,
   so the graph shows no link from services to Firestore. Ask about the caller
   (`handleRoute()`) instead, or grep.
2. **Method calls on objects.** `db.collection("users")` and `stripe.subscriptions.retrieve`
   are not edges. `syncSubscription()` has degree 1. Firestore collection names and
   Stripe API calls are not modelled. Use grep for "who writes collection X".
3. **The catch-all router.** Most API endpoints are branches inside one
   `handleRoute()` in `app/api/[[...path]]/route.js`, not separate nodes. The graph sees
   one 52-edge hub, not one node per endpoint.
4. **Env vars and config.** `FIRESTORE_EMULATOR_HOST`, `firebase.json` emulator ports and
   so on are not edges. Config files show up only as key nodes (`scripts`, `dependencies`).

## Command → use-case map

**Rule of thumb:** name a symbol or file label (`syncSubscription`, `webhook/route.js`),
not a sentence. Use `explain`/`affected` for precise answers and `query` for orientation.

| Question you have | Command | DMForge example |
|-------------------|---------|-----------------|
| What breaks if I change X? | `graphify affected "X" --depth 2` | Before touching `getAdminDb()`, `verifyRequest()`, `authFetch()` or `validate()` |
| Who calls X / what does X call? | `graphify explain "X"` | `explain "handleRoute()"` to see every service the catch-all router dispatches to |
| Where do I start reading feature Y? | `graphify query "symbolA fileB" --budget 1500` | `query "syncSubscription webhook/route.js"`; `query "createProspect prospectService.js"` |
| How are two modules connected? | `graphify path "fileA" "fileB"` | `path "webhook/route.js" "firebaseAdmin.js"` (use file labels, not `POST()`) |
| What are the core abstractions? | `graphify god-nodes --top 15` | Onboarding: `cn`, `authFetch`, the `lib/errors.js` classes, `handleRoute`, `logError` |
| Is there an import cycle? | `GRAPH_REPORT.md` → "Import Cycles" | Currently none |
| Which code clusters belong together? | `GRAPH_REPORT.md` → "Communities" | Billing cluster: `billingService.js` + `lib/stripe.js` + webhook route |

### Use cases by area

| Area | Hub nodes to start from | Typical task |
|------|-------------------------|--------------|
| **Billing / Stripe** | `webhook/route.js`, `syncSubscription()`, `lib/stripe.js` (`getStripe`, `ensurePrice`, `getOrCreateCustomer`), `billingService.js` | Change subscription sync, add a webhook event type, audit what touches Stripe |
| **Firebase / data access** | `firebaseAdmin.js` (`getAdminDb`, `getAdminAuth`, `verifyRequest`, `ensureInit`), `lib/firebase.js` | Credential/emulator changes: `affected "ensureInit()"` covers every entry point |
| **API surface** | `handleRoute()`, `route-handler.js`, `lib/schemas.js` (`validate`), `lib/errors.js` | Add an endpoint, change validation, trace which errors an endpoint can throw |
| **Prospects / inbox** | `prospectService.js` (`createProspect`, `updateProspect`, `appendProspectMessage`), `lib/prospects.js` | Lead-pipeline changes; remember the `db` injection blind spot |
| **Outbound webhooks** | `webhookService.js`, `lib/webhooks.js` (`triggerWebhooks`), `lib/webhookAuth.js` (`isPublicHttpsUrl`) | SSRF/URL validation review, delivery changes |
| **Channels / integrations** | `channelService.js`, `integrationService.js`, `encryption.js` | Credential-at-rest changes: `affected "encrypt()"` |
| **Frontend** | `cn()`, `authFetch()`, `useAuth()`, `components/ui/*` | Auth-fetch refactors: `affected "authFetch()"` lists every page and component that calls it |
| **Rate limiting** | `rateLimit.js` (`checkRateLimit`, `checkLlmRateLimit`) | See which routes are throttled |

## Integrations available (not yet used here)

| Integration | What it gives | How |
|-------------|---------------|-----|
| **MCP server** | Live `query_graph`, `get_node`, `get_neighbors`, `shortest_path`, `god_nodes` tools for any agent | `python -m graphify.serve graphify-out/graph.json` with the absolute interpreter path in the MCP config |
| **Feedback loop** | Records which nodes answered a question, so later queries prefer them | `graphify save-result --question Q --answer A --nodes N1 N2 --outcome useful\|dead_end\|corrected`, then `graphify reflect` |
| **Cross-repo graph** | One graph across DMForge and `functions/` or another repo | `graphify merge-graphs g1.json g2.json` |

## Recommendations

1. **Ask with symbols.** Update agent prompts and skills to pass symbol or file labels to
   `graphify query`, and to prefer `explain`/`affected` for impact questions.
2. **Re-label communities** after big ignore or refactor changes: `graphify label .`
   (needs an LLM backend). Thirty communities are currently named after their hub file.
3. **Don't trust "no edge" for data flow.** For Firestore collections, Stripe API calls
   and env vars, grep is the source of truth (see Blind spots).
