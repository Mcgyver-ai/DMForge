# Graph Report - friendly-easley-93ee36  (2026-10-16)

## Corpus Check
- 200 files · ~94,799 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 15, .example 1, .code-workspace 1)

## Summary
- 1228 nodes · 2686 edges · 75 communities (45 shown, 30 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2a720a67`
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
- app/layout.js
- context-menu.jsx
- UnauthorizedError
- toggle-group.jsx
- chart.jsx
- carousel.jsx
- input-otp.jsx
- navigation-menu.jsx
- tabs.jsx
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
- analytics.js
- billingService.js
- contact/page.js
- privacy/page.js
- terms/page.js
- sonner.jsx
- CI Workflow
- .mcp.json
- repository
- DMForge Apple Icon (PNG)
- DMForge
- @radix-ui/react-aspect-ratio
- @radix-ui/react-collapsible
- next.config.js
- vercel.json
- DMForge Deployment Runbook
- Bug Report Template
- Feature Request Template
- Pull Request Template
- Legal & Regulatory Compliance Notes
- app/page.js
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
1. `cn()` - 221 edges
2. `authFetch()` - 66 edges
3. `react` - 64 edges
4. `UnauthorizedError` - 53 edges
5. `handleRoute()` - 52 edges
6. `ValidationError` - 41 edges
7. `lucide-react` - 34 edges
8. `useAuth()` - 28 edges
9. `logError()` - 28 edges
10. `next` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Recommendations` --references--> `authFetch()`  [INFERRED]
  test_result.md → lib/auth-context.js
- `Test Coverage` --references--> `authFetch()`  [INFERRED]
  test_result.md → lib/auth-context.js
- `portal()` --calls--> `authFetch()`  [EXTRACTED]
  app/page.js → lib/auth-context.js
- `sitemap()` --calls--> `getBaseUrl()`  [EXTRACTED]
  app/sitemap.js → lib/baseUrl.js
- `saveAndShare()` --calls--> `authFetch()`  [EXTRACTED]
  components/home/chat-simulator.jsx → lib/auth-context.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design Governance Stack** — impeccable_design_context, figma_design_system, brand_tokens [EXTRACTED 1.00]

## Communities (75 total, 30 thin omitted)

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
Nodes (47): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Breadcrumb, BreadcrumbEllipsis() (+39 more)

### Community 7 - "[[...path]]/route.js"
Cohesion: 0.05
Nodes (83): agentDenied(), ALLOWED_ORIGINS, CHANNEL_LABELS, CHAT_TURN_SCHEMA, DELETE, EMPTY_CHAT_STATE, formatPrice(), GET (+75 more)

### Community 8 - "functions/index.js"
Cohesion: 0.08
Nodes (27): crypto, decrypt(), { defineSecret }, deriveKey(), ENCRYPTION_KEY, ENCRYPTION_KEY_PREVIOUS, { getFirestore, FieldValue }, { initializeApp, getApp } (+19 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (34): homepage, firebase-admin, license, name, packageManager, private, version, autoprefixer (+26 more)

### Community 10 - "@playwright/test"
Cohesion: 0.07
Nodes (15): { defineConfig, devices }, IMPORTANT: Defaults to localhost (safe for local/CI testing)., @playwright/test, { test, expect }, { test, expect }, { test, expect }, { test, expect }, { test, expect } (+7 more)

### Community 11 - "utils.js"
Cohesion: 0.06
Nodes (23): Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem, ResizableHandle(), ResizablePanelGroup() (+15 more)

### Community 12 - "auth-context.js"
Cohesion: 0.16
Nodes (7): Logo(), AuthCtx, auth, db, firebaseConfig, googleProvider, firebase

### Community 13 - "alert-dialog.jsx"
Cohesion: 0.11
Nodes (19): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+11 more)

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
Cohesion: 0.12
Nodes (18): Alert, AlertDescription, AlertTitle, alertVariants, FormControl, FormDescription, FormFieldContext, FormItem (+10 more)

### Community 19 - "app/layout.js"
Cohesion: 0.14
Nodes (10): app_globals, baseUrl, body, display, metadata, Providers(), Footer(), SupportChat() (+2 more)

### Community 20 - "context-menu.jsx"
Cohesion: 0.18
Nodes (10): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+2 more)

### Community 21 - "UnauthorizedError"
Cohesion: 0.06
Nodes (78): resolveSeats(), fetchSession(), metadata, Success(), robots(), getBaseUrl(), AppError, BadGatewayError (+70 more)

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

### Community 27 - "tabs.jsx"
Cohesion: 0.40
Nodes (4): TabsContent, TabsList, TabsTrigger, @radix-ui/react-tabs

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
Cohesion: 0.10
Nodes (19): API endpoints (all working), Backend sub-agent log, Critical Issues Requiring Fix, Detailed Findings, Frontend sub-agent log, Key Findings, Notes, Pages (+11 more)

### Community 39 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, audit, build, dev, dev:emulated, emulators, start, test (+6 more)

### Community 40 - "analytics.js"
Cohesion: 0.20
Nodes (10): AnalyticsProvider(), CookieConsent(), choose(), ErrorBoundary, getConsent(), identify(), initAnalytics(), isEnabled() (+2 more)

### Community 42 - "billingService.js"
Cohesion: 0.10
Nodes (35): checkFirestore(), checkGemini(), checkStripe(), dynamic, GET(), dynamic, POST(), generateMetadata() (+27 more)

### Community 49 - "CI Workflow"
Cohesion: 1.00
Nodes (3): CI Workflow, E2E Workflow, Pre-Deploy Verification Workflow

### Community 51 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 53 - "DMForge"
Cohesion: 0.07
Nodes (28): DMForge Project Rules, DMForge Brand Tokens, Commands, DMForge — Project Rules, graphify, Layout, Rules, Stack (+20 more)

### Community 68 - "app/page.js"
Cohesion: 0.12
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
- **345 isolated node(s):** `cloudflare-api`, `cloudflare-ai-gateway`, `metadata`, `ALLOWED_ORIGINS`, `EMPTY_CHAT_STATE` (+340 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 455 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `react` to `best/[slug]/page.js`, `app/page.js`, `[[...path]]/route.js`, `about/page.js`, `package.json`, `billingService.js`, `auth-context.js`, `app/layout.js`, `UnauthorizedError`, `proxy.js`, `settings/layout.js`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `react`, `sidebar.jsx`, `utils.js`, `alert-dialog.jsx`, `menubar.jsx`, `command.jsx`, `form.jsx`, `context-menu.jsx`, `UnauthorizedError`, `toggle-group.jsx`, `chart.jsx`, `carousel.jsx`, `input-otp.jsx`, `navigation-menu.jsx`, `tabs.jsx`, `drawer.jsx`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `sidebar.jsx`, `cn`, `package.json`, `utils.js`, `auth-context.js`, `alert-dialog.jsx`, `menubar.jsx`, `command.jsx`, `form.jsx`, `context-menu.jsx`, `toggle-group.jsx`, `chart.jsx`, `carousel.jsx`, `input-otp.jsx`, `navigation-menu.jsx`, `tabs.jsx`, `drawer.jsx`, `@sentry/nextjs`, `analytics.js`, `app/page.js`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `authFetch()` (e.g. with `Recommendations` and `Test Coverage`) actually correct?**
  _`authFetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cloudflare-api`, `cloudflare-ai-gateway`, `metadata` to the rest of the system?**
  _345 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.029411764705882353 - nodes in this community are weakly interconnected._
- **Should `best/[slug]/page.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09206349206349207 - nodes in this community are weakly interconnected._