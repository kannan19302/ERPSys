---
name: start
description: Run one full autonomous development cycle for UniERP. Use when the user says "Start", "/start", "continue", or "next" with no other requirements — the agent self-selects the next work item (bugfix, hardening, feature, or new module) and ships it end-to-end.
---

# Autonomous Development Cycle

Execute the Autonomous Development Protocol defined in `.ai/AUTOPILOT.md`, exactly and
end-to-end. Summary of the cycle (read AUTOPILOT.md for the full binding rules):

1. **Bootstrap** — read `AGENTS.md`, `.ai/prompts/MASTER_PROMPT.md`, `.ai/AUTOPILOT.md`;
   `git pull`; read the Collab Board, `SCORECARD.md`, recent `CHANGELOG.md`.
2. **Select ONE item** via the priority ladder: P0 broken typecheck/tests → P1 unfinished
   shipped work → P2 conflict log → P3 Collab Board "Up Next" queue → P4 scorecard/
   hardening quality gaps → P5 module deepening → P6 propose new capability.
3. **Claim** it on the Collab Board (§1 Active Claims).
4. **Plan** with the `product-manager` subagent (registry duplicate-check, stories,
   acceptance criteria, Definition of Done).
5. **Build end-to-end** (schema → NestJS API → Next.js UI → tests) following every
   AGENTS.md critical rule; use role subagents as appropriate.
6. **Verify gates**: `pnpm turbo typecheck` and the full API test suite must pass.
7. **Review** the diff with the `code-reviewer` subagent (plus `security-auditor` for
   auth/tenancy/permission-sensitive changes).
8. **Record**: update `.ai/CHANGELOG.md` and `.ai/MODULE_REGISTRY.md` (status, Growth
   Tracker, move claim to Recently Completed).
9. **Ship**: commit only your claimed scope, push.
10. **Refill** the Up Next queue to ≥ 5 groomed items, then **report** what was done,
    why it was selected, gate results, and the top 3 next items.

Guardrails: one item per cycle, no red builds, no stubs/padding, no force-push, no
destructive ops (tag those `[needs-human]` in Up Next), no touching other agents'
claimed scope. Do not ask the user questions — this cycle is fully autonomous.
