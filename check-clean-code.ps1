<#
.SYNOPSIS
  Clean Code Pre-Commit & Quality Gate Script.
.DESCRIPTION
  Runs automated verification:
  1. Type checking (TypeScript / tsc)
  2. Linter / Formatter check (Biome / ESLint)
  3. Automated test suite (npm test / vitest / jest)
  4. Static clean code audit (boundary validation, zero secrets, error swallowing)
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$ProjectPath = (Get-Location).Path,

  [Parameter(Mandatory = $false)]
  [switch]$Fix
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     RUNNING CLEAN CODE QUALITY & PRE-COMMIT GATE         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target: $ProjectPath" -ForegroundColor Gray

$failures = @()

# 1. Type Check
Write-Host "`n[1/4] Checking TypeScript Types..." -ForegroundColor Yellow
if (Test-Path (Join-Path $ProjectPath "tsconfig.json")) {
  $tscCmd = "npx tsc --noEmit"
  Write-Host "Executing: $tscCmd" -ForegroundColor DarkGray
  try {
    $tscOut = Invoke-Expression $tscCmd 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE"
    }
    Write-Host "✓ TypeScript type-check passed cleanly." -ForegroundColor Green
  } catch {
    Write-Host "✗ TypeScript type-check failed!" -ForegroundColor Red
    if ($tscOut) { Write-Host ($tscOut | Out-String) -ForegroundColor Red }
    Write-Host $_.Exception.Message -ForegroundColor Red
    $failures += "TypeScript type-check"
  }
} else {
  Write-Host "No tsconfig.json found, skipping tsc." -ForegroundColor DarkGray
}

# 2. Linting & Formatting Check
Write-Host "`n[2/4] Checking Linter & Code Formatting..." -ForegroundColor Yellow
if (Test-Path (Join-Path $ProjectPath "biome.json")) {
$biomeLocal = Join-Path $ProjectPath "node_modules\@biomejs\biome"
if (Test-Path $biomeLocal) {
  $biomeAction = if ($Fix) { "check --write" } else { "check" }
  $biomeCmd = "npx @biomejs/biome $biomeAction `"$ProjectPath`""
  $biomeCmd = "node `"$biomeLocal\bin\biome`" $biomeAction `"$ProjectPath`""
  Write-Host "Executing: $biomeCmd" -ForegroundColor DarkGray
  try {
    $biomeOut = Invoke-Expression $biomeCmd 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code $LASTEXITCODE"
    }
    Write-Host "✓ Biome check passed." -ForegroundColor Green
  } catch {
    Write-Host "✗ Biome check found issues!" -ForegroundColor Red
    if ($biomeOut) { Write-Host ($biomeOut | Out-String) -ForegroundColor Red }
    Write-Host $_.Exception.Message -ForegroundColor Red
    $failures += "Biome check"
  }
} elseif (Test-Path (Join-Path $ProjectPath "package.json")) {
  $pkg = Get-Content (Join-Path $ProjectPath "package.json") -Raw | ConvertFrom-Json
  if ($pkg.scripts.lint) {
    try {
      Write-Host "Executing: npm run lint" -ForegroundColor DarkGray
      npm run lint
      Write-Host "✓ npm run lint passed." -ForegroundColor Green
      Write-Host "Executing: yarn --ignore-engines run lint" -ForegroundColor DarkGray
      yarn --ignore-engines run lint
      Write-Host "✓ yarn run lint passed." -ForegroundColor Green
    } catch {
      Write-Host "✗ npm run lint failed!" -ForegroundColor Red
      $failures += "npm run lint"
      Write-Host "✗ yarn run lint failed!" -ForegroundColor Red
      $failures += "yarn run lint"
    }
  } else {
    Write-Host "No local linter package or lint script found, skipping." -ForegroundColor DarkGray
  }
}

# 3. Unit / Integration Tests
Write-Host "`n[3/4] Running Automated Tests..." -ForegroundColor Yellow
if (Test-Path (Join-Path $ProjectPath "package.json")) {
  $pkg = Get-Content (Join-Path $ProjectPath "package.json") -Raw | ConvertFrom-Json
  if ($pkg.scripts.test -and $pkg.scripts.test -notmatch "no test specified") {
    try {
      Write-Host "Executing: npm test" -ForegroundColor DarkGray
      npm test
      Write-Host "Executing: node .\node_modules\vitest\vitest.mjs run" -ForegroundColor DarkGray
      node .\node_modules\vitest\vitest.mjs run
      if ($LASTEXITCODE -ne 0) {
        throw "Vitest failed with exit code $LASTEXITCODE"
      }
      Write-Host "✓ Automated test suite passed." -ForegroundColor Green
    } catch {
      Write-Host "✗ Automated test suite failed!" -ForegroundColor Red
      $failures += "Automated test suite"
    }
  } else {
    Write-Host "No test script configured in package.json, skipping." -ForegroundColor DarkGray
  }
}

# 4. Clean Code Static Audit
Write-Host "`n[4/4] Running Clean Code Static Audit..." -ForegroundColor Yellow
$globalAuditScript = "C:\Users\bossm\.gemini\config\skills\clean-code-standards\scripts\audit-clean-code.ps1"
if (Test-Path $globalAuditScript) {
$fastAuditScript = Join-Path $ProjectPath "scripts\audit-code.js"
if (Test-Path $fastAuditScript) {
  try {
    & $globalAuditScript -TargetDir $ProjectPath -FailOnSeverity "Error"
    node $fastAuditScript
    if ($LASTEXITCODE -ne 0) {
      throw "Clean code audit failed with exit code $LASTEXITCODE"
    }
    Write-Host "✓ Clean code static audit passed." -ForegroundColor Green
  } catch {
    Write-Host "✗ Clean code static audit detected critical issues!" -ForegroundColor Red
    $failures += "Clean code static audit"
  }
} else {
  Write-Host "Global audit script not found, skipping." -ForegroundColor DarkGray
  Write-Host "Audit script not found, skipping." -ForegroundColor DarkGray
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($failures.Count -eq 0) {
  Write-Host "  ALL PRE-COMMIT GATES PASSED! CODE IS READY TO SHIP.  " -ForegroundColor Green
  Write-Host "==========================================================" -ForegroundColor Cyan
  exit 0
} else {
  Write-Host "  PRE-COMMIT GATE FAILED WITH $($failures.Count) ISSUE(S):  " -ForegroundColor Red
  foreach ($f in $failures) {
    Write-Host "  - $f" -ForegroundColor Red
  }
  Write-Host "==========================================================" -ForegroundColor Cyan
  exit 1
}

