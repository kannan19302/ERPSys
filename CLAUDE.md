# CLAUDE.md

Read and follow `AGENTS.md` — it is the master instruction set for this repo
(architecture, critical rules, 3-file tracking convention, Collab Board protocol).

**Autonomous mode**: if the user's message is just "Start" (or "start", "/start",
"continue", "next") with no other requirements, execute the Autonomous Development
Protocol in `.ai/AUTOPILOT.md` end-to-end: select one work item via its priority
ladder, build it fully (DB → API → UI → tests), verify typecheck + test gates, update
`.ai/CHANGELOG.md` + `.ai/MODULE_REGISTRY.md`, commit + push, and refill the Up Next
queue so the next cycle always has work.
Ask exactly ONE question before starting — **the focus-module question** (binding,
every interactive run): regenerate `node scripts/feature-ledger.mjs` first, then ask
which module to focus on via `AskUserQuestion`, showing in EVERY option the module's
**updated feature count** from the regenerated `FEATURE_LEDGER.md` (e.g. "Inventory —
612 features, focus module" / "Finance — 487 features" / "HR — 96 features, weakest"),
and marking any module another active collaborator holds (per `claim.mjs list`). If
the user picks an occupied module, tell them who holds it and ask them to choose
another. After that single answer, proceed with zero further questions. Unattended
runs (scheduler/CI — no user to ask) skip the question and follow `MODULE_FOCUS.md`.

**Issue-identification mode**: if the user's message is just "identify issue" (or
"identify issues", "/issue-scan") with no other requirements, do not ask questions —
invoke the `/issue-scan` skill in **deep mode**: the `issue-scout` agent
(`.claude/agents/issue-scout.md`) builds and tests the whole repo, QA-probes
functionality against the running app, walks primary workflows from the end user's
(UAT) perspective, gathers improvement and UI-convenience calls, and records every
verified, deduplicated finding as a labeled issue in the GitHub repo's Issues tab.
It files issues only — it never fixes, commits code, or closes issues.

**Issue-fixing mode**: if the user's message is just "fix issues" (or "fix issue",
"/fix-issues", "resolve issues") with no other requirements, invoke the `/fix-issues`
skill: drain the GitHub Issues backlog severity-first — reproduce each issue, fix it
inline at root cause, verify with scoped gates plus the issue's own reproduction,
commit with `fixes #<n>` so the issue auto-closes on main, label genuinely blocked
issues `blocked` and move on. Milestone gates settle after the loop if risky surfaces
were touched or ≥ 5 issues fixed.

**Multi-collaborator rule** (binding for all three modes above): at bootstrap check
`node scripts/claim.mjs list` — if other sessions hold active claims and a user is
present, ask which module to focus on (`AskUserQuestion`); if their choice is a module
another active collaborator already holds, tell them who holds it and ask them to
choose a different module (details: `.ai/AUTOPILOT.md` § Multi-Collaborator Focus
Selection). Unattended sessions never prompt — they auto-pick unclaimed scope.
