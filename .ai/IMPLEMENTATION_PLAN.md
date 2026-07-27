# Implementation Plan — Cycle 64 — Deepest 10 MVM Modules to Functional (50+ feats)

**Phase:** M — Module strengthening (weakest-health focus)
**Cycle:** 64 (start SHA: a855e208)
**Throughput floor:** ≥ 5,000 net LOC OR ≥ 40 features

## Scope & Why

The 10 lowest-health modules (all MVM tier, <50 features) are deepened to Functional (50+ feats) in parallel via 3 subagents. This shrinks the MVM pile from 21→11 modules and adds tests for 2 untested modules.

## Modules & Target

| Subagent | Modules                                    | Current                | Target                  | Strategy                                                           |
| -------- | ------------------------------------------ | ---------------------- | ----------------------- | ------------------------------------------------------------------ |
| 1        | field-service, real-estate                 | 74, 79 feats; ❌ tests | 150+ each + test suites | 5 new Prisma models + services + controllers + 3 UI pages each     |
| 2        | people, search, fixed-assets, api-platform | 10, 14, 15, 16 feats   | 50+ each                | 2-3 new Prisma models + services + controllers + 1-2 UI pages each |
| 3        | subscriptions, storage, pwa, saved-views   | 14, 17, 19, 19 feats   | 50+ each                | 2-3 new Prisma models + services + controllers + 1-2 UI pages each |

## Endpoint Count: ~80-100 new REST endpoints

## Feature Count: ~350-400 weighted features

## Prisma Models: ~20-25 new models

## UI Pages: ~15-20 new pages

## Tests: ~40-60 Vitest tests

## Duplicate Check

- Ledger was regenerated at end of Cycle 63 — no overlap with existing features
- None of these 10 modules were deepened in Cycle 63 (that cycle covered AI, Analytics, Documents, Drive, Auth, Marketplace, Blockchain)

## Gate Tier: FAST (standard module deepening, no risky surface)

## Rollback

If any subagent fails, its work is simply omitted from the merge. The others ship independently.
