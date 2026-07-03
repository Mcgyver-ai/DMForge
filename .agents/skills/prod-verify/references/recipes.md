# prod-verify — recipes

Concrete commands for the workflow in SKILL.md. Use a Bash shell (Git Bash on Windows).
Replace `$BASE` with the production URL. Never print/commit secret values; pipe via stdin.

## Table of contents

1. Page + link crawl
2. Endpoint discovery from the client bundle
3. Real registration + authed journey (Firebase Auth REST)
4. Vercel: runtime logs, env vars, redeploy (CLI)
5. Firebase Admin credential failure-mode → fix table
6. Stripe checkout / portal verification
7. Minimal reusable Playwright setup

---

## 1. Page + link crawl

```bash
BASE="https://www.example.com"
curl -s "$BASE/sitemap.xml" | grep -oP '(?<=<loc>)[^<]+' | sort -u > urls.txt
# add app routes not in the sitemap (dashboard, success pages, etc.)
while read u; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 20 "$u")
  [ "$code" != "200" ] && echo "[$code] $u"
done < urls.txt
# extract internal links from a page and check the same way:
curl -s -L "$BASE/" | grep -oP 'href="\K/[^"#?]*' | sort -u
```

A 308 to a different host (apex↔www) is a finding: canonical/sitemap should match the primary domain.

## 2. Endpoint discovery from the client bundle

Don't guess route names — read what the frontend calls:

```bash
curl -s -L "$BASE/" -o home.html
for c in $(grep -oP '/_next/static/chunks/[^"]+\.js' home.html | sort -u); do curl -s "$BASE$c"; done > chunks.js
grep -oP '"/api/[a-zA-Z0-9_/-]+' chunks.js | tr -d '"' | sort -u
grep -oP 'fetch\([^)]{0,60}/api/[a-zA-Z0-9_/-]+' chunks.js | sort -u
```

## 3. Real registration + authed journey (Firebase Auth REST)

The web API key is public (`NEXT_PUBLIC_FIREBASE_API_KEY`); using it to sign up a test user is safe.

```bash
APIKEY="<NEXT_PUBLIC_FIREBASE_API_KEY>"
TS=$(date +%s); EMAIL="qa-${TS}@example.com"; PASS="QaTest1234_${TS}"
RESP=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$APIKEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
TOK=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('idToken',''))")

# provisioning / authed reads / core feature (adapt paths to the app):
curl -s -o /dev/null -w "me: %{http_code}\n"        -H "Authorization: Bearer $TOK" "$BASE/api/me"
curl -s -o /dev/null -w "data: %{http_code}\n"      -H "Authorization: Bearer $TOK" "$BASE/api/my/items"
curl -s -o /dev/null -w "feature: %{http_code}\n" -X POST "$BASE/api/feature/create" \
  -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d '{ ...real body... }'
```

Report the test account so the user can delete it. `signIn` endpoint is `accounts:signInWithPassword`.
`UID` is a reserved bash variable — name it `USERID`.

## 4. Vercel: runtime logs, env vars, redeploy (CLI)

```bash
vercel whoami || vercel login
# in the repo dir (uses .vercel/project.json); else: vercel link
vercel logs <deployment-url-or-id>            # runtime logs; the real 500 cause lives here
# set a secret env var WITHOUT exposing it (pipe via stdin):
node -p "JSON.stringify(require('/abs/path/key.json'))" | vercel env add MY_JSON_VAR production
vercel env rm BROKEN_VAR production -y         # remove a bad var
vercel --prod                                  # redeploy so new env takes effect
```

Env changes require a fresh deploy to take effect. If you only have the Vercel MCP (read/deploy/logs,
no env write), set env vars via this CLI or hand off to the user.

## 5. Firebase Admin credential failure-mode → fix table

The Admin SDK resolves credentials in order; first match wins. Typical `loadServiceAccount()`:

1. `FIREBASE_SERVICE_ACCOUNT_JSON` → `JSON.parse` (often try/catch: silently falls through if invalid)
2. `FIREBASE_PRIVATE_KEY` + `FIREBASE_CLIENT_EMAIL` + project id → `.replace(/\\n/g,'\n')`
3. `FIREBASE_SERVICE_ACCOUNT_PATH` file

| Error seen in logs | Real cause | Fix |
|---|---|---|
| `16 UNAUTHENTICATED: ... Expected OAuth 2 access token` | The service-account key was revoked/disabled — usually a **leaked key auto-disabled** after a repo went public. Worked earlier only because the OAuth token was cached. | **Rotate the key** (revoke old, create new JSON). Update the env var. Redeploy. Then scrub the key from git history and keep it out of the repo. |
| `Failed to parse private key: error:1E08010C:DECODER routines::unsupported` | `FIREBASE_PRIVATE_KEY` is malformed PEM — surrounding quotes included, or double-escaped `\\n`, or mangled newlines. | Don't fight the escaping. Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the **single-line** minified key JSON instead — `JSON.parse` handles the newlines natively. Remove the broken `FIREBASE_PRIVATE_KEY`. |
| `Firebase Admin SDK not configured` | No credential resolved — the JSON var is unset or invalid (silently skipped) and the others aren't set. | Set a **valid** single-line `FIREBASE_SERVICE_ACCOUNT_JSON`. Verify it parses: `node -p "JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).client_email"`. |

Generate the bulletproof single-line value:

```bash
node -p "JSON.stringify(require('/abs/path/service-account.json'))"
```

Verify after redeploy — both must be 200:

```bash
curl -s -o /dev/null -w "create:%{http_code}\n" -X POST "$BASE/api/<write-route>" -H "Content-Type: application/json" -d '{...}'
# plus a fresh Firebase Auth signUp -> /api/me returns 200 with the provisioned user
```

## 6. Stripe checkout / portal verification

```bash
curl -s -X POST "$BASE/api/billing/checkout" -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" -d '{"planKey":"<plan>"}'   # expect a checkout.stripe.com url
curl -s -X POST "$BASE/api/billing/portal" -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" -d '{}'                      # expect a billing.stripe.com url
```

A live portal URL means the Stripe billing-portal config is saved; a 500 usually means it isn't.

## 7. Minimal reusable Playwright setup

```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
```

`playwright.config.js` (override target with `BASE_URL` for any project):

```js
const { defineConfig, devices } = require('@playwright/test')
const baseURL = process.env.BASE_URL || 'https://www.example.com'
module.exports = defineConfig({
  testDir: './tests/e2e', timeout: 60_000, expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL, headless: true, screenshot: 'only-on-failure', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

`tests/e2e/smoke.spec.js` — target visible text/placeholders; scope ambiguous controls:

```js
const { test, expect } = require('@playwright/test')
test('homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/<hero text>/i)).toBeVisible()
})
test('core flow works', async ({ page }) => {
  await page.goto('/')
  // advance a wizard with defaults, then click the action; if a label is duplicated
  // on the page, scope it (e.g. the one paired with "Back"):
  // await page.getByRole('button', { name: 'Back' }).locator('..')
  //   .getByRole('button', { name: /<action>/i }).click()
  // assert the success state (an element that only appears on success), with a long
  // timeout if it calls an LLM/3rd-party.
})
```

Run: `npm run test:e2e` (prod) or `BASE_URL=http://localhost:3000 npm run test:e2e` (local).
A test that "fails" by catching a real outage is the suite doing its job — read the captured
screenshot/error-context to see the page state at failure.
