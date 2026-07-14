# RELEASE_PLAN.md — Road to v1 (flawless launch, ~2 months)

> **Status: pre-v1** (this word gates the exhaustive, no-cap behavior of the
> `issue-scout` deep scan and the hardening posture of the autonomous cycles).
> Target launch: **~2 months from 2026-07-14 → on/around 2026-09-14.**
> Change Status to `v1-shipped` only when the § 4 exit gate passes.

The goal is a **full-fledged, live, working product with no known flaws or bugs** at
v1. Every workflow in this repo (`/start`, `/identify issue`, `/fix-issues`) is now
pointed at that goal. This plan sequences the work so the launch is real, not rushed.

## 1. The launch definition (what "v1, no flaws" means)

v1 ships only when ALL are true:
1. Zero open GitHub issues labeled `severity:critical` or `severity:high`.
2. Zero open `security`-labeled issues at any severity (security is never deferred
   past launch).
3. Green milestone gate on `main`: full `pnpm turbo typecheck`, full API test suite,
   Playwright smoke suite — all passing, no `skip`/`only`.
4. Every core module past its `MODULE_FOCUS.md` § 5 exit criteria (incl. the 500+
   feature mandate) OR explicitly scoped out of v1 in § 3 below with a written reason.
5. A clean end-to-end deep scan (`identify issue`) whose only new findings are
   `severity:low` polish items triaged into a post-v1 backlog.

## 2. The engine (how we get there — run these on repeat)

Two months of continuous, disciplined cycles, in this rhythm:

1. **Discover** — run `identify issue` (deep, exhaustive, no cap) to populate the
   full defect+security+QA+suggestion inventory into GitHub Issues via
   `.ai/ISSUE_INVENTORY.jsonl`. Re-run weekly and after every major batch so the
   backlog reflects reality.
2. **Fix** — run `/fix-issues` continuously, severity-first (security → critical →
   high → medium → low). This is the dominant activity of the pre-v1 window; feature
   building slows so hardening leads.
3. **Build only what v1 needs** — `/start` cycles focus on: closing `MODULE_FOCUS.md`
   exit criteria for in-scope modules, real-usage feature suggestions (D7) that are
   launch-blocking, and market-parity gaps that are table-stakes for launch. Defer
   nice-to-haves to the post-v1 backlog.
4. **Verify** — milestone gates settle the fast-cycle debt; no red build reaches a
   launch candidate.

## 3. Scope for v1 (edit as decided)

| Area | v1 scope | Notes |
|:--|:--|:--|
| Core ERP modules (Finance, CRM & Sales, Inventory, HR, …) | IN — must pass § 5 exit criteria | Focus order in `MODULE_FOCUS.md` § 4 |
| Security hardening (all D5 rungs) | IN — blocking, zero open `security` issues | § 1.2 |
| Studio / advanced/experimental modules | Decide per module; default DEFER unless launch-critical | Log deferrals here with a reason |
| Post-v1 polish (low-severity UX) | OUT — triaged to a `post-v1` milestone | Not launch-blocking |

## 4. Exit gate → flip Status to `v1-shipped`

Run a final exhaustive `identify issue`; confirm § 1 items 1–5 all hold; tag the
release; update this file's Status line and record the launch in `CHANGELOG.md`.
After launch, the `issue-scout` deep scan reverts to its capped steady-state mode
(max 25/run) automatically, because it keys off this Status line.

## 5. Weekly checkpoints (fill in as we go)

| Week ending | Open crit/high | Open security | Milestone gate | Notes |
|:--|:--|:--|:--|:--|
| 2026-07-18 | — | — | — | Kickoff: first exhaustive scan + fix loop |
