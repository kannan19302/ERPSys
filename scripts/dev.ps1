<#
.SYNOPSIS
  Start UniERP for daily development.

.DESCRIPTION
  One command for the everyday loop. Brings up the datastores, the package
  registry and the two applications you almost always need (api + web), waits
  until each is genuinely answering rather than merely "started", and prints
  where everything is.

  Additional planes are opt-in because each Next.js dev server holds a full
  module graph in memory; running all five at once exhausted the Docker VM
  during bring-up.

.EXAMPLE
  ./scripts/dev.ps1
  ./scripts/dev.ps1 -With console,developer
  ./scripts/dev.ps1 -Down
#>
param(
  [string[]]$With = @(),
  [switch]$Down,
  [switch]$Reset
)

$ErrorActionPreference = 'Stop'
$compose = @('compose', '-f', 'docker-compose.dev.yml')

if ($Down)  { & docker @compose down;    exit $LASTEXITCODE }
if ($Reset) { & docker @compose down -v; exit $LASTEXITCODE }

Write-Host ''
Write-Host '  UniERP — starting development stack' -ForegroundColor Cyan
Write-Host ''

# The registry lives in unierp-infra but the app containers install from it, so
# it has to be up before they boot. It joins this stack's network by name.
$registry = docker ps --filter name=unerp-registry --format '{{.Names}}'
if (-not $registry) {
  Write-Host '  Starting the package registry...' -ForegroundColor DarkGray
  docker compose -f ../unierp-infra/registry/docker-compose.registry.yml up -d | Out-Null
}
$net = docker inspect erpsys_default --format '{{.Name}}' 2>$null
if ($net) { docker network connect erpsys_default unerp-registry 2>$null | Out-Null }

$services = @('postgres', 'redis', 'minio', 'api', 'web')
$args = $compose + @('up', '-d')
foreach ($p in $With) { $args = $compose + @('--profile', $p) + $args[$compose.Count..($args.Count-1)] }
& docker @args @services @With

Write-Host ''
Write-Host '  Waiting for services to answer...' -ForegroundColor DarkGray

$targets = @(
  @{ Name = 'API';       Url = 'http://localhost:3001/api/v1/health' },
  @{ Name = 'Web';       Url = 'http://localhost:3000/' }
)
if ($With -contains 'console')   { $targets += @{ Name = 'Console';   Url = 'http://localhost:3002/' } }
if ($With -contains 'developer') { $targets += @{ Name = 'Developer'; Url = 'http://localhost:3004/' } }

foreach ($t in $targets) {
  $deadline = (Get-Date).AddMinutes(20)   # a cold Next.js compile is genuinely slow
  $ok = $false
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri $t.Url -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
      if ($r.StatusCode -lt 500) { $ok = $true; break }
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -and $_.Exception.Response.StatusCode.value__ -lt 500) { $ok = $true; break }
    }
    Start-Sleep -Seconds 10
  }
  if ($ok) { Write-Host ("  [OK]   {0}" -f $t.Name) -ForegroundColor Green }
  else     { Write-Host ("  [WAIT] {0} — still compiling; check: docker logs -f unerp-{1}" -f $t.Name, $t.Name.ToLower()) -ForegroundColor Yellow }
}

Write-Host ''
Write-Host '  Web         http://localhost:3000'
Write-Host '  API         http://localhost:3001/api/v1'
Write-Host '  Swagger     http://localhost:3001/swagger'
if ($With -contains 'console')   { Write-Host '  Console     http://localhost:3002' }
if ($With -contains 'developer') { Write-Host '  Developer   http://localhost:3004' }
Write-Host '  MinIO       http://localhost:9001   (minioadmin / minioadmin)'
Write-Host '  Registry    http://localhost:4873'
Write-Host ''
Write-Host '  Logs:  docker compose -f docker-compose.dev.yml logs -f api web'
Write-Host '  Stop:  ./scripts/dev.ps1 -Down'
Write-Host ''
