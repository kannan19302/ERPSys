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
2. **Select ONE item** via the priority ladder: P0 broken typecheck/tests → P1 unfinished
   shipped work → P2 conflict log → P3 Collab Board "Up Next" queue → P4 scorecard/
   hardening quality gaps → P5 competitive gaps from `.ai/MARKET_BENCHMARK.md` →
   P6 module deepening → P7 propose new capability.
   **Focus constraint (binding)**: P3–P7 items must belong to the Current Focus Module
   in `.ai/MODULE_FOCUS.md` (one module at a time → 500+ distinct working features →
   exit criteria → next module; core first, Studio locked until last). Only P0–P2 may
   touch other modules. Log a Feature Ledger row in MODULE_FOCUS.md § 6 each cycle.
3. **Claim** it on the Collab Board (§1 Active Claims).
4. **Plan** with the `product-manager` subagent (registry duplicate-check, stories,
   acceptance criteria, Definition of Done).
5. **Build a BATCH end-to-end** — minimum **10–20 distinct features per cycle** (more is
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
8. **Record**: update `.ai/CHANGELOG.md` and `.ai/MODULE_REGISTRY.md` (status, Growth
   Tracker, move claim to Recently Completed); **regenerate the system-wide
   functionality ledger** — `node scripts/feature-ledger.mjs` → `.ai/FEATURE_LEDGER.md`
   (mandatory whenever any code shipped; commit it with the change; also the
   duplicate-check source during planning); log the focus module's new count in
   `MODULE_FOCUS.md` § 6.
9. **Ship**: commit only your claimed scope, push.
10. **Refill & discover** (mandatory): run the Discovery Protocol in
    `.ai/MARKET_BENCHMARK.md` — benchmark the most-overdue module against its top
    market-leader competitors (use WebSearch/WebFetch), log new gaps/improvements in
    the Gap Backlog, promote the best 1–3 into Up Next as `[benchmark]` items, and keep
    the queue at ≥ 5 groomed items (≥ 2 benchmark-sourced). Then **report** what was
    done, why it was selected, gate results, new gaps discovered, and the top 3 next items.

Guardrails: one item per cycle, no red builds, no stubs/padding, no force-push, no
destructive ops (tag those `[needs-human]` in Up Next), no touching other agents'
claimed scope. Do not ask the user questions — this cycle is fully autonomous.
