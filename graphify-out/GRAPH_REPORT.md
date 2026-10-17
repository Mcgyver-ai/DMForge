# Graph Report - compliance  (2026-10-17)

## Corpus Check
- 208 files · ~99,692 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 15, .example 1, .code-workspace 1)

## Summary
- 1269 nodes · 2814 edges · 76 communities (49 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e493421c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- dependencies
- app/layout.js
- authFetch
- backend_test.py
- sidebar.jsx
- cn
- [[...path]]/route.js
- functions/index.js
- package.json
- @playwright/test
- utils.js
- schemas.js
- alert-dialog.jsx
- menubar.jsx
- command.jsx
- components.json
- biome.json
- form.jsx
- agentService.js
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
- rateLimit.js
- ref_node_module
- devDependencies
- resolutions
- ref_node_path
- compilerOptions
- Project: DMForge — AI DM setter builder + Stripe-enabled SaaS
- ref_node_url
- scripts
- vitest
- reminderService.js
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
- complaints/page.js
- next.config.js
- vercel.json
- email.js
- DMForge Deployment Runbook
- Bug Report Template
- Feature Request Template
- Pull Request Template
- Legal & Regulatory Compliance Notes
- DMForge E2E — real-browser click tests (Playwright)
- DMForge — Security & Compliance Architecture
- CLEAN_CODE_REPORT.md
- engines
- @testing-library/jest-dom
- ref_node_fs
- audit-code.js

## God Nodes (most connected - your core abstractions)
1. `cn()` - 224 edges
2. `authFetch()` - 69 edges
3. `react` - 65 edges
4. `handleRoute()` - 64 edges
5. `UnauthorizedError` - 54 edges
6. `ValidationError` - 45 edges
7. `lucide-react` - 34 edges
8. `logError()` - 30 edges
9. `useAuth()` - 29 edges
10. `next` - 29 edges

## Surprising Connections (you probably didn't know these)
- `4. Cryptographic Storage & Secrets` --references--> `isPublicHttpsUrl()`  [INFERRED]
  SECURITY.md → lib/webhookAuth.js
- `Specification & Background` --references--> `handleRoute()`  [INFERRED]
  project-tasks/inbound-rate-limit-tasklist.md → app/api/[[...path]]/route.js
- `[x] Task 3: Wire `checkInboundRateLimit` into `app/api/[[...path]]/route.js`` --references--> `handleRoute()`  [INFERRED]
  project-tasks/inbound-rate-limit-tasklist.md → app/api/[[...path]]/route.js
- `Use cases by area` --references--> `useAuth()`  [INFERRED]
  docs/GRAPHIFY.md → lib/auth-context.js
- `Command → use-case map` --references--> `authFetch()`  [INFERRED]
  docs/GRAPHIFY.md → lib/auth-context.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Design Governance Stack** — impeccable_design_context, figma_design_system, brand_tokens [EXTRACTED 1.00]

## Communities (76 total, 27 thin omitted)

### Community 0 - "react"
Cohesion: 0.05
Nodes (57): metadata, ProspectCard(), relTime(), STATUS_STYLE, STATUSES, ThreadDrawer(), App(), Nav() (+49 more)

### Community 1 - "dependencies"
Cohesion: 0.03
Nodes (68): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, dayjs, dotenv (+60 more)

### Community 2 - "app/layout.js"
Cohesion: 0.05
Nodes (40): BestPage(), FIXED_PAGES, generateMetadata(), NICHES, parseSlug(), RANKING, fetchSession(), metadata (+32 more)

### Community 3 - "authFetch"
Cohesion: 0.07
Nodes (53): Dashboard(), portal(), FollowUpSequence(), generate(), saveEdit(), InboxPage(), createLead(), loadInboundUrl() (+45 more)

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
Cohesion: 0.13
Nodes (26): ALLOWED_ORIGINS, CHANNEL_LABELS, CHAT_TURN_SCHEMA, DELETE, EMPTY_CHAT_STATE, formatPrice(), GET, handleCORS() (+18 more)

### Community 8 - "functions/index.js"
Cohesion: 0.08
Nodes (27): crypto, decrypt(), { defineSecret }, deriveKey(), ENCRYPTION_KEY, ENCRYPTION_KEY_PREVIOUS, { getFirestore, FieldValue }, { initializeApp, getApp } (+19 more)

### Community 9 - "package.json"
Cohesion: 0.06
Nodes (34): homepage, firebase-admin, license, name, packageManager, private, version, autoprefixer (+26 more)

### Community 10 - "@playwright/test"
Cohesion: 0.06
Nodes (18): BOOKED_CONFIRMATION, deriveResultState(), { defineConfig, devices }, IMPORTANT: Defaults to localhost (safe for local/CI testing)., @playwright/test, { test, expect }, { test, expect }, { test, expect } (+10 more)

### Community 11 - "utils.js"
Cohesion: 0.05
Nodes (27): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup (+19 more)

### Community 12 - "schemas.js"
Cohesion: 0.14
Nodes (23): buildOpenApiSpec(), buildOperation(), errorResponse(), ROUTES, SECURITY, agencyInviteSchema, agencyRemoveSchema, agencyWhiteLabelSchema (+15 more)

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

### Community 19 - "agentService.js"
Cohesion: 0.16
Nodes (20): checkFirestore(), checkGemini(), checkStripe(), dynamic, GET(), agentDenied(), chat(), chatJSON() (+12 more)

### Community 20 - "prospectService.js"
Cohesion: 0.35
Nodes (14): NotFoundError, normalizeChannel(), normalizeStatus(), addProspectMessage(), appendProspectMessage(), createProspect(), deleteProspect(), getOrCreateInboundToken() (+6 more)

### Community 21 - "UnauthorizedError"
Cohesion: 0.14
Nodes (29): BadGatewayError, UnauthorizedError, ValidationError, sendMetaMessage(), verifyMetaInstagramToken(), verifyMetaPageToken(), validate(), connectEmailChannel() (+21 more)

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

### Community 27 - "logError"
Cohesion: 0.23
Nodes (13): AppError, ForbiddenError, log(), logError(), sendMail(), withErrorHandling(), acceptAgencyInvite(), getAgencyDetails() (+5 more)

### Community 28 - "drawer.jsx"
Cohesion: 0.22
Nodes (7): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle, vaul

### Community 29 - "@sentry/nextjs"
Cohesion: 0.29
Nodes (3): onRequestError(), register(), @sentry/nextjs

### Community 30 - "paths"
Cohesion: 0.25
Nodes (7): compilerOptions, baseUrl, paths, exclude, @/app/*, @/components/*, @/lib/*

### Community 31 - "rateLimit.js"
Cohesion: 0.17
Nodes (14): buckets, checkInboundRateLimit(), getLimiter(), hit(), hitMemory(), limiters, Inbound Webhook & Inbound Token Rate Limiting Task List, Specification & Background (+6 more)

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

### Community 40 - "vitest"
Cohesion: 0.33
Nodes (4): eraseUserData(), OWNER_FIELD_BY_COLLECTION, UID_KEYED_COLLECTIONS, vitest

### Community 41 - "reminderService.js"
Cohesion: 0.21
Nodes (15): cleanSecret(), decrypt(), deriveKey(), encrypt(), getCurrentKey(), getDecryptKeys(), packAndEncrypt(), unpackAndDecrypt() (+7 more)

### Community 42 - "handleRoute"
Cohesion: 0.14
Nodes (32): handleRoute(), resolveSeats(), sanitizeReply(), ser(), truncate(), dynamic, POST(), syncSubscription() (+24 more)

### Community 43 - "webhookAuth.js"
Cohesion: 0.27
Nodes (9): BLOCKED_SUFFIXES, GHL_WEBHOOK_PUBLIC_KEY, isPrivateIPv4(), isPrivateIPv6(), isPublicHttpsUrl(), parseMetaSignedRequest(), safeEqual(), verifyMetaSignature() (+1 more)

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

### Community 60 - "email.js"
Cohesion: 0.48
Nodes (6): buildTransport(), resolveCreds(), sendEmail(), sendSystemEmail(), testConnection(), nodemailer

### Community 83 - "DMForge E2E — real-browser click tests (Playwright)"
Cohesion: 0.29
Nodes (6): DMForge E2E — real-browser click tests (Playwright), Install (one time, in the DMForge repo root), Note: keep test files out of the deployed bundle, Reuse for future projects, Run, What it covers (tests/e2e/smoke.spec.js)

### Community 89 - "DMForge — Security & Compliance Architecture"
Cohesion: 0.40
Nodes (4): 1. Vulnerability Reporting, 3. PCI-DSS SAQ A Scope, 4. Cryptographic Storage & Secrets, DMForge — Security & Compliance Architecture

### Community 134 - "audit-code.js"
Cohesion: 0.21
Nodes (10): ref_fs, ref_path, audit(), EXTENSIONS, fs, IGNORED_DIRS, main(), path (+2 more)

## Knowledge Gaps
- **354 isolated node(s):** `cloudflare-api`, `cloudflare-ai-gateway`, `metadata`, `ALLOWED_ORIGINS`, `EMPTY_CHAT_STATE` (+349 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 469 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `react`, `sidebar.jsx`, `handleRoute`, `utils.js`, `alert-dialog.jsx`, `menubar.jsx`, `breadcrumb.jsx`, `command.jsx`, `form.jsx`, `toggle-group.jsx`, `chart.jsx`, `carousel.jsx`, `input-otp.jsx`, `navigation-menu.jsx`, `drawer.jsx`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **Why does `next` connect `react` to `app/layout.js`, `[[...path]]/route.js`, `package.json`, `handleRoute`, `agentService.js`, `logError`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `authFetch()` connect `authFetch` to `react`, `handleRoute`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `cn()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`cn()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `authFetch()` (e.g. with `Command → use-case map` and `Health check (2026-10-16)`) actually correct?**
  _`authFetch()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `handleRoute()` (e.g. with `Blind spots (static analysis limits)` and `Command → use-case map`) actually correct?**
  _`handleRoute()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `cloudflare-api`, `cloudflare-ai-gateway`, `metadata` to the rest of the system?**
  _354 weakly-connected nodes found - possible documentation gaps or missing edges._