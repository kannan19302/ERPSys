# ============================================================
# UniERP Docker Compose Environment Startup Script (Windows PowerShell)
# ============================================================
# Usage (from project root): .\scripts\docker-start.ps1
#
# This script:
#   1. Starts Docker Desktop (if not running)
#   2. Loads or copies the root .env file
#   3. Generates NEXTAUTH_SECRET & PII_ENCRYPTION_KEY if missing
#   4. Starts all services via Docker Compose (docker compose up -d --build)
#   5. Monitors container startup and waits for the API to be healthy
#   6. Displays connection details and credentials
# ============================================================

$ErrorActionPreference = "Stop"

# Reload PATH so globally installed tools are found
$machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
$userPath    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$env:PATH    = "$userPath;$machinePath"

# Resolve project root
$ROOT = (Get-Item $PSScriptRoot).Parent.FullName

function Write-Step   { param([string]$msg) Write-Host "" ; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok     { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn   { param([string]$msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail   { param([string]$msg) Write-Host "  [FAIL] $msg" -ForegroundColor Red }

# Helper to generate a cryptographically secure 32-byte (64-char) hex key
function Generate-SecureHexKey {
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return ([System.BitConverter]::ToString($bytes) -replace '-').ToLower()
}

# --------------------------------------------------------
# Step 1: Terminate stale node processes & clear cache
# --------------------------------------------------------
Write-Step "Step 1/6 - Releasing active file locks & clearing cache..."
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID }
if ($nodeProcs) {
    Write-Warn "Stale Node.js processes detected on host. Terminating servers to release file ports..."
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
# Step 2: Ensure Docker Desktop is running
# --------------------------------------------------------
Write-Step "Step 2/6 - Checking Docker daemon..."
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
# Step 2: Load/Verify Environment Variables (.env)
# --------------------------------------------------------
Write-Step "Step 3/6 - Configuring Environment Variables (.env)..."
$envFile = "$ROOT\.env"
$envExample = "$ROOT\.env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Write-Warn ".env file not found. Copying from .env.example..."
        Copy-Item $envExample $envFile
        Write-Ok ".env file initialized."
    } else {
        Write-Fail "Neither .env nor .env.example was found!"
        exit 1
    }
}

# Verify and auto-inject required secret/keys if missing or empty
$envContent = Get-Content $envFile -Raw
$modified = $false

if ($envContent -notmatch '^NEXTAUTH_SECRET\s*=\s*"?[a-f0-9]{32,}"?') {
    Write-Warn "NEXTAUTH_SECRET is empty or missing. Generating a secure key..."
    $newSecret = Generate-SecureHexKey
    if ($envContent -match 'NEXTAUTH_SECRET\s*=.*') {
        $envContent = $envContent -replace 'NEXTAUTH_SECRET\s*=.*', "NEXTAUTH_SECRET=""$newSecret"""
    } else {
        $envContent += "`nNEXTAUTH_SECRET=""$newSecret"""
    }
    $modified = $true
}

if ($envContent -notmatch '^PII_ENCRYPTION_KEY\s*=\s*"?[a-f0-9]{64}"?') {
    Write-Warn "PII_ENCRYPTION_KEY is empty or missing. Generating a secure 32-byte key..."
    $newKey = Generate-SecureHexKey
    if ($envContent -match 'PII_ENCRYPTION_KEY\s*=.*') {
        $envContent = $envContent -replace 'PII_ENCRYPTION_KEY\s*=.*', "PII_ENCRYPTION_KEY=""$newKey"""
    } else {
        $envContent += "`nPII_ENCRYPTION_KEY=""$newKey"""
    }
    $modified = $true
}

if ($modified) {
    Set-Content $envFile $envContent
    Write-Ok "Updated .env file with generated secure keys."
} else {
    Write-Ok "Environment variables verified."
}

# Load env variables into current process scope
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

# --------------------------------------------------------
# Step 4: Launch Docker Compose Services
# --------------------------------------------------------
Write-Step "Step 4/6 - Launching containerized stack (docker compose up -d --build)..."
Push-Location $ROOT
try {
    & docker compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Docker Compose failed to start the containers."
        Pop-Location
        exit 1
    }
} catch {
    Pop-Location
    throw
}
Pop-Location
Write-Ok "All containers launched."

# --------------------------------------------------------
# Step 5: Wait for services to be ready
# --------------------------------------------------------
Write-Step "Step 5/6 - Waiting for API and Web services to be healthy..."
$apiHealthy = $false
$webHealthy = $false

Write-Host "  Note: Database migration and seeding run inside the API container first." -ForegroundColor DarkGray
Write-Host "  Monitoring health endpoints (up to 3 minutes)..." -ForegroundColor DarkGray

for ($i = 0; $i -lt 36; $i++) {
    Start-Sleep -Seconds 5
    
    if (-not $apiHealthy) {
        $apiStatus = (& docker inspect --format "{{.State.Health.Status}}" unerp-api 2>&1)
        if ($apiStatus -eq "healthy") {
            $apiHealthy = $true
            Write-Ok "API backend is healthy."
        } else {
            Write-Host "  [API status]: $apiStatus" -ForegroundColor DarkGray
        }
    }
    
    if ($apiHealthy -and -not $webHealthy) {
        # Check if Next.js app port 3000 responds with 200 OK
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $webHealthy = $true
                Write-Ok "Next.js Web frontend is ready."
            }
        } catch { }
    }
    
    if ($apiHealthy -and $webHealthy) {
        break
    }
}

if (-not $apiHealthy) {
    Write-Warn "API did not report healthy. Checking api logs:"
    & docker logs --tail 30 unerp-api
}
if (-not $webHealthy) {
    Write-Warn "Web port 3000 is not responding yet. Checking web logs:"
    & docker logs --tail 30 unerp-web
}

# --------------------------------------------------------
# Step 6: Complete & Summary
# --------------------------------------------------------
Write-Step "Step 6/6 - Environment is up!"

Write-Host "  +-------------------------------------+" -ForegroundColor DarkCyan
Write-Host "  |      Default Login Credentials      |" -ForegroundColor DarkCyan
Write-Host "  |  URL:      http://localhost:3000    |" -ForegroundColor DarkCyan
Write-Host "  |  Email:    admin@unerp.dev          |" -ForegroundColor DarkCyan
Write-Host "  |  Password: admin123                 |" -ForegroundColor DarkCyan
Write-Host "  +-------------------------------------+" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  UniERP Containerized Dev Stack is Running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Web App:       http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API Backend:   http://localhost:3001/api/v1" -ForegroundColor Cyan
Write-Host "  Swagger Docs:  http://localhost:3001/swagger" -ForegroundColor Cyan
Write-Host "  MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host "  Ollama Local:  http://localhost:11434" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To view logs:   docker compose logs -f" -ForegroundColor DarkGray
Write-Host "  To stop stack:  docker compose down" -ForegroundColor DarkGray
Write-Host ""
