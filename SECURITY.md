# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report suspected vulnerabilities privately via **[GitHub Security Advisories](../../security/advisories/new)**
for this repository. If you cannot use that channel, contact the maintainer directly (see
[README § Contact](README.md#contact)).

Include, where possible:

- Affected module/package and version or commit SHA
- Steps to reproduce (a minimal repro is ideal)
- Impact assessment (data exposure, privilege escalation, tenant isolation bypass, etc.)
- Any suggested remediation

## Response Targets

| Severity                                            | Initial response | Target resolution               |
| :-------------------------------------------------- | :--------------- | :------------------------------ |
| Critical (RCE, auth bypass, cross-tenant data leak) | 24 hours         | 7 days                          |
| High                                                | 3 business days  | 30 days                         |
| Medium / Low                                        | 5 business days  | Best effort, next release cycle |

## Scope

In scope: all code under `apps/`, `packages/`, and infrastructure config (`.github/workflows`,
`Dockerfile*`, `docker-compose*`) in this repository.

Out of scope: third-party dependencies (report upstream — see [Dependabot](.github/dependabot.yml)
for what we track), and issues requiring physical access or social engineering.

## Supported Versions

This project ships from a single `main` branch (no long-lived release branches). Only the latest
commit on `main` receives security fixes.

## Our Practices

- Dependency vulnerability scanning: Dependabot + nightly `pnpm audit` ([security-scan.yml](.github/workflows/security-scan.yml))
- Static analysis: CodeQL ([codeql.yml](.github/workflows/codeql.yml))
- Secret scanning: GitHub secret scanning + push protection (enabled on this repo)
- Tenant isolation: Row-Level Security enforced at the database layer for every tenant-scoped table
- See [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) for the full engineering checklist

Thank you for helping keep UniERP and its users safe.
