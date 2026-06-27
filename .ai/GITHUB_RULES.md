# GitHub Rules & Deployment Policy — UniERP

> Enterprise-grade CI/CD governance for the UniERP platform.
> **Policy owner**: @kannan19302 — only this user may modify environment
> configurations, branch protection rules, CODEOWNERS, and CI/CD workflows.

---

## 1. Deployment Pipeline

All changes follow a strict 4-stage sequential pipeline. No stage can be
skipped. Each stage must succeed before the next begins.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│ Development │ →  │   Quality   │ →  │   Staging   │ →  │  Production  │
│  (auto)     │    │   (QA)      │    │   (UAT)     │    │  (approval)  │
└─────────────┘    └─────────────┘    └─────────────┘    └──────────────┘
       ↑
  Quality Gates
  (must all pass)
```

### Stage 0 — Quality Gates

Every push and pull request triggers these gates in parallel. **All must
pass** before any deployment stage begins.

| Gate | What it checks | Blocking? |
|:---|:---|:---|
| Lint & Type Check | ESLint + TypeScript strict compilation | Yes |
| Unit Tests | Vitest (463+ tests, coverage report) | Yes |
| Build Web | Next.js production build | Yes |
| Docker Build (API) | Dockerfile builds cleanly | Yes |
| Build Storybook | Design system compiles | Yes |
| Migration Drift Check | Prisma schema matches migrations | Yes |
| Production-Readiness Scorecard | 10/10 across 33 modules (7 dimensions) | Yes |
| Security Scan | CodeQL + dependency audit | Non-blocking |
| E2E (Playwright) | End-to-end browser tests | Non-blocking |

### Stage 1 — Development

| Property | Value |
|:---|:---|
| **GitHub Environment** | `Development` |
| **Trigger** | Push to `main` (after all gates pass) |
| **Approval** | None (automatic) |
| **Wait timer** | None |
| **Branch policy** | `main` only |
| **Actions** | Build image → push to GHCR → deploy API + Web → smoke test |

**Policy**: All quality gates must pass. Deployment is fully automated.
If any gate fails, no deployment occurs.

### Stage 2 — Quality (QA)

| Property | Value |
|:---|:---|
| **GitHub Environment** | `quality` |
| **Trigger** | Development deployment succeeds |
| **Approval** | None (automatic after dev passes) |
| **Wait timer** | Configurable (recommended: 5 minutes) |
| **Branch policy** | `main` only |
| **Actions** | Migrate DB → deploy → run regression suite → validate |

**Policy**: Development must succeed first. Automated regression tests
run against the QA environment. Any failure blocks promotion to staging.

### Stage 3 — Staging (UAT)

| Property | Value |
|:---|:---|
| **GitHub Environment** | `staging` |
| **Trigger** | QA deployment succeeds |
| **Approval** | None (automatic after QA passes) |
| **Wait timer** | Configurable (recommended: 15 minutes for UAT window) |
| **Branch policy** | `main` only |
| **Actions** | Migrate DB → deploy → UAT smoke tests → tag release candidate |

**Policy**: QA must succeed first. UAT smoke tests validate business
flows. A release candidate tag is created for audit traceability.

### Stage 4 — Production

| Property | Value |
|:---|:---|
| **GitHub Environment** | `production` |
| **Trigger** | Staging deployment succeeds |
| **Approval** | **Required — @kannan19302 only** |
| **Wait timer** | Until approval is granted |
| **Branch policy** | `main` only |
| **Actions** | Pre-deployment checklist → migrate DB → blue-green deploy → health check → tag release |

**Policy**: This is the most protected stage.
- All prior stages (Development, QA, Staging) must pass.
- **Manual approval from @kannan19302 is mandatory.**
- Even if all policies are satisfied, deployment waits for explicit approval.
- Blue-green deployment strategy for zero-downtime rollout.
- Post-deployment health check must pass.
- A production release tag is created for rollback reference.

---

## 2. Branch Strategy

| Branch | Purpose | Deploys to | Protection |
|:---|:---|:---|:---|
| `main` | Integration branch — all PRs merge here | Development → QA → Staging → Production | Protected: require PR, require reviews, no force push |
| `develop` | Feature integration (optional) | CI gates only (no deployment) | Protected |
| `feature/*` | Individual feature work | CI gates on PR | None |
| `release/*` | Release preparation | CI gates only | Protected |
| `hotfix/*` | Emergency production fixes | Fast-track through pipeline | Require @kannan19302 review |

### Branch Protection Rules (main)

- **Require pull request before merging**: Yes
- **Required approving reviews**: 1 (from CODEOWNERS)
- **Dismiss stale reviews on new push**: Yes
- **Require status checks to pass**: Lint, Unit Tests, Build Web, Docker Build, Migration Drift, Scorecard
- **Require branches up to date**: Yes
- **Restrict who can push**: @kannan19302 only
- **No force pushes**: Enforced
- **No deletions**: Enforced

---

## 3. CODEOWNERS

File: `.github/CODEOWNERS`

All pull requests require review from @kannan19302. Critical paths
(CI/CD, database migrations, deployment config, security) are
explicitly owned:

```
*                                        @kannan19302
.github/                                 @kannan19302
.ai/                                     @kannan19302
packages/database/prisma/migrations/     @kannan19302
deploy/                                  @kannan19302
docker/                                  @kannan19302
scripts/                                 @kannan19302
AGENTS.md                                @kannan19302
RUNBOOK.md                               @kannan19302
```

---

## 4. Environment Protection Matrix

| Rule | Development | Quality | Staging | Production |
|:---|:---|:---|:---|:---|
| Required reviewers | None | None | None | @kannan19302 |
| Wait timer | 0 min | 5 min | 15 min | Until approval |
| Branch policy | main | main | main | main |
| Admin bypass | Yes | Yes | No | No |
| Deployment logs | Retained | Retained | Retained | Retained |

---

## 5. Access Control

### Policy Modification Authority

Only **@kannan19302** has authority to:

- Create, modify, or delete GitHub environments
- Change environment protection rules (reviewers, wait timers, branch policies)
- Modify branch protection rules
- Edit CODEOWNERS
- Modify CI/CD workflow files (`.github/workflows/`)
- Change deployment configurations (`deploy/`, `docker/`)
- Approve production deployments

### Contributor Permissions

Contributors may:

- Create feature branches and pull requests
- Push code changes (subject to PR review)
- View deployment status and logs
- Comment on PRs and issues

Contributors may NOT:

- Push directly to `main` or `release/*`
- Modify environment settings or protection rules
- Approve production deployments
- Change CI/CD workflows without CODEOWNER approval
- Modify database migrations without CODEOWNER approval
- Force push or delete protected branches

---

## 6. Secrets Management

| Secret | Environments | Purpose |
|:---|:---|:---|
| `DATABASE_URL` | All | PostgreSQL connection string (unique per env) |
| `REDIS_URL` | All | Redis connection string |
| `NEXTAUTH_SECRET` | All | Auth.js signing key (unique per env) |
| `PII_ENCRYPTION_KEY` | All | AES-256 encryption for PII (unique per env) |
| `NEXTAUTH_URL` | All | Frontend URL |
| `NEXT_PUBLIC_API_URL` | All | API URL (unique per env) |
| `SENTRY_DSN` | Staging, Production | Error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Staging, Production | OpenTelemetry |

**Rules**:
- Secrets are scoped per environment — never shared across stages.
- Production secrets are only accessible by the `production` environment.
- Secrets must never appear in logs, image layers, or source code.
- Rotate secrets quarterly. Emergency rotation within 24 hours of compromise.

---

## 7. Incident Response & Rollback

### Emergency Hotfix Process

1. Create `hotfix/<description>` branch from `main`
2. Apply fix and open PR (requires @kannan19302 review)
3. On merge, pipeline runs all gates
4. @kannan19302 can fast-track through environments
5. Production deployment requires approval as usual

### Rollback

- **API**: Re-deploy previous GHCR image tag (`ghcr.io/<repo>/api:<previous-sha>`)
- **Database**: Prisma does not support down migrations — apply a corrective migration
- **Web**: Re-deploy previous build artifact

### On-Call Escalation

Production incidents escalate to @kannan19302. See [RUNBOOK.md](../RUNBOOK.md)
for operational procedures.

---

## 8. Audit & Compliance

- All deployments are tracked via GitHub Environments deployment history
- Every PR requires review — no direct pushes to main
- Production deployments require explicit human approval
- CODEOWNERS ensures critical paths are always reviewed
- Dependency audits run on every CI execution
- CodeQL security scanning on every push
- All container images are signed and stored in GHCR with SHA tags

---

## 9. Setup Checklist

To fully enable this policy, configure the following in GitHub repo settings:

### Branch Protection (Settings → Branches → main)
- [ ] Require pull request before merging
- [ ] Require 1 approving review
- [ ] Dismiss stale reviews on new push
- [ ] Require status checks: `Gate: Lint & Type Check`, `Gate: Unit Tests`, `Gate: Build Web`, `Gate: Docker Build (API)`, `Gate: Migration Drift Check`, `Gate: Production-Readiness Scorecard`
- [ ] Require branches up to date before merging
- [ ] Restrict pushes to @kannan19302
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

### Environments (Settings → Environments)
- [ ] `Development`: No protection rules, main branch only
- [ ] `quality`: 5-minute wait timer, main branch only
- [ ] `staging`: 15-minute wait timer, main branch only
- [ ] `production`: Required reviewer @kannan19302, main branch only

### Security (Settings → Security)
- [ ] Enable code scanning (for CodeQL results upload)
- [ ] Enable Dependabot alerts
- [ ] Enable secret scanning

### General (Settings → General)
- [ ] Default branch: `main`
- [ ] Disable forking (if private)
- [ ] Disable wiki (documentation is in `.ai/`)
