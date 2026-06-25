# Testing Protocol

ALL agents MUST follow these rules. Do NOT edit this section.

1. Read this whole file BEFORE invoking any sub-testing agent.
2. Backend testing uses `deep_testing_backend_nextjs`. Frontend testing uses `deep_testing_frontend_nextjs` ONLY with explicit user permission.
3. Append new findings under each agent's section. Never delete prior findings.
4. Main agent must never fix issues already fixed by a testing sub-agent.

---

## Project: DMForge — AI DM setter builder (SetSmart competitor)

### Stack
- Next.js 15 App Router + MongoDB
- LLM: Google Gemini API directly (`gemini-2.5-flash`), key in `GEMINI_API_KEY`
- All API routes under `/api/*` via catch-all `app/api/[[...path]]/route.js`

### Core API endpoints
- `POST /api/agent/create` — body `{niche, offer, audience, qualification, tone, agentName}` → returns `{id, script, calendarSlots, agentName}`
- `POST /api/agent/chat` — body `{agentId, messages:[{role,content}]}` → returns `{reply, state:{step,qualified,booked,bookedSlot,tags}}`
- `POST /api/result/save` — body `{agentId, transcript, state, leadName?}` → returns `{id, shareUrl}`
- `GET /api/result/:id` — returns saved result
- `GET /api/competitors` — list of competitor metadata

### Pages
- `/` — homepage with hero + 4-step wizard + live chat simulator + features + vs-table + pricing + faq + footer
- `/r/[id]` — branded shareable result page with OG meta, share buttons, CTA
- `/vs/[slug]` — 12 competitor versus pages (setsmart, manychat, chatfuel, inflact, instachamp, tidio, intercom-fin, respond-io, kommo, gohighlevel, voiceflow, botpress)
- `/sitemap.xml`, `/robots.txt`

### Status: MVP Phase 1 shipped & verified
- All endpoints return 200, agent creation produces real high-quality scripts, chat replies are short/human-tone, save+share works end to end.
- LLM key (Google AI Studio free tier) confirmed working with `gemini-2.5-flash`.
- Phase 2 pending user go-ahead: auth, Stripe test-mode pricing/billing, dashboard with saved history, blog cluster, programmatic SEO pages.

## Backend sub-agent log
(empty — run when requested)

## Frontend sub-agent log
(empty — frontend testing requires explicit user permission)
