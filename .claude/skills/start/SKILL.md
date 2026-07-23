---
name: start
description: Run one full DEV-flow cycle for UniERP. Use when the user says "Start", "/start", "continue", or "next" with no other requirements — phase-gated: mandatory-harden checkpoint, then foundation roadmap first; only after the foundation is SEALED, module strengthening to Complete (1500+ weighted features) in the AUTOPILOT Phase M focus order, then new apps. Binding throughput floor: ≥ 5,000 net LOC OR ≥ 40 features per cycle. Ships end-to-end onto main.
---

# Start — the DEV flow (phase-gated)

Execute the **DEV flow** of `.ai/AUTOPILOT.md` exactly and end-to-end. That file is
the single source of truth; this is the operating summary:

1. **Bootstrap (slim)** — read `.ai/AUTOPILOT.md` (flow authority); from
   `.ai/MODULE_REGISTRY.md` read ONLY § Cycle Ledger + § 0 Current Focus +
   § Collab Board (ranged reads — never the whole file); read the last ~5
   `.ai/CHANGELOG.md` entries. Do NOT re-read `instructions.md`/`AGENTS.md` in
   full — consult sections on demand. `git pull`; `node scripts/claim.mjs gc`;
   `node scripts/claim.mjs list`; record the cycle-start SHA
   (`git rev-parse HEAD`) for the net-LOC floor check. Never touch work you
   didn't create this session.
2. **Harden checkpoint (MANDATORY, first)** — if § Cycle Ledger says
   `Next run: HARDEN (mandatory)` (every 10th completed DEV cycle), execute one
   full QA-flow cycle (`.ai/AUTOPILOT.md` § QA flow) instead of DEV work, log it
   in the ledger, reset `Next run: DEV`, and end the run.
3. **Phase gate (MANDATORY, second — AUTOPILOT § The Program Ladder)** — read
   `.ai/FOUNDATION_HARDENING_ROADMAP.md` § 12 (lift gate):
   - **Gate unmet → Phase F (Foundation)**: this cycle works the next unblocked
     roadmap track item(s) in dependency order (0 → A #19 → B #17 ∥ C #21 → D →
     E → F/G/H/I). Feature freeze holds; no feature work; no focus question;
     velocity = track items closed with exit-gate proofs (floor exempt).
   - **Gate met → Phase M (Module strengthening)**: drive every module to
     **Complete (1500+ weighted features)** in the AUTOPILOT § Phase M focus
     order (Finance → CRM → HR → Procurement → Supply Chain → Manufacturing →
     Projects → Connect → Builder → industry → weakest-health). Horizontal
     build order (DB layer → API layer → UI layer), one focus module at a time.
   - **All modules Complete → Phase X**: plan/build new apps/modules through
     the sealed kernel contracts.
4. **Focus question (Phase M/X only; interactive runs; the ONE question)** — per
   AUTOPILOT DEV step 1. Phase F never asks. Unattended runs never ask.
5. **Select** via the priority ladder: P0 broken build → P1 security/critical
   issues → (Phase F: P-F roadmap items) → P2 unfinished → P2.5 below-MVM →
   P3 deepening → P4 new capability.
6. **Claim** the lock (`claim.mjs acquire`), add the Collab Board row.
7. **Plan (MANDATORY phase, zero approvals) — write `.ai/IMPLEMENTATION_PLAN.md`**:
   overwrite it ONCE with this cycle's plan, sized to clear the throughput
   floor. Phase M deepening: keep it lean — cycle #, phase, scope + why,
   feature/endpoint/model list, duplicate-check, gate tier, rollback note (no
   RICE / user stories / per-feature acceptance criteria). Phase X new
   modules: full PM treatment. Commit it with the first code commit, then
   execute. Never overwrite again mid-cycle — scope changes go in as dated
   addendum lines.
8. **Build horizontally under the throughput floor**: schema → migrations
   (`pnpm db:deploy`, never `db:push`) → services/controllers with tenant
   scoping + RBAC + Zod + tests → UI via `@unerp/framework` + `@unerp/ui-*`.
   `pnpm architecture:check` for API changes, `pnpm migration:discipline` for
   DB. Micro-harden checkpoint every 20th feature (scoped typecheck + vitest).
   **Binding floor (Phase M/X): ship ≥ 5,000 net LOC OR ≥ 40 distinct features
   per cycle.** Under both floors at ship time → pick the next priority-ladder
   item in the same focus module and keep building; only a hard stop (budget
   exhaustion, red gate needing human input) excuses shipping under-floor.
9. **Verify** at the right gate tier (FAST default; MILESTONE on risky surfaces).
10. **Record + Ship**: run `node scripts/cycle-report.mjs --since <cycle-start-sha>`
    to measure net LOC (floor check + ledger value); regenerate the feature
    ledger (once per cycle, here); CHANGELOG + MODULE_REGISTRY + **§ Cycle
    Ledger update** (increment DEV counter; fill the `Net LOC` column; multiple
    of 10 → set `Next run: HARDEN (mandatory)`) in the SAME commit as the code;
    invoke the **`sprint-sync` skill** (AUTOPILOT § Shared bindings #19) to
    mirror this cycle onto the module's GitHub Epic/Story issues — best-effort,
    never blocks the push; release the lock; land on `main`. Phase F: mark
    closed tracks ✅ in the roadmap with evidence.
11. **Report**: detected phase, what shipped, **net LOC vs the 5K floor**, why,
    gate results, cycle counter (+ cycles until mandatory harden), top 3 next
    items.

Guardrails: one batch per cycle; no stubs or padding to inflate LOC or feature
counts (the floor is met with real, production-grade work only); no destructive
ops; do the work yourself — subagents only for large genuinely-parallel chunks
(security-auditor on auth/tenancy/RBAC surfaces is the standing exception), and
every subagent gets a distilled context brief instead of re-reading governance
docs (AUTOPILOT § Agent roster).
