# CLAUDE.md

Read and follow `AGENTS.md` — it is the master instruction set for this repo
(architecture, critical rules, 3-file tracking convention, Collab Board protocol).

**Autonomous mode**: if the user's message is just "Start" (or "start", "/start",
"continue", "next") with no other requirements, do not ask questions — execute the
Autonomous Development Protocol in `.ai/AUTOPILOT.md` end-to-end: select one work item
via its priority ladder, build it fully (DB → API → UI → tests), verify typecheck + test
gates, update `.ai/CHANGELOG.md` + `.ai/MODULE_REGISTRY.md`, commit + push, and refill
the Up Next queue so the next cycle always has work.
