---
name: start
description: Run one full DEV-flow cycle for UniERP. Use when the user says "Start", "/start", "continue", or "next" with no other requirements — phase-gated: mandatory-harden checkpoint, then foundation roadmap first; only after the foundation is SEALED, module strengthening to 500+ features (core → industry), then new apps. Ships end-to-end onto main.
---

# Start — the DEV flow (phase-gated)

Execute the **DEV flow** of `.ai/AUTOPILOT.md` exactly and end-to-end. That file is
the single source of truth; this is the operating summary:

1. **Bootstrap** — read `AGENTS.md` Critical Rules and `.ai/AUTOPILOT.md`;
   `git pull`; read `.ai/MODULE_REGISTRY.md` § Cycle Ledger + § Collab Board and
   recent `.ai/CHANGELOG.md`; `node scripts/claim.mjs list`. Never touch work you
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
     velocity = track items closed with exit-gate proofs. Track A SQL needs
     named-owner sign-off — prepare, never auto-apply.
   - **Gate met → Phase M (Module strengthening)**: drive every module to
     **500+ weighted features minimum** (more where market gaps remain), in
     order core → enterprise → platform → cross-cutting → industry-specific;
     40+ features per cycle; cross-module workflow batches count.
   - **All modules Complete → Phase X**: plan/build new apps/modules through
     the sealed kernel contracts.
4. **Focus question (Phase M/X only; interactive runs; the ONE question)** — per
   AUTOPILOT DEV step 1. Phase F never asks. Unattended runs never ask.
5. **Select** via the priority ladder: P0 broken build → P1 security/critical
   issues → (Phase F: P-F roadmap items) → P2 unfinished → P2.5 below-MVM →
   P3 deepening → P4 new capability.
6. **Claim** the lock (`claim.mjs acquire`), add the Collab Board row.
7. **Plan (MANDATORY phase, zero approvals) — write `.ai/IMPLEMENTATION_PLAN.md`**:
   overwrite it ONCE with this cycle's plan (cycle #, phase, scope + why,
   ordered slice/track-item list, duplicate-check, acceptance criteria, gate
   tier, rollback note), commit it with the first code commit, then execute.
   Never overwrite again mid-cycle — scope changes go in as dated addendum lines.
8. **Build end-to-end** under the architecture policies: schema → one migration
   (`pnpm db:deploy`, never `db:push`) → services/controllers with tenant
   scoping + RBAC + Zod + tests → UI via `@unerp/framework` + `@unerp/ui-*`.
   `pnpm architecture:check` for API changes, `pnpm migration:discipline` for DB.
9. **Verify** at the right gate tier (FAST default; MILESTONE on risky surfaces).
10. **Record + Ship**: CHANGELOG + MODULE_REGISTRY + **§ Cycle Ledger update**
    (increment DEV counter; multiple of 10 → set `Next run: HARDEN (mandatory)`)
    in the SAME commit as the code; release the lock; land on `main`. Phase F:
    mark closed tracks ✅ in the roadmap with evidence; when the last track
    closes, declare foundation SEALED v1.0 (roadmap § 12b).
11. **Report**: detected phase, what shipped, why, gate results, cycle counter
    (+ cycles until mandatory harden), top 3 next items.

Guardrails: one batch per cycle; no stubs or padding; no destructive ops; do the
work yourself — subagents only for large genuinely-parallel chunks (security-auditor
on auth/tenancy/RBAC surfaces is the standing exception).
