# ============================================================
# UniERP Dev Environment Startup Script (Windows PowerShell)
# ============================================================
# Usage (from project root): .\scripts\dev-start.ps1
#
# This script:
#   1. Starts Docker Desktop (if not running)
#   2. Starts PostgreSQL + Redis via docker-compose
#   3. Waits for DB to be healthy
#   4. Runs Prisma migrations (pnpm db:migrate)
#   5. Seeds the database (pnpm db:seed)
#   6. Starts NestJS API (port 3001) in a new terminal window
#   7. Starts Next.js frontend (port 3000) in a new terminal window
#
# Default credentials after seeding:
#   Email:    admin@unerp.dev
#   Password: admin123
# ============================================================

$ErrorActionPreference = "Stop"

# Reload PATH from both Machine and User scopes so globally installed tools
# (pnpm, node, etc.) are found even when launched without a user profile.
$machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
$userPath    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$env:PATH    = "$userPath;$machinePath"

# Resolve project root (parent of scripts/ folder)
$ROOT = (Get-Item $PSScriptRoot).Parent.FullName

# Load environment variables from root .env file
$envFile = "$ROOT\.env"
if (Test-Path $envFile) {
  Write-Host "==> Loading environment variables from .env..." -ForegroundColor Cyan
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
      if ($line -match '^\s*([^#\s=]+)\s*=\s*(.*)$') {
        $name = $Matches[1]
        $val = $Matches[2].Trim("'`"")
        [System.Environment]::SetEnvironmentVariable($name, $val, "Process")
        Set-Item "env:$name" $val
      }
    }
  }
  Write-Host "  [OK] Environment variables loaded." -ForegroundColor Green
} else {
  Write-Host "  [WARN] .env file not found at $envFile" -ForegroundColor Yellow
}

function Write-Step   { param([string]$msg) Write-Host "" ; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok     { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn   { param([string]$msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail   { param([string]$msg) Write-Host "  [FAIL] $msg" -ForegroundColor Red }

# --------------------------------------------------------
# Step 0: Terminate stale node processes & clear cache
# --------------------------------------------------------
Write-Step "Step 0/7 - Releasing active file locks & clearing cache..."
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
  Write-Warn "Stale Node.js processes detected. Terminating servers to release file locks..."
  Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Write-Ok "Stale servers terminated."
} else {
  Write-Ok "No file locks found."
}

$webNext = Join-Path $ROOT "apps\web\.next"
if (Test-Path $webNext) {
  Remove-Item -Recurse -Force $webNext -ErrorAction SilentlyContinue
  Write-Ok "Next.js cache directory cleared."
}

# --------------------------------------------------------
# Step 1: Ensure Docker Desktop is running
# --------------------------------------------------------
Write-Step "Step 1/7 - Checking Docker daemon..."
$dockerOk = $false
try {
  & docker info *>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $dockerOk = $true }
} catch { }

if (-not $dockerOk) {
  Write-Warn "Docker is not running. Attempting to launch Docker Desktop..."
  $candidates = @(
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe",
    "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  )
  $exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $exe) {
    Write-Fail "Docker Desktop not found. Please install it from https://www.docker.com and re-run."
    exit 1
  }
  Start-Process $exe
  Write-Host "  Waiting for Docker to start (up to 90s)..." -ForegroundColor DarkGray
  $secs = 0
  while ($secs -lt 90) {
    Start-Sleep -Seconds 5; $secs += 5
    try {
      & docker info *>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { $dockerOk = $true; break }
    } catch { }
    Write-Host "  ...${secs}s elapsed" -ForegroundColor DarkGray
  }
  if (-not $dockerOk) {
    Write-Fail "Docker did not start within 90 seconds. Start it manually and re-run."
    exit 1
  }
}
Write-Ok "Docker is running."

# --------------------------------------------------------
# Step 2: Start PostgreSQL + Redis
# --------------------------------------------------------
Write-Step "Step 2/7 - Starting PostgreSQL and Redis (docker-compose)..."
Push-Location "$ROOT\docker"
try {
  & docker compose up -d postgres redis
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "docker compose up failed."
    Pop-Location
    exit 1
  }
} catch {
  Pop-Location
  throw
}
Pop-Location
Write-Ok "Containers started."

# --------------------------------------------------------
# Step 3: Wait for PostgreSQL healthcheck
# --------------------------------------------------------
Write-Step "Step 3/7 - Waiting for PostgreSQL to be healthy..."
$pgOk = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  $status = (& docker inspect --format "{{.State.Health.Status}}" unerp-postgres 2>&1)
  if ($status -eq "healthy") { $pgOk = $true; break }
  Write-Host "  ($($i*2)s) status: $status" -ForegroundColor DarkGray
}
if ($pgOk) { Write-Ok "PostgreSQL is healthy." }
else { Write-Warn "Health check timed out - proceeding anyway." }

# --------------------------------------------------------
# Step 4: Run Prisma DB Push
# --------------------------------------------------------
Write-Step "Step 4/7 - Synchronizing Prisma database schema..."
Push-Location $ROOT
try {
  & pnpm db:push
  & pnpm --filter @unerp/database build
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "Database sync/build failed. Check DATABASE_URL in apps/api/.env"
    Pop-Location
    exit 1
  }
} catch {
  Pop-Location
  throw
}
Pop-Location
Write-Ok "Database schema synchronized."

# --------------------------------------------------------
# Step 5: Seed the Database
# --------------------------------------------------------
Write-Step "Step 5/7 - Seeding the database..."
Push-Location $ROOT
try {
  & pnpm db:seed
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "Seed script exited non-zero (may already be seeded - continuing)."
  } else {
    Write-Ok "Database seeded successfully."
  }
} catch {
  Write-Warn "Seed threw an exception (may already be seeded - continuing)."
}
Pop-Location

# Banner
Write-Host ""
Write-Host "  +-------------------------------------+" -ForegroundColor DarkCyan
Write-Host "  |      Default Login Credentials      |" -ForegroundColor DarkCyan
Write-Host "  |  URL:      http://localhost:3000    |" -ForegroundColor DarkCyan
Write-Host "  |  Email:    admin@unerp.dev          |" -ForegroundColor DarkCyan
Write-Host "  |  Password: admin123                 |" -ForegroundColor DarkCyan
Write-Host "  +-------------------------------------+" -ForegroundColor DarkCyan
Write-Host ""

# --------------------------------------------------------
# Step 6: Start NestJS API (new window)
# --------------------------------------------------------
Write-Step "Step 6/7 - Launching NestJS API (port 3001) in a new window..."
$pathReload = '$env:PATH = [System.Environment]::GetEnvironmentVariable(''PATH'',''User'') + '';'' + [System.Environment]::GetEnvironmentVariable(''PATH'',''Machine'')'
$apiCmd = "$pathReload; Set-Location '$ROOT'; Write-Host '--- UniERP API  http://localhost:3001/api/v1 ---' -ForegroundColor Green; pnpm dev:api; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $apiCmd
Write-Ok "API window launched."

# --------------------------------------------------------
# Step 7: Start Next.js Web App (new window)
# --------------------------------------------------------
Write-Step "Step 7/7 - Launching Next.js Web App (port 3000) in a new window..."
$webCmd = "$pathReload; Set-Location '$ROOT'; Write-Host '--- UniERP Web  http://localhost:3000 ---' -ForegroundColor Green; pnpm dev:web; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd
Write-Ok "Web window launched."

# Done
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  UniERP Dev Environment is Starting!      " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Two new PowerShell windows have opened." -ForegroundColor White
Write-Host "  API  ->  http://localhost:3001/api/v1" -ForegroundColor Cyan
Write-Host "  Web  ->  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Wait ~15 seconds for both servers to compile." -ForegroundColor Yellow
Write-Host "  Then open http://localhost:3000 in your browser." -ForegroundColor Yellow
Write-Host ""
