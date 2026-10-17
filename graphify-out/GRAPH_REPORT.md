# Graph Report - compliance  (2026-10-17)

## Corpus Check
- 209 files · ~101,436 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 15, .example 1, .code-workspace 1)

## Summary
- 1276 nodes · 2834 edges · 83 communities (51 shown, 32 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e493421c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- dependencies
- best/[slug]/page.js
- authFetch
- backend_test.py
- sidebar.jsx
- cn
- [[...path]]/route.js
- functions/index.js
- package.json
- @playwright/test
- utils.js
- dashboard/page.js
- alert-dialog.jsx
- agentService.js
- command.jsx
- components.json
- biome.json
- form.jsx
- rateLimit.js
- prospectService.js
- UnauthorizedError
- toggle-group.jsx
- chart.jsx
- carousel.jsx
- input-otp.jsx
- navigation-menu.jsx
- logError
- drawer.jsx
- @sentry/nextjs
- paths
- settings/layout.js
- ref_node_module
- devDependencies
- resolutions
- ref_node_path
- compilerOptions
- Project: DMForge — AI DM setter builder + Stripe-enabled SaaS
- ref_node_url
- scripts
- app/layout.js
- context-menu.jsx
- handleRoute
- webhookAuth.js
- contact/page.js
- privacy/page.js
- terms/page.js
- breadcrumb.jsx
- sonner.jsx
- CI Workflow
- .mcp.json
- repository
- DMForge Apple Icon (PNG)
- DMForge
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- auth-context.js
- next.config.js
- vercel.json
- health/route.js
- DMForge Deployment Runbook
- Test Run 1 - Firebase Auth + Firestore E2E Testing
- Bug Report Template
- Feature Request Template
- Pull Request Template
- Legal & Regulatory Compliance Notes
- useAuth
- accordion.jsx
- about/page.js
- complaints/page.js
- DMForge E2E — real-browser click tests (Playwright)
- vitest.config.mjs
- CLEAN_CODE_REPORT.md
- engines
- @testing-library/jest-dom
- ref_node_fs
- audit-code.js
- proxy.js

## God Nodes (most connected - your core abstractions)
1. `cn()` - 224 edges
2. `authFetch()` - 69 edges
3. `handleRoute()` - 66 edges
4. `react` - 65 edges
5. `UnauthorizedError` - 54 edges
6. `ValidationError` - 46 edges
7. `lucide-react` - 34 edges
8. `logError()` - 30 edges
9. `useAuth()` - 29 edges
10. `next` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Recommendations` --references--> `authFetch()`  [INFERRED]
  test_result.md → lib/auth-context.js
- `Test Coverage` --references--> `authFetch()`  [INFERRED]
  test_result.md → lib/auth-context.js
- `Specification & Background` --references--> `handleRoute()`  [INFERRED]
  project-tasks/inbound-rate-limit-tasklist.md → app/api/[[...path]]/route.js
- `[x] Task 3: Wire `checkInboundRateLimit` into `app/api/[[...path]]/route.js`` --references--> `handleRoute()`  [INFERRED]
  project-tasks/inbound-rate-limit-tasklist.md → app/api/[[...path]]/route.js
- `Use cases by area` --references--> `useAuth()`  [INFERRED]
  docs/GRAPHIFY.md → lib/auth-context.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design Governance Stack** — impeccable_design_context, figma_design_system, brand_tokens [EXTRACTED 1.00]

## Communities (83 total, 32 thin omitted)

### Community 0 - "react"
Cohesion: 0.20
Nodes (16): ProspectCard(), relTime(), STATUS_STYLE, STATUSES, ThreadDrawer(), GREETING, Badge(), badgeVariants (+8 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (68): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, dayjs, dotenv (+60 more)

### Community 2 - "best/[slug]/page.js"
Cohesion: 0.09
Nodes (25): BestPage(), FIXED_PAGES, generateMetadata(), NICHES, parseSlug(), RANKING, CLUSTER, metadata (+17 more)

### Community 3 - "authFetch"
Cohesion: 0.08
Nodes (44): Dashboard(), portal(), FollowUpSequence(), generate(), saveEdit(), InboxPage(), createLead(), loadInboundUrl() (+36 more)

### Community 4 - "backend_test.py"
Cohesion: 0.09
Nodes (41): main(), print_test(), Test POST /api/agent/chat - empty messages returns intro, Test POST /api/agent/chat - multi-turn conversation, Test POST /api/agent/chat - invalid agentId returns 404, Test POST /api/result/save, DMForge Backend API Test Suite Tests all endpoints at https://insight-…, Test GET /api/ - health check (+33 more)

### Community 5 - "sidebar.jsx"
Cohesion: 0.06
Nodes (41): Separator, components_ui_sheet_sheet, SheetContent, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+33 more)

### Community 6 - "cn"
Cohesion: 0.05
Nodes (52): Avatar, AvatarFallback, AvatarImage, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (+44 more)

### Community 7 - "[[...path]]/route.js"
Cohesion: 0.10
Nodes (26): ALLOWED_ORIGINS, CHANNEL_LABELS, CHAT_TURN_SCHEMA, DELETE, EMPTY_CHAT_STATE, formatPrice(), GET, handleCORS() (+18 more)

### Community 8 - "functions/index.js"
Cohesion: 0.08
Nodes (27): crypto, decrypt(), { defineSecret }, deriveKey(), ENCRYPTION_KEY, ENCRYPTION_KEY_PREVIOUS, { getFirestore, FieldValue }, { initializeApp, getApp } (+19 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (33): homepage, firebase-admin, license, name, packageManager, private, version, autoprefixer (+25 more)

### Community 10 - "@playwright/test"
Cohesion: 0.06
Nodes (19): BOOKED_CONFIRMATION, deriveResultState(), toPublicResult(), { defineConfig, devices }, IMPORTANT: Defaults to localhost (safe for local/CI testing)., @playwright/test, { test, expect }, { test, expect } (+11 more)

### Community 11 - "utils.js"
Cohesion: 0.06
Nodes (21): Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem, ResizableHandle(), ResizablePanelGroup() (+13 more)

### Community 12 - "dashboard/page.js"
Cohesion: 0.17
Nodes (5): generateMetadata(), getResult(), ResultPage(), Logo(), @testing-library/react

### Community 13 - "alert-dialog.jsx"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 14 - "agentService.js"
Cohesion: 0.21
Nodes (14): agentDenied(), AppError, chat(), chatJSON(), GEMINI_URL(), repairLLMJson(), toGemini(), findPlaceholders() (+6 more)

### Community 15 - "command.jsx"
Cohesion: 0.11
Nodes (17): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+9 more)

### Community 16 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 17 - "biome.json"
Cohesion: 0.05
Nodes (41): source, assist, actions, noUnusedImports, noUnusedVariables, files, includes, formatter (+33 more)

### Community 18 - "form.jsx"
Cohesion: 0.17
Nodes (13): FormControl, FormDescription, FormFieldContext, FormItem, FormItemContext, FormLabel, FormMessage, useFormField() (+5 more)

### Community 19 - "rateLimit.js"
Cohesion: 0.15
Nodes (18): buckets, checkInboundRateLimit(), checkLlmRateLimit(), checkRateLimit(), clientIp(), getLimiter(), hit(), hitMemory() (+10 more)

### Community 20 - "prospectService.js"
Cohesion: 0.35
Nodes (14): NotFoundError, normalizeChannel(), normalizeStatus(), addProspectMessage(), appendProspectMessage(), createProspect(), deleteProspect(), getOrCreateInboundToken() (+6 more)

### Community 21 - "UnauthorizedError"
Cohesion: 0.05
Nodes (82): cleanSecret(), decrypt(), deriveKey(), encrypt(), getCurrentKey(), getDecryptKeys(), packAndEncrypt(), unpackAndDecrypt() (+74 more)

### Community 22 - "toggle-group.jsx"
Cohesion: 0.17
Nodes (12): Alert, AlertDescription, AlertTitle, alertVariants, ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle (+4 more)

### Community 23 - "chart.jsx"
Cohesion: 0.29
Nodes (8): ChartContainer, ChartContext, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload(), THEMES, useChart(), recharts

### Community 24 - "carousel.jsx"
Cohesion: 0.33
Nodes (8): Carousel, CarouselContent, CarouselContext, CarouselItem, CarouselNext, CarouselPrevious, useCarousel(), embla-carousel-react

### Community 25 - "input-otp.jsx"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 26 - "navigation-menu.jsx"
Cohesion: 0.25
Nodes (8): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport, @radix-ui/react-navigation-menu

### Community 27 - "logError"
Cohesion: 0.24
Nodes (13): resolveSeats(), ghlCreateAppointment(), ghlCreateContact(), ghlGetContact(), ghlValidate(), headers(), logError(), onProspectBooked() (+5 more)

### Community 28 - "drawer.jsx"
Cohesion: 0.22
Nodes (7): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle, vaul

### Community 29 - "@sentry/nextjs"
Cohesion: 0.29
Nodes (3): onRequestError(), register(), @sentry/nextjs

### Community 30 - "paths"
Cohesion: 0.25
Nodes (7): compilerOptions, baseUrl, paths, exclude, @/app/*, @/components/*, @/lib/*

### Community 33 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer, cross-env, globals, jsdom, @playwright/test, postcss, tailwindcss (+9 more)

### Community 34 - "resolutions"
Cohesion: 0.29
Nodes (7): resolutions, **/anymatch/picomatch, follow-redirects, form-data, **/micromatch/picomatch, **/readdirp/picomatch, yaml

### Community 36 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, alwaysStrict, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module (+16 more)

### Community 37 - "Project: DMForge — AI DM setter builder + Stripe-enabled SaaS"
Cohesion: 0.14
Nodes (13): API endpoints (all working), Backend sub-agent log, Frontend sub-agent log, Key Findings, Notes, Pages, Phase 2 NOT yet built, Project: DMForge — AI DM setter builder + Stripe-enabled SaaS (+5 more)

### Community 39 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, audit, build, dev, dev:emulated, emulators, start, test (+6 more)

### Community 40 - "app/layout.js"
Cohesion: 0.07
Nodes (28): fetchSession(), metadata, Success(), app_globals, baseUrl, body, display, metadata (+20 more)

### Community 41 - "context-menu.jsx"
Cohesion: 0.18
Nodes (10): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+2 more)

### Community 42 - "handleRoute"
Cohesion: 0.19
Nodes (26): handleRoute(), dynamic, POST(), syncSubscription(), Blind spots (static analysis limits), Command → use-case map, Health check (2026-10-16), Use cases by area (+18 more)

### Community 43 - "webhookAuth.js"
Cohesion: 0.18
Nodes (12): BLOCKED_SUFFIXES, isPrivateIPv4(), isPrivateIPv6(), isPublicHttpsUrl(), parseMetaSignedRequest(), safeEqual(), verifyMetaSignature(), ref_net (+4 more)

### Community 47 - "breadcrumb.jsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 49 - "CI Workflow"
Cohesion: 1.00
Nodes (3): CI Workflow, E2E Workflow, Pre-Deploy Verification Workflow

### Community 51 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 53 - "DMForge"
Cohesion: 0.06
Nodes (35): DMForge Project Rules, DMForge Brand Tokens, Commands, DMForge — Project Rules, graphify, Layout, Rules, Stack (+27 more)

### Community 56 - "auth-context.js"
Cohesion: 0.39
Nodes (6): AuthCtx, auth, db, firebaseConfig, googleProvider, firebase

### Community 60 - "health/route.js"
Cohesion: 0.39
Nodes (7): checkFirestore(), checkGemini(), checkStripe(), dynamic, GET(), GEMINI_BASE(), MODEL

### Community 62 - "Test Run 1 - Firebase Auth + Firestore E2E Testing"
Cohesion: 0.33
Nodes (6): Critical Issues Requiring Fix, Detailed Findings, Recommendations, Test Artifacts, Test Coverage, Test Run 1 - Firebase Auth + Firestore E2E Testing

### Community 68 - "useAuth"
Cohesion: 0.15
Nodes (18): App(), Nav(), Pricing(), checkout(), portal(), AuthModal(), google(), submit() (+10 more)

### Community 70 - "accordion.jsx"
Cohesion: 0.40
Nodes (4): AccordionContent, AccordionItem, AccordionTrigger, @radix-ui/react-accordion

### Community 83 - "DMForge E2E — real-browser click tests (Playwright)"
Cohesion: 0.29
Nodes (6): DMForge E2E — real-browser click tests (Playwright), Install (one time, in the DMForge repo root), Note: keep test files out of the deployed bundle, Reuse for future projects, Run, What it covers (tests/e2e/smoke.spec.js)

### Community 134 - "audit-code.js"
Cohesion: 0.21
Nodes (10): ref_fs, ref_path, audit(), EXTENSIONS, fs, IGNORED_DIRS, main(), path (+2 more)

## Knowledge Gaps
- **355 isolated node(s):** `cloudflare-api`, `cloudflare-ai-gateway`, `metadata`, `ALLOWED_ORIGINS`, `EMPTY_CHAT_STATE` (+350 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 472 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `react`, `sidebar.jsx`, `accordion.jsx`, `context-menu.jsx`, `handleRoute`, `utils.js`, `alert-dialog.jsx`, `breadcrumb.jsx`, `command.jsx`, `form.jsx`, `toggle-group.jsx`, `chart.jsx`, `carousel.jsx`, `input-otp.jsx`, `navigation-menu.jsx`, `drawer.jsx`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **Why does `authFetch()` connect `authFetch` to `react`, `useAuth`, `handleRoute`, `dashboard/page.js`, `auth-context.js`, `Test Run 1 - Firebase Auth + Firestore E2E Testing`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `next` connect `react` to `best/[slug]/page.js`, `useAuth`, `[[...path]]/route.js`, `about/page.js`, `app/layout.js`, `handleRoute`, `data-deletion/page.js`, `dashboard/page.js`, `package.json`, `proxy.js`, `logError`, `health/route.js`, `settings/layout.js`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `cn()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`cn()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `authFetch()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`authFetch()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `handleRoute()` (e.g. with `Blind spots (static analysis limits)` and `Command → use-case map`) actually correct?**
  _`handleRoute()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cloudflare-api`, `cloudflare-ai-gateway`, `metadata` to the rest of the system?**
  _355 weakly-connected nodes found - possible documentation gaps or missing edges._