# Testing Protocol

ALL agents MUST follow these rules. Do NOT edit this section.

1. Read this whole file BEFORE invoking any sub-testing agent.
2. Backend testing uses `deep_testing_backend_nextjs`. Frontend testing uses `deep_testing_frontend_nextjs` ONLY with explicit user permission.
3. Append new findings under each agent's section. Never delete prior findings.
4. Main agent must never fix issues already fixed by a testing sub-agent.

---

## Project: DMForge — AI DM setter builder + Stripe-enabled SaaS

### Stack
- Next.js 15 App Router + MongoDB + Stripe (test mode)
- LLM: Google Gemini API directly (`gemini-2.5-flash`)

### API endpoints (all working)
- LLM: `POST /api/agent/create`, `POST /api/agent/chat`, `POST /api/result/save`, `GET /api/result/:id`
- Billing: `POST /api/billing/checkout` (auto-creates product/price), `POST /api/billing/portal`, `GET /api/billing/session?session_id=…`, `POST /api/stripe/webhook`
- Misc: `GET /api/me?email=…`, `GET /api/plans`, `GET /api/competitors`

### Pages
- `/` — homepage with hero + wizard + chat simulator + features + vs-table + pricing (Stripe-wired) + faq
- `/r/[id]` — branded shareable result page
- `/vs/[slug]` — 12 competitor pages with FAQPage JSON-LD
- `/billing/success?session_id=…` — Stripe redirect target
- `/sitemap.xml`, `/robots.txt`

### Stripe wiring (TEST MODE)
- Real Checkout sessions confirmed against user's Stripe test account
- Products/prices auto-created on first checkout call, cached in `billing_meta` collection
- Webhook accepts payload with dev fallback when `STRIPE_WEBHOOK_SECRET` is empty; signs when set
- Webhook URL to register: `${NEXT_PUBLIC_BASE_URL}/api/stripe/webhook`

### Phase 2 NOT yet built
- Auth (currently email-prompt at checkout); Google OAuth + magic link pending
- Dashboard with saved agents/history per user
- 12+ seeded blog posts (pillar + cluster), `/blog`, `/blog/[slug]`
- Programmatic long-tail landing pages (`/best-ai-dm-setter`, `/[category]-tool`, etc.)
- Per-page dynamic OG image generation
- Permanent production deployment

## Backend sub-agent log

### Test Run 1 - Complete Backend API Testing (All Endpoints)
**Date**: Current session  
**Tester**: Backend Testing Sub-agent  
**Base URL**: https://insight-forge-172.preview.emergentagent.com/api  
**Status**: ✅ ALL TESTS PASSED (18/18)

#### Test Coverage:
1. ✅ **GET /api/** - Health check returns `{ok:true, app:'DMForge'}` with CORS headers
2. ✅ **POST /api/agent/create** - Happy path with all fields returns valid agent with LLM-generated script (5 questions), calendarSlots, agentName
3. ✅ **POST /api/agent/create** - Missing required fields (niche/offer) returns 400 error
4. ✅ **POST /api/agent/chat** - Empty messages returns intro from script with initial state
5. ✅ **POST /api/agent/chat** - Multi-turn conversation returns conversational reply with state JSON
6. ✅ **POST /api/agent/chat** - Invalid agentId returns 404 error
7. ✅ **POST /api/result/save** - Saves transcript and state, returns id and shareUrl
8. ✅ **GET /api/result/:id** - Retrieves saved result without _id field
9. ✅ **GET /api/competitors** - Returns 12 competitor entries
10. ✅ **GET /api/me?email=x** - Returns `{user:null}` for non-existent user
11. ✅ **GET /api/plans** - Returns all 3 plans (pro_monthly, pro_annual, agency)
12. ✅ **POST /api/billing/checkout** - pro_monthly plan returns valid Stripe checkout URL (https://checkout.stripe.com/...)
13. ✅ **POST /api/billing/checkout** - pro_annual plan returns valid Stripe checkout URL
14. ✅ **POST /api/billing/checkout** - agency plan returns valid Stripe checkout URL
15. ✅ **POST /api/billing/checkout** - Missing fields returns 400 error
16. ✅ **POST /api/billing/checkout** - Invalid planKey returns 400 error
17. ✅ **POST /api/billing/portal** - No customer returns 404 error
18. ✅ **POST /api/stripe/webhook** - Unsigned payload (dev fallback) returns `{received:true}`

#### Key Findings:
- **CORS**: All endpoints return proper CORS headers (Access-Control-Allow-Origin: *)
- **LLM Integration**: Gemini API working correctly - agent/create generates real script with intro and 4-6 questions
- **Multi-turn Chat**: Conversational flow works - intro on empty messages, contextual replies on subsequent turns
- **Stripe LIVE Mode**: ⚠️ App is using LIVE Stripe keys (sk_live_...) - checkout URLs are real and functional
- **Webhook**: Accepts unsigned payloads (STRIPE_WEBHOOK_SECRET is empty) - dev fallback working as expected
- **Error Handling**: Proper 400/404 responses for invalid inputs
- **Data Persistence**: MongoDB integration working - agents and results saved/retrieved correctly
- **No _id Leakage**: Result endpoint correctly excludes MongoDB _id field

#### Notes:
- Did NOT complete any actual Stripe checkouts (would charge real cards)
- All 3 billing plans (pro_monthly, pro_annual, agency) generate valid checkout sessions
- LLM responses are natural and conversational (not robotic)
- AI summary generation in result/save endpoint works (summary included in saved doc)
- No critical issues found

## Frontend sub-agent log

### Test Run 1 - Firebase Auth + Firestore E2E Testing
**Date**: June 25, 2026  
**Tester**: Frontend Testing Sub-agent  
**Base URL**: https://insight-forge-172.preview.emergentagent.com  
**Status**: ⚠️ PARTIAL PASS (9/12 tests passed, 3 critical issues found)

#### Test Coverage:

**✅ PASSED (9 tests):**
1. ✅ **Homepage** - Loads correctly with all UI elements
2. ✅ **Firebase Email/Password Signup** - Account creation successful with unique email `test+playwright-{timestamp}@dmforge.test`
3. ✅ **Auth State in Nav** - Dashboard link and logout icon appear after signup
4. ✅ **AI Agent Creation via Wizard** - 4-step wizard completes successfully (Niche → Offer → Qualify → Tone)
5. ✅ **ChatSimulator** - Appears after agent creation with agent name "Sarah" and initial AI message
6. ✅ **Multi-turn Chat** - 5 messages sent and received successfully with AI responses
7. ✅ **Dashboard Page** - Loads correctly, shows user email, plan badge (Free), stats cards
8. ✅ **Additional Pages** - /blog, /vs/setsmart pages render correctly
9. ✅ **Logout** - Successfully logs out and returns to unauthenticated state

**❌ FAILED (3 critical issues):**
1. ❌ **Save Transcript Button** - "Save & share this transcript" button/link not appearing after conversation
   - Tested after 5 messages with various user inputs
   - Neither the button (when `state.booked === true`) nor the link (when `messages.length > 2`) appeared
   - Root cause: Likely a state update issue or UI condition not being met
   
2. ❌ **Agent Ownership** - Created agent NOT associated with logged-in user
   - Dashboard shows 0 agents despite successful agent creation while authenticated
   - Issue: `/api/agent/create` endpoint may not be receiving Authorization header from frontend
   - The `authFetch` helper is not being used in the wizard's agent creation call
   
3. ❌ **Page Crash** - /best/setsmart-alternative page fails with ERR_ABORTED
   - Server memory pressure causing crashes (logs show "Server is approaching the used memory threshold, restarting...")
   - Next.js dev server restarting frequently

#### Detailed Findings:

**Firebase Integration:**
- ✅ Firebase Auth working correctly (email/password signup and login)
- ✅ Firebase Admin SDK configured with service account credentials
- ✅ Firestore database "dmforge" accessible (after initial NOT_FOUND errors resolved)
- ⚠️ Initial Firestore writes failed with "5 NOT_FOUND" error, then succeeded after database auto-creation

**Dashboard Verification:**
- ✅ User email displayed: test+playwright-1782400544584@dmforge.test
- ✅ Plan badge: Free
- ❌ Agent count: 0 (expected: 1)
- ❌ Transcript count: 0 (expected: 0, as save failed)
- Message: "You haven't forged any AI setters yet"

**API Endpoints Tested:**
- ✅ GET /api/competitors - Returns 12 competitors
- ✅ GET /api/me - Returns user data when authenticated
- ✅ GET /api/my/agents - Returns empty array (no agents associated with user)
- ✅ GET /api/my/results - Returns empty array (no transcripts saved)

**Console Errors:**
- No Firebase Auth errors (auth/unauthorized-domain, auth/operation-not-allowed)
- No critical JavaScript errors
- Network requests completing successfully

#### Critical Issues Requiring Fix:

1. **HIGH PRIORITY: Agent Creation Not Using authFetch**
   - Location: `/app/app/page.js` line 178
   - Current code: `fetch('/api/agent/create', { method: 'POST', ... })`
   - Should be: `authFetch('/api/agent/create', { method: 'POST', ... }, getToken)`
   - Impact: Agents created while logged in are not associated with the user

2. **HIGH PRIORITY: Save Transcript UI Logic**
   - Location: `/app/app/page.js` lines 149-159
   - The "Save & share this transcript" link should appear when `messages.length > 2 && !state.booked`
   - Investigation needed: Check if state updates are propagating correctly from chat responses
   - Possible issue: The `<STATE>` JSON parsing in chat responses may be failing

3. **MEDIUM PRIORITY: Server Memory Management**
   - Next.js dev server running with `--max-old-space-size=512`
   - Frequent restarts due to memory pressure
   - Consider increasing memory limit or optimizing build

#### Test Artifacts:
- Screenshots saved: 01-authenticated-nav.png, 02-chat-simulator.png, 03-conversation.png, dashboard-verified.png
- Console logs captured in automation output
- Test email: test+playwright-1782400544584@dmforge.test (password: testpass123)

#### Recommendations:
1. Fix agent creation to use `authFetch` with user token
2. Debug ChatSimulator state management for save button visibility
3. Increase Next.js memory limit or optimize for production build
4. Add error boundary for page crashes
5. Test result page creation after fixing save functionality
