# Graph Report - friendly-easley-93ee36  (2026-10-16)

## Corpus Check
- 201 files · ~96,028 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 15, .example 1, .code-workspace 1)

## Summary
- 1236 nodes · 2735 edges · 81 communities (51 shown, 30 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `26c6f70f`
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
- auth-context.js
- alert-dialog.jsx
- menubar.jsx
- command.jsx
- components.json
- biome.json
- form.jsx
- health/route.js
- prospectService.js
- UnauthorizedError
- toggle-group.jsx
- chart.jsx
- carousel.jsx
- input-otp.jsx
- navigation-menu.jsx
- prospects.js
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
- encryption.js
- Use cases by area
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
- graphify in DMForge
- next.config.js
- vercel.json
- email.js
- DMForge Deployment Runbook
- [id]/page.js
- Bug Report Template
- Feature Request Template
- Pull Request Template
- Legal & Regulatory Compliance Notes
- useAuth
- about/page.js
- DMForge E2E — real-browser click tests (Playwright)
- Security Policy
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
3. `react` - 64 edges
4. `handleRoute()` - 56 edges
5. `UnauthorizedError` - 54 edges
6. `ValidationError` - 42 edges
7. `lucide-react` - 34 edges
8. `logError()` - 30 edges
9. `useAuth()` - 29 edges
10. `next` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Recommendations` --references--> `authFetch()`  [INFERRED]
  test_result.md → lib/auth-context.js
- `Test Coverage` --references--> `authFetch()`  [INFERRED]
  test_result.md → lib/auth-context.js
- `Health check (2026-10-16)` --references--> `UnauthorizedError`  [INFERRED]
  docs/GRAPHIFY.md → lib/errors.js
- `Health check (2026-10-16)` --references--> `ValidationError`  [INFERRED]
  docs/GRAPHIFY.md → lib/errors.js
- `Use cases by area` --references--> `checkLlmRateLimit()`  [INFERRED]
  docs/GRAPHIFY.md → lib/rateLimit.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design Governance Stack** — impeccable_design_context, figma_design_system, brand_tokens [EXTRACTED 1.00]

## Communities (81 total, 30 thin omitted)

### Community 0 - "react"
Cohesion: 0.22
Nodes (15): ProspectCard(), relTime(), STATUS_STYLE, STATUSES, ThreadDrawer(), GREETING, Badge(), badgeVariants (+7 more)

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
Nodes (50): Avatar, AvatarFallback, AvatarImage, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (+42 more)

### Community 7 - "[[...path]]/route.js"
Cohesion: 0.10
Nodes (28): agentDenied(), ALLOWED_ORIGINS, CHANNEL_LABELS, CHAT_TURN_SCHEMA, DELETE, EMPTY_CHAT_STATE, formatPrice(), GET (+20 more)

### Community 8 - "functions/index.js"
Cohesion: 0.08
Nodes (27): crypto, decrypt(), { defineSecret }, deriveKey(), ENCRYPTION_KEY, ENCRYPTION_KEY_PREVIOUS, { getFirestore, FieldValue }, { initializeApp, getApp } (+19 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (31): homepage, firebase-admin, license, name, packageManager, private, version, autoprefixer (+23 more)

### Community 10 - "@playwright/test"
Cohesion: 0.07
Nodes (18): findPlaceholders(), leadFacingFields(), scriptPlaceholders(), { defineConfig, devices }, IMPORTANT: Defaults to localhost (safe for local/CI testing)., @playwright/test, { test, expect }, { test, expect } (+10 more)

### Community 11 - "utils.js"
Cohesion: 0.05
Nodes (27): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup (+19 more)

### Community 12 - "auth-context.js"
Cohesion: 0.16
Nodes (7): Logo(), AuthCtx, auth, db, firebaseConfig, googleProvider, firebase

### Community 13 - "alert-dialog.jsx"
Cohesion: 0.11
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 14 - "menubar.jsx"
Cohesion: 0.11
Nodes (12): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+4 more)

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

### Community 19 - "health/route.js"
Cohesion: 0.13
Nodes (23): checkFirestore(), checkGemini(), checkStripe(), dynamic, GET(), chat(), chatJSON(), GEMINI_BASE() (+15 more)

### Community 20 - "prospectService.js"
Cohesion: 0.35
Nodes (14): NotFoundError, normalizeChannel(), normalizeStatus(), addProspectMessage(), appendProspectMessage(), createProspect(), deleteProspect(), getOrCreateInboundToken() (+6 more)

### Community 21 - "UnauthorizedError"
Cohesion: 0.07
Nodes (73): AppError, BadGatewayError, ForbiddenError, UnauthorizedError, ValidationError, log(), logError(), sendMetaMessage() (+65 more)

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
Cohesion: 0.15
Nodes (13): Alert, AlertDescription, AlertTitle, alertVariants, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList (+5 more)

### Community 27 - "prospects.js"
Cohesion: 0.32
Nodes (10): ghlCreateAppointment(), ghlCreateContact(), ghlGetContact(), ghlValidate(), headers(), onProspectBooked(), PROSPECT_CHANNELS, PROSPECT_STATUSES (+2 more)

### Community 28 - "drawer.jsx"
Cohesion: 0.22
Nodes (7): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle, vaul

### Community 29 - "@sentry/nextjs"
Cohesion: 0.33
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
Cohesion: 0.10
Nodes (19): API endpoints (all working), Backend sub-agent log, Critical Issues Requiring Fix, Detailed Findings, Frontend sub-agent log, Key Findings, Notes, Pages (+11 more)

### Community 39 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, audit, build, dev, dev:emulated, emulators, start, test (+6 more)

### Community 40 - "app/layout.js"
Cohesion: 0.07
Nodes (28): fetchSession(), metadata, Success(), app_globals, baseUrl, body, display, metadata (+20 more)

### Community 41 - "encryption.js"
Cohesion: 0.36
Nodes (8): cleanSecret(), decrypt(), deriveKey(), encrypt(), getCurrentKey(), getDecryptKeys(), packAndEncrypt(), unpackAndDecrypt()

### Community 42 - "Use cases by area"
Cohesion: 0.22
Nodes (21): dynamic, POST(), syncSubscription(), Command → use-case map, Health check (2026-10-16), Use cases by area, ensureInit(), getAdminAuth() (+13 more)

### Community 43 - "webhookAuth.js"
Cohesion: 0.36
Nodes (7): BLOCKED_SUFFIXES, isPrivateIPv4(), isPrivateIPv6(), isPublicHttpsUrl(), safeEqual(), verifyMetaSignature(), ref_net

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
Cohesion: 0.07
Nodes (28): DMForge Project Rules, DMForge Brand Tokens, Commands, DMForge — Project Rules, graphify, Layout, Rules, Stack (+20 more)

### Community 56 - "graphify in DMForge"
Cohesion: 0.29
Nodes (6): graphify in DMForge, How it stays fresh, Integrations available (not yet used here), Recommendations, What is excluded (`.graphifyignore`), What it is

### Community 60 - "email.js"
Cohesion: 0.48
Nodes (6): buildTransport(), resolveCreds(), sendEmail(), sendSystemEmail(), testConnection(), nodemailer

### Community 62 - "[id]/page.js"
Cohesion: 0.83
Nodes (3): generateMetadata(), getResult(), ResultPage()

### Community 68 - "useAuth"
Cohesion: 0.13
Nodes (20): App(), Nav(), Pricing(), checkout(), portal(), AuthModal(), google(), submit() (+12 more)

### Community 83 - "DMForge E2E — real-browser click tests (Playwright)"
Cohesion: 0.29
Nodes (6): DMForge E2E — real-browser click tests (Playwright), Install (one time, in the DMForge repo root), Note: keep test files out of the deployed bundle, Reuse for future projects, Run, What it covers (tests/e2e/smoke.spec.js)

### Community 89 - "Security Policy"
Cohesion: 0.50
Nodes (3): Reporting a Vulnerability, Scope, Security Policy

### Community 134 - "audit-code.js"
Cohesion: 0.21
Nodes (10): ref_fs, ref_path, audit(), EXTENSIONS, fs, IGNORED_DIRS, main(), path (+2 more)

## Knowledge Gaps
- **349 isolated node(s):** `Tech Stack`, `Prerequisites`, `Setup`, `Local dev against the Firebase emulators (safe for webhook tests)`, `Running Tests` (+344 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 455 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `react`, `useAuth`, `sidebar.jsx`, `Use cases by area`, `utils.js`, `alert-dialog.jsx`, `menubar.jsx`, `breadcrumb.jsx`, `command.jsx`, `form.jsx`, `toggle-group.jsx`, `chart.jsx`, `carousel.jsx`, `input-otp.jsx`, `navigation-menu.jsx`, `drawer.jsx`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `next` connect `react` to `best/[slug]/page.js`, `useAuth`, `[[...path]]/route.js`, `about/page.js`, `app/layout.js`, `Use cases by area`, `package.json`, `auth-context.js`, `health/route.js`, `UnauthorizedError`, `proxy.js`, `[id]/page.js`, `settings/layout.js`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `cn()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`cn()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `authFetch()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`authFetch()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `handleRoute()` (e.g. with `Blind spots (static analysis limits)` and `Command → use-case map`) actually correct?**
  _`handleRoute()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tech Stack`, `Prerequisites`, `Setup` to the rest of the system?**
  _349 weakly-connected nodes found - possible documentation gaps or missing edges._