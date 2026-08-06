# SECURITY_CHECKLIST.md

> Canonical security evidence pipeline per `PLATFORM_ARCHITECTURE.md § 10`.
> This file maps OWASP Top 10, control ownership, and compliance evidence (SOC 2 / ISO 27001 / GDPR / HIPAA readiness).

## Security Controls by Layer

| Layer             | Controls                                                                                                                                                           | Verified By                               | Status                            |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------- | :-------------------------------- |
| **Network**       | mTLS between services; control-plane ingress IP-allowlisted; egress allowlist; WAF at Traefik                                                                      | Infra tests against staging cluster       | ⚠️ Staging infra pending          |
| **Identity**      | OAuth 2.1 + OIDC, PKCE mandatory, no implicit flow; separate realms per plane; MFA mandatory on control plane; SCIM provisioning                                   | Auth integration suite                    | ✅ Guards implemented             |
| **Authorization** | `@Permissions` on every route (ratchet to 0); `PolicyEngine` single decision point; extension scopes ⊆ installer's                                                 | `check-policy.mjs` route-guard gate       | ✅ 589 unguarded → ratcheting     |
| **Tenant**        | Four-layer isolation; RLS `ENABLE` + `FORCE`; app role `NOBYPASSRLS` at startup                                                                                    | Generated two-tenant test per table       | ⚠️ RLS needs live DB              |
| **Application**   | Zod validation at every boundary; parameterized SQL only (1 reviewed exception); output encoding; CSRF double-submit; strict CSP; `helmet`                         | `check-policy.mjs` raw-SQL gate           | ✅                                |
| **Data**          | TLS 1.3 in transit; AES-256 at rest; column-level encryption for PII/secrets; per-tenant KMS key path; `Decimal(19,4)` for money                                   | Schema policy gate                        | ⚠️ Float→Decimal pending          |
| **Files**         | Content-type sniffing, size caps, AV scan, quarantine-then-promote, signed time-limited URLs, per-tenant MinIO prefix                                              | Storage integration tests                 | ✅                                |
| **API**           | Per-tenant + per-key rate limits; quota enforcement; idempotency keys on all mutations; request signing for webhooks                                               | k6 suite + throttler tests                | ✅                                |
| **Secrets**       | OpenBao / SOPS+age; injected at runtime; never in CI logs; gitleaks at pre-commit, pre-push, and CI in all repos                                                   | Secret-scan gate at three layers          | ✅                                |
| **Supply chain**  | Pinned base-image digests; `pnpm audit` blocking on high/critical; CycloneDX SBOM per image and per published package; cosign signatures; Trivy scan; licence gate | CI, no `continue-on-error`                | ✅                                |
| **Audit**         | Append-only, hash-chained audit log; separate tenant and platform streams; impersonation double-logged                                                             | Audit integrity job                       | ✅                                |
| **Recovery**      | WAL archiving, RPO ≤ 5 min, RTO ≤ 1 h, monthly automated restore verification, quarterly rehearsal                                                                 | Restore-verification job pages on failure | ⚠️ Rehearsal cadence to establish |

## Split-Specific Security Controls

Per § 10 — a polyrepo widens the supply-chain surface:

- [x] **Every published package is signed** via npm provenance / Sigstore (OIDC-federated from CI)
- [x] **Publish tokens are per-repo, short-lived, OIDC-federated** — no long-lived npm token exists
- [x] **Scope reservation** — `@unerp` and `@unierp` reserved; `.npmrc` allowlist enforced
- [x] **Manifest is signed** — unsigned `platform-manifest.json` is not deployable

## OWASP Top 10 Mapping

| OWASP                         | Risk                                   | Control                                                                | Owner                               |
| :---------------------------- | :------------------------------------- | :--------------------------------------------------------------------- | :---------------------------------- |
| A01 Broken Access Control     | RBAC bypass, tenant escalation         | `@Permissions` decorator, `ControlPlaneGuard`, `check-policy.mjs` gate | `apps/api`, `packages/kernel`       |
| A02 Cryptographic Failures    | Unencrypted PII, weak keys             | Column-level encryption, TLS 1.3, per-tenant KMS path                  | `packages/database`, infra          |
| A03 Injection                 | SQL injection, template injection      | Parameterized SQL (1 reviewed exception), Zod boundary validation      | `packages/database`                 |
| A04 Insecure Design           | Missing controls at design time        | ADR process, architecture:check gate, RLS from day 0                   | `packages/kernel`                   |
| A05 Security Misconfiguration | Exposed admin, default creds           | IP allowlist on control plane, mandatory MFA, `helmet`                 | infra, `apps/api`                   |
| A06 Vulnerable Components     | Outdated deps, CVEs                    | `pnpm audit` blocking, Trivy scan, CycloneDX SBOM                      | CI pipeline                         |
| A07 Auth Failures             | Session hijacking, credential stuffing | PKCE mandatory, short sessions, rate limiting on auth routes           | `packages/auth`                     |
| A08 Data Integrity Failures   | Unsigned updates, CI poisoning         | Cosign image signing, manifest signing, gitleaks                       | CI, `scripts/ci/`                   |
| A09 Logging Failures          | Missing audit trail                    | Append-only hash-chained audit log, impersonation double-logged        | `modules/saas/audit-log.service.ts` |
| A10 SSRF                      | Extension HTTP egress to internal      | Manifest-declared egress allowlist, extension sandbox no global fetch  | `packages/sandbox`                  |

## Compliance Readiness

### SOC 2 Type II

| Control Family            | Evidence Source                                    |
| :------------------------ | :------------------------------------------------- |
| CC1 — Control Environment | GOVERNANCE.md, AGENTS.md, ADR process              |
| CC2 — Communication       | Security policy in SECURITY.md, alert runbooks     |
| CC3 — Risk Assessment     | PLATFORM_ARCHITECTURE.md § 1, threat model         |
| CC4 — Monitoring          | Grafana dashboards, SLO definitions, audit log     |
| CC5 — Control Activities  | `check-policy.mjs`, gitleaks, pnpm audit, CI gates |
| CC6 — Logical Access      | RBAC, `PolicyEngine`, RLS, realm separation        |
| CC7 — System Operations   | Runbooks, DR rehearsal, restore verification       |
| CC8 — Change Management   | Git history, signed commits, CD pipeline gates     |
| CC9 — Risk Mitigation     | PgBouncer, rate limiting, circuit breakers         |

### GDPR Article Checklist

- [x] **Art. 25 — Data Protection by Design:** RLS at DB level, column-level PII encryption, tenant isolation enforced structurally
- [x] **Art. 30 — Records of processing:** Append-only audit log with tenant and platform streams
- [x] **Art. 32 — Security of processing:** AES-256 at rest, TLS 1.3 in transit, access control layers
- [x] **Art. 33 — Breach notification:** Audit integrity job, alert rules, incident response runbook
- [ ] **Art. 17 — Right to erasure:** Implementation pending — `data-export.service.ts` handles export; deletion path needs review
- [ ] **Art. 20 — Data portability:** `data-export.service.ts` exists; machine-readable format verification pending

### HIPAA (healthcare extension)

- [x] **§ 164.312(a)(1) — Access control:** RBAC, unique user identification, automatic logoff
- [x] **§ 164.312(b) — Audit controls:** Append-only audit log, access logging
- [x] **§ 164.312(e)(1) — Transmission security:** TLS 1.3, mTLS between services
- [ ] **§ 164.308(a)(7) — Contingency plan:** DR rehearsal cadence to be established

## Security Gates in CI

```
scripts/ci/check-policy.mjs       # @Permissions ratchet, raw-SQL gate, control-plane namespaces
scripts/ci/check-secrets.mjs      # gitleaks equivalent, pre-commit + CI
scripts/ci/check-licenses.mjs     # OSI-approved licenses only
scripts/ci/check-suppressions.mjs # @ts-nocheck ratchet must not increase
scripts/ci/check-migration-safety.mjs  # Destructive migration guard
```
