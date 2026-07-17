# autopilot-loop.ps1 — Unattended continuous autonomous development.
#
# Runs the AUTOPILOT cycle (.ai/AUTOPILOT.md) repeatedly by invoking Claude Code
# headless with the single prompt "Start". Each iteration is one full cycle:
# select -> build -> verify gates -> review -> record -> commit+push -> discover.
#
# Usage (from repo root):
#   .\scripts\autopilot-loop.ps1                 # 5 cycles, 2 min pause between
#   .\scripts\autopilot-loop.ps1 -Cycles 20 -PauseMinutes 5
#   .\scripts\autopilot-loop.ps1 -Cycles 0       # run forever (Ctrl+C to stop)
#
# Prereqs: claude CLI on PATH and authenticated; dev stack up for E2E gate
# (.\scripts\docker-start.ps1). Logs land in var\autopilot\.
param(
    [int]$Cycles = 5,
    [int]$PauseMinutes = 2
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$logDir = Join-Path $root 'var\autopilot'
New-Item -ItemType Directory -Force $logDir | Out-Null

$i = 0
while ($Cycles -eq 0 -or $i -lt $Cycles) {
    $i++
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $log = Join-Path $logDir "cycle-$stamp.log"
    Write-Host "=== AUTOPILOT cycle $i ($stamp) — log: $log ===" -ForegroundColor Cyan

    git pull --rebase --autostash 2>&1 | Tee-Object -FilePath $log -Append

    # Headless cycle. --permission-mode acceptEdits keeps file edits unattended while
    # still refusing genuinely dangerous ops per AUTOPILOT guardrails.
    claude -p "Start" --permission-mode acceptEdits --max-turns 200 2>&1 |
        Tee-Object -FilePath $log -Append

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Cycle $i exited with code $LASTEXITCODE — see $log" -ForegroundColor Yellow
    }

    if ($Cycles -eq 0 -or $i -lt $Cycles) {
        Write-Host "Sleeping $PauseMinutes minute(s) before next cycle..." -ForegroundColor DarkGray
        Start-Sleep -Seconds ($PauseMinutes * 60)
    }
}
Write-Host "AUTOPILOT loop finished ($i cycles)." -ForegroundColor Green
