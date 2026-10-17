# Graph Report - authz-ssrf  (2026-10-17)

## Corpus Check
- 209 files · ~100,998 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 15, .example 1, .code-workspace 1)

## Summary
- 1275 nodes · 2840 edges · 86 communities (54 shown, 32 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.93)
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
- schemas.js
- command.jsx
- components.json
- biome.json
- form.jsx
- health/route.js
- NotFoundError
- UnauthorizedError
- toggle-group.jsx
- chart.jsx
- carousel.jsx
- input-otp.jsx
- navigation-menu.jsx
- errors.js
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
- reminderService.js
- handleRoute
- webhookAuth.js
- contact/page.js
- privacy/page.js
- terms/page.js
- agencyService.js
- sonner.jsx
- CI Workflow
- .mcp.json
- repository
- DMForge Apple Icon (PNG)
- DMForge
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- context-menu.jsx
- next.config.js
- vercel.json
- email.js
- DMForge Deployment Runbook
- auth-context.js
- Bug Report Template
- Feature Request Template
- Pull Request Template
- Legal & Regulatory Compliance Notes
- useAuth
- Test Run 1 - Firebase Auth + Firestore E2E Testing
- about/page.js
- accordion.jsx
- tabs.jsx
- scroll-area.jsx
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
3. `handleRoute()` - 67 edges
4. `react` - 65 edges
5. `UnauthorizedError` - 54 edges
6. `ValidationError` - 45 edges
7. `lucide-react` - 34 edges
8. `logError()` - 31 edges
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

## Communities (86 total, 32 thin omitted)

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
Cohesion: 0.06
Nodes (51): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), CardContent (+43 more)

### Community 7 - "[[...path]]/route.js"
Cohesion: 0.12
Nodes (27): ALLOWED_ORIGINS, CHANNEL_LABELS, CHAT_TURN_SCHEMA, DELETE, EMPTY_CHAT_STATE, formatPrice(), GET, handleCORS() (+19 more)

### Community 8 - "functions/index.js"
Cohesion: 0.08
Nodes (27): crypto, decrypt(), { defineSecret }, deriveKey(), ENCRYPTION_KEY, ENCRYPTION_KEY_PREVIOUS, { getFirestore, FieldValue }, { initializeApp, getApp } (+19 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (32): homepage, firebase-admin, license, name, packageManager, private, version, autoprefixer (+24 more)

### Community 10 - "@playwright/test"
Cohesion: 0.06
Nodes (21): BOOKED_CONFIRMATION, deriveResultState(), findPlaceholders(), leadFacingFields(), scriptPlaceholders(), { defineConfig, devices }, IMPORTANT: Defaults to localhost (safe for local/CI testing)., @playwright/test (+13 more)

### Community 11 - "utils.js"
Cohesion: 0.06
Nodes (24): Avatar, AvatarFallback, AvatarImage, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup (+16 more)

### Community 12 - "dashboard/page.js"
Cohesion: 0.17
Nodes (5): generateMetadata(), getResult(), ResultPage(), Logo(), @testing-library/react

### Community 13 - "alert-dialog.jsx"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 14 - "schemas.js"
Cohesion: 0.14
Nodes (23): buildOpenApiSpec(), buildOperation(), errorResponse(), ROUTES, SECURITY, agencyInviteSchema, agencyRemoveSchema, agencyWhiteLabelSchema (+15 more)

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
Cohesion: 0.12
Nodes (18): Alert, AlertDescription, AlertTitle, alertVariants, FormControl, FormDescription, FormFieldContext, FormItem (+10 more)

### Community 19 - "health/route.js"
Cohesion: 0.10
Nodes (30): checkFirestore(), checkGemini(), checkStripe(), dynamic, GET(), chat(), chatJSON(), GEMINI_BASE() (+22 more)

### Community 20 - "NotFoundError"
Cohesion: 0.35
Nodes (14): NotFoundError, normalizeChannel(), normalizeStatus(), addProspectMessage(), appendProspectMessage(), createProspect(), deleteProspect(), getOrCreateInboundToken() (+6 more)

### Community 21 - "UnauthorizedError"
Cohesion: 0.14
Nodes (28): BadGatewayError, UnauthorizedError, ValidationError, sendMetaMessage(), verifyMetaInstagramToken(), verifyMetaPageToken(), validate(), removeAgencyMember() (+20 more)

### Community 22 - "toggle-group.jsx"
Cohesion: 0.31
Nodes (7): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants, @radix-ui/react-toggle, @radix-ui/react-toggle-group

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

### Community 27 - "errors.js"
Cohesion: 0.15
Nodes (15): agentDenied(), AppError, ForbiddenError, withErrorHandling(), eraseUserData(), OWNER_FIELD_BY_COLLECTION, UID_KEYED_COLLECTIONS, createAgent() (+7 more)

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
Nodes (27): fetchSession(), metadata, Success(), app_globals, baseUrl, body, display, metadata (+19 more)

### Community 41 - "reminderService.js"
Cohesion: 0.22
Nodes (14): cleanSecret(), decrypt(), deriveKey(), encrypt(), getCurrentKey(), getDecryptKeys(), packAndEncrypt(), unpackAndDecrypt() (+6 more)

### Community 42 - "handleRoute"
Cohesion: 0.16
Nodes (31): handleRoute(), resolveSeats(), dynamic, POST(), syncSubscription(), Blind spots (static analysis limits), Command → use-case map, Health check (2026-10-16) (+23 more)

### Community 43 - "webhookAuth.js"
Cohesion: 0.18
Nodes (12): BLOCKED_SUFFIXES, isPrivateIPv4(), isPrivateIPv6(), isPublicHttpsUrl(), parseMetaSignedRequest(), safeEqual(), verifyMetaSignature(), ref_net (+4 more)

### Community 47 - "agencyService.js"
Cohesion: 0.29
Nodes (7): sendMail(), acceptAgencyInvite(), getAgencyDetails(), inviteAgencyMember(), resolveSeats(), updateWhiteLabel(), mockRetrieve

### Community 49 - "CI Workflow"
Cohesion: 1.00
Nodes (3): CI Workflow, E2E Workflow, Pre-Deploy Verification Workflow

### Community 51 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 53 - "DMForge"
Cohesion: 0.06
Nodes (35): DMForge Project Rules, DMForge Brand Tokens, Commands, DMForge — Project Rules, graphify, Layout, Rules, Stack (+27 more)

### Community 56 - "context-menu.jsx"
Cohesion: 0.18
Nodes (10): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+2 more)

### Community 60 - "email.js"
Cohesion: 0.48
Nodes (6): buildTransport(), resolveCreds(), sendEmail(), sendSystemEmail(), testConnection(), nodemailer

### Community 62 - "auth-context.js"
Cohesion: 0.39
Nodes (6): AuthCtx, auth, db, firebaseConfig, googleProvider, firebase

### Community 68 - "useAuth"
Cohesion: 0.15
Nodes (18): App(), Nav(), Pricing(), checkout(), portal(), AuthModal(), google(), submit() (+10 more)

### Community 70 - "Test Run 1 - Firebase Auth + Firestore E2E Testing"
Cohesion: 0.33
Nodes (6): Critical Issues Requiring Fix, Detailed Findings, Recommendations, Test Artifacts, Test Coverage, Test Run 1 - Firebase Auth + Firestore E2E Testing

### Community 72 - "accordion.jsx"
Cohesion: 0.40
Nodes (4): AccordionContent, AccordionItem, AccordionTrigger, @radix-ui/react-accordion

### Community 73 - "tabs.jsx"
Cohesion: 0.40
Nodes (4): TabsContent, TabsList, TabsTrigger, @radix-ui/react-tabs

### Community 74 - "scroll-area.jsx"
Cohesion: 0.50
Nodes (3): ScrollArea, ScrollBar, @radix-ui/react-scroll-area

### Community 83 - "DMForge E2E — real-browser click tests (Playwright)"
Cohesion: 0.29
Nodes (6): DMForge E2E — real-browser click tests (Playwright), Install (one time, in the DMForge repo root), Note: keep test files out of the deployed bundle, Reuse for future projects, Run, What it covers (tests/e2e/smoke.spec.js)

### Community 134 - "audit-code.js"
Cohesion: 0.21
Nodes (10): ref_fs, ref_path, audit(), EXTENSIONS, fs, IGNORED_DIRS, main(), path (+2 more)

## Knowledge Gaps
- **355 isolated node(s):** `cloudflare-api`, `cloudflare-ai-gateway`, `metadata`, `ALLOWED_ORIGINS`, `EMPTY_CHAT_STATE` (+350 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 474 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `react`, `navigation-menu.jsx`, `sidebar.jsx`, `accordion.jsx`, `tabs.jsx`, `scroll-area.jsx`, `utils.js`, `handleRoute`, `alert-dialog.jsx`, `command.jsx`, `form.jsx`, `toggle-group.jsx`, `chart.jsx`, `carousel.jsx`, `input-otp.jsx`, `context-menu.jsx`, `drawer.jsx`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `authFetch()` connect `authFetch` to `react`, `useAuth`, `Test Run 1 - Firebase Auth + Firestore E2E Testing`, `handleRoute`, `dashboard/page.js`, `auth-context.js`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Health check (2026-10-16)` connect `handleRoute` to `UnauthorizedError`, `authFetch`, `DMForge`, `cn`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `cn()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`cn()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `authFetch()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`authFetch()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `handleRoute()` (e.g. with `Blind spots (static analysis limits)` and `Command → use-case map`) actually correct?**
  _`handleRoute()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cloudflare-api`, `cloudflare-ai-gateway`, `metadata` to the rest of the system?**
  _355 weakly-connected nodes found - possible documentation gaps or missing edges._