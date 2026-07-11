---
name: issue-scan
description: Sweep the repo for defects, debt, and gaps and raise each verified finding as a GitHub issue. Use when the user says "identify issue"/"identify issues" (deep mode — full build/test, functionality-level QA, UAT user-perspective walkthroughs, improvement & UI-convenience calls), or "scan for issues", "file issues", "issue scan" (quick mode). Catalogues problems in the GitHub issue tracker without fixing them.
---

# Issue Scan

Invoke the `issue-scout` agent (`.claude/agents/issue-scout.md`) and let it run its
full protocol end-to-end. **Mode selection**: the user message "identify issue" (or
"identify issues") means **deep mode** — run it automatically without asking any
questions. Other phrasings default to quick mode unless the user asks for depth.

1. **Quick mode**: scan rungs S1–S7 (broken gates → runtime errors → CI breakage →
   overdue gate debt → security smells → code debt → doc drift), gathering evidence
   for each candidate finding. Max 10 new issues.
2. **Deep mode**: S1–S7 plus D1–D4 — full build + full test suite + smoke E2E (D1),
   functionality-level QA probing of the focus and weakest modules against the
   running app (D2), UAT walkthroughs of primary business workflows from the end
   user's perspective (D3), and improvement/UI-convenience calls for existing
   functionality benchmarked against `.ai/MARKET_BENCHMARK.md` and the repo's own
   best pages (D4). Start the dev stack first if it's down — D2/D3 require observed
   runtime behavior. Max 25 new issues.
3. Dedupe every candidate against open issues in `kannan19302/ERPSys` before filing.
4. File severity-labeled issues, one problem (or one workflow/surface checklist) per
   issue, using the agent's template (What / Evidence / Impact / Suggested fix / Source).
5. Report a compact table: filed, skipped duplicates, overflow remaining.

The scout files cases only — it never fixes, commits code changes, or closes issues.
Issues it files feed the AUTOPILOT P1 rung on subsequent cycles.
