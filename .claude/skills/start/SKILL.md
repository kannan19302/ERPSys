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
5. **Build end-to-end** (schema → NestJS API → Next.js UI → tests) following every
   AGENTS.md critical rule; use role subagents as appropriate.
6. **Verify gates**: `pnpm turbo typecheck`, the full API test suite, AND the binding
   E2E smoke gate (`pnpm --filter @unerp/web test:e2e` — `e2e/smoke.spec.ts` logs in
   and walks all core module surfaces against the running stack; add new pages to
   `SMOKE_ROUTES`). Also manually exercise the changed feature in the running app.
7. **Review** the diff with the `code-reviewer` subagent (plus `security-auditor` for
   auth/tenancy/permission-sensitive changes).
8. **Record**: update `.ai/CHANGELOG.md` and `.ai/MODULE_REGISTRY.md` (status, Growth
   Tracker, move claim to Recently Completed).
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
