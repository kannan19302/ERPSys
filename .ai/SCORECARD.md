# Production-Readiness Scorecard

> **Generated file** — produced by `node scripts/scorecard.mjs`. Do not edit by hand.
> Last generated: 2026-06-26T16:37:09.830Z

## System score: 7.1 / 10

- Module average: **4.2 / 10** (33 modules)
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
| ai  | **2.6** | 6 | 0 | 0 | 0 | 6 | 0 | 6 |
| saas  | **2.9** | 6 | 0 | 0 | 2 | 6 | 0 | 6 |
| localization  | **3.3** | 3 | 0 | 0 | 8 | 6 | 0 | 6 |
| field-service  | **3.4** | 6 | 0 | 0 | 6 | 6 | 0 | 6 |
| advanced-finance  | **3.6** | 9 | 0 | 0 | 4 | 6 | 0 | 6 |
| pwa  | **3.6** | 3 | 0 | 0 | 10 | 6 | 0 | 6 |
| real-estate  | **3.6** | 6 | 0 | 0 | 7 | 6 | 0 | 6 |
| education  | **3.7** | 6 | 0 | 0 | 8 | 6 | 0 | 6 |
| reporting  | **3.7** | 6 | 0 | 0 | 8 | 6 | 0 | 6 |
| api-platform  | **4** | 6 | 0 | 0 | 10 | 6 | 0 | 6 |
| auth  | **4** | 9 | 7 | 0 | 0 | 6 | 0 | 6 |
| hr  | **4** | 6 | 0 | 0 | 10 | 6 | 0 | 6 |
| storage  | **4** | 6 | 0 | 0 | 10 | 6 | 0 | 6 |
| healthcare  | **4.1** | 9 | 0 | 0 | 8 | 6 | 0 | 6 |
| workflow  | **4.1** | 9 | 0 | 0 | 8 | 6 | 0 | 6 |
| notifications  | **4.3** | 6 | 0 | 0 | 10 | 8 | 0 | 6 |
| advanced-hr  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| analytics  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| communication  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| crm  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| documents  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| finance  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| inventory  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| manufacturing  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| pos  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| projects  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| sales  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| supply-chain  | **4.4** | 9 | 0 | 0 | 10 | 6 | 0 | 6 |
| admin  | **4.6** | 9 | 1 | 0 | 10 | 6 | 0 | 6 |
| marketplace  | **4.6** | 9 | 0 | 5 | 6 | 6 | 0 | 6 |
| procurement  | **4.7** | 9 | 3 | 0 | 9 | 6 | 0 | 6 |
| devops  | **5.4** | 6 | 10 | 0 | 10 | 6 | 0 | 6 |
| builder  | **6.3** | 9 | 8 | 6 | 9 | 6 | 0 | 6 |

---

Heuristics are intentionally conservative so the baseline is honest and
the score climbs as real work lands. See `scripts/scorecard.mjs` and the
roadmap in the plan that introduced this file.
