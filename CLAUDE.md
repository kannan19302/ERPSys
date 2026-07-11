# CLAUDE.md

Read and follow `AGENTS.md` — it is the master instruction set for this repo
(architecture, critical rules, 3-file tracking convention, Collab Board protocol).

**Autonomous mode**: if the user's message is just "Start" (or "start", "/start",
"continue", "next") with no other requirements, do not ask questions — execute the
Autonomous Development Protocol in `.ai/AUTOPILOT.md` end-to-end: select one work item
via its priority ladder, build it fully (DB → API → UI → tests), verify typecheck + test
gates, update `.ai/CHANGELOG.md` + `.ai/MODULE_REGISTRY.md`, commit + push, and refill
the Up Next queue so the next cycle always has work.

**Issue-identification mode**: if the user's message is just "identify issue" (or
"identify issues", "/issue-scan") with no other requirements, do not ask questions —
invoke the `/issue-scan` skill in **deep mode**: the `issue-scout` agent
(`.claude/agents/issue-scout.md`) builds and tests the whole repo, QA-probes
functionality against the running app, walks primary workflows from the end user's
(UAT) perspective, gathers improvement and UI-convenience calls, and records every
verified, deduplicated finding as a labeled issue in the GitHub repo's Issues tab.
It files issues only — it never fixes, commits code, or closes issues.
