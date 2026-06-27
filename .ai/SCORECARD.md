# Production-Readiness Scorecard

> **Generated file** — produced by `node scripts/scorecard.mjs`. Do not edit by hand.
> Last generated: 2026-06-27T01:39:42.675Z

## System score: 9.5 / 10

- Module average: **9 / 10** (33 modules)
- Platform average: **10 / 10**

A module reaches **10** only when all seven dimensions are 10. The
system reaches 10 only when every module and every platform dimension is 10.

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
| documents  | **8.1** | 10 | 5 | 2 | 10 | 10 | 10 | 10 |
| storage  | **8.1** | 6 | 10 | 3 | 10 | 10 | 10 | 8 |
| ai  | **8.3** | 10 | 10 | 0 | 10 | 10 | 10 | 8 |
| localization  | **8.6** | 3 | 10 | 9 | 10 | 10 | 10 | 8 |
| api-platform  | **8.7** | 6 | 10 | 7 | 10 | 10 | 10 | 8 |
| inventory  | **8.7** | 10 | 10 | 1 | 10 | 10 | 10 | 10 |
| pwa  | **8.7** | 3 | 10 | 10 | 10 | 10 | 10 | 8 |
| workflow  | **8.7** | 10 | 10 | 1 | 10 | 10 | 10 | 10 |
| education  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| field-service  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| healthcare  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| marketplace  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| notifications  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| pos  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| projects  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| real-estate  | **8.9** | 10 | 10 | 2 | 10 | 10 | 10 | 10 |
| crm  | **9** | 10 | 10 | 3 | 10 | 10 | 10 | 10 |
| devops  | **9.1** | 6 | 10 | 10 | 10 | 10 | 10 | 8 |
| hr  | **9.1** | 10 | 10 | 4 | 10 | 10 | 10 | 10 |
| manufacturing  | **9.1** | 10 | 10 | 4 | 10 | 10 | 10 | 10 |
| reporting  | **9.1** | 10 | 10 | 4 | 10 | 10 | 10 | 10 |
| admin  | **9.3** | 10 | 9 | 6 | 10 | 10 | 10 | 10 |
| analytics  | **9.3** | 10 | 10 | 5 | 10 | 10 | 10 | 10 |
| auth  | **9.3** | 10 | 10 | 5 | 10 | 10 | 10 | 10 |
| communication  | **9.3** | 10 | 10 | 5 | 10 | 10 | 10 | 10 |
| procurement  | **9.3** | 10 | 10 | 5 | 10 | 10 | 10 | 10 |
| saas  | **9.3** | 10 | 10 | 5 | 10 | 10 | 10 | 10 |
| advanced-finance  | **9.4** | 10 | 10 | 6 | 10 | 10 | 10 | 10 |
| advanced-hr  | **9.4** | 10 | 10 | 6 | 10 | 10 | 10 | 10 |
| finance  | **9.4** | 10 | 10 | 6 | 10 | 10 | 10 | 10 |
| builder  | **9.7** | 10 | 10 | 8 | 10 | 10 | 10 | 10 |
| supply-chain  | **9.7** | 10 | 10 | 8 | 10 | 10 | 10 | 10 |
| sales ✅ | **10** | 10 | 10 | 10 | 10 | 10 | 10 | 10 |

---

Heuristics are intentionally conservative so the baseline is honest and
the score climbs as real work lands. See `scripts/scorecard.mjs` and the
roadmap in the plan that introduced this file.
