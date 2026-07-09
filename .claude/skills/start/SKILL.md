---
name: start
description: Run one full autonomous development cycle for UniERP. Use when the user says "Start", "/start", "continue", or "next" with no other requirements — the agent self-selects the next work item (bugfix, hardening, feature, or new module) and ships it end-to-end.
---

# Autonomous Development Cycle

Execute the Autonomous Development Protocol defined in `.ai/AUTOPILOT.md`, exactly and
end-to-end. Summary of the cycle (read AUTOPILOT.md for the full binding rules):

1. **Bootstrap** — read `AGENTS.md`, `.ai/prompts/MASTER_PROMPT.md`, `.ai/AUTOPILOT.md`;
   `git pull`; read the Collab Board, `SCORECARD.md`, recent `CHANGELOG.md`,
   `MARKET_BENCHMARK.md`; regenerate `.ai/FEEDBACK.md` (`node scripts/feedback-scan.mjs`)
   and start the dev stack if it's down.
   **Pending-work quarantine**: any work you did not create in THIS session —
   uncommitted/untracked files, unclaimed half-built batches, unmerged `autopilot/*`
   branches, code behind stale locks — is PENDING: never finish/commit/stash/revert it,
   never `git add -A` over it. Log it once as `[pending]` in Up Next, then start a NEW
   task in a non-overlapping sub-domain. Pending work is completed only when the user
   explicitly instructs (e.g. "complete pending work").
2. **Select ONE item** via the priority ladder: P0 broken typecheck/tests → P1 unfinished
   shipped work → P2 conflict log → P3 Collab Board "Up Next" queue → P4 scorecard/
   hardening quality gaps → P5 competitive gaps from `.ai/MARKET_BENCHMARK.md` →
   P6 module deepening → P7 propose new capability.
   **Focus constraint (binding)**: P3–P7 items must belong to the Current Focus Module
   in `.ai/MODULE_FOCUS.md` (one module at a time → 500+ distinct working features →
   exit criteria → next module; core first, Studio locked until last). Only P0–P2 may
   touch other modules. Log a Feature Ledger row in MODULE_FOCUS.md § 6 each cycle.
3. **Claim** with the atomic lock FIRST: `node scripts/claim.mjs acquire
   <sub-domain-slug> --agent <name+session> --scope "<desc>"` (exit 1 = HELD by
   another session → pick a different sub-domain, never proceed); commit+push the
   lock file, then add the Collab Board §1 row. Heartbeat each step
   (`claim.mjs heartbeat <slug>`; 2h silence = stale, takeover allowed), release +
   commit in Step 9. Duplicate check both ends: grep FEATURE_LEDGER for your routes
   at claim time AND again after the pre-merge rebase — drop features another
   session already shipped. **Parallel agents** (see AUTOPILOT § Parallel Agents): claims
   are disjoint sub-domain locks within the focus module; work on your own
   `autopilot/<sub-domain>` branch and merge to main only after gates pass; serialize
   Prisma migrations (rebase + re-apply if another landed first); append-only edits in
   shared hotspots (schema.prisma, permissions registry, moduleNav, SMOKE_ROUTES) with
   `git pull --rebase` before push; on conflicts in generated trackers, regenerate —
   never hand-merge; never reset/re-seed the shared DB while other agents' claims are active;
   after any rebase, grep FEATURE_LEDGER for your routes and shrink the batch if
   another agent already shipped part of it.
4. **Plan** with the `product-manager` subagent (registry duplicate-check, stories,
   acceptance criteria, Definition of Done).
5. **Build a BATCH end-to-end** — minimum **20–40+ distinct features or 5,000–10,000+
   LOC per cycle** (hit at least one floor; verify vs SPRINT_TRACKER/FEATURE_LEDGER at
   record time and extend the cycle with the next sub-domain slice if under; more is
   better), composed around one sub-domain of the focus module, always spanning
   **DB + API + UI**. Batch-efficient order: ALL schema changes → one migration → all
   services/controllers → all UI pages → one test pass. Spend ≥ 70% of the cycle
   writing code: during build use only fast scoped checks (`pnpm --filter @unerp/api
   typecheck`, single-module vitest, HMR in the running stack) — never the full
   suite/typecheck/E2E per feature, and never restart docker or re-seed needlessly.
6. **Verify gates ONCE per cycle** (after the whole batch, never per feature):
   `pnpm turbo typecheck`, the full API test suite, AND the binding E2E smoke gate
   (`npx playwright test smoke` in apps/web against the running stack; add new pages
   to `SMOKE_ROUTES`). Manually exercise the batch's primary workflow once.
7. **Review** the diff with the `code-reviewer` subagent (plus `security-auditor` for
   auth/tenancy/permission-sensitive changes).
8. **Record (documentation gate — commit is FORBIDDEN until ALL done)**: updating only
   CHANGELOG + MODULE_REGISTRY is a violation. Full checklist (AUTOPILOT Step 7):
   CHANGELOG entry; MODULE_REGISTRY (status/Growth Tracker/claim → Recently Completed);
   regenerate `feature-ledger.mjs`, `sprint-tracker.mjs`; MODULE_FOCUS § 6 row + § 7
   contract statuses; MARKET_BENCHMARK `✅ SHIPPED` marks + discovery rows;
   `feedback-scan.mjs` if a P1 error was fixed; `scorecard.mjs` if substantial;
   release the lock (`claim.mjs release`); HANDBOOK only if conventions changed.
   Self-check: `git status --short .ai/` must show the expected set. Quote today's
   SPRINT_TRACKER row and 500-target progress in the final report.
9. **Ship** (only after the step-8 documentation gate passes): in parallel mode run in
   your **own git worktree** — `node scripts/worktree.mjs new <slug>` at cycle start
   (open that folder; `pnpm install` once), `node scripts/worktree.mjs done <slug>` at
   cycle end (refuses dirty trees; rebases, pushes to main, removes worktree+branch) —
   so commits never entangle other sessions' files. Sharing one checkout:
   commit with an explicit pathspec — `git commit -m "..." -- <your files>` — never a
   bare `git commit` (a shared index may hold another session's staged files), edit shared hotspots (CHANGELOG/REGISTRY/schema/permissions/moduleNav)
   only at ship time just before staging, never commit a file containing another
   session's hunks (defer + Conflict Log), never stash/reset foreign changes. Push
   rejected → `git fetch && git rebase --autostash origin/main`, re-typecheck, retry
   (max 3, never force-push). stage code + the full
   documentation set together — docs land in the SAME commit/push as the code, never
   a separate afterthought. Commit only your claimed scope, push — and the cycle MUST
   end with the changes on `origin/main`. If on an `autopilot/*` branch: rebase onto origin/main,
   re-run scoped typecheck, merge to main, push, delete the branch. Never leave
   shipped work stranded on a branch.
10. **Refill & discover** (mandatory): run the Discovery Protocol in
    `.ai/MARKET_BENCHMARK.md` — benchmark the most-overdue module against its top
    market-leader competitors (use WebSearch/WebFetch), log new gaps/improvements in
    the Gap Backlog, promote the best 1–3 into Up Next as `[benchmark]` items, and keep
    the queue at ≥ 5 groomed items (≥ 2 benchmark-sourced). Then **report** what was
    done, why it was selected, gate results, new gaps discovered, and the top 3 next items.

Guardrails: one batch per cycle, no red builds, no stubs/padding, no force-push, no
destructive ops (tag those `[needs-human]` in Up Next), no touching other agents'
claimed scope. Do not ask the user questions — this cycle is fully autonomous.

Token efficiency (binding — see AUTOPILOT § Token & Context Efficiency): grep + ranged
reads instead of whole files; use FEATURE_LEDGER/registry as the map (grep them, never
dump them); read each file at most once and never re-read after your own edit; clone
the reference pattern (newest focus-module sub-service; `customers` list page) instead
of exploring; prefer `@unerp/framework` schema-driven UI over hand-written JSX; write
each file in ONE complete Write call; cap tool output (`--reporter=line`, `tail`);
reports contain counts and results, never pasted code or diffs.
