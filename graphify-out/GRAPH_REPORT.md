# Graph Report - DMForge  (2026-07-08)

## Corpus Check
- 142 files · ~65,916 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 736 nodes · 735 edges · 122 communities (75 shown, 47 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16ed4ba2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NPM Dependencies
- Legacy Python Backend Tests
- Subagent & Skill Specs
- Calendar & Carousel UI
- Package Scripts
- Sidebar Component
- shadcn Config
- Menubar Component
- API Route & Prospects
- Firebase Admin & Stripe Init
- Landing Page
- Toast Hook
- Command Palette UI
- Context Menu UI
- Dropdown Menu UI
- Alert Dialog UI
- Table Component
- Path Aliases Config
- Best-Of Landing Pages
- Root Layout & Providers
- Breadcrumb Component
- Drawer Component
- Navigation Menu UI
- Pagination Component
- Select Component
- Sheet Component
- Toast Component
- Encryption Key Rotation
- Card Component
- Dialog Component
- Test ID Constants
- Gemini LLM Client
- Inbox Page
- Error Boundary
- Input OTP Component
- Blog Data Helpers
- Firebase Client Config
- GoHighLevel Integration
- LinkedIn OAuth
- Rate Limiting
- Blog Index Page
- Alert Component
- Auth Context
- Email Sending (SMTP)
- Billing Success Page
- Shared Result Page
- Sitemap Generation
- Accordion Component
- Avatar Component
- Tabs Component
- Toggle Group Component
- Firestore Bootstrap Script
- SMS Sending (Twilio)
- Support Chat Widget
- Badge Component
- Button Component
- Label Component
- Radio Group Component
- Scroll Area Component
- Sonner Toaster
- Toggle Component
- Competitor Data
- Webhook Dispatch
- MCP Server Config
- Checkbox Component
- Hover Card Component
- Input Component
- Popover Component
- Progress Component
- Separator Component
- Slider Component
- Switch Component
- Textarea Component
- Tooltip Component
- Next.js Config
- Playwright Config
- Smoke Test Script
- Agency Seat E2E Test
- Email Channel E2E Test
- Follow-Up Sequence E2E Test
- GHL E2E Test
- LinkedIn E2E Test
- Rate Limit E2E Test
- Smoke E2E Test
- SMS Reminders E2E Test
- Webhooks E2E Test
- White-Label E2E Test
- Vercel Cron Config
- API Route DELETE Handler
- API Route GET Handler
- API Route PATCH Handler
- API Route POST Handler
- API Route PUT Handler
- chart.jsx
- Design Context
- DMForge — brand tokens (verified from app/globals.css)
- DMForge — Design Decisions
- DMForge — Project Rules
- prod-verify recipes (Antigravity mirror)

## God Nodes (most connected - your core abstractions)
1. `print_test()` - 19 edges
2. `main()` - 19 edges
3. `DMForge Ship-Faster Agent Workflow` - 11 edges
4. `react` - 8 edges
5. `resolutions` - 8 edges
6. `DMForge — Project Rules` - 7 edges
7. `scripts` - 7 edges
8. `DMForge — Project Rules` - 6 edges
9. `DMForge — Design Decisions` - 6 edges
10. `Design Context` - 6 edges

## Surprising Connections (you probably didn't know these)
- `TASKS.md backlog and session log` --semantically_similar_to--> `api-security subagent spec`  [INFERRED] [semantically similar]
  TASKS.md → .claude/agents/api-security.md
- `prod-verify recipes (canonical)` --semantically_similar_to--> `E2E-SETUP.md Playwright guide`  [INFERRED] [semantically similar]
  .claude/skills/prod-verify/references/recipes.md → E2E-SETUP.md
- `emergent.yml env image config` --semantically_similar_to--> `test_result.md testing protocol and log`  [INFERRED] [semantically similar]
  .emergent/emergent.yml → test_result.md
- `useCarousel()` --references--> `react`  [EXTRACTED]
  components/ui/carousel.jsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  components/ui/chart.jsx → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **DMForge six area-scoped subagents defined by the workflow doc** — claude_dmforge_agent_workflow, claude_agents_api_security, claude_agents_billing_stripe, claude_agents_channels_integrations, claude_agents_lead_enricher, claude_agents_leads_model, claude_agents_verifier [EXTRACTED 1.00]
- **leads/prospects model as keystone dependency for channels-integrations auto-triggers and lead-enricher** — claude_agents_leads_model, claude_agents_leads_model_leadsprospectsmodel, claude_agents_channels_integrations, claude_agents_lead_enricher, tasks [INFERRED 0.85]

## Communities (122 total, 47 thin omitted)

### Community 0 - "NPM Dependencies"
Cohesion: 0.03
Nodes (58): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, dayjs, dotenv (+50 more)

### Community 1 - "Legacy Python Backend Tests"
Cohesion: 0.10
Nodes (37): main(), print_test(), Test POST /api/agent/chat - empty messages returns intro, Test POST /api/agent/chat - multi-turn conversation, Test POST /api/agent/chat - invalid agentId returns 404, Test POST /api/result/save, Test GET /api/ - health check, Test GET /api/result/:id (+29 more)

### Community 2 - "Subagent & Skill Specs"
Cohesion: 0.11
Nodes (26): api-security subagent spec, Catch-all API route (app/api/[[...path]]/route.js), Firestore composite indexes requirement, billing-stripe subagent spec, current_period_end field-location bug, channels-integrations subagent spec, Encryption key rotation (ENCRYPTION_KEY, v1: prefix, ENCRYPTION_KEY_PREVIOUS), lead-enricher subagent spec (+18 more)

### Community 3 - "Calendar & Carousel UI"
Cohesion: 0.06
Nodes (26): Calendar(), CalendarDayButton(), Carousel, CarouselContent, CarouselContext, CarouselItem, CarouselNext, CarouselPrevious (+18 more)

### Community 4 - "Package Scripts"
Cohesion: 0.07
Nodes (26): devDependencies, autoprefixer, cross-env, globals, @playwright/test, postcss, tailwindcss, name (+18 more)

### Community 5 - "Sidebar Component"
Cohesion: 0.08
Nodes (25): Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel (+17 more)

### Community 6 - "shadcn Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 7 - "Menubar Component"
Cohesion: 0.12
Nodes (10): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarSubContent (+2 more)

### Community 8 - "API Route & Prospects"
Cohesion: 0.24
Nodes (10): ALLOWED_ORIGINS, handleCORS(), handleRoute(), OPTIONS(), ser(), truncate(), normalizeChannel(), normalizeStatus() (+2 more)

### Community 9 - "Firebase Admin & Stripe Init"
Cohesion: 0.32
Nodes (11): ensureInit(), getAdminAuth(), getAdminDb(), getAdminFieldValue(), loadServiceAccount(), verifyRequest(), ensurePrice(), getOrCreateCustomer() (+3 more)

### Community 11 - "Toast Hook"
Cohesion: 0.31
Nodes (10): actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState, reducer(), toast() (+2 more)

### Community 12 - "Command Palette UI"
Cohesion: 0.20
Nodes (7): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator

### Community 13 - "Context Menu UI"
Cohesion: 0.20
Nodes (8): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSubContent, ContextMenuSubTrigger

### Community 14 - "Dropdown Menu UI"
Cohesion: 0.20
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSubContent, DropdownMenuSubTrigger

### Community 15 - "Alert Dialog UI"
Cohesion: 0.22
Nodes (6): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogOverlay, AlertDialogTitle

### Community 16 - "Table Component"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 17 - "Path Aliases Config"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, paths, exclude, @/*, @/app/*, @/components/*, @/lib/*

### Community 18 - "Best-Of Landing Pages"
Cohesion: 0.32
Nodes (6): BestPage(), FIXED_PAGES, generateMetadata(), NICHES, parseSlug(), RANKING

### Community 19 - "Root Layout & Providers"
Cohesion: 0.33
Nodes (4): baseUrl, body, display, metadata

### Community 20 - "Breadcrumb Component"
Cohesion: 0.25
Nodes (5): Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage

### Community 21 - "Drawer Component"
Cohesion: 0.25
Nodes (4): DrawerContent, DrawerDescription, DrawerOverlay, DrawerTitle

### Community 22 - "Navigation Menu UI"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 24 - "Select Component"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 25 - "Sheet Component"
Cohesion: 0.25
Nodes (5): SheetContent, SheetDescription, SheetOverlay, SheetTitle, sheetVariants

### Community 26 - "Toast Component"
Cohesion: 0.25
Nodes (7): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport

### Community 27 - "Encryption Key Rotation"
Cohesion: 0.50
Nodes (7): decrypt(), deriveKey(), encrypt(), getCurrentKey(), getPreviousKey(), packAndEncrypt(), unpackAndDecrypt()

### Community 28 - "Card Component"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 29 - "Dialog Component"
Cohesion: 0.29
Nodes (4): DialogContent, DialogDescription, DialogOverlay, DialogTitle

### Community 30 - "Test ID Constants"
Cohesion: 0.29
Nodes (4): LOGIN, LOGOUT, REGISTER, HOME

### Community 31 - "Gemini LLM Client"
Cohesion: 0.52
Nodes (6): chat(), chatJSON(), GEMINI_BASE(), GEMINI_URL(), repairLLMJson(), toGemini()

### Community 32 - "Inbox Page"
Cohesion: 0.40
Nodes (4): InboxPage(), relTime(), STATUS_STYLE, STATUSES

### Community 34 - "Input OTP Component"
Cohesion: 0.33
Nodes (5): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, input-otp

### Community 35 - "Blog Data Helpers"
Cohesion: 0.33
Nodes (3): AUTHOR, categories, posts

### Community 36 - "Firebase Client Config"
Cohesion: 0.33
Nodes (5): auth, db, firebaseConfig, googleProvider, firebase

### Community 37 - "GoHighLevel Integration"
Cohesion: 0.60
Nodes (5): ghlCreateAppointment(), ghlCreateContact(), ghlGetContact(), ghlValidate(), headers()

### Community 39 - "Rate Limiting"
Cohesion: 0.60
Nodes (5): buckets, checkLlmRateLimit(), checkRateLimit(), clientIp(), hit()

### Community 40 - "Blog Index Page"
Cohesion: 0.40
Nodes (3): CLUSTER, metadata, PILLAR

### Community 41 - "Alert Component"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 43 - "Email Sending (SMTP)"
Cohesion: 0.70
Nodes (4): buildTransport(), resolveCreds(), sendEmail(), testConnection()

### Community 44 - "Billing Success Page"
Cohesion: 0.67
Nodes (3): fetchSession(), metadata, Success()

### Community 47 - "Shared Result Page"
Cohesion: 0.83
Nodes (3): generateMetadata(), getResult(), ResultPage()

### Community 51 - "Accordion Component"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 52 - "Avatar Component"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 53 - "Tabs Component"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 54 - "Toggle Group Component"
Cohesion: 0.50
Nodes (3): ToggleGroup, ToggleGroupContext, ToggleGroupItem

### Community 55 - "Firestore Bootstrap Script"
Cohesion: 0.67
Nodes (3): fs, { GoogleAuth }, main()

### Community 56 - "SMS Sending (Twilio)"
Cohesion: 0.83
Nodes (3): basicAuth(), sendSMS(), testTwilio()

### Community 115 - "chart.jsx"
Cohesion: 0.29
Nodes (6): Commands, DMForge — Project Rules, graphify, Layout, Rules, Stack

### Community 116 - "Design Context"
Cohesion: 0.25
Nodes (7): Aesthetic Direction, Brand Personality, Design Context, Design Principles, DMForge — Impeccable Design Context, Technical Notes, Users

### Community 119 - "DMForge — brand tokens (verified from app/globals.css)"
Cohesion: 0.33
Nodes (5): Colors, DMForge — brand tokens (verified from app/globals.css), Logo files, Token bug — FIXED (2026-07-07), Type

### Community 122 - "DMForge — Design Decisions"
Cohesion: 0.29
Nodes (6): DMForge — Design Decisions, 关键决策 (Key Decisions), 变更历史 (Change History), 已知限制 (Known Limitations), 方案选择 (Alternatives Considered), 设计目标 (Design Goals)

### Community 123 - "DMForge — Project Rules"
Cohesion: 0.22
Nodes (8): Commands, Credentials Vault, DMForge — Project Rules, Layout, Rules, Shared Skills, Stack, This is NOT the Next.js you know

## Knowledge Gaps
- **369 isolated node(s):** `Stack`, `Commands`, `Layout`, `Rules`, `graphify` (+364 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `NPM Dependencies` to `Sonner Toaster`, `Input OTP Component`, `Calendar & Carousel UI`, `Package Scripts`, `Firebase Client Config`, `Firebase Admin & Stripe Init`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `react` connect `Calendar & Carousel UI` to `NPM Dependencies`, `Toast Hook`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `useSidebar()` connect `Calendar & Carousel UI` to `Sidebar Component`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `Stack`, `Commands`, `Layout` to the rest of the system?**
  _388 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `NPM Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Legacy Python Backend Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.10384068278805121 - nodes in this community are weakly interconnected._
- **Should `Subagent & Skill Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._