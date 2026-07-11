# Production-Readiness Scorecard

> **Generated file** — produced by `node scripts/scorecard.mjs`. Do not edit by hand.
> Last generated: 2026-07-11T05:31:42.569Z

## System score (heuristic): 9.9 / 10

- Module average: **9.8 / 10** (33 modules)
- Platform average: **10 / 10**

The score below measures the **presence** of good patterns (validation,
RBAC, docs, tests) via static heuristics. It is **not** proof of
correctness — see the Reality Gates section, which is the binding signal.
A module reaches **10** only when all seven dimensions are 10. The
system reaches 10 only when every module and every platform dimension is 10.

## Reality Gates (binding)

> Last verified: 2026-07-04T04:24:19.536Z

| Gate | Result | Exit | Duration |
| --- | --- | --- | --- |
| Typecheck (tsc --noEmit, all packages) | ✅ PASS | 0 | 20s |
| Unit tests (full API suite) | ✅ PASS | 0 | 40s |

> ✅ Code compiles and the full test suite passes.

## Rubric (each dimension scored 0–10)

| Dim | Name | What "10" means |
| --- | --- | --- |
| D1 | Functionality | Core domain workflows fully implemented; no stub/placeholder endpoints. |
| D2 | Validation | Every write endpoint zod-validated via `@ZodBody`/`ZodValidationPipe`. |
| D3 | Tests | Service unit coverage ≥ 80%; critical paths have e2e. |
| D4 | Security | `@Permissions` RBAC on every route; tenant-scoped; audit-logged mutations. |
| D5 | Observability | Structured logs, errors via global filter, no stray `console.*`. |
| D6 | Docs/API | `@ApiOperation` Swagger annotations on every route. |
| D7 | Ops | Health/readiness wired; jobs idempotent; migrations clean. |

## Platform dimensions

| Dimension | Score | |
| --- | --- | --- |
| CI/CD | 10/10 | `██████████` |
| Observability | 10/10 | `██████████` |
| Security | 10/10 | `██████████` |
| Deployment | 10/10 | `██████████` |

## Module scores

| Module | Overall | Functionality | Validation | Tests | Security | Observability | Docs/API | Ops |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ext-gateway  | **7.1** | 10 | 0 | 10 | 0 | 10 | 10 | 10 |
| subscriptions  | **8.6** | 10 | 0 | 10 | 10 | 10 | 10 | 10 |
| auth  | **9.3** | 10 | 10 | 10 | 5 | 10 | 10 | 10 |
| admin  | **9.4** | 6 | 10 | 10 | 10 | 10 | 10 | 10 |
| ecommerce  | **9.4** | 10 | 10 | 10 | 6 | 10 | 10 | 10 |
| crm  | **9.6** | 10 | 9 | 10 | 10 | 10 | 8 | 10 |
| sales  | **9.7** | 10 | 10 | 10 | 10 | 10 | 8 | 10 |
| procurement  | **9.9** | 10 | 10 | 10 | 9 | 10 | 10 | 10 |
| advanced-finance ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| advanced-hr ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| ai ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| analytics ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| api-platform ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| builder ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| communication ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| devops ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| documents ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| finance ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| fixed-assets ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| hr ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| inventory ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| localization ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| manufacturing ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| marketplace ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| notifications ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| pos ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| projects ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| pwa ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| reporting ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| saas ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| storage ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| supply-chain ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |
| workflow ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |

---

Heuristics are intentionally conservative so the baseline is honest and
the score climbs as real work lands. See `scripts/scorecard.mjs` and the
roadmap in the plan that introduced this file.
