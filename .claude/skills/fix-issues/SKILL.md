---
name: fix-issues
description: Pick up open issues from the GitHub repository and fix them all, end-to-end. Use when the user says "fix issues", "fix issue", "/fix-issues", "resolve issues", or wants the GitHub Issues backlog worked down — each fix verified, committed with "Fixes #n" so the issue auto-closes on merge to main.
---

# Fix Issues — the issue-resolution workflow

The third leg of the workflow triad: `/start` builds new features, `/issue-scan`
("identify issue") files problems, **`/fix-issues` resolves them**. It drains the
GitHub Issues backlog for `kannan19302/ERPSys`, one issue at a time, until the
backlog is empty or every remaining issue is genuinely blocked.

All AUTOPILOT bindings apply: § Do The Work Yourself (fix inline — no subagent
relays), § Cycle Tiers (scoped gates per fix, milestone settlement), § Parallel
Agents (locks), and the Token & Context Efficiency rules.

## 0. Bootstrap

1. Read `AGENTS.md` Critical Rules + `.ai/AUTOPILOT.md` §§ Cycle Tiers, Do The Work
   Yourself, Multi-Collaborator Focus Selection. `git pull`. Start the dev stack if
   down (needed to verify fixes against observed behavior).
2. **Multi-collaborator gate (binding)**: run `node scripts/claim.mjs list` and read
   Collab Board §1. If other sessions hold ACTIVE claims, follow AUTOPILOT
   § Multi-Collaborator Focus Selection — ask the user which module's issues to work
   on, and if their choice collides with an active claim, tell them who holds it and
   ask them to pick another. Unattended (no user available): silently restrict
   yourself to issues in modules with no active claim.
3. Load the backlog: GitHub MCP `list_issues` (state: open, oldest first), page
   through completely. Skip issues labeled `blocked` or `needs-human`, and issues
   whose module is excluded by the collaborator gate.

## 1. Order of attack

Sort the remaining issues: `severity:critical` → `severity:high` →
`severity:medium` → `severity:low`; within a severity, `bug`/`security` before
`uat`/`ux` before `enhancement`/`tech-debt`; then oldest first. Group issues that
touch the same module/files into one batch so migrations, typecheck, and commits
are shared.

## 2. Per-issue loop (repeat until backlog empty)

1. **Claim**: `node scripts/claim.mjs acquire issue-<number> --agent <name+session>
   --scope "<title>"`; HELD → another session is on it, skip to the next issue.
2. **Understand**: read the issue's Evidence section; reproduce it (run the failing
   command / hit the failing route) BEFORE changing code. If it doesn't reproduce,
   comment with what you observed and close as not-planned — that also counts as
   resolved.
3. **Fix inline** per AGENTS.md rules — root cause, not symptom. Enhancement/`ux`
   issues get the described improvement built (DB→API→UI as needed). Never weaken a
   test, never delete the failing assertion, never `skip`.
4. **Verify (FAST-tier gates per fix)**: scoped typecheck + the touched module's
   vitest + re-run the issue's own reproduction from step 2 — it must now pass.
   Auth/tenancy/permissions/payments surfaces additionally get the security-auditor
   checklist inline.
5. **Commit** with `fix(<module>): <summary> (fixes #<number>)` — the `fixes #n`
   keyword auto-closes the issue when the commit reaches the default branch. Release
   the lock.
6. **Blocked?** (needs credentials, ambiguous business decision, depends on another
   issue): comment your findings on the issue, add the `blocked` label, release the
   lock, move on. Never thrash.

## 3. Settlement (once, after the loop)

1. If any fix touched risky surface (data migration, auth/tenancy/RBAC, shared
   hotspots) or ≥ 5 issues were fixed: run the MILESTONE gate set — full turbo
   typecheck, full API suite, Playwright smoke — and fix regressions before shipping
   (P0, same run). Otherwise FAST-tier bookkeeping applies (increment
   `fastCyclesSinceFullGate`).
2. Record: one `CHANGELOG.md` entry listing all issues fixed; regenerate
   `feature-ledger.mjs` + `sprint-tracker.mjs`; `feedback-scan.mjs` if runtime-error
   issues were fixed.
3. Ship: push to `main` (or merge your worktree branch per Parallel Agents rule 2) —
   issues only auto-close when the commits land on the default branch.

## 4. Report

Compact table: issue # → title → outcome (fixed @ commit / closed-not-reproducible /
blocked+why) + gate results. Counts, not code dumps. If open issues remain (skipped
by the collaborator gate or blocked), list them so the next run picks them up.
