#!/usr/bin/env node
// Agent driver for a locally running DMForge (`yarn --ignore-engines dev --port 3100`).
// Run from the repo root:  node .claude/skills/run-dmforge/driver.mjs <command> [args]
//
//   wait                      poll BASE until "/" answers 200 (first compile can take ~5 min)
//   api                       probe read-only API endpoints, assert status codes
//   pages [path ...]          screenshot pages (default set below); paths WITHOUT a leading slash
//   wizard [--live]           drive the homepage wizard; --live clicks Build (writes prod Firestore!)
//   cleanup <agentId>         delete agents/<agentId> created by `wizard --live`
//
// Env: BASE (default http://localhost:3100 — NOT 127.0.0.1: next dev 403s /_next chunks for that origin), OUT (default test-results/run-dmforge)
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const BASE = (process.env.BASE || 'http://localhost:3100').replace(/\/$/, '')
const OUT = process.env.OUT || 'test-results/run-dmforge'
const DEFAULT_PAGES = ['', 'blog', 'about', 'contact', 'legal/privacy', 'dashboard', 'settings']

// [path, expected status] — none of these write data or bill Gemini.
const API_PROBES = [
  ['/api/health', 200],
  ['/api/plans', 200],
  ['/api/competitors', 200],
  ['/api/openapi.json', 200],
  ['/api/me', 200],          // {"user":null} when anonymous
  ['/api/my/agents', 401],   // auth guard must hold
]

function normalizePagePath(arg) {
  // Git Bash rewrites a bare "/blog" argument into "C:/Program Files/Git/blog" (MSYS path conversion).
  if (/^[A-Za-z]:[\\/]/.test(arg)) {
    throw new Error(`"${arg}" looks MSYS-mangled — pass page paths without a leading slash (e.g. "blog").`)
  }
  return '/' + arg.replace(/^\/+/, '')
}

async function waitForServer(timeoutMs = 600_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE + '/', { signal: AbortSignal.timeout(300_000) })
      if (res.ok) return console.log(`ready: ${BASE} -> ${res.status}`)
    } catch (err) {
      if (err.cause?.code !== 'ECONNREFUSED' && err.name !== 'TimeoutError') throw err
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error(`server at ${BASE} not ready after ${timeoutMs / 1000}s`)
}

async function probeApi() {
  let failures = 0
  for (const [route, expected] of API_PROBES) {
    const started = Date.now()
    const res = await fetch(BASE + route, { signal: AbortSignal.timeout(300_000) })
    const body = (await res.text()).slice(0, 120).replace(/\s+/g, ' ')
    const ok = res.status === expected
    if (!ok) failures++
    console.log(`${ok ? 'PASS' : 'FAIL'} ${route} ${res.status} (want ${expected}) ${Date.now() - started}ms  ${body}`)
  }
  if (failures) throw new Error(`${failures} API probe(s) failed`)
}

async function withPage(fn) {
  const { chromium } = require('@playwright/test')
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  const blockedChunks = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
  page.on('response', (r) => { if (r.status() >= 400 && r.url().includes('/_next/')) blockedChunks.push(r.url()) })
  try {
    await fn(page)
  } finally {
    for (const e of new Set(errors)) console.log('  ' + e.slice(0, 200))
    await browser.close()
  }
  // SSR still renders, so screenshots look fine — but without these chunks React never hydrates.
  if (blockedChunks.length) {
    throw new Error(`${blockedChunks.length} /_next/ asset(s) failed (e.g. ${blockedChunks[0]}) — page is NOT hydrated. Use BASE=http://localhost:3100.`)
  }
}

function shotPath(name) {
  return path.join(OUT, `${name || 'home'}.png`.replace(/[\\/]/g, '_'))
}

async function screenshotPages(args) {
  const routes = (args.length ? args : DEFAULT_PAGES).map(normalizePagePath)
  await withPage(async (page) => {
    for (const route of routes) {
      const res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 300_000 })
      const file = shotPath(route.slice(1))
      await page.screenshot({ path: file, fullPage: false })
      console.log(`${res?.status()} ${route} -> ${file}  title="${await page.title()}"`)
    }
  })
}

async function driveWizard(live) {
  await withPage(async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 300_000 })
    await page.getByText(/what's your niche/i).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: /fitness/i }).first().click()
    await page.getByPlaceholder(/your name/i).fill('RunSkillBot')
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByPlaceholder(/ideal client/i).waitFor()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    // Two "Build my AI setter" buttons exist; the wizard's is the sibling of "Back".
    const build = page.getByRole('button', { name: 'Back' }).locator('..')
      .getByRole('button', { name: /build my ai setter/i })
    await build.waitFor()
    await build.scrollIntoViewIfNeeded()
    await page.screenshot({ path: shotPath('wizard-step4') })
    console.log(`wizard reached Tone step -> ${shotPath('wizard-step4')}`)
    if (!live) return console.log('dry run: not clicking Build (pass --live to create a real agent)')

    const created = page.waitForResponse((r) => r.url().endsWith('/api/agent/create'), { timeout: 120_000 })
    await build.click()
    const body = await (await created).json()
    await page.getByText(/ai active/i).waitFor({ timeout: 90_000 })
    await page.screenshot({ path: shotPath('wizard-chat') })
    console.log(`agent created: agents/${body.id} -> ${shotPath('wizard-chat')}`)
    console.log(`DELETE IT: node .claude/skills/run-dmforge/driver.mjs cleanup ${body.id}`)
  })
}

async function deleteAgent(agentId) {
  if (!agentId) throw new Error('usage: cleanup <agentId>')
  if (!agentId) throw new Error('Usage: cleanup <agentId> (e.g. "cleanup ag_12345")')
  require('dotenv').config({ path: '.env.local', quiet: true })
  const { getAdminDb } = await import(pathToFileURL(path.resolve('lib/firebaseAdmin.js')).href)
  const ref = getAdminDb().collection('agents').doc(agentId)
  if (!(await ref.get()).exists) return console.log(`agents/${agentId} not found — nothing to delete`)
  await ref.delete()
  console.log(`deleted agents/${agentId}`)
}

const [command, ...args] = process.argv.slice(2)
function printHelp() {
  console.log(`
DMForge Developer Tooling Driver

Usage:
  node .claude/skills/run-dmforge/driver.mjs <command> [options] [args]

Commands:
  wait              Poll BASE url until "/" answers 200 (timeout: 10m)
  api               Probe read-only API endpoints and assert status codes
  pages [routes...] Capture screenshots for specified routes (without leading slash)
  wizard [--live]   Drive homepage wizard (dry-run by default; --live creates prod agent)
  cleanup <id>      Delete an agent document from Firestore by ID

Global Options:
  -h, --help        Show this help message
  --json            Output structured JSON (where applicable)
  -v, --version     Show driver version

Environment Variables:
  BASE              Target base URL (default: http://localhost:3100)
  OUT               Output folder for screenshots (default: test-results/run-dmforge)
`)
}

const rawArgs = process.argv.slice(2)
const isJson = rawArgs.includes('--json')
const isHelp = rawArgs.includes('-h') || rawArgs.includes('--help') || rawArgs.length === 0
const isVersion = rawArgs.includes('-v') || rawArgs.includes('--version')

if (isVersion) {
  console.log('dmforge-driver 1.1.0')
  process.exit(0)
}

if (isHelp && (rawArgs.length === 0 || rawArgs.includes('-h') || rawArgs.includes('--help'))) {
  printHelp()
  process.exit(0)
}

const [command, ...args] = rawArgs.filter((a) => a !== '--json')
const commands = {
  wait: () => waitForServer(),
  api: () => probeApi(),
  pages: () => screenshotPages(args),
  wizard: () => driveWizard(args.includes('--live')),
  cleanup: () => deleteAgent(args[0]),
}

if (!commands[command]) {
  console.error(`usage: driver.mjs <${Object.keys(commands).join('|')}> [args]`)
  process.exit(2)
  console.error(`Error: Unknown command "${command}"`)
  console.error(`Run "node .claude/skills/run-dmforge/driver.mjs --help" for valid commands.`)
  process.exit(1)
}
await commands[command]()

try {
  await commands[command]()
} catch (err) {
  if (isJson) {
    console.error(JSON.stringify({ error: err.message, stack: err.stack }))
  } else {
    console.error(`\nError: ${err.message}`)
  }
  process.exit(1)
}

