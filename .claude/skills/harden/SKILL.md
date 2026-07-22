---
name: harden
description: Run one full QA-flow cycle for UniERP — find flaws security-first, file each as a GitHub issue, fix it at root cause, verify, and close it, all in one pass. Use when the user says "harden", "/harden", "find and fix", "scan and fix", or wants bugs identified and resolved.
---

# Harden — the QA flow (find → file → fix → close)

Execute the **QA flow** of `.ai/AUTOPILOT.md` exactly. That file is the single
source of truth; this is the operating summary:

> **Two ways this flow runs** (AUTOPILOT § Shared bindings #17): explicitly
> (user types "harden") or as the **mandatory checkpoint** the "Start" flow
> auto-executes after every 10 completed DEV cycles. Either way, log the run in
> `MODULE_REGISTRY.md` § Cycle Ledger; only the mandatory checkpoint resets
> `Next run` to `DEV` — an explicit user harden never resets the 10-cycle clock.

## 0. Bootstrap (slim)

Read `.ai/AUTOPILOT.md` § QA flow (flow authority; consult `AGENTS.md` sections
on demand, not in full); `git pull`; start the dev
stack if runtime probing is needed. `node scripts/claim.mjs list` — if a user is
present and another session holds the module they pick, say who holds it and ask
for another; unattended runs restrict to unclaimed scope silently.

## 1. Identify (security-first scan order)

1. Broken build / failing tests / failing gates.
2. Security: authz bypass, tenant leakage, injection, secrets in code, unsafe
   input handling, missing RBAC guards. (Defensive only — never create or suggest
   attack tooling.)
3. Reliability: crashes, unhandled rejections, race conditions, data-integrity risks.
4. Functional QA against the running app (API + UI probes).
5. UAT walkthroughs of primary workflows from the end user's perspective.
6. UX, performance, and doc-drift debt.

Evidence rules: static findings need a file:line quote; runtime findings need
observed behavior. If the stack can't start, run static rungs only and say so.

## 2. Per-finding closed loop (severity order)

1. **Dedup** against open GitHub issues — adopt an existing issue over filing a copy.
2. **File the issue FIRST** (What / Evidence / Impact / Suggested fix; labels:
   severity + area, `security` where applicable) — an interrupted run must never
   lose a finding.
3. **Claim** `node scripts/claim.mjs acquire issue-<n> ...`.
4. **Fix inline at root cause** under the architecture policies (tenant scoping,
   RBAC, migrations via `db:deploy`, `architecture:check` / `migration:discipline`
   where touched). Never weaken a test, never `skip`, never suppress the check
   that caught it.
5. **Verify**: scoped typecheck + touched-module vitest + the finding's own
   reproduction now passing. Auth/tenancy/RBAC/payment fixes also get the
   security-auditor checklist.
6. **Commit** `fix(<module>): <summary> (fixes #<n>)`; release the lock. After the
   commit reaches `main`, confirm the issue closed — close it explicitly if not.
7. **Blocked?** (business decision / credentials / large refactor): label
   `blocked`, comment why, leave OPEN, move on. Never close a blocked issue.

## 3. Settlement (once, after the loop)

1. MILESTONE gates (full turbo typecheck + API suite + Playwright smoke) if ≥ 5
   fixes landed or any risky surface was touched; otherwise FAST bookkeeping.
2. One CHANGELOG entry (found N / fixed M / blocked K) + MODULE_REGISTRY updates,
   in the same commit as the last fix where practical.
3. Invoke the **`sprint-sync` skill** (AUTOPILOT § Shared bindings #19,
   `sprint:qa` labeling) to mirror this run's fixes onto GitHub as closed
   Story-shaped issues — best-effort, never blocks the ship.
4. Ship to `main`; re-query every issue fixed this run and close stragglers.

## 4. Report

Compact table: found → fixed+CLOSED (@commit) → blocked (+why), security first;
gate results; remaining open `security`/critical/high count (the launch gate).
Counts, not code dumps.

Guardrails: security-first always; no red build ships; file-before-fix; never
leave a fixed issue open; no destructive ops without explicit user instruction.
