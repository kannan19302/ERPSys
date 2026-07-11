---
name: issue-scan
description: Sweep the repo for defects, debt, and gaps and raise each verified finding as a GitHub issue. Use when the user says "scan for issues", "file issues", "issue scan", or wants the repo's problems catalogued in the GitHub issue tracker without fixing them.
---

# Issue Scan

Invoke the `issue-scout` agent (`.claude/agents/issue-scout.md`) and let it run its
full protocol end-to-end:

1. Scan rungs S1–S7 (broken gates → runtime errors → CI breakage → overdue gate
   debt → security smells → code debt → doc drift), gathering evidence for each
   candidate finding.
2. Dedupe every candidate against open issues in `kannan19302/ERPSys` before filing.
3. File at most 10 new issues per run — severity-labeled, one problem per issue,
   using the agent's issue template (What / Evidence / Impact / Suggested fix / Source).
4. Report a compact table: filed, skipped duplicates, overflow remaining.

The scout files cases only — it never fixes, commits code changes, or closes issues.
Issues it files feed the AUTOPILOT P1 rung on subsequent cycles.
