# FEATURE_LEDGER.md — Every Functionality in UniERP (single file, whole system)

> **Generated file** — `node scripts/feature-ledger.mjs`. Do not edit by hand.
> Last generated: 2026-07-12T02:05:19.691Z
>
> One row per API-backed functionality (method + route + summary + permission),
> scanned directly from every controller — so it always reflects existing **and**
> newly shipped features. `AUTOPILOT.md` Step 7 mandates regenerating this file in
> every cycle that ships code; agents use it to answer "does X already exist?"
> before building anything.

## System total: **2010 features** across 33 modules

| Module | Features |
|:--|--:|
| [admin](#admin) | 181 |
| [advanced-finance](#advanced-finance) | 502 |
| [advanced-hr](#advanced-hr) | 90 |
| [ai](#ai) | 13 |
| [analytics](#analytics) | 12 |
| [api-platform](#api-platform) | 9 |
| [auth](#auth) | 17 |
| [builder](#builder) | 177 |
| [communication](#communication) | 41 |
| [crm](#crm) | 474 |
| [devops](#devops) | 3 |
| [documents](#documents) | 21 |
| [ecommerce](#ecommerce) | 23 |
| [ext-gateway](#ext-gateway) | 3 |
| [finance](#finance) | 27 |
| [fixed-assets](#fixed-assets) | 9 |
| [hr](#hr) | 8 |
| [inventory](#inventory) | 104 |
| [localization](#localization) | 4 |
| [manufacturing](#manufacturing) | 43 |
| [marketplace](#marketplace) | 17 |
| [notifications](#notifications) | 6 |
| [pos](#pos) | 73 |
| [procurement](#procurement) | 38 |
| [projects](#projects) | 25 |
| [pwa](#pwa) | 3 |
| [reporting](#reporting) | 12 |
| [saas](#saas) | 13 |
| [sales](#sales) | 29 |
| [storage](#storage) | 6 |
| [subscriptions](#subscriptions) | 14 |
| [supply-chain](#supply-chain) | 5 |
| [workflow](#workflow) | 8 |

## admin

181 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/admin/activity-feed` | Get activity feed | `admin.setting.read` |
| GET | `/admin/users` | Get users | `admin.user.read` |
| POST | `/admin/users` | Create user | `admin.user.read` |
| PATCH | `/admin/users/:id` | Update user | `admin.user.update` |
| GET | `/admin/roles` | Get roles | `admin.role.read` |
| GET | `/admin/settings` | Get settings | `admin.role.read` |
| PATCH | `/admin/settings` | Update settings | `admin.setting.read` |
| GET | `/admin/demo/status` | Get demo status | `admin.setting.read` |
| POST | `/admin/demo/load` | Load demo data | `admin.setting.read` |
| DELETE | `/admin/demo/remove` | Remove demo data | `admin.demo.manage` |
| DELETE | `/admin/demo/remove/:module` | Remove demo data for module | `admin.demo.manage` |
| GET | `/admin/access-packages` | Get access packages | `admin.access-package.read` |
| POST | `/admin/access-packages` | Create access package | `admin.access-package.read` |
| PATCH | `/admin/access-packages/:id` | Update access package | `admin.access-package.update` |
| DELETE | `/admin/access-packages/:id` | Delete access package | `admin.access-package.delete` |
| POST | `/admin/access-packages/:id/assign-role` | Assign access package to role | `admin.access-package.update` |
| DELETE | `/admin/access-packages/:id/unassign-role/:roleId` | Unassign access package from role | `admin.access-package.update` |
| GET | `/admin/groups` | Get groups | `admin.user-group.read` |
| POST | `/admin/groups` | Create group | `admin.user-group.read` |
| PATCH | `/admin/groups/:id` | Update group | `admin.user-group.update` |
| DELETE | `/admin/groups/:id` | Delete group | `admin.user-group.delete` |
| GET | `/admin/groups/:id/members` | Get group members | `admin.user-group.read` |
| POST | `/admin/groups/:id/members` | Add group members | `admin.user-group.update` |
| DELETE | `/admin/groups/:id/members/:userId` | Remove group member | `admin.user-group.update` |
| GET | `/admin/alerts` | Get alerts | `admin.alerts.read` |
| POST | `/admin/alerts/:id/read` | Mark read | `admin.alerts.update` |
| POST | `/admin/alerts/:id/dismiss` | Dismiss alert | `admin.alerts.update` |
| POST | `/admin/alerts/mark-all-read` | Mark all read | `admin.alerts.update` |
| GET | `/admin/alerts/thresholds` | Get thresholds | `admin.alerts.update` |
| POST | `/admin/alerts/thresholds` | Upsert threshold | `admin.alerts.read` |
| DELETE | `/admin/alerts/thresholds/:id` | Delete threshold | `admin.alerts.update` |
| GET | `/admin/announcements` | Get announcements | `admin.setting.read` |
| POST | `/admin/announcements` | Create announcement | `admin.setting.read` |
| PATCH | `/admin/announcements/:id` | Update announcement | `admin.setting.update` |
| DELETE | `/admin/announcements/:id` | Delete announcement | `admin.setting.update` |
| GET | `/admin/automation-rules` | Get rules | `admin.automation.read` |
| GET | `/admin/automation-rules/executions` | Get execution history | `admin.automation.read` |
| GET | `/admin/automation-rules/:id` | Get rule | `admin.automation.read` |
| POST | `/admin/automation-rules` | Create rule | `admin.automation.create` |
| PATCH | `/admin/automation-rules/:id` | Update rule | `admin.automation.update` |
| DELETE | `/admin/automation-rules/:id` | Delete rule | `admin.automation.delete` |
| POST | `/admin/automation-rules/:id/test` | Test rule | `admin.automation.update` |
| POST | `/admin/bulk-operations` | Create | `admin.bulk-ops.create` |
| GET | `/admin/bulk-operations` | List | `admin.bulk-ops.read` |
| GET | `/admin/bulk-operations/entity-counts` | Get entity counts | `admin.bulk-ops.read` |
| GET | `/admin/bulk-operations/:id` | Get by id | `admin.bulk-ops.read` |
| GET | `/admin/custom-fields` | Get definitions | `admin.custom-fields.read` |
| GET | `/admin/custom-fields/entity-types` | Get entity types | `admin.custom-fields.read` |
| POST | `/admin/custom-fields` | Create definition | `admin.custom-fields.read` |
| PATCH | `/admin/custom-fields/:id` | Update definition | `admin.custom-fields.update` |
| DELETE | `/admin/custom-fields/:id` | Delete definition | `admin.custom-fields.delete` |
| GET | `/admin/custom-fields/values/:entityType/:entityId` | Get values | `admin.custom-fields.read` |
| PUT | `/admin/custom-fields/values/:entityType/:entityId` | Save values | `admin.custom-fields.update` |
| POST | `/admin/data-quality/scan/:entityType` | Scan for duplicates | `admin.data-quality.update` |
| GET | `/admin/data-quality/duplicates` | Get duplicate sets | `admin.data-quality.read` |
| POST | `/admin/data-quality/merge` | Merge records | `admin.data-quality.update` |
| POST | `/admin/data-quality/:id/dismiss` | Dismiss set | `admin.data-quality.update` |
| GET | `/admin/delegations` | List | `admin.delegations.read` |
| POST | `/admin/delegations` | Create | `admin.delegations.read` |
| PATCH | `/admin/delegations/:id` | Update | `admin.delegations.update` |
| POST | `/admin/delegations/:id/revoke` | Revoke | `admin.delegations.update` |
| POST | `/public/error-reports` | Submit client-side error report | — |
| GET | `/admin/gdpr/retention-policies` | Get retention policies | `admin.setting.read` |
| POST | `/admin/gdpr/retention-policies` | Upsert retention policy | `admin.setting.read` |
| GET | `/admin/gdpr/erasure-requests` | Get erasure requests | `admin.setting.read` |
| POST | `/admin/gdpr/erasure-requests` | Create erasure request | `admin.setting.read` |
| POST | `/admin/gdpr/erasure-requests/:id/execute` | Execute erasure | `admin.setting.read` |
| POST | `/admin/gdpr/data-export/:email` | Export subject data | `admin.setting.read` |
| GET | `/admin/imports` | List import history | `admin.setting.read` |
| POST | `/admin/imports/validate` | Validate import | `admin.setting.read` |
| POST | `/admin/imports/execute` | Execute import | `admin.setting.read` |
| GET | `/admin/imports/exports/:entityType` | Export data | `admin.setting.read` |
| GET | `/admin/marketplace/apps` | Get apps | `admin.platform.read` |
| GET | `/admin/marketplace/apps/:slug` | Get app | `admin.platform.read` |
| GET | `/admin/marketplace/apps/:slug/related` | Get related apps | `admin.platform.read` |
| GET | `/admin/marketplace/stats` | Get stats | `admin.platform.read` |
| GET | `/admin/marketplace/installed` | Get installed apps | `admin.platform.read` |
| POST | `/admin/marketplace/install/:slug` | Install app | `admin.platform.read` |
| DELETE | `/admin/marketplace/uninstall/:slug` | Uninstall app | `admin.platform.update` |
| GET | `/admin/marketplace/installed/:slug/config` | Get app config | `admin.platform.update` |
| PUT | `/admin/marketplace/installed/:slug/config` | Update app config | `admin.platform.read` |
| GET | `/admin/marketplace/installed/:slug/modules` | Get installed app modules | `admin.platform.read` |
| GET | `/admin/marketplace/installed/:slug/metrics` | Get installed app metrics | `admin.platform.read` |
| PUT | `/admin/marketplace/installed/:slug/modules/:moduleSlug` | Set module enabled | `admin.platform.read` |
| GET | `/admin/marketplace/apps/:slug/reviews` | Get reviews | `admin.platform.read` |
| POST | `/admin/marketplace/apps/:slug/reviews` | Create review | `admin.platform.read` |
| PUT | `/admin/marketplace/reviews/:id` | Update review | `admin.platform.update` |
| DELETE | `/admin/marketplace/reviews/:id` | Delete review | `admin.platform.update` |
| POST | `/admin/marketplace/reviews/:id/helpful` | Mark review helpful | `admin.platform.update` |
| GET | `/admin/marketplace/apps/:slug/changelog` | Get changelogs | `admin.platform.read` |
| GET | `/admin/marketplace/collections` | Get collections | `admin.platform.read` |
| GET | `/admin/marketplace/collections/:slug` | Get collection | `admin.platform.read` |
| POST | `/admin/marketplace/collections` | Create collection | `admin.platform.read` |
| PUT | `/admin/marketplace/collections/:id` | Update collection | `admin.platform.update` |
| DELETE | `/admin/marketplace/collections/:id` | Delete collection | `admin.platform.update` |
| POST | `/admin/marketplace/collections/:id/apps` | Add app to collection | `admin.platform.update` |
| DELETE | `/admin/marketplace/collections/:collectionId/apps/:appId` | Remove app from collection | `admin.platform.update` |
| GET | `/admin/marketplace/favorites` | Get favorites | `admin.platform.read` |
| POST | `/admin/marketplace/favorites/:slug` | Add favorite | `admin.platform.read` |
| DELETE | `/admin/marketplace/favorites/:slug` | Remove favorite | `admin.platform.read` |
| GET | `/admin/marketplace/submissions` | Get submissions | `admin.platform.read` |
| POST | `/admin/marketplace/submissions` | Create submission | `admin.platform.read` |
| PUT | `/admin/marketplace/submissions/:id/approve` | Approve submission | `admin.platform.update` |
| PUT | `/admin/marketplace/submissions/:id/reject` | Reject submission | `admin.platform.update` |
| POST | `/admin/marketplace/seed` | Seed apps | `admin.platform.update` |
| GET | `/admin/operations/health` | Get system health | `admin.operations.read` |
| GET | `/admin/operations/jobs` | Get background jobs | `admin.operations.read` |
| POST | `/admin/operations/jobs/retry` | Retry jobs | `admin.operations.read` |
| GET | `/admin/operations/tasks` | Get scheduled tasks | `admin.operations.update` |
| POST | `/admin/operations/tasks/:id/trigger` | Trigger task | `admin.operations.read` |
| GET | `/admin/operations/logs` | Get error logs | `admin.operations.update` |
| POST | `/admin/operations/logs/:id/resolve` | Resolve error log | `admin.operations.update` |
| GET | `/admin/operations/backups` | Get backups (platform-wide, Super Admin only) | `system.operations.backup` |
| POST | `/admin/operations/backups/create` | Create backup (platform-wide, Super Admin only) | `system.operations.backup` |
| GET | `/admin/operations/db-schema` | Get db schema | `admin.operations.read` |
| GET | `/admin/org-hierarchy/tree` | Get org tree | `admin.org-hierarchy.read` |
| GET | `/admin/org-hierarchy/departments` | Get departments | `admin.org-hierarchy.read` |
| POST | `/admin/org-hierarchy/departments` | Create department | `admin.org-hierarchy.read` |
| PATCH | `/admin/org-hierarchy/departments/:id` | Update department | `admin.org-hierarchy.update` |
| DELETE | `/admin/org-hierarchy/departments/:id` | Delete department | `admin.org-hierarchy.delete` |
| GET | `/admin/org-hierarchy/cost-centers/:orgId` | Get cost centers | `admin.org-hierarchy.read` |
| POST | `/admin/org-hierarchy/cost-centers` | Create cost center | `admin.org-hierarchy.create` |
| PATCH | `/admin/org-hierarchy/cost-centers/:id` | Update cost center | `admin.org-hierarchy.update` |
| DELETE | `/admin/org-hierarchy/cost-centers/:id` | Delete cost center | `admin.org-hierarchy.delete` |
| GET | `/admin/platform/modules` | Get modules | `admin.platform.read` |
| POST | `/admin/platform/modules/:name/toggle` | Toggle module | `admin.platform.read` |
| GET | `/admin/platform/feature-flags` | Get feature flags | `admin.platform.read` |
| POST | `/admin/platform/feature-flags/:key/toggle` | Save feature flag | `admin.platform.read` |
| GET | `/admin/platform/domains` | Get custom domains | `admin.platform.read` |
| POST | `/admin/platform/domains` | Add custom domain | `admin.platform.read` |
| GET | `/admin/platform/environments` | Get environments | `admin.platform.read` |
| POST | `/admin/platform/environments/:type/sync` | Sync environment | `admin.platform.read` |
| GET | `/admin/platform/maintenance` | Get maintenance mode | `admin.platform.read` |
| POST | `/admin/platform/maintenance` | Save maintenance mode | `admin.platform.read` |
| GET | `/admin/platform/smtp` | Get smtp config | `admin.platform.read` |
| POST | `/admin/platform/smtp` | Save smtp config | `admin.platform.read` |
| GET | `/admin/platform/login-customizer` | Get login customizer | `admin.platform.read` |
| POST | `/admin/platform/login-customizer` | Save login customizer | `admin.platform.read` |
| GET | `/admin/platform/email-templates` | Get email templates | `admin.platform.read` |
| POST | `/admin/platform/email-templates` | Save email template | `admin.platform.read` |
| DELETE | `/admin/platform/email-templates/:id` | Delete email template | `admin.platform.update` |
| GET | `/admin/platform/usage-analytics` | Get usage analytics | `admin.platform.read` |
| GET | `/admin/platform/white-label` | Get white label settings | `admin.platform.read` |
| POST | `/admin/platform/white-label` | Save white label settings | `admin.platform.read` |
| GET | `/admin/platform/updates` | Get system updates | `admin.platform.update` |
| POST | `/admin/platform/check-updates` | Check for updates | `admin.platform.read` |
| GET | `/admin/recycle-bin` | Get items | `admin.recycle-bin.read` |
| GET | `/admin/recycle-bin/stats` | Get stats | `admin.recycle-bin.read` |
| POST | `/admin/recycle-bin/:id/restore` | Restore item | `admin.recycle-bin.read` |
| DELETE | `/admin/recycle-bin/:id` | Permanent delete | `admin.recycle-bin.delete` |
| POST | `/admin/recycle-bin/purge` | Purge all | `admin.recycle-bin.delete` |
| GET | `/admin/security/audit-logs` | Get audit logs | `admin.security.read` |
| GET | `/admin/security/sessions` | Get active sessions | `admin.security.read` |
| DELETE | `/admin/security/sessions/:id` | Revoke session | `admin.security.read` |
| GET | `/admin/security/password-policy` | Get password policy | `admin.security.read` |
| POST | `/admin/security/password-policy` | Save password policy | `admin.security.read` |
| GET | `/admin/security/sso` | Get sso configs | `admin.security.read` |
| POST | `/admin/security/sso` | Save sso config | `admin.security.read` |
| GET | `/admin/security/mfa` | Get mfa settings | `admin.security.read` |
| POST | `/admin/security/mfa` | Save mfa settings | `admin.security.read` |
| GET | `/admin/security/ip-restrictions` | Get ip restrictions | `admin.security.read` |
| POST | `/admin/security/ip-restrictions` | Create ip restriction | `admin.security.read` |
| DELETE | `/admin/security/ip-restrictions/:id` | Delete ip restriction | `admin.security.update` |
| POST | `/admin/security/impersonate/:userId` | Impersonate user | `admin.security.update` |
| GET | `/admin/security/data-retention` | Get data retention policies | `admin.security.read` |
| POST | `/admin/security/data-retention` | Save data retention policy | `admin.security.read` |
| DELETE | `/admin/security/data-retention/:id` | Delete data retention policy | `admin.security.update` |
| GET | `/admin/security/compliance/reports` | Get compliance reports | `admin.security.read` |
| POST | `/admin/security/compliance/generate` | Generate compliance report | `admin.security.read` |
| GET | `/admin/subscription/current` | Get current plan | `admin.subscription.read` |
| GET | `/admin/subscription/plans` | Get available plans | `admin.subscription.read` |
| POST | `/admin/subscription/change-plan` | Change plan | `admin.subscription.read` |
| POST | `/admin/subscription/seats` | Update seats | `admin.subscription.update` |
| GET | `/admin/subscription/billing-history` | Get billing history | `admin.subscription.read` |
| GET | `/super-admin/tenants` | Get tenants | `system.tenant.read` |
| GET | `/super-admin/tenants/:id` | Get tenant detail | `system.tenant.read` |
| POST | `/super-admin/tenants` | Provision tenant | `system.tenant.read` |
| PATCH | `/super-admin/tenants/:id` | Update tenant | `system.tenant.update` |
| GET | `/super-admin/admins` | Get all admins | `system.superadmin.access` |
| GET | `/super-admin/analytics` | Get analytics | `system.superadmin.access` |
| GET | `/super-admin/health` | Get system health | `system.analytics.read` |

## advanced-finance

502 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/advanced-finance/exchange-rates` | Get exchange rates | `finance.treasury.read` |
| GET | `/advanced-finance/accounts` | Get chart of accounts | `finance.treasury.read` |
| GET | `/advanced-finance/accounts/:id` | Get account by ID | `finance.account.read` |
| POST | `/advanced-finance/accounts` | Create ledger account | `finance.account.read` |
| PATCH | `/advanced-finance/accounts/:id` | Update ledger account | `finance.account.create` |
| DELETE | `/advanced-finance/accounts/:id` | Delete ledger account | `finance.account.create` |
| GET | `/advanced-finance/accounts/:id/ledger` | Get GL ledger for a specific account | `finance.account.read` |
| GET | `/advanced-finance/cost-centers` | Get cost centers | `finance.account.read` |
| POST | `/advanced-finance/cost-centers` | Create cost center | `finance.account.read` |
| PATCH | `/advanced-finance/cost-centers/:id` | Update cost center | `finance.account.create` |
| DELETE | `/advanced-finance/cost-centers/:id` | Delete cost center | `finance.account.create` |
| GET | `/advanced-finance/journals` | Get journal entries | `finance.journal.read` |
| GET | `/advanced-finance/journals/:id` | Get journal entry by ID | `finance.journal.read` |
| POST | `/advanced-finance/journals` | Create journal entry | `finance.journal.read` |
| POST | `/advanced-finance/journals/:id/submit` | Submit journal for approval | `finance.journal.create` |
| POST | `/advanced-finance/journals/:id/approve` | Approve journal entry | `finance.journal.approve` |
| POST | `/advanced-finance/journals/:id/post` | Post journal to general ledger | `finance.journal.approve` |
| POST | `/advanced-finance/journals/:id/reject` | Reject journal entry | `finance.journal.approve` |
| POST | `/advanced-finance/journals/:id/reverse` | Reverse a posted journal entry | `finance.journal.reverse` |
| GET | `/advanced-finance/budgets` | Get budgets | `finance.budget.read` |
| GET | `/advanced-finance/budgets/:id` | Get budget by ID | `finance.budget.read` |
| POST | `/advanced-finance/budgets` | Create budget | `finance.budget.read` |
| PATCH | `/advanced-finance/budgets/:id` | Update budget | `finance.budget.create` |
| DELETE | `/advanced-finance/budgets/:id` | Delete budget | `finance.budget.delete` |
| GET | `/advanced-finance/budgets/:id/vs-actuals` | Budget vs actuals comparison | `finance.budget.read` |
| GET | `/advanced-finance/bank-reconciliations` | Get bank reconciliations | `finance.budget.read` |
| POST | `/advanced-finance/bank-reconciliations` | Create bank reconciliation | `finance.bank-recon.read` |
| GET | `/advanced-finance/financial-periods` | Get financial periods | `finance.period.read` |
| POST | `/advanced-finance/financial-periods` | Create financial period | `finance.period.read` |
| POST | `/advanced-finance/financial-periods/:id/close` | Close financial period | `finance.period.close` |
| POST | `/advanced-finance/financial-periods/:id/reopen` | Reopen financial period | `finance.period.close` |
| GET | `/advanced-finance/financial-periods/:id/close-checklist` | Get period close checklist | `finance.period.read` |
| GET | `/advanced-finance/bank-accounts` | Get bank accounts | `finance.period.read` |
| POST | `/advanced-finance/bank-accounts` | Create bank account | `finance.bank-account.read` |
| GET | `/advanced-finance/credit-notes` | Get credit notes | `finance.tax.read` |
| POST | `/advanced-finance/credit-notes` | Create credit note | `finance.tax.read` |
| GET | `/advanced-finance/debit-notes` | Get debit notes | `finance.tax.read` |
| POST | `/advanced-finance/debit-notes` | Create debit note | `finance.tax.read` |
| GET | `/advanced-finance/dunning-levels` | Get dunning levels | `finance.tax.read` |
| POST | `/advanced-finance/dunning-levels` | Create dunning level | `finance.tax.read` |
| GET | `/advanced-finance/dunning-runs` | Get dunning runs | `finance.tax.read` |
| POST | `/advanced-finance/dunning-runs` | Create dunning run | `finance.tax.read` |
| GET | `/advanced-finance/payment-schedules` | Get payment schedules | `finance.treasury.read` |
| POST | `/advanced-finance/payment-schedules` | Create payment schedule | `finance.treasury.read` |
| GET | `/advanced-finance/payment-runs` | Get payment runs | `finance.treasury.read` |
| POST | `/advanced-finance/payment-runs` | Create payment run | `finance.treasury.read` |
| POST | `/advanced-finance/payment-runs/:id/approve` | Approve payment run | `finance.treasury.create` |
| GET | `/advanced-finance/forecast-scenarios` | Get forecast scenarios | `finance.treasury.read` |
| POST | `/advanced-finance/forecast-scenarios` | Create forecast scenario | `finance.treasury.read` |
| GET | `/advanced-finance/reports/pnl` | Get profit and loss | `finance.report.read` |
| GET | `/advanced-finance/reports/balance-sheet` | Get balance sheet | `finance.report.read` |
| GET | `/advanced-finance/reports/cash-flow` | Get cash flow | `finance.report.read` |
| GET | `/advanced-finance/reports/trial-balance` | Get trial balance | `finance.report.read` |
| GET | `/advanced-finance/reports/aging` | Get aging report | `finance.report.read` |
| GET | `/advanced-finance/budget-vs-actuals` | Get budget vs actuals | `finance.budget.read` |
| GET | `/advanced-finance/analytics/invoices` | Get invoice analytics | `finance.report.read` |
| GET | `/advanced-finance/reports/ap-aging` | Get AP aging report | `finance.report.read` |
| POST | `/advanced-finance/invoices/:id/write-off` | Write off invoice | `finance.report.read` |
| POST | `/advanced-finance/invoices/:id/proforma` | Create proforma invoice | `finance.invoice.create` |
| GET | `/advanced-finance/late-fees/calculate` | Calculate late fees | `finance.tax.compute` |
| GET | `/advanced-finance/dashboard/kpis` | Get finance dashboard KPIs | `finance.tax.compute` |
| GET | `/advanced-finance/cash-flow/13-week` | Get 13-week cash forecast | `finance.report.read` |
| GET | `/advanced-finance/budgets/monthly-spread` | Get budget monthly spread | `finance.report.read` |
| GET | `/advanced-finance/accounts/:id/drilldown` | Get GL account drill down | `finance.account.read` |
| GET | `/advanced-finance/analytics/customer-payment-behavior` | Get customer payment behavior | `finance.report.read` |
| GET | `/advanced-finance/analytics/vendor-payment` | Get vendor payment analysis | `finance.report.read` |
| GET | `/advanced-finance/tax-filings/summary` | Get tax filing summary | `finance.report.read` |
| GET | `/advanced-finance/payment-terms` | Get payment terms templates | `finance.payment.read` |
| GET | `/advanced-finance/payment-terms/:id` | Get payment term template by ID | `finance.payment.read` |
| POST | `/advanced-finance/payment-terms` | Create payment term template | `finance.payment.create` |
| PATCH | `/advanced-finance/payment-terms/:id` | Update payment term template | `finance.payment.create` |
| DELETE | `/advanced-finance/payment-terms/:id` | Delete payment term template | `finance.payment.create` |
| GET | `/advanced-finance/bank-feeds/connections` | Get bank connections | `finance.bank-account.read` |
| POST | `/advanced-finance/bank-feeds/connections` | Create bank connection | `finance.bank-account.read` |
| DELETE | `/advanced-finance/bank-feeds/connections/:id` | Delete bank connection | `finance.bank-account.update` |
| POST | `/advanced-finance/bank-feeds/connections/:id/sync` | Sync bank connection transactions | `finance.bank-account.update` |
| GET | `/advanced-finance/bank-feeds/transactions` | Get bank transactions | `finance.bank-recon.read` |
| POST | `/advanced-finance/bank-feeds/transactions/:id/auto-match` | Auto-match bank transaction | `finance.bank-recon.match` |
| POST | `/advanced-finance/bank-feeds/transactions/:id/manual-match` | Manual match bank transaction | `finance.bank-recon.match` |
| POST | `/advanced-finance/bank-feeds/transactions/:id/ignore` | Ignore bank transaction | `finance.bank-recon.match` |
| GET | `/advanced-finance/cash-flow/forecast` | Get rolling 13-week cash flow forecast | `finance.report.read` |
| POST | `/advanced-finance/cash-flow/forecast/adjust` | Save weekly forecast manual adjustment | `finance.report.create` |
| GET | `/advanced-finance/cash-flow/forecast/scenarios` | Get custom forecast scenarios | `finance.report.read` |
| POST | `/advanced-finance/cash-flow/forecast/scenarios` | Create custom forecast scenario | `finance.report.read` |
| PATCH | `/advanced-finance/cash-flow/forecast/scenarios/:id` | Update custom forecast scenario | `finance.report.create` |
| DELETE | `/advanced-finance/cash-flow/forecast/scenarios/:id` | Delete custom forecast scenario | `finance.report.create` |
| GET | `/advanced-finance/cash-flow/forecast/compare` | Compare scenarios side-by-side | `finance.report.read` |
| GET | `/advanced-finance/cash-flow/forecast/export` | Export forecast to CSV | `finance.report.read` |
| GET | `/advanced-finance/intercompany/transactions` | Get intercompany transactions list | `finance.report.read` |
| POST | `/advanced-finance/intercompany/auto-match` | Run intercompany automatic transaction matching | `finance.report.create` |
| POST | `/advanced-finance/intercompany/manual-match` | Manually match intercompany transaction pair | `finance.report.create` |
| POST | `/advanced-finance/intercompany/eliminate/:id` | Run netting elimination entry for intercompany matched transaction | `finance.report.create` |
| GET | `/advanced-finance/intercompany/stats` | Get intercompany netting consolidated stats | `finance.report.read` |
| GET | `/advanced-finance/intercompany/elimination-rules` | Get all intercompany elimination rules | `finance.eliminations.read` |
| GET | `/advanced-finance/intercompany/elimination-rules/:id` | Get intercompany elimination rule by ID | `finance.eliminations.read` |
| POST | `/advanced-finance/intercompany/elimination-rules` | Create intercompany elimination rule | `finance.eliminations.manage` |
| PATCH | `/advanced-finance/intercompany/elimination-rules/:id` | Update intercompany elimination rule | `finance.eliminations.manage` |
| DELETE | `/advanced-finance/intercompany/elimination-rules/:id` | Delete intercompany elimination rule | `finance.eliminations.manage` |
| GET | `/advanced-finance/intercompany/elimination-runs` | Get intercompany elimination runs | `finance.eliminations.read` |
| POST | `/advanced-finance/intercompany/elimination-runs` | Execute intercompany elimination run | `finance.eliminations.read` |
| POST | `/advanced-finance/intercompany/elimination-runs/:id/post` | Post/approve intercompany elimination run | `finance.eliminations.run` |
| GET | `/advanced-finance/fx-revaluation/runs` | Get FX revaluation runs list | `finance.report.read` |
| POST | `/advanced-finance/fx-revaluation/runs` | Create draft FX revaluation run | `finance.report.read` |
| POST | `/advanced-finance/fx-revaluation/runs/:id/post` | Post FX revaluation run adjustments to GL ledger | `finance.report.create` |
| GET | `/advanced-finance/fx-revaluation/runs/:id/details` | Get details of FX revaluation run | `finance.report.read` |
| POST | `/advanced-finance/exchange-rates` | Update exchange rate | `finance.treasury.create` |
| GET | `/advanced-finance/currency-convert` | Convert currency | `finance.treasury.read` |
| GET | `/advanced-finance/compute-tax` | Compute tax | `finance.tax.compute` |
| GET | `/advanced-finance/recurring-schedules` | List recurring invoice schedules | `finance.journal.read` |
| POST | `/advanced-finance/recurring-schedules` | Create recurring invoice schedule | `finance.journal.create` |
| POST | `/advanced-finance/recurring/generate` | Generate recurring invoices | `finance.journal.create` |
| POST | `/advanced-finance/bank-reconciliations/:id/auto-match` | Auto match reconciliation | `finance.bank-recon.match` |
| POST | `/advanced-finance/bank-reconciliations/import` | Import bank statement | `finance.bank-recon.create` |
| GET | `/advanced-finance/expense-reports` | Get expense reports | `finance.expense.read` |
| GET | `/advanced-finance/expense-reports/:id` | Get expense report by ID | `finance.expense.read` |
| POST | `/advanced-finance/expense-reports` | Create expense report | `finance.expense.create` |
| POST | `/advanced-finance/expense-reports/:id/submit` | Submit expense report for approval | `finance.expense.create` |
| POST | `/advanced-finance/expense-reports/:id/approve` | Approve expense report | `finance.expense.approve` |
| POST | `/advanced-finance/expense-reports/:id/reject` | Reject expense report | `finance.expense.reject` |
| POST | `/advanced-finance/expense-reports/:id/pay` | Mark expense report as paid | `finance.expense.approve` |
| POST | `/advanced-finance/expense-reports/:id/second-approve` | Second-level approve expense report (over threshold) | `finance.expense.approve` |
| POST | `/advanced-finance/expense-reports/:id/items` | Add expense line item to report | `finance.expense.create` |
| PATCH | `/advanced-finance/expense-items/:itemId` | Update expense line item | `finance.expense.create` |
| DELETE | `/advanced-finance/expense-items/:itemId` | Delete expense line item | `finance.expense.create` |
| POST | `/advanced-finance/expenses/ocr-scan` | Scan a receipt (simulated OCR extraction of merchant/amount/date/category) | `finance.expense.create` |
| GET | `/advanced-finance/expense-policies` | List expense category policies | `finance.expense.read` |
| POST | `/advanced-finance/expense-policies` | Create or update an expense category policy | `finance.expense.approve` |
| DELETE | `/advanced-finance/expense-policies/:id` | Delete an expense category policy | `finance.expense.approve` |
| GET | `/advanced-finance/mileage-rates` | List mileage rates | `finance.expense.read` |
| POST | `/advanced-finance/mileage-rates` | Create a mileage rate | `finance.expense.approve` |
| GET | `/advanced-finance/per-diem-rates` | List per-diem rates | `finance.expense.read` |
| POST | `/advanced-finance/per-diem-rates` | Create or update a per-diem rate | `finance.expense.approve` |
| GET | `/advanced-finance/corporate-cards` | List corporate cards | `finance.expense.read` |
| POST | `/advanced-finance/corporate-cards` | Register a corporate card | `finance.expense.approve` |
| POST | `/advanced-finance/corporate-cards/:id/transactions/import` | Import corporate card transactions (feed simulation) | `finance.expense.approve` |
| GET | `/advanced-finance/corporate-card-transactions/unmatched` | List unmatched corporate card transactions | `finance.expense.read` |
| POST | `/advanced-finance/corporate-card-transactions/:id/match` | Match a corporate card transaction to an expense item | `finance.expense.create` |
| POST | `/advanced-finance/corporate-card-transactions/:id/ignore` | Ignore a corporate card transaction | `finance.expense.create` |
| GET | `/advanced-finance/expense-analytics` | Expense analytics: spend by category, status, policy violations | `finance.expense.read` |
| GET | `/advanced-finance/revenue-schedules` | Get revenue schedules | `finance.revenue.read` |
| GET | `/advanced-finance/revenue-schedules/:id` | Get revenue schedule by ID | `finance.revenue.read` |
| POST | `/advanced-finance/revenue-schedules` | Create revenue schedule | `finance.revenue.create` |
| POST | `/advanced-finance/revenue-schedules/:id/recognize` | Recognize revenue (manual) | `finance.revenue.recognize` |
| POST | `/advanced-finance/revenue-recognition/asc606` | Run ASC 606 automated revenue recognition | `finance.revenue.recognize` |
| GET | `/advanced-finance/cash-position` | Get cash position | `finance.report.read` |
| GET | `/advanced-finance/financial-ratios` | Get financial ratios | `finance.report.read` |
| GET | `/advanced-finance/cash-flow-forecast` | Get cash flow forecast | `finance.report.read` |
| GET | `/advanced-finance/audit-logs` | Get finance audit logs | `finance.audit.read` |
| GET | `/advanced-finance/tax-returns/compute` | Compute tax return | `finance.tax.compute` |
| GET | `/advanced-finance/accounts/:id/reconcile` | Reconcile account | `finance.bank-recon.read` |
| GET | `/advanced-finance/consolidation/overview` | Get live consolidation overview | `finance.consolidation.read` |
| GET | `/advanced-finance/consolidation/runs` | Get consolidation run history | `finance.consolidation.read` |
| POST | `/advanced-finance/consolidation/run` | Run consolidation | `finance.consolidation.run` |
| POST | `/advanced-finance/consolidation/multi-currency` | Run multi-currency consolidation with translation | `finance.consolidation.run` |
| POST | `/advanced-finance/bank-reconciliations/:id/smart-match` | Smart match bank transactions | `finance.bank-recon.match` |
| PATCH | `/advanced-finance/bank-accounts/:id` | Update bank account | `finance.bank-account.update` |
| POST | `/advanced-finance/inter-company-transfers` | Create intercompany transfer | `finance.treasury.create` |
| POST | `/advanced-finance/inter-company-transfers/:id/approve` | Approve intercompany transfer | `finance.treasury.create` |
| POST | `/advanced-finance/tax-rules` | Create tax rule | `finance.tax.create` |
| GET | `/advanced-finance/tax-rules` | Get tax rules | `finance.tax.read` |
| POST | `/advanced-finance/withholding-taxes` | Create withholding tax | `finance.tax.create` |
| GET | `/advanced-finance/withholding-taxes` | Get withholding taxes | `finance.tax.read` |
| POST | `/advanced-finance/tax-filings` | Create tax filing | `finance.tax.create` |
| GET | `/advanced-finance/tax-filings` | Get tax filings | `finance.tax.read` |
| POST | `/advanced-finance/investment-portfolios` | Create investment portfolio | `finance.treasury.create` |
| GET | `/advanced-finance/investment-portfolios` | Get investment portfolios | `finance.treasury.read` |
| POST | `/advanced-finance/treasury-transactions` | Create treasury transaction | `finance.treasury.create` |
| GET | `/advanced-finance/treasury-transactions` | Get treasury transactions | `finance.treasury.read` |
| GET | `/advanced-finance/inter-company-transfers` | Get intercompany transfers list | `finance.treasury.read` |
| GET | `/advanced-finance/currency-revaluations` | Get currency revaluations | `finance.treasury.read` |
| POST | `/advanced-finance/currency-revaluations/run` | Run currency revaluation | `finance.treasury.read` |
| GET | `/advanced-finance/e-invoices` | Get e-invoices list | `finance.einvoice.read` |
| GET | `/advanced-finance/e-invoices/:id` | Get e-invoice by ID | `finance.einvoice.read` |
| POST | `/advanced-finance/e-invoices/generate` | Generate e-invoice | `finance.einvoice.read` |
| GET | `/advanced-finance/accounting-books` | List accounting books (parallel GAAP ledgers) | `finance.accounting-book.read` |
| POST | `/advanced-finance/accounting-books` | Create an accounting book | `finance.accounting-book.create` |
| POST | `/advanced-finance/accounting-books/:bookId/journals` | Post a journal entry to a specific accounting book | `finance.accounting-book.create` |
| GET | `/advanced-finance/accounting-books/:bookId/trial-balance` | Trial balance for an accounting book | `finance.accounting-book.read` |
| GET | `/advanced-finance/accounting-books/variance` | Cross-book variance report (e.g. LOCAL_GAAP vs IFRS) | `finance.accounting-book.read` |
| GET | `/advanced-finance/accounting-books/rules` | List accounting book rules | `finance.books.manage` |
| POST | `/advanced-finance/accounting-books/rules` | Create an accounting book rule | `finance.books.manage` |
| DELETE | `/advanced-finance/accounting-books/rules/:id` | Delete an accounting book rule | `finance.books.manage` |
| GET | `/advanced-finance/dunning-levels/:id` | Get a single dunning level by ID | `finance.tax.read` |
| PATCH | `/advanced-finance/dunning-levels/:id` | Update a dunning level | `finance.tax.read` |
| DELETE | `/advanced-finance/dunning-levels/:id` | Delete a dunning level | `finance.tax.delete` |
| GET | `/advanced-finance/dunning-levels/:id/logs` | Get dunning logs for a specific level (paginated) | `finance.tax.delete` |
| GET | `/advanced-finance/dunning-stats` | Get dunning campaign stats (success rate, fees, emails) | `finance.tax.read` |
| POST | `/advanced-finance/dunning/invoices/:invoiceId/pause` | Pause dunning for a specific invoice (dispute hold) | `finance.tax.read` |
| POST | `/advanced-finance/dunning/invoices/:invoiceId/resume` | Resume dunning for a specific invoice | `finance.tax.update` |
| GET | `/advanced-finance/ar-aging` | AR Aging report — buckets: Current, 1-30, 31-60, 61-90, 90+ days | `finance.reports.read` |
| GET | `/advanced-finance/customer-statement/:customerId` | Customer statement — invoice/payment ledger for a specific customer | `finance.reports.read` |
| GET | `/advanced-finance/ar-overdue-summary` | Overdue invoice summary KPIs and top debtors | `finance.reports.read` |
| POST | `/advanced-finance/cash-application` | Apply a cash payment to a specific invoice (cash application) | `finance.payment.create` |
| GET | `/advanced-finance/customers/:customerId/credit` | Get credit summary for a customer (limit, usage, hold, risk rating) | `finance.credit.read` |
| PATCH | `/advanced-finance/customers/:customerId/credit` | Update customer credit terms (limit, payment terms, hold status, risk rating) | `finance.credit.read` |
| GET | `/advanced-finance/credit-risk` | Credit risk list — all active customers with outstanding balances and utilization | `finance.credit.read` |
| GET | `/advanced-finance/payables/stats` | Payables stats dashboard | `finance.payables.read` |
| GET | `/advanced-finance/payables/match-rules` | List AP match rules | `finance.payables.read` |
| POST | `/advanced-finance/payables/match-rules` | Create AP match rule | `finance.payables.read` |
| PATCH | `/advanced-finance/payables/match-rules/:id` | Update AP match rule | `finance.payables.manage` |
| DELETE | `/advanced-finance/payables/match-rules/:id` | Delete AP match rule (soft delete) | `finance.payables.manage` |
| POST | `/advanced-finance/payables/invoices/:id/match` | Run three-way match on a purchase order | `finance.payables.manage` |
| GET | `/advanced-finance/payables/exceptions` | List AP match exceptions (out-of-tolerance invoices) | `finance.payables.read` |
| POST | `/advanced-finance/payables/exceptions/:id/approve` | Approve an AP match exception | `finance.payables.read` |
| POST | `/advanced-finance/payables/exceptions/:id/reject` | Reject an AP match exception | `finance.payables.manage` |
| GET | `/advanced-finance/payables/payment-batches` | List vendor payment batches | `finance.payables.read` |
| GET | `/advanced-finance/payables/payment-batches/:id` | Get a payment batch by ID | `finance.payables.read` |
| POST | `/advanced-finance/payables/payment-batches` | Create a new vendor payment batch | `finance.payables.read` |
| POST | `/advanced-finance/payables/payment-batches/:id/lines` | Add an invoice/PO to a payment batch | `finance.payables.manage` |
| DELETE | `/advanced-finance/payables/payment-batches/:id/lines/:lineId` | Remove a line from a payment batch | `finance.payables.manage` |
| POST | `/advanced-finance/payables/payment-batches/:id/run` | Execute (run) a payment batch — settle lines and post GL journal | `finance.payables.run` |
| GET | `/advanced-finance/payables/payment-batches/:id/export` | Export payment batch as NACHA / SEPA XML / CSV | `finance.payables.read` |
| GET | `/advanced-finance/reports/:reportType/drilldown` | Drill through a P&L or Balance Sheet line to underlying journal entries | `finance.reports.read` |
| GET | `/advanced-finance/close-tasks` | List close tasks for a financial period | `finance.fpa.read` |
| GET | `/advanced-finance/close-tasks/:id` | Get a close task by ID | `finance.fpa.read` |
| POST | `/advanced-finance/close-tasks` | Create a new close task | `finance.fpa.read` |
| PATCH | `/advanced-finance/close-tasks/:id` | Update close task status/assignee | `finance.fpa.manage` |
| DELETE | `/advanced-finance/close-tasks/:id` | Delete a close task | `finance.fpa.manage` |
| POST | `/advanced-finance/close-tasks/generate` | Generate standard close tasks from templates for a period | `finance.fpa.manage` |
| GET | `/advanced-finance/close-tasks/dashboard` | Get continuous close dashboard summary | `finance.fpa.read` |
| POST | `/advanced-finance/variance-flags/run` | Run variance engine comparing current vs prior financial period | `finance.fpa.run` |
| GET | `/advanced-finance/variance-flags` | List variance flags for a financial period | `finance.fpa.read` |
| POST | `/advanced-finance/variance-flags/:id/acknowledge` | Acknowledge an open variance flag | `finance.fpa.manage` |
| POST | `/advanced-finance/variance-flags/:id/resolve` | Resolve a variance flag | `finance.fpa.manage` |
| GET | `/advanced-finance/budget-scenarios` | List budget scenarios | `finance.fpa.read` |
| GET | `/advanced-finance/budget-scenarios/compare` | Compare scenarios or scenario vs actuals | `finance.fpa.read` |
| GET | `/advanced-finance/budget-scenarios/:id` | Get budget scenario details and monthly lines | `finance.fpa.read` |
| POST | `/advanced-finance/budget-scenarios` | Create a new budget scenario | `finance.fpa.read` |
| PATCH | `/advanced-finance/budget-scenarios/:id` | Update a budget scenario | `finance.fpa.manage` |
| POST | `/advanced-finance/budget-scenarios/:id/lock` | Lock a budget scenario (approves it) | `finance.fpa.run` |
| POST | `/advanced-finance/budget-scenarios/:id/unlock` | Unlock a budget scenario | `finance.fpa.run` |
| POST | `/advanced-finance/budget-scenarios/:id/clone` | Clone a budget scenario | `finance.fpa.manage` |
| POST | `/advanced-finance/budget-scenarios/:id/driver` | Apply driver calculations to generate budget lines in bulk | `finance.fpa.run` |
| DELETE | `/advanced-finance/budget-scenarios/:id` | Delete a budget scenario (archives it) | `finance.fpa.manage` |
| POST | `/advanced-finance/budget-scenarios/:id/lines` | Upsert a single budget scenario line | `finance.fpa.manage` |
| GET | `/advanced-finance/payables/invoices/capture` | List captured invoices | `finance.payables.read` |
| GET | `/advanced-finance/payables/invoices/capture/:id` | Get captured invoice details | `finance.payables.read` |
| POST | `/advanced-finance/payables/invoices/capture` | Create (upload) invoice capture record | `finance.payables.read` |
| PATCH | `/advanced-finance/payables/invoices/capture/:id` | Update captured invoice metadata manually | `finance.payables.manage` |
| DELETE | `/advanced-finance/payables/invoices/capture/:id` | Delete captured invoice record | `finance.payables.manage` |
| POST | `/advanced-finance/payables/invoices/capture/:id/auto-code` | Auto-code GL account suggestions based on vendor history | `finance.payables.manage` |
| POST | `/advanced-finance/payables/invoices/capture/:id/approve` | Approve and post captured invoice | `finance.payables.manage` |
| POST | `/advanced-finance/payables/invoices/capture/:id/reject` | Reject captured invoice | `finance.payables.manage` |
| POST | `/advanced-finance/payables/invoices/capture/:id/lines` | Add a line item manually to captured invoice | `finance.payables.manage` |
| PATCH | `/advanced-finance/payables/invoices/capture/:id/lines/:lineId` | Update captured invoice line item | `finance.payables.manage` |
| DELETE | `/advanced-finance/payables/invoices/capture/:id/lines/:lineId` | Delete captured invoice line item | `finance.payables.manage` |
| POST | `/advanced-finance/corporate-cards/:id/limits` | Create card spend limit | `finance.corporate-card-limit.create` |
| GET | `/advanced-finance/corporate-cards/:id/limits` | List card spend limits | `finance.corporate-card-limit.read` |
| PATCH | `/advanced-finance/corporate-cards/:id/limits/:limitId` | Update card spend limit | `finance.corporate-card-limit.read` |
| DELETE | `/advanced-finance/corporate-cards/:id/limits/:limitId` | Delete card spend limit | `finance.corporate-card-limit.delete` |
| POST | `/advanced-finance/corporate-cards/:id/category-limits` | Create card category (MCC) spend limit | `finance.corporate-card-limit.update` |
| GET | `/advanced-finance/corporate-cards/:id/category-limits` | List card category (MCC) spend limits | `finance.corporate-card-limit.read` |
| PATCH | `/advanced-finance/corporate-cards/:id/category-limits/:limitId` | Update card category (MCC) spend limit | `finance.corporate-card-limit.read` |
| DELETE | `/advanced-finance/corporate-cards/:id/category-limits/:limitId` | Delete card category (MCC) spend limit | `finance.corporate-card-limit.update` |
| GET | `/advanced-finance/corporate-cards/:id/utilization` | Get card utilization (spend vs cap for all active limits) | `finance.corporate-card-limit.read` |
| POST | `/advanced-finance/corporate-cards/:id/freeze` | Freeze corporate card | `finance.corporate-card-limit.read` |
| POST | `/advanced-finance/corporate-cards/:id/unfreeze` | Unfreeze corporate card | `finance.corporate-card.freeze` |
| POST | `/advanced-finance/corporate-cards/:id/limits/:limitId/request-increase` | Request a card spend limit increase | `finance.corporate-card-limit.request-increase` |
| POST | `/advanced-finance/corporate-cards/:id/limits/:limitId/request-increase/:requestId/approve` | Approve a card spend limit increase request | `finance.corporate-card-limit.approve` |
| GET | `/advanced-finance/corporate-cards/:id/limits/:limitId/audit` | Get card spend limit audit trail | `finance.corporate-card-limit.read` |
| GET | `/advanced-finance/allocations/rules` | List all allocation rules | `finance.allocations.read` |
| GET | `/advanced-finance/allocations/rules/:id` | Get allocation rule by ID | `finance.allocations.read` |
| POST | `/advanced-finance/allocations/rules` | Create a new allocation rule | `finance.allocations.read` |
| PATCH | `/advanced-finance/allocations/rules/:id` | Update an allocation rule | `finance.allocations.manage` |
| DELETE | `/advanced-finance/allocations/rules/:id` | Delete an allocation rule | `finance.allocations.manage` |
| GET | `/advanced-finance/allocations/runs` | List all allocation runs | `finance.allocations.read` |
| POST | `/advanced-finance/allocations/rules/:id/run` | Execute an allocation run (generate draft journal) | `finance.allocations.read` |
| POST | `/advanced-finance/allocations/runs/:id/post` | Approve and post allocation run journal entries | `finance.allocations.run` |
| GET | `/advanced-finance/budget-control/config` | Get budget control config | `finance.budget.read` |
| PATCH | `/advanced-finance/budget-control/config` | Update budget control config | `finance.budget.read` |
| GET | `/advanced-finance/budget-reallocations` | Get budget reallocations | `finance.budget.read` |
| GET | `/advanced-finance/budget-reallocations/:id` | Get budget reallocation by ID | `finance.budget.read` |
| POST | `/advanced-finance/budget-reallocations` | Create budget reallocation | `finance.budget.read` |
| POST | `/advanced-finance/budget-reallocations/:id/submit` | Submit budget reallocation | `finance.budget.update` |
| POST | `/advanced-finance/budget-reallocations/:id/approve` | Approve budget reallocation | `finance.budget.update` |
| POST | `/advanced-finance/budget-reallocations/:id/reject` | Reject budget reallocation | `finance.budget.update` |
| GET | `/advanced-finance/tax/jurisdictions` | List tax jurisdictions | `finance.tax.read` |
| GET | `/advanced-finance/tax/jurisdictions/:id` | Get tax jurisdiction by ID | `finance.tax.read` |
| POST | `/advanced-finance/tax/jurisdictions` | Create tax jurisdiction | `finance.tax.read` |
| PATCH | `/advanced-finance/tax/jurisdictions/:id` | Update tax jurisdiction | `finance.tax.update` |
| DELETE | `/advanced-finance/tax/jurisdictions/:id` | Delete tax jurisdiction | `finance.tax.delete` |
| GET | `/advanced-finance/tax/exemption-certificates` | List tax exemption certificates | `finance.tax.delete` |
| GET | `/advanced-finance/tax/exemption-certificates/:id` | Get exemption certificate by ID | `finance.tax.read` |
| POST | `/advanced-finance/tax/exemption-certificates` | Create tax exemption certificate | `finance.tax.read` |
| PATCH | `/advanced-finance/tax/exemption-certificates/:id` | Update exemption certificate | `finance.tax.update` |
| POST | `/advanced-finance/tax/exemption-certificates/:id/revoke` | Revoke exemption certificate | `finance.tax.update` |
| GET | `/advanced-finance/tax/vat-return/preview` | Preview VAT return | `finance.tax.update` |
| GET | `/advanced-finance/tax/reconciliations` | List tax reconciliations | `finance.tax.read` |
| POST | `/advanced-finance/tax/reconciliations/compute` | Compute tax reconciliation | `finance.tax.read` |
| PATCH | `/advanced-finance/tax/reconciliations/:id` | Update tax reconciliation | `finance.tax.create` |
| GET | `/advanced-finance/tax/withholding-certificates` | List withholding certificates | `finance.tax.update` |
| GET | `/advanced-finance/tax/withholding-certificates/:id` | Get withholding certificate by ID | `finance.tax.read` |
| POST | `/advanced-finance/tax/withholding-certificates` | Create withholding certificate | `finance.tax.read` |
| POST | `/advanced-finance/tax/withholding-certificates/:id/issue` | Issue withholding certificate | `finance.tax.update` |
| POST | `/advanced-finance/tax/withholding-certificates/:id/file` | File withholding certificate | `finance.tax.update` |
| POST | `/advanced-finance/tax/withholding-certificates/bulk-generate` | Bulk generate withholding certificates for a year | `finance.tax.update` |
| GET | `/advanced-finance/tax/amended-filings` | List amended tax filings | `finance.tax.create` |
| POST | `/advanced-finance/tax/amended-filings` | Create amended tax filing | `finance.tax.read` |
| POST | `/advanced-finance/tax/amended-filings/:id/submit` | Submit amended tax filing | `finance.tax.update` |
| PATCH | `/advanced-finance/tax/amended-filings/:id/status` | Update amended filing status (accept/reject) | `finance.tax.update` |
| GET | `/advanced-finance/tax/dashboard` | Tax engine dashboard | `finance.tax.update` |
| GET | `/advanced-finance/treasury/positions` | List treasury positions | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/positions/summary` | Get treasury position summary by currency | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/positions` | Create treasury position (manual entry) | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/liquidity-forecast` | Get liquidity forecast | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/hedge-instruments` | List hedge instruments | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/hedge-instruments/:id` | Get hedge instrument by ID | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/hedge-instruments` | Create hedge instrument | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/hedge-instruments/:id/revalue` | Revalue hedge instrument (mark-to-market) | `finance.treasury.update` |
| PATCH | `/advanced-finance/treasury/hedge-instruments/:id` | Update hedge instrument | `finance.treasury.update` |
| GET | `/advanced-finance/treasury/debt-facilities` | List debt facilities | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/debt-facilities/:id` | Get debt facility by ID | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/debt-facilities` | Create debt facility | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/debt-facilities/:id/drawdown` | Record debt drawdown | `finance.treasury.update` |
| PATCH | `/advanced-finance/treasury/debt-facilities/:id` | Update debt facility | `finance.treasury.update` |
| GET | `/advanced-finance/treasury/debt-facilities/utilization` | Get debt facility utilization report | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/investments` | List investment holdings | `finance.treasury.read` |
| GET | `/advanced-finance/treasury/investments/:id` | Get investment holding by ID | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/investments` | Create investment holding | `finance.treasury.read` |
| POST | `/advanced-finance/treasury/investments/:id/mark-to-market` | Mark investment holding to market | `finance.treasury.update` |
| GET | `/advanced-finance/treasury/investments/portfolio-return` | Get investment portfolio return | `finance.treasury.update` |
| GET | `/advanced-finance/ap/vendor-statements` | List vendor statements | `finance.payables.read` |
| POST | `/advanced-finance/ap/vendor-statements` | Import vendor statement | `finance.payables.read` |
| POST | `/advanced-finance/ap/vendor-statements/:id/reconcile` | Reconcile vendor statement | `finance.payables.update` |
| GET | `/advanced-finance/ap/vendor-statements/:id/diff` | Get vendor statement reconciliation diff | `finance.payables.update` |
| GET | `/advanced-finance/ap/duplicate-flags` | List AP duplicate flags | `finance.payables.read` |
| POST | `/advanced-finance/ap/duplicate-flags/scan` | Run AP duplicate invoice scan | `finance.payables.read` |
| PATCH | `/advanced-finance/ap/duplicate-flags/:id/review` | Review AP duplicate flag | `finance.payables.create` |
| GET | `/advanced-finance/ap/approval-policies` | List AP approval policies | `finance.payables.update` |
| POST | `/advanced-finance/ap/approval-policies` | Create AP approval policy | `finance.payables.read` |
| PATCH | `/advanced-finance/ap/approval-policies/:id` | Update AP approval policy | `finance.payables.update` |
| DELETE | `/advanced-finance/ap/approval-policies/:id` | Delete AP approval policy | `finance.payables.delete` |
| GET | `/advanced-finance/ap/approval-policies/match` | Get AP approval policy for a given invoice amount | `finance.payables.delete` |
| GET | `/advanced-finance/ap/grni` | List GRNI records | `finance.payables.read` |
| GET | `/advanced-finance/ap/grni/aging` | Get GRNI aging report | `finance.payables.read` |
| POST | `/advanced-finance/ap/grni` | Create GRNI record | `finance.payables.read` |
| POST | `/advanced-finance/ap/grni/:id/mark-invoiced` | Mark GRNI record as invoiced | `finance.payables.update` |
| GET | `/advanced-finance/ap/cash-flow-obligation` | Get AP cash flow obligation forecast | `finance.payables.update` |
| POST | `/advanced-finance/ap/early-payment-discount` | Calculate early payment discount savings | `finance.payables.read` |
| GET | `/advanced-finance/ap/vendor-scorecard/:vendorId` | Get vendor scorecard | `finance.payables.read` |
| GET | `/advanced-finance/ar/promises-to-pay` | List promises to pay | `finance.receivables.read` |
| POST | `/advanced-finance/ar/promises-to-pay` | Create promise to pay | `finance.receivables.read` |
| PATCH | `/advanced-finance/ar/promises-to-pay/:id` | Update promise to pay | `finance.receivables.update` |
| POST | `/advanced-finance/ar/promises-to-pay/check-broken` | Check and mark broken promises to pay | `finance.receivables.update` |
| GET | `/advanced-finance/ar/disputes` | List AR disputes | `finance.receivables.update` |
| GET | `/advanced-finance/ar/disputes/:id` | Get AR dispute by ID | `finance.receivables.read` |
| POST | `/advanced-finance/ar/disputes` | Create AR dispute | `finance.receivables.read` |
| PATCH | `/advanced-finance/ar/disputes/:id` | Update AR dispute | `finance.receivables.update` |
| POST | `/advanced-finance/ar/disputes/:id/escalate` | Escalate AR dispute | `finance.receivables.update` |
| GET | `/advanced-finance/ar/bad-debt-provisions` | List bad debt provisions | `finance.receivables.update` |
| POST | `/advanced-finance/ar/bad-debt-provisions/compute` | Compute bad debt provision | `finance.receivables.read` |
| POST | `/advanced-finance/ar/bad-debt-provisions/:id/post` | Post bad debt provision to GL | `finance.receivables.create` |
| GET | `/advanced-finance/ar/collector-workbench` | Get collector workbench | `finance.receivables.update` |
| GET | `/advanced-finance/ar/dso-trend` | Get DSO trend (last N months) | `finance.receivables.read` |
| GET | `/advanced-finance/ar/performance-dashboard` | Get AR performance dashboard | `finance.receivables.read` |
| GET | `/advanced-finance/assets/:id/depreciation-schedule` | Get depreciation schedule preview for an asset | `finance.assets.read` |
| GET | `/advanced-finance/assets/insurances` | List asset insurance policies | `finance.assets.read` |
| POST | `/advanced-finance/assets/insurances` | Create asset insurance policy | `finance.assets.read` |
| PATCH | `/advanced-finance/assets/insurances/:id` | Update asset insurance policy | `finance.assets.update` |
| GET | `/advanced-finance/assets/insurances/expiring` | Get expiring asset insurances | `finance.assets.read` |
| GET | `/advanced-finance/assets/impairments` | List asset impairments | `finance.assets.read` |
| POST | `/advanced-finance/assets/impairments` | Create asset impairment test | `finance.assets.read` |
| POST | `/advanced-finance/assets/impairments/:id/post` | Post asset impairment to GL | `finance.assets.update` |
| GET | `/advanced-finance/assets/capital-projects` | List capital projects | `finance.assets.update` |
| GET | `/advanced-finance/assets/capital-projects/:id` | Get capital project by ID | `finance.assets.read` |
| POST | `/advanced-finance/assets/capital-projects` | Create capital project | `finance.assets.read` |
| POST | `/advanced-finance/assets/capital-projects/:id/costs` | Add cost to capital project | `finance.assets.update` |
| PATCH | `/advanced-finance/assets/capital-projects/:id` | Update capital project | `finance.assets.update` |
| POST | `/advanced-finance/assets/capital-projects/:id/convert-to-asset` | Convert capital project to fixed asset | `finance.assets.create` |
| GET | `/advanced-finance/assets/nbv-roll-forward` | Get net book value roll-forward report | `finance.assets.create` |
| POST | `/advanced-finance/assets/bulk-upload` | Bulk upload fixed assets from CSV data | `finance.assets.read` |
| GET | `/advanced-finance/fpa/rolling-forecast` | List rolling forecast lines | `finance.budget.read` |
| POST | `/advanced-finance/fpa/rolling-forecast` | Upsert rolling forecast line | `finance.budget.read` |
| POST | `/advanced-finance/fpa/rolling-forecast/sync-actuals` | Sync actuals into rolling forecast | `finance.budget.update` |
| GET | `/advanced-finance/fpa/headcount-plans` | List headcount plans | `finance.budget.update` |
| POST | `/advanced-finance/fpa/headcount-plans` | Create headcount plan | `finance.budget.read` |
| PATCH | `/advanced-finance/fpa/headcount-plans/:id` | Update headcount plan | `finance.budget.update` |
| POST | `/advanced-finance/fpa/headcount-plans/cost-projection` | Get headcount cost projection | `finance.budget.read` |
| GET | `/advanced-finance/fpa/budget-comments` | List budget comments | `finance.budget.read` |
| POST | `/advanced-finance/fpa/budget-comments` | Add budget comment | `finance.budget.read` |
| PATCH | `/advanced-finance/fpa/budget-comments/:id` | Update budget comment | `finance.budget.create` |
| DELETE | `/advanced-finance/fpa/budget-comments/:id` | Delete budget comment | `finance.budget.update` |
| GET | `/advanced-finance/fpa/management-reports` | List management reports | `finance.budget.delete` |
| GET | `/advanced-finance/fpa/management-reports/:id` | Get management report by ID | `finance.reports.read` |
| POST | `/advanced-finance/fpa/management-reports` | Create management report | `finance.reports.read` |
| PATCH | `/advanced-finance/fpa/management-reports/:id` | Update management report | `finance.reports.update` |
| DELETE | `/advanced-finance/fpa/management-reports/:id` | Delete management report | `finance.reports.delete` |
| GET | `/advanced-finance/fpa/waterfall-chart` | Get variance waterfall chart data | `finance.reports.delete` |
| POST | `/advanced-finance/fpa/sensitivity-analysis` | Run what-if sensitivity analysis | `finance.reports.read` |
| GET | `/advanced-finance/billing/rules` | List billing rules | `finance.revenue.read` |
| GET | `/advanced-finance/billing/rules/:id` | Get billing rule by ID | `finance.revenue.read` |
| POST | `/advanced-finance/billing/rules` | Create billing rule | `finance.revenue.read` |
| PATCH | `/advanced-finance/billing/rules/:id` | Update billing rule | `finance.revenue.update` |
| DELETE | `/advanced-finance/billing/rules/:id` | Delete billing rule | `finance.revenue.delete` |
| GET | `/advanced-finance/billing/milestones` | List billing milestones | `finance.revenue.delete` |
| POST | `/advanced-finance/billing/rules/:id/milestones` | Add milestone to billing rule | `finance.revenue.read` |
| POST | `/advanced-finance/billing/milestones/:id/complete` | Complete billing milestone | `finance.revenue.update` |
| POST | `/advanced-finance/billing/milestones/:id/trigger-invoice` | Trigger invoice from completed milestone | `finance.revenue.update` |
| GET | `/advanced-finance/billing/contract-modifications` | List contract modifications | `finance.revenue.create` |
| POST | `/advanced-finance/billing/contract-modifications` | Create contract modification | `finance.revenue.read` |
| POST | `/advanced-finance/billing/contract-modifications/:id/approve` | Approve contract modification | `finance.revenue.update` |
| GET | `/advanced-finance/billing/deferred-revenue-roll-forwards` | List deferred revenue roll-forwards | `finance.revenue.update` |
| POST | `/advanced-finance/billing/deferred-revenue-roll-forwards/compute` | Compute deferred revenue roll-forward for a period | `finance.revenue.read` |
| GET | `/advanced-finance/billing/tiered-pricing` | List tiered pricing tables | `finance.revenue.create` |
| POST | `/advanced-finance/billing/tiered-pricing` | Create tiered pricing table | `finance.revenue.read` |
| POST | `/advanced-finance/billing/tiered-pricing/:id/rate` | Rate usage against a tiered pricing table | `finance.revenue.read` |
| GET | `/advanced-finance/billing/revenue-backlog` | Get revenue backlog (remaining performance obligations) | `finance.revenue.read` |
| POST | `/advanced-finance/billing/revenue-forecast-vs-actual` | Get revenue forecast vs actual | `finance.revenue.read` |
| GET | `/advanced-finance/compliance/controls` | List financial controls | `finance.compliance.read` |
| GET | `/advanced-finance/compliance/controls/:id` | Get financial control by ID | `finance.compliance.read` |
| POST | `/advanced-finance/compliance/controls` | Create financial control | `finance.compliance.read` |
| PATCH | `/advanced-finance/compliance/controls/:id` | Update financial control | `finance.compliance.update` |
| DELETE | `/advanced-finance/compliance/controls/:id` | Deactivate financial control | `finance.compliance.delete` |
| GET | `/advanced-finance/compliance/control-tests` | List control tests | `finance.compliance.delete` |
| POST | `/advanced-finance/compliance/control-tests` | Create control test | `finance.compliance.read` |
| POST | `/advanced-finance/compliance/control-tests/:id/review` | Review control test result | `finance.compliance.update` |
| GET | `/advanced-finance/compliance/control-effectiveness` | Get control effectiveness dashboard | `finance.compliance.update` |
| GET | `/advanced-finance/compliance/sod-rules` | List SoD rule definitions | `finance.compliance.read` |
| POST | `/advanced-finance/compliance/sod-rules` | Create SoD rule definition | `finance.compliance.read` |
| PATCH | `/advanced-finance/compliance/sod-rules/:id` | Update SoD rule definition | `finance.compliance.update` |
| POST | `/advanced-finance/compliance/sod-scan` | Run SoD conflict scan across all users | `finance.compliance.update` |
| GET | `/advanced-finance/compliance/sod-conflicts` | List SoD conflicts | `finance.compliance.create` |
| PATCH | `/advanced-finance/compliance/sod-conflicts/:id/resolve` | Resolve SoD conflict | `finance.compliance.read` |
| GET | `/advanced-finance/compliance/audit-confirmations` | List audit confirmations | `finance.compliance.update` |
| POST | `/advanced-finance/compliance/audit-confirmations` | Create audit confirmation request | `finance.compliance.read` |
| POST | `/advanced-finance/compliance/audit-confirmations/:id/respond` | Record audit confirmation response | `finance.compliance.update` |
| GET | `/advanced-finance/compliance/period-certifications` | List period certifications | `finance.compliance.update` |
| POST | `/advanced-finance/compliance/period-certifications` | Create period certification request | `finance.compliance.read` |
| POST | `/advanced-finance/compliance/period-certifications/:id/certify` | Certify (sign off) a period | `finance.compliance.update` |
| POST | `/advanced-finance/compliance/period-certifications/:id/reject` | Reject period certification | `finance.compliance.update` |
| POST | `/advanced-finance/intercompany-loans` | Create intercompany loan agreement | `finance.treasury.create` |
| GET | `/advanced-finance/intercompany-loans/:id` | Get intercompany loan agreement details | `finance.treasury.read` |
| GET | `/advanced-finance/intercompany-loans` | List all intercompany loan agreements | `finance.treasury.read` |
| POST | `/advanced-finance/intercompany-loans/:id/drawdown` | Record loan drawdown against facility | `finance.treasury.read` |
| POST | `/advanced-finance/intercompany-loans/:id/repayment` | Record loan repayment of principal/interest | `finance.treasury.create` |
| GET | `/advanced-finance/intercompany-loans/:id/accrued-interest` | Calculate accrued interest for period | `finance.treasury.read` |
| POST | `/advanced-finance/intercompany-loans/:id/post-interest` | Post accrued interest GL journal entry | `finance.journal.create` |
| GET | `/advanced-finance/intercompany-loans/:id/amortization` | Generate loan amortization schedule | `finance.treasury.read` |
| GET | `/advanced-finance/intercompany-loans/analytics/summary` | Get intercompany loan analytics | `finance.treasury.read` |
| POST | `/advanced-finance/intercompany-loans/:id/close` | Close loan agreement | `finance.treasury.read` |
| POST | `/advanced-finance/assets/revaluations` | Record asset revaluation | `finance.fixed-asset.create` |
| GET | `/advanced-finance/assets/:assetId/revaluations` | List asset revaluations history | `finance.fixed-asset.read` |
| POST | `/advanced-finance/assets/revaluations/:id/post` | Post asset revaluation adjustments to GL | `finance.journal.create` |
| POST | `/advanced-finance/assets/disposals` | Record asset disposal | `finance.journal.create` |
| GET | `/advanced-finance/assets/disposals/list` | List asset disposals | `finance.fixed-asset.read` |
| POST | `/advanced-finance/assets/disposals/:id/post` | Post asset disposal write-off to GL | `finance.fixed-asset.read` |
| POST | `/advanced-finance/assets/impairments/:id/post` | Post asset impairment write-off to GL | `finance.journal.create` |
| GET | `/advanced-finance/assets/:assetId/depreciation-post-reval` | Calculate monthly depreciation after revaluation | `finance.journal.create` |
| GET | `/advanced-finance/assets/:assetId/audit-report` | Get asset audit report | `finance.fixed-asset.read` |
| POST | `/advanced-finance/assets/disposals/bulk` | Bulk dispose assets | `finance.fixed-asset.create` |
| POST | `/advanced-finance/cash-pools` | Create concentration cash pool | `finance.treasury.create` |
| GET | `/advanced-finance/cash-pools/:id` | Get cash pool details and balances | `finance.treasury.read` |
| GET | `/advanced-finance/cash-pools` | List concentration cash pools | `finance.treasury.read` |
| POST | `/advanced-finance/cash-pools/:id/sweep` | Execute concentration cash pool sweep | `finance.treasury.read` |
| POST | `/advanced-finance/cash-pools/:id/fund` | Execute cash pool redistribution funding | `finance.treasury.create` |
| GET | `/advanced-finance/cash-pools/:id/runs` | List runs of cash pool | `finance.treasury.read` |
| GET | `/advanced-finance/budget-variance/alerts` | Get accounts exceeding budget variance thresholds | `finance.treasury.read` |
| POST | `/advanced-finance/budget-variance/configs` | Configure budget variance alert config | `finance.report.read` |
| POST | `/advanced-finance/consolidation/rates` | Configure exchange rates for period consolidation | `finance.treasury.create` |
| GET | `/advanced-finance/consolidation/rates/:period` | Get consolidation rates for period | `finance.treasury.read` |
| POST | `/advanced-finance/consolidation/translations` | Execute multi-currency consolidation translation | `finance.report.create` |
| GET | `/advanced-finance/consolidation/cta/:period` | Calculate cumulative translation adjustment (CTA) amount | `finance.report.read` |
| POST | `/advanced-finance/consolidation/runs/:id/eliminations` | Post intercompany consolidation eliminations | `finance.report.create` |
| GET | `/advanced-finance/consolidation/statements/:period` | Get consolidated P&L and Balance Sheet financial statements | `finance.report.create` |
| POST | `/advanced-finance/consolidation/runs/:id/lock` | Lock consolidated book period | `finance.report.create` |
| GET | `/advanced-finance/consolidation/runs` | List consolidated book runs | `finance.report.create` |
| GET | `/advanced-finance/1099/vendors` | List vendors with 1099 profiles and YTD reportable payments | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/vendor-profiles/:vendorId` | Get a vendor 1099 profile | `finance.tax1099.read` |
| PATCH | `/advanced-finance/1099/vendor-profiles/:vendorId` | Create or update a vendor 1099 profile | `finance.tax1099.read` |
| POST | `/advanced-finance/1099/vendor-profiles/:vendorId/tin-match` | Run a simulated TIN match check for a vendor | `finance.tax1099.manage` |
| POST | `/advanced-finance/1099/vendor-profiles/:vendorId/backup-withholding` | Toggle backup withholding for a vendor | `finance.tax1099.manage` |
| GET | `/advanced-finance/1099/vendors/:vendorId/w9-checklist` | W-9 / TIN compliance checklist for a vendor | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/threshold-report` | $600 IRS threshold report — vendors crossing the 1099 reporting threshold | `finance.tax1099.read` |
| POST | `/advanced-finance/1099/generate` | Generate draft 1099 forms for all eligible vendors in a tax year | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/forms` | List 1099 forms | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/forms/:id` | Get a 1099 form by ID | `finance.tax1099.read` |
| PATCH | `/advanced-finance/1099/forms/:id` | Edit box amounts on a draft 1099 form | `finance.tax1099.read` |
| POST | `/advanced-finance/1099/forms/:id/mark-ready` | Mark a 1099 form ready for filing | `finance.tax1099.manage` |
| POST | `/advanced-finance/1099/forms/:id/file` | File a 1099 form (outside of a batch) | `finance.tax1099.manage` |
| POST | `/advanced-finance/1099/forms/:id/void` | Void a 1099 form | `finance.tax1099.manage` |
| POST | `/advanced-finance/1099/forms/:id/correct` | Create a corrected 1099 form linked to the original filed form | `finance.tax1099.manage` |
| GET | `/advanced-finance/1099/forms/:id/pdf-data` | Printable/e-file summary payload for a 1099 form | `finance.tax1099.read` |
| POST | `/advanced-finance/1099/batches` | Bundle READY 1099 forms into an e-file batch | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/batches` | List 1099 e-file batches | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/batches/:id` | Get a 1099 e-file batch with its forms | `finance.tax1099.read` |
| POST | `/advanced-finance/1099/batches/:id/efile` | Submit a 1099 batch to the simulated IRS FIRE e-file system | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/summary` | 1099 dashboard summary stats for a tax year | `finance.tax1099.read` |
| GET | `/advanced-finance/1099/state-filing-requirements` | Reference: state 1099 filing requirements (CFS program participation) | `finance.tax1099.read` |
| GET | `/advanced-finance/tax/nexus/thresholds` | List per-state economic nexus thresholds configured for this tenant | `finance.tax-nexus.read` |
| POST | `/advanced-finance/tax/nexus/thresholds/seed-defaults` | Seed reference US state economic-nexus thresholds (idempotent, does not overwrite existing rows) | `finance.tax-nexus.read` |
| POST | `/advanced-finance/tax/nexus/thresholds` | Create/override a state economic nexus threshold | `finance.tax-nexus.manage` |
| PATCH | `/advanced-finance/tax/nexus/thresholds/:id` | Update a state economic nexus threshold | `finance.tax-nexus.manage` |
| DELETE | `/advanced-finance/tax/nexus/thresholds/:id` | Delete a state economic nexus threshold | `finance.tax-nexus.manage` |
| POST | `/advanced-finance/tax/nexus/monitor/refresh` | Recompute trailing-12-month per-state nexus monitoring snapshots from posted invoices | `finance.tax-nexus.manage` |
| GET | `/advanced-finance/tax/nexus/monitor` | Latest per-state nexus monitoring snapshot (revenue/transaction % of threshold, status) | `finance.tax-nexus.manage` |
| GET | `/advanced-finance/tax/nexus/monitor/:state/history` | Historical nexus monitoring snapshots for one state (trend over time) | `finance.tax-nexus.read` |
| GET | `/advanced-finance/tax/nexus/dashboard` | Economic nexus dashboard — counts by status, exceeded/approaching state lists | `finance.tax-nexus.read` |
| GET | `/advanced-finance/tax/nexus/registrations` | List nexus registrations (states where the tenant is/was registered to collect tax) | `finance.tax-nexus.read` |
| GET | `/advanced-finance/tax/nexus/registrations/:id` | Get a single nexus registration | `finance.tax-nexus.read` |
| POST | `/advanced-finance/tax/nexus/registrations` | Create a nexus registration record for a state | `finance.tax-nexus.read` |
| PATCH | `/advanced-finance/tax/nexus/registrations/:id` | Update a nexus registration (status transitions, filing frequency, dates) | `finance.tax-nexus.manage` |
| DELETE | `/advanced-finance/tax/nexus/registrations/:id` | Delete a nexus registration record | `finance.tax-nexus.manage` |

## advanced-hr

90 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/advanced-hr/salaries` | Get salary structures | `hr.employee.read` |
| POST | `/advanced-hr/salaries` | Create salary structure | `hr.employee.read` |
| GET | `/advanced-hr/payroll` | Get payroll runs | `hr.payroll.read` |
| POST | `/advanced-hr/payroll/run` | Run payroll | `hr.payroll.read` |
| GET | `/advanced-hr/attendance` | Get attendance records | `hr.employee.read` |
| POST | `/advanced-hr/attendance/check-in` | Check in | `hr.employee.create` |
| POST | `/advanced-hr/attendance/check-out` | Check out | `hr.employee.create` |
| GET | `/advanced-hr/documents/:employeeId` | Get employee documents | `hr.employee.read` |
| POST | `/advanced-hr/documents/:employeeId` | Create employee document | `hr.employee.create` |
| GET | `/advanced-hr/assets` | Get assets | `hr.employee.read` |
| POST | `/advanced-hr/assets` | Assign asset | `hr.employee.read` |
| POST | `/advanced-hr/assets/:id/return` | Return asset | `hr.employee.update` |
| GET | `/advanced-hr/org-chart` | Get org chart | `hr.employee.read` |
| GET | `/advanced-hr/leaves/balances` | Get leave balances | `hr.leave.read` |
| GET | `/advanced-hr/leaves/policies` | Get leave policies | `hr.leave.read` |
| POST | `/advanced-hr/leaves/policies` | Create leave policy | `hr.leave.read` |
| GET | `/advanced-hr/leaves/requests` | Get leave requests | `hr.leave.read` |
| POST | `/advanced-hr/leaves/requests` | Create leave request | `hr.leave.read` |
| PUT | `/advanced-hr/leaves/requests/:id/approve` | Approve leave request | `hr.leave.create` |
| GET | `/advanced-hr/onboarding/checklists` | Get onboarding checklists | `hr.employee.read` |
| POST | `/advanced-hr/onboarding/checklists` | Create onboarding checklist | `hr.employee.read` |
| PUT | `/advanced-hr/onboarding/items/:itemId/complete` | Complete onboarding item | `hr.employee.update` |
| PUT | `/advanced-hr/onboarding/items/:itemId` | Update onboarding item | `hr.employee.update` |
| POST | `/advanced-hr/onboarding/checklists/:checklistId/items` | Add onboarding item | `hr.employee.update` |
| DELETE | `/advanced-hr/onboarding/items/:itemId` | Delete onboarding item | `hr.employee.update` |
| GET | `/advanced-hr/offboarding/checklists` | Get offboarding checklists | `hr.employee.read` |
| POST | `/advanced-hr/offboarding/checklists` | Create offboarding checklist | `hr.employee.read` |
| PUT | `/advanced-hr/offboarding/items/:itemId` | Update offboarding item | `hr.employee.update` |
| POST | `/advanced-hr/offboarding/checklists/:checklistId/items` | Add offboarding item | `hr.employee.update` |
| DELETE | `/advanced-hr/offboarding/items/:itemId` | Delete offboarding item | `hr.employee.update` |
| GET | `/advanced-hr/shifts` | Get shift schedules | `hr.employee.read` |
| POST | `/advanced-hr/shifts` | Create shift schedule | `hr.employee.read` |
| GET | `/advanced-hr/jobs` | Get job postings | `hr.employee.read` |
| POST | `/advanced-hr/jobs` | Create job posting | `hr.employee.read` |
| GET | `/advanced-hr/applicants` | Get applicants | `hr.employee.read` |
| POST | `/advanced-hr/applicants` | Create applicant | `hr.employee.create` |
| POST | `/advanced-hr/applicants/:id/advance` | Advance applicant | `hr.employee.update` |
| GET | `/advanced-hr/interviews` | Get interviews | `hr.employee.read` |
| POST | `/advanced-hr/interviews` | Create interview | `hr.employee.read` |
| GET | `/advanced-hr/goals` | Get goals | `hr.employee.read` |
| POST | `/advanced-hr/goals` | Create goal | `hr.employee.create` |
| PUT | `/advanced-hr/key-results/:id` | Update key result progress | `hr.employee.update` |
| GET | `/advanced-hr/goals/:goalId/comments` | Get goal comments | `hr.employee.read` |
| POST | `/advanced-hr/goals/:goalId/comments` | Create goal comment | `hr.employee.create` |
| GET | `/advanced-hr/feedback` | Get feedback360 | `hr.employee.read` |
| POST | `/advanced-hr/feedback` | Create feedback360 | `hr.employee.create` |
| GET | `/advanced-hr/succession` | Get succession plans | `hr.employee.read` |
| POST | `/advanced-hr/succession` | Create succession plan | `hr.employee.read` |
| GET | `/advanced-hr/skills` | Get employee skills | `hr.employee.read` |
| POST | `/advanced-hr/skills` | Create employee skill | `hr.employee.create` |
| GET | `/advanced-hr/appraisals` | Get appraisals | `hr.employee.read` |
| POST | `/advanced-hr/appraisals` | Create appraisal | `hr.employee.read` |
| GET | `/advanced-hr/trainings` | Get trainings | `hr.employee.read` |
| POST | `/advanced-hr/trainings` | Create training | `hr.employee.read` |
| POST | `/advanced-hr/trainings/:trainingId/enroll` | Enroll participant | `hr.employee.create` |
| DELETE | `/advanced-hr/trainings/:trainingId/enroll/:employeeId` | Unenroll participant | `hr.employee.delete` |
| PUT | `/advanced-hr/trainings/:trainingId/enroll/:employeeId` | Update enrollment status | `hr.employee.update` |
| GET | `/advanced-hr/analytics/headcount` | Get headcount analytics | `hr.employee.read` |
| GET | `/advanced-hr/analytics/compensation` | Get compensation analytics | `hr.employee.read` |
| GET | `/advanced-hr/analytics/cost` | Get h r cost analysis | `hr.employee.read` |
| GET | `/advanced-hr/tickets` | Get h r tickets | `hr.employee.read` |
| POST | `/advanced-hr/tickets` | Create h r ticket | `hr.employee.create` |
| PUT | `/advanced-hr/tickets/:id/resolve` | Resolve h r ticket | `hr.employee.update` |
| GET | `/advanced-hr/surveys` | Get engagement surveys | `hr.employee.read` |
| POST | `/advanced-hr/surveys` | Create engagement survey | `hr.employee.read` |
| POST | `/advanced-hr/surveys/responses` | Submit survey response | `hr.employee.create` |
| GET | `/advanced-hr/offers` | Get offers | `hr.employee.read` |
| POST | `/advanced-hr/offers` | Create offer | `hr.employee.read` |
| PUT | `/advanced-hr/offers/:id/status` | Update offer status | `hr.employee.update` |
| GET | `/advanced-hr/benefits/schemes` | Get benefit schemes | `hr.employee.read` |
| POST | `/advanced-hr/benefits/schemes` | Create benefit scheme | `hr.employee.read` |
| GET | `/advanced-hr/benefits/enrollments` | Get employee benefits | `hr.employee.read` |
| POST | `/advanced-hr/benefits/enroll` | Enroll employee benefit | `hr.employee.create` |
| PUT | `/advanced-hr/benefits/enrollments/:id` | Update employee benefit | `hr.employee.update` |
| GET | `/advanced-hr/skills/requirements` | Get skill requirements | `hr.employee.read` |
| POST | `/advanced-hr/skills/requirements` | Upsert skill requirement | `hr.employee.read` |
| GET | `/advanced-hr/skills/gap-analysis` | Get skill gap analysis | `hr.employee.read` |
| GET | `/advanced-hr/positions` | Get positions | `hr.employee.read` |
| POST | `/advanced-hr/positions` | Create position | `hr.employee.read` |
| PUT | `/advanced-hr/positions/:id` | Update position | `hr.employee.update` |
| GET | `/advanced-hr/positions/budget-variance` | Get position budget variance | `hr.employee.read` |
| GET | `/advanced-hr/compliance/checks` | Get compliance checks | `hr.employee.read` |
| POST | `/advanced-hr/compliance/run-checks` | Run compliance checks | `hr.employee.read` |
| GET | `/advanced-hr/tax-tables` | Get tax tables | `hr.employee.read` |
| POST | `/advanced-hr/tax-tables` | Create tax table | `hr.employee.read` |
| GET | `/advanced-hr/holidays` | Get holidays | `hr.employee.read` |
| POST | `/advanced-hr/holidays` | Create holiday | `hr.employee.read` |
| POST | `/advanced-hr/attendance/biometric` | Check in r f i d | `hr.employee.create` |
| GET | `/advanced-hr/self-service/dashboard` | Get self service dashboard | `hr.employee.read` |
| PUT | `/advanced-hr/self-service/profile` | Update self service profile | `hr.employee.read` |

## ai

13 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/admin/ai/config` | Get AI assistant configuration (kill switch + read-only model info) | `ai.admin.manage` |
| POST | `/admin/ai/config` | Enable/disable the AI assistant for this tenant | `ai.admin.manage` |
| GET | `/admin/ai/engine/status` | Get local Ollama (AI engine) live status | `ai.admin.manage` |
| POST | `/admin/ai/engine/start` | Start the local Ollama (AI engine) process | `ai.admin.manage` |
| POST | `/admin/ai/engine/stop` | Stop the local Ollama (AI engine) process | `ai.admin.manage` |
| GET | `/ai/status` | Handle request | `ai.read` |
| POST | `/ai/ask` | Ask data | `ai.create` |
| POST | `/ai/summarize/:entityType/:entityId` | Summarize record | `ai.create` |
| POST | `/ai/draft-email` | Draft email | `ai.create` |
| POST | `/ai/generate-form` | Generate form | `ai.create` |
| POST | `/ai/generate-workflow` | Generate workflow | `ai.create` |
| POST | `/ai/process-invoice` | Process invoice | `ai.create` |
| POST | `/ai/converse` | Converse with the AI copilot agent (tool-use loop) | `ai.create` |

## analytics

12 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/analytics/dashboards` | Get dashboards | `analytics.dashboard.read` |
| GET | `/analytics/dashboards/:id` | Get dashboard by id | `analytics.dashboard.read` |
| POST | `/analytics/dashboards` | Create dashboard | `analytics.dashboard.read` |
| GET | `/analytics/reports` | Get reports | `analytics.report.read` |
| POST | `/analytics/reports` | Create report | `analytics.report.read` |
| GET | `/analytics/kpis` | Get k p is | `analytics.kpi.read` |
| GET | `/analytics/kpis/:code/drilldown` | Get kpi drilldown | `analytics.kpi.read` |
| GET | `/analytics/insights` | Get insights | `analytics.kpi.read` |
| GET | `/analytics/export/:dataset` | Export dataset | `analytics.report.read` |
| PATCH | `/analytics/dashboards/:id` | Update dashboard | `analytics.report.read` |
| POST | `/analytics/reports/:id/pivot` | Execute pivot query | `analytics.report.read` |
| POST | `/analytics/query/visual` | Run secure visual query | `analytics.report.read` |

## api-platform

9 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/admin/api-platform/keys` | Get api keys | `admin.api-keys.read` |
| POST | `/admin/api-platform/keys` | Create api key | `admin.api-keys.read` |
| DELETE | `/admin/api-platform/keys/:id` | Revoke api key | `admin.api-keys.delete` |
| GET | `/admin/api-platform/webhooks` | Get webhook subscriptions | `admin.api-keys.delete` |
| POST | `/admin/api-platform/webhooks` | Create webhook subscription | `admin.webhooks.read` |
| DELETE | `/admin/api-platform/webhooks/:id` | Delete webhook subscription | `admin.webhooks.delete` |
| GET | `/admin/api-platform/webhooks/logs` | Get webhook delivery logs | `admin.webhooks.delete` |
| POST | `/admin/api-platform/keys/:id/scopes` | Update api key scopes | `admin.webhooks.read` |
| POST | `/admin/api-platform/webhooks/logs/:id/retry` | Retry webhook delivery | `admin.webhooks.create` |

## auth

17 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| POST | `/auth/register` | Register | `auth.create` |
| POST | `/auth/login` | Login | `auth.create` |
| POST | `/auth/logout` | Logout | `auth.create` |
| GET | `/auth/me` | Get profile | `auth.read` |
| PATCH | `/auth/me` | Update profile | `auth.update` |
| POST | `/auth/forgot-password` | Request password reset | — |
| POST | `/auth/reset-password` | Reset password | — |
| POST | `/auth/login-demo` | Login demo user | — |
| POST | `/auth/mfa/setup` | Setup TOTP MFA | — |
| POST | `/auth/mfa/verify` | Verify and enable/disable TOTP MFA | — |
| POST | `/auth/passkey/register-options` | Generate Passkey Registration Options | — |
| POST | `/auth/passkey/register` | Register Passkey Credential | — |
| POST | `/auth/passkey/login` | Login with Passkey | — |
| POST | `/auth/mfa/verify-login` | Verify MFA and Login | — |
| POST | `/auth/sso/saml/callback/:tenantSlug` | Saml callback | `auth.create` |
| POST | `/auth/sso/oidc/callback/:tenantSlug` | Oidc callback | `auth.create` |
| GET | `/auth/sso/config/:tenantSlug` | Get sso config | `auth.read` |

## builder

177 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/builder/stats` | Get stats | `builder.read` |
| GET | `/builder/recent-items` | Get recent items | `builder.read` |
| GET | `/builder/forms` | Get forms | `builder.form.read` |
| GET | `/builder/forms/stats` | Get form stats | `builder.form.read` |
| GET | `/builder/forms/:id` | Get form by id | `builder.form.read` |
| POST | `/builder/forms` | Create form | `builder.form.read` |
| PATCH | `/builder/forms/:id` | Update form | `builder.form.update` |
| DELETE | `/builder/forms/:id` | Delete form | `builder.form.delete` |
| POST | `/builder/forms/:id/publish` | Publish builder form | `builder.form.delete` |
| GET | `/builder/workflows` | Get workflows | `builder.workflow.read` |
| GET | `/builder/workflows/:id` | Get workflow by id | `builder.workflow.read` |
| POST | `/builder/workflows` | Create workflow | `builder.workflow.read` |
| PATCH | `/builder/workflows/:id` | Update workflow | `builder.workflow.update` |
| DELETE | `/builder/workflows/:id` | Delete workflow | `builder.workflow.delete` |
| POST | `/builder/workflows/:id/execute` | Execute workflow | `builder.workflow.delete` |
| GET | `/builder/workflows/:id/executions` | Get workflow executions | `builder.workflow.update` |
| GET | `/builder/dashboards/global-stats` | Get global performance stats | `builder.dashboard.read` |
| GET | `/builder/dashboards` | Get dashboards | `builder.dashboard.read` |
| GET | `/builder/dashboards/:id` | Get dashboard by id | `builder.dashboard.read` |
| POST | `/builder/dashboards` | Create dashboard | `builder.dashboard.read` |
| PATCH | `/builder/dashboards/:id` | Update dashboard | `builder.dashboard.update` |
| DELETE | `/builder/dashboards/:id` | Delete dashboard | `builder.dashboard.delete` |
| GET | `/builder/modules` | Get modules | `builder.module.read` |
| GET | `/builder/modules/:id` | Get module by id | `builder.module.read` |
| POST | `/builder/modules/generate` | Generate module via AI | `builder.module.read` |
| POST | `/builder/components/:id/generate` | Suggest fields inside components via AI | `builder.module.update` |
| POST | `/builder/modules` | Create module | `builder.module.update` |
| PATCH | `/builder/modules/:id` | Update module | `builder.module.update` |
| DELETE | `/builder/modules/:id` | Delete module | `builder.module.delete` |
| GET | `/builder/modules/:id/full` | Get module with components | `builder.module.read` |
| GET | `/builder/modules/:id/stats` | Get module stats | `builder.module.read` |
| POST | `/builder/modules/:id/components` | Add component to module | `builder.module.read` |
| DELETE | `/builder/modules/:id/components/:componentId` | Remove component from module | `builder.module.update` |
| POST | `/builder/modules/:id/pages` | Add page to module | `builder.module.update` |
| DELETE | `/builder/modules/:id/pages/:pageId` | Remove page from module | `builder.module.update` |
| PATCH | `/builder/modules/:id/pages/:pageId` | Update page in module | `builder.module.update` |
| POST | `/builder/modules/:id/data-models` | Add data model to module | `builder.module.update` |
| DELETE | `/builder/modules/:id/data-models/:dataModelId` | Remove data model from module | `builder.module.update` |
| POST | `/builder/modules/:id/test` | Run app tests | `builder.module.update` |
| POST | `/builder/modules/:id/publish` | Publish module | `builder.module.update` |
| POST | `/builder/modules/:id/unpublish` | Unpublish module | `builder.module.update` |
| GET | `/builder/modules/:id/releases` | Get module releases | `builder.module.update` |
| GET | `/builder/modules/:id/releases/:releaseId/diff` | Compare release snapshot | `builder.module.read` |
| POST | `/builder/modules/:id/rollback` | Rollback module | `builder.module.update` |
| GET | `/builder/marketplace` | Get marketplace | `builder.module.read` |
| POST | `/builder/marketplace/install` | Install builder app | `builder.module.read` |
| POST | `/builder/marketplace/uninstall` | Uninstall builder app | `builder.module.read` |
| GET | `/builder/automation-rules` | Get automation rules | `builder.automation.read` |
| GET | `/builder/automation-rules/:id` | Get automation rule by id | `builder.automation.read` |
| POST | `/builder/automation-rules` | Create automation rule | `builder.automation.read` |
| PATCH | `/builder/automation-rules/:id` | Update automation rule | `builder.automation.update` |
| DELETE | `/builder/automation-rules/:id` | Delete automation rule | `builder.automation.delete` |
| POST | `/builder/automation-rules/:id/test` | Test run automation rule | `builder.automation.delete` |
| GET | `/builder/data-imports` | Get data imports | `builder.import.read` |
| POST | `/builder/data-imports` | Create data import | `builder.import.read` |
| POST | `/builder/data-imports/:id/execute` | Execute data import | `builder.import.create` |
| GET | `/builder/web-pages` | Get web pages | `builder.web.read` |
| GET | `/builder/web-pages/:id` | Get web page by id | `builder.web.read` |
| POST | `/builder/web-pages` | Create web page | `builder.web.read` |
| PATCH | `/builder/web-pages/:id` | Update web page | `builder.web.update` |
| DELETE | `/builder/web-pages/:id` | Delete web page | `builder.web.delete` |
| GET | `/builder/blog-posts` | Get blog posts | `builder.blog.read` |
| GET | `/builder/blog-posts/:id` | Get blog post by id | `builder.blog.read` |
| POST | `/builder/blog-posts` | Create blog post | `builder.blog.read` |
| PATCH | `/builder/blog-posts/:id` | Update blog post | `builder.blog.update` |
| DELETE | `/builder/blog-posts/:id` | Delete blog post | `builder.blog.delete` |
| GET | `/builder/web-assets` | Get web assets | `builder.web.read` |
| POST | `/builder/web-assets` | Create web asset | `builder.web.read` |
| PATCH | `/builder/web-assets/:id` | Update web asset | `builder.web.create` |
| DELETE | `/builder/web-assets/:id` | Delete web asset | `builder.web.update` |
| GET | `/builder/web-templates` | Get web templates | `builder.web.read` |
| POST | `/builder/web-templates` | Create web template | `builder.web.read` |
| PATCH | `/builder/web-templates/:id` | Update web template | `builder.web.create` |
| DELETE | `/builder/web-templates/:id` | Delete web template | `builder.web.update` |
| GET | `/builder/web-menus` | Get web menus | `builder.web.read` |
| POST | `/builder/web-menus` | Create web menu | `builder.web.read` |
| PATCH | `/builder/web-menus/:id` | Update web menu | `builder.web.create` |
| DELETE | `/builder/web-menus/:id` | Delete web menu | `builder.web.update` |
| GET | `/builder/web-seo` | Get web seo | `builder.web.read` |
| POST | `/builder/web-seo` | Create web seo | `builder.web.read` |
| PATCH | `/builder/web-seo/:id` | Update web seo | `builder.web.create` |
| DELETE | `/builder/web-seo/:id` | Delete web seo | `builder.web.update` |
| POST | `/builder/analytics` | Log analytics | `builder.read` |
| POST | `/builder/ai-generate` | Generate schema | `builder.form.create` |
| GET | `/builder/schema-registries` | Get schema registries | `builder.schema.read` |
| GET | `/builder/schema-registries/:slug` | Get schema registry by slug | `builder.schema.read` |
| POST | `/builder/schema-registries` | Create schema registry | `builder.schema.read` |
| PATCH | `/builder/schema-registries/:id` | Update schema registry | `builder.schema.update` |
| DELETE | `/builder/schema-registries/:id` | Delete schema registry | `builder.schema.delete` |
| GET | `/builder/page-registries` | Get page registries | `builder.page.read` |
| GET | `/builder/page-registries/:id` | Get page registry by id | `builder.page.read` |
| GET | `/builder/page-registries/:module/:slug` | Get page registry by slug | `builder.page.read` |
| POST | `/builder/page-registries` | Create page registry | `builder.page.create` |
| PATCH | `/builder/page-registries/:id` | Update page registry | `builder.page.update` |
| DELETE | `/builder/page-registries/:id` | Delete page registry | `builder.page.delete` |
| POST | `/builder/page-registries/:id/restore` | Restore page registry history | `builder.page.delete` |
| POST | `/builder/page-registries/:id/publish` | Publish form | `builder.page.update` |
| GET | `/builder/custom-records/:schemaId` | Get custom records | `builder.record.read` |
| GET | `/builder/custom-records/:schemaId/:id` | Get custom record by id | `builder.record.read` |
| POST | `/builder/custom-records/:schemaId` | Create custom record | `builder.record.create` |
| PATCH | `/builder/custom-records/:schemaId/:id` | Update custom record | `builder.record.update` |
| DELETE | `/builder/custom-records/:schemaId/:id` | Delete custom record | `builder.record.delete` |
| GET | `/builder/web-settings` | Get web settings | `builder.page.read` |
| PATCH | `/builder/web-settings` | Update web settings | `builder.page.read` |
| GET | `/builder/web-collections/presets` | List collection presets | `builder.web.read` |
| GET | `/builder/web-collections` | Get collections | `builder.web.read` |
| GET | `/builder/web-collections/:id` | Get collection | `builder.web.read` |
| POST | `/builder/web-collections` | Create collection | `builder.web.read` |
| POST | `/builder/web-collections/seed` | Seed collection | `builder.web.create` |
| PATCH | `/builder/web-collections/:id` | Update collection | `builder.web.update` |
| DELETE | `/builder/web-collections/:id` | Delete collection | `builder.web.delete` |
| GET | `/builder/web-collections/:id/items` | Get collection items | `builder.web.read` |
| GET | `/builder/web-collections/:id/items/:itemId` | Get collection item | `builder.web.read` |
| POST | `/builder/web-collections/:id/items` | Create collection item | `builder.web.read` |
| PATCH | `/builder/web-collections/:id/items/:itemId` | Update collection item | `builder.web.update` |
| DELETE | `/builder/web-collections/:id/items/:itemId` | Delete collection item | `builder.web.delete` |
| GET | `/builder/web-form-submissions` | Get form submissions | `builder.web.read` |
| PATCH | `/builder/web-form-submissions/:id` | Update form submission | `builder.web.update` |
| DELETE | `/builder/web-form-submissions/:id` | Delete form submission | `builder.web.update` |
| GET | `/builder/web-orders` | Get orders | `builder.web.read` |
| GET | `/builder/web-orders/stats` | Get order stats | `builder.web.read` |
| PATCH | `/builder/web-orders/:id` | Update order | `builder.web.read` |
| DELETE | `/builder/web-orders/:id` | Delete order | `builder.web.update` |
| GET | `/builder/nav-overlay/:moduleId` | Get nav overlay + submodules for a module | `builder.read` |
| PUT | `/builder/nav-overlay/:moduleId` | Save nav overlay (reorder / hide / rename) | `builder.update` |
| DELETE | `/builder/nav-overlay/:moduleId` | Reset nav overlay to default | `builder.update` |
| POST | `/builder/nav-overlay/:moduleId/submodules` | Add a submodule to an existing app | `builder.create` |
| DELETE | `/builder/nav-overlay/:moduleId/submodules/:slug` | Delete a submodule from an app | `builder.delete` |
| GET | `/builder/widgets` | Get widgets | `builder.read` |
| POST | `/builder/widgets` | Create or update widget | `builder.create` |
| DELETE | `/builder/widgets/:id` | Delete widget | `builder.delete` |
| GET | `/builder/git/config` | Get git config | `builder.read` |
| POST | `/builder/git/config` | Save git config | `builder.create` |
| GET | `/builder/git/diff` | Get git diff | `builder.read` |
| POST | `/builder/git/commit` | Commit git changes | `builder.create` |
| GET | `/builder/native-builds` | Get native builds | `builder.read` |
| POST | `/builder/native-builds/trigger` | Trigger native build | `builder.create` |
| GET | `/builder/native-builds/:id/logs` | Get native build logs | `builder.read` |
| GET | `/builder/governance/modules/:moduleId/environments` | Get environments | `builder.read` |
| POST | `/builder/governance/modules/:moduleId/promote-staging` | Promote to staging | `builder.create` |
| POST | `/builder/governance/modules/:moduleId/promote-production` | Promote to production | `builder.create` |
| GET | `/builder/governance/modules/:moduleId/permissions` | Get permissions | `builder.read` |
| PATCH | `/builder/governance/modules/:moduleId/permissions` | Update permissions | `builder.update` |
| GET | `/builder/governance/modules/:moduleId/compare` | Compare versions | `builder.read` |
| POST | `/builder/governance/scripts/execute` | Execute script | `builder.create` |
| POST | `/builder/governance/scripts/validate` | Validate script | `builder.create` |
| POST | `/builder/governance/forms/:formId/hook` | Execute form hook | `builder.create` |
| GET | `/builder/governance/hooks` | Get available hooks | `builder.read` |
| POST | `/builder/governance/query/run` | Dry-run SQL / custom query builder check | `builder.read` |
| GET | `/builder/governance/summary` | Get governance dashboard summary statistics | `builder.read` |
| GET | `/builder/governance/logs` | Get system execution run logs | `builder.read` |
| GET | `/builder/governance/connectors` | Get registered third-party connectors | `builder.read` |
| POST | `/builder/governance/connectors` | Register third-party API connector | `builder.create` |
| DELETE | `/builder/governance/connectors/:id` | Delete API connector | `builder.delete` |
| GET | `/builder/governance/marketplace` | List marketplace extensions | `builder.read` |
| GET | `/builder/governance/permissions` | Get global studio permissions list | `builder.read` |
| POST | `/builder/governance/permissions` | Save studio permission mapping | `builder.create` |
| DELETE | `/builder/governance/permissions/:id` | Delete studio permission entry | `builder.delete` |
| GET | `/public/web/site` | Resolve site + nav by host | — |
| GET | `/public/web/page` | Get a published site page by path | — |
| POST | `/public/web/chat` | Chat with the site assistant | — |
| GET | `/public/web/collections/:slug` | Get collection items | — |
| GET | `/public/web/collections/:slug/:itemSlug` | Get collection item | — |
| POST | `/public/web/forms/submit` | Submit form | — |
| POST | `/public/web/checkout` | Checkout | — |
| GET | `/builder/web-studio/sites` | List sites | `builder.read` |
| GET | `/builder/web-studio/sites/:id` | Get site | `builder.read` |
| POST | `/builder/web-studio/sites` | Create site | `builder.create` |
| PATCH | `/builder/web-studio/sites/:id` | Update site | `builder.update` |
| DELETE | `/builder/web-studio/sites/:id` | Delete site | `builder.delete` |
| POST | `/builder/web-studio/sites/:id/domains` | Add domain | `builder.update` |
| DELETE | `/builder/web-studio/sites/:id/domains/:domainId` | Remove domain | `builder.update` |
| GET | `/builder/web-studio/sites/:id/pages` | List site pages | `builder.read` |
| PUT | `/builder/web-studio/sites/:id/pages` | Create or update a site page | `builder.update` |
| DELETE | `/builder/web-studio/sites/:id/pages/:pageId` | Delete a site page | `builder.delete` |
| GET | `/builder/web-studio/sites/:id/chatbot` | Get chatbot config | `builder.read` |
| PATCH | `/builder/web-studio/sites/:id/chatbot` | Update chatbot config | `builder.update` |

## communication

41 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/communication/workspace` | Get workspace | `communication.channel.read` |
| GET | `/communication/directory` | Get directory | `communication.channel.read` |
| POST | `/communication/spaces` | Create space | `communication.channel.create` |
| POST | `/communication/channels` | Create channel | `communication.channel.create` |
| POST | `/communication/channels/dm` | Create d m | `communication.channel.create` |
| POST | `/communication/channels/group` | Create group | `communication.channel.create` |
| POST | `/communication/channels/:channelId/read` | Mark read | `communication.message.read` |
| GET | `/communication/channels/browse` | Browse public channels not yet joined | `communication.channel.read` |
| GET | `/communication/channels/:id/members` | List channel members with their role | `communication.channel.read` |
| PATCH | `/communication/channels/:id` | Rename or archive a channel | `communication.channel.manage` |
| POST | `/communication/channels/:id/join` | Join a public channel | `communication.channel.join` |
| POST | `/communication/channels/:id/members` | Add a channel member | `communication.channel.member.manage` |
| DELETE | `/communication/channels/:id/members/:userId` | Remove a channel member | `communication.channel.member.manage` |
| GET | `/communication/search` | Search messages across my channels | `communication.message.search` |
| GET | `/communication/messages/:id/read-receipts` | Get message read receipts (US-B4) | `communication.message.read` |
| GET | `/communication/link-preview` | Get link preview metadata (US-C2) | `communication.message.read` |
| GET | `/communication/channels/:channelId/messages` | Get messages | `communication.message.read` |
| POST | `/communication/channels/:channelId/messages` | Create message | `communication.message.read` |
| POST | `/communication/channels/:channelId/attachments` | Upload a real file attachment for a Connect message (US-A1/US-A2) | `communication.message-attachment.upload` |
| PATCH | `/communication/messages/:id` | Edit message | `communication.message.create` |
| DELETE | `/communication/messages/:id` | Delete message | `communication.message.create` |
| POST | `/communication/messages/:id/pin` | Toggle pin | `communication.message.create` |
| POST | `/communication/messages/:id/reactions` | Toggle reaction | `communication.message.create` |
| GET | `/communication/bookmarks` | Get bookmarks | `communication.message.read` |
| POST | `/communication/messages/:id/bookmark` | Toggle bookmark | `communication.message.read` |
| POST | `/communication/channels/:channelId/star` | Toggle star | `communication.channel.read` |
| POST | `/communication/channels/:channelId/mute` | Toggle mute | `communication.channel.read` |
| PUT | `/communication/channels/:channelId/notify-level` | Set my per-channel notification level (US-B5) | `communication.channel.read` |
| GET | `/communication/presence` | Get presence | `communication.channel.read` |
| PUT | `/communication/presence` | Set presence | `communication.channel.read` |
| GET | `/communication/meetings` | Get meetings | `communication.channel.read` |
| POST | `/communication/meetings` | Create meeting | `communication.channel.read` |
| PUT | `/communication/meetings/:id/end` | End meeting | `communication.channel.create` |
| GET | `/communication/events` | Get events | `communication.channel.read` |
| POST | `/communication/events` | Create event | `communication.channel.read` |
| DELETE | `/communication/events/:id` | Delete event | `communication.channel.create` |
| GET | `/communication/notifications` | Get notifications | `communication.notification.read` |
| POST | `/communication/notifications` | Create notification | `communication.notification.read` |
| PUT | `/communication/notifications/:id/status` | Update notification status | `communication.notification.update` |
| GET | `/communication/email-templates` | Get email templates | `communication.email-template.read` |
| POST | `/communication/email-templates` | Create email template | `communication.email-template.read` |

## crm

474 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| POST | `/crm/ai-drafting/opportunities/:opportunityId/followup` | Generate a follow-up email draft for an opportunity/deal | `crm.opportunity.update` |
| POST | `/crm/ai-drafting/quotations/:quotationId/cover-note` | Generate an AI cover note draft for a quotation | `crm.opportunity.update` |
| POST | `/crm/ai-drafting/leads/:leadId/outreach` | Generate an AI outreach email draft for a lead | `crm.lead.update` |
| POST | `/crm/ai-drafting/:draftId/regenerate` | Regenerate an existing draft (same context, optionally a new tone) | `crm.opportunity.update` |
| GET | `/crm/ai-drafting` | List drafts, optionally scoped to a context (opportunity/quotation/lead) | `crm.opportunity.read` |
| GET | `/crm/ai-drafting/:draftId` | Get a single draft | `crm.opportunity.read` |
| PATCH | `/crm/ai-drafting/:draftId` | Edit a draft\ | `crm.opportunity.read` |
| POST | `/crm/ai-drafting/:draftId/mark-used` | Mark a draft as used (sent by the rep through their own email client) | `crm.opportunity.update` |
| POST | `/crm/ai-drafting/:draftId/discard` | Discard a draft | `crm.opportunity.update` |
| POST | `/crm/cadences` | Create a multi-channel sales cadence | `crm.settings.create` |
| GET | `/crm/cadences/:id` | Get a cadence with steps and auto-enroll rules | `crm.settings.read` |
| GET | `/crm/cadences/auto-enroll-rules/list` | List auto-enroll rules | `crm.settings.read` |
| POST | `/crm/cadences/auto-enroll-rules` | Create an auto-enroll rule | `crm.settings.read` |
| PUT | `/crm/cadences/auto-enroll-rules/:id` | Update an auto-enroll rule | `crm.settings.update` |
| DELETE | `/crm/cadences/auto-enroll-rules/:id` | Delete an auto-enroll rule | `crm.settings.delete` |
| POST | `/crm/cadences/auto-enroll-rules/evaluate/:leadId` | Evaluate auto-enroll rules for a lead | `crm.lead.update` |
| POST | `/crm/cadences/process-due-steps` | Process all due cadence steps now (manual trigger; scheduler-ready) | `crm.lead.update` |
| GET | `/crm/cadences/step-tasks/mine` | List my pending cadence step tasks (call/task/LinkedIn touchpoints) | `crm.settings.update` |
| POST | `/crm/cadences/step-tasks/:id/complete` | Complete (or skip) a cadence step task | `crm.lead.read` |
| POST | `/crm/coaching/rubrics` | Create a coaching scorecard rubric | `crm.coaching.manage` |
| GET | `/crm/coaching/rubrics` | List coaching rubrics | `crm.coaching.read` |
| GET | `/crm/coaching/rubrics/:id` | Get one coaching rubric | `crm.coaching.read` |
| PUT | `/crm/coaching/rubrics/:id` | Update a coaching rubric | `crm.coaching.read` |
| POST | `/crm/coaching/scorecards` | Score a logged call against a rubric (manager review) | `crm.coaching.create` |
| GET | `/crm/coaching/calls/:activityId/scorecards` | List scorecards for a given call activity | `crm.coaching.read` |
| GET | `/crm/coaching/scorecards/:id` | Get one scorecard | `crm.coaching.read` |
| PUT | `/crm/coaching/scorecards/:id/acknowledge` | Rep acknowledges a coaching scorecard (closes the review loop) | `crm.coaching.read` |
| GET | `/crm/coaching/reps/:repUserId/summary` | Per-rep coaching summary: average score, talk ratio, trend | `crm.coaching.read` |
| GET | `/crm/coaching/dashboard` | Team-wide coaching dashboard: per-rep averages | `crm.coaching.read` |
| POST | `/crm/coaching/library` | Add an exemplar call/note to the coaching library | `crm.coaching.read` |
| GET | `/crm/coaching/library` | List coaching library items | `crm.coaching.read` |
| DELETE | `/crm/coaching/library/:id` | Remove a coaching library item | `crm.coaching.read` |
| GET | `/crm/commission-plans` | List commission plans | `crm.commission.read` |
| GET | `/crm/commission-plans/:id` | Get a commission plan with tiers and SPIFFs | `crm.commission.read` |
| POST | `/crm/commission-plans` | Create a commission plan | `crm.commission.read` |
| PATCH | `/crm/commission-plans/:id` | Update a commission plan | `crm.commission.manage` |
| DELETE | `/crm/commission-plans/:id` | Soft-delete a commission plan | `crm.commission.manage` |
| POST | `/crm/commission-plans/:id/tiers` | Add a quota-attainment accelerator tier to a plan | `crm.commission.manage` |
| DELETE | `/crm/commission-plans/tiers/:tierId` | Remove a tier from a plan | `crm.commission.manage` |
| GET | `/crm/commission-plans/spiffs/all` | List SPIFF bonus rules | `crm.commission.read` |
| POST | `/crm/commission-plans/spiffs` | Create a SPIFF bonus rule | `crm.commission.read` |
| PATCH | `/crm/commission-plans/spiffs/:id` | Update a SPIFF bonus rule | `crm.commission.manage` |
| DELETE | `/crm/commission-plans/spiffs/:id` | Delete a SPIFF bonus rule | `crm.commission.manage` |
| POST | `/crm/commission-plans/calculate-payouts` | Calculate quota-attainment-tiered + SPIFF payouts for a plan/period | `crm.commission.manage` |
| GET | `/crm/commission-plans/payouts/all` | List calculated payouts | `crm.commission.read` |
| GET | `/crm/commission-plans/payouts/:id` | Get a single payout with SPIFF detail lines | `crm.commission.read` |
| POST | `/crm/commission-plans/payouts/:id/approve` | Approve a draft payout | `crm.commission.read` |
| POST | `/crm/commission-plans/payouts/:id/mark-paid` | Mark an approved payout as paid | `crm.commission.manage` |
| GET | `/crm/contracts` | List contracts (paginated, searchable, sortable) | `crm.contracts.read` |
| GET | `/crm/contracts/stats` | Contract KPI stats (active/expiring-soon/expired/total value) | `crm.contracts.read` |
| POST | `/crm/contracts/scan-renewals` | Scan and auto-transition contracts nearing renewal/expiry | `crm.contracts.read` |
| GET | `/crm/contracts/:id` | Get contract by ID | `crm.contracts.update` |
| POST | `/crm/contracts` | Create contract | `crm.contracts.read` |
| PUT | `/crm/contracts/:id` | Update contract | `crm.contracts.update` |
| PATCH | `/crm/contracts/:id/status` | Change contract status | `crm.contracts.update` |
| POST | `/crm/contracts/:id/renew` | Renew contract (extend in place or create a follow-on contract) | `crm.contracts.update` |
| DELETE | `/crm/contracts/:id` | Delete contract (soft) | `crm.contracts.delete` |
| POST | `/crm/contracts/:id/submit-approval` | Submit contract for approval | `crm.contracts.update` |
| POST | `/crm/contracts/:id/approve` | Approve contract | `crm.contracts.update` |
| POST | `/crm/contracts/:id/reject` | Reject contract | `crm.contracts.update` |
| POST | `/crm/contracts/:id/invite-sign` | Invite signer to sign contract | `crm.contracts.update` |
| POST | `/crm/contracts/:id/sign` | Sign contract | `crm.contracts.update` |
| POST | `/crm/contracts/:id/revise` | Revise contract (creates a new draft copy of an active contract) | `crm.contracts.update` |
| POST | `/crm/contracts/:id/sales-order` | Convert contract to a Sales Order | `crm.contracts.update` |
| POST | `/crm/contracts/:contractId/milestones` | Add a billing milestone to a contract | `crm.contracts.update` |
| DELETE | `/crm/contracts/:contractId/milestones/:id` | Delete a billing milestone | `crm.contracts.update` |
| POST | `/crm/contracts/:contractId/milestones/:id/invoice` | Trigger milestone invoicing (generates a draft Invoice in Finance module) | `crm.contracts.update` |
| POST | `/crm/conversation-intelligence/calls` | Log a call and auto-generate its AI summary/sentiment/action items | `crm.activity.create` |
| POST | `/crm/conversation-intelligence/calls/:id/regenerate-summary` | Re-run AI analysis on a logged call (e.g. after a transcript correction) | `crm.activity.update` |
| GET | `/crm/conversation-intelligence/calls/:id` | Get one logged call with its full transcript + AI analysis | `crm.activity.read` |
| GET | `/crm/conversation-intelligence/calls` | List logged calls, optionally filtered by deal/lead/customer/sentiment | `crm.activity.read` |
| GET | `/crm/conversation-intelligence/insights/summary` | Tenant-wide conversation intelligence rollup (sentiment mix, avg engagement score) | `crm.activity.read` |
| GET | `/crm/conversion-analytics/summary` | Overall lead-to-opportunity-to-won funnel summary, with average cycle time | `crm.lead.read` |
| GET | `/crm/conversion-analytics/by-source` | Funnel conversion rates broken down by lead source | `crm.lead.read` |
| GET | `/crm/conversion-analytics/by-campaign` | Funnel conversion rates broken down by campaign | `crm.lead.read` |
| GET | `/crm/conversion-analytics/by-rep` | Funnel conversion-rate leaderboard broken down by assigned rep | `crm.lead.read` |
| GET | `/crm/conversion-analytics/trend` | Trailing weekly time-series of leads created vs. converted vs. opportunities won | `crm.lead.read` |
| POST | `/crm/deal-rooms` | Create a deal room for an opportunity | `crm.dealroom.create` |
| GET | `/crm/deal-rooms` | List deal rooms | `crm.dealroom.read` |
| GET | `/crm/deal-rooms/:id` | Get one deal room with milestones/stakeholders/documents | `crm.dealroom.read` |
| GET | `/crm/deal-rooms/by-opportunity/:opportunityId` | Get the deal room for a given opportunity (null if none exists) | `crm.dealroom.read` |
| PUT | `/crm/deal-rooms/:id/archive` | Archive a deal room | `crm.dealroom.read` |
| POST | `/crm/deal-rooms/:id/milestones` | Add a mutual action plan milestone | `crm.dealroom.update` |
| PUT | `/crm/deal-rooms/milestones/:milestoneId` | Update a milestone (status, owner, due date) | `crm.dealroom.update` |
| DELETE | `/crm/deal-rooms/milestones/:milestoneId` | Delete a milestone | `crm.dealroom.update` |
| POST | `/crm/deal-rooms/:id/stakeholders` | Add a stakeholder to the deal room stakeholder map | `crm.dealroom.update` |
| DELETE | `/crm/deal-rooms/stakeholders/:stakeholderId` | Remove a stakeholder | `crm.dealroom.update` |
| POST | `/crm/deal-rooms/:id/documents` | Share a document into the deal room | `crm.dealroom.update` |
| DELETE | `/crm/deal-rooms/documents/:documentId` | Remove a shared document | `crm.dealroom.update` |
| GET | `/crm/deal-rooms/:token` | Buyer: view the deal room via their access token | — |
| POST | `/crm/deal-rooms/:token/milestones/:milestoneId/complete` | Buyer: mark a buyer/mutual-owned milestone complete | — |
| POST | `/crm/deal-rooms/:token/documents/:documentId/view` | Buyer: record that a shared document was viewed | — |
| GET | `/crm/duplicate-rules` | List | `crm.duplicate-rules.read` |
| GET | `/crm/duplicate-rules/:id` | Get One | `crm.duplicate-rules.read` |
| POST | `/crm/duplicate-rules` | Create | `crm.duplicate-rules.read` |
| PUT | `/crm/duplicate-rules/:id` | Update | `crm.duplicate-rules.create` |
| DELETE | `/crm/duplicate-rules/:id` | Remove | `crm.duplicate-rules.update` |
| GET | `/crm/duplicates/scan` | Scan all records for an entity, group duplicates | `crm.duplicate-rules.delete` |
| POST | `/crm/duplicates/find` | Scan all records for an entity, group duplicates | `crm.duplicates.scan` |
| POST | `/crm/leads/merge` | Merge Leads | `crm.duplicates.scan` |
| POST | `/crm/contacts/merge` | Merge Contacts | `crm.duplicates.merge` |
| POST | `/crm/customers/merge` | Merge Customers | `crm.duplicates.merge` |
| POST | `/crm/accounts/merge` | Merge Accounts | `crm.duplicates.merge` |
| GET | `/crm/expansion/deal-score/:id` | Get Deal Score | `crm.opportunity.read` |
| GET | `/crm/expansion/rotting-deals` | Get Rotting Deals | `crm.opportunity.read` |
| GET | `/crm/expansion/deal-velocity` | Get Deal Velocity | `crm.opportunity.read` |
| GET | `/crm/expansion/revenue-waterfall` | Get Revenue Waterfall | `crm.opportunity.read` |
| GET | `/crm/expansion/influence-map/:customerId` | Get Influence Map | `crm.contact.read` |
| GET | `/crm/expansion/health-score/:customerId` | Get Health Score | `crm.contact.read` |
| GET | `/crm/expansion/risk-alerts` | Get Risk Alerts | `crm.customer.read` |
| GET | `/crm/expansion/marketing-funnel` | Get Marketing Funnel | `crm.campaign.read` |
| GET | `/crm/expansion/marketing-dashboard` | Get Marketing Dashboard | `crm.campaign.read` |
| GET | `/crm/expansion/sla-calendar` | Get Sla Calendar | `crm.case.read` |
| GET | `/crm/expansion/ticket-analytics` | Get Ticket Analytics | `crm.case.read` |
| GET | `/crm/expansion/objection-database` | Get Objections | `crm.playbook.read` |
| GET | `/crm/expansion/gamification-leaderboard` | Get Leaderboard | `crm.playbook.read` |
| GET | `/crm/expansion/revops-metrics` | Get Rev Ops Metrics | `crm.sales-target.read` |
| GET | `/crm/expansion/commissions` | Get Commissions | `crm.sales-target.read` |
| GET | `/crm/expansion/partners` | Get Partners | `crm.partner.read` |
| GET | `/crm/expansion/workflows` | Get Workflows | `crm.workflow.read` |
| POST | `/crm/expansion/forecast-snapshots` | Create Forecast Snapshot | `crm.opportunity.update` |
| GET | `/crm/expansion/forecast-snapshots` | Get Forecast Snapshots | `crm.opportunity.read` |
| PUT | `/crm/expansion/forecast-snapshots/:id/freeze` | Freeze Forecast Snapshot | `crm.opportunity.update` |
| PUT | `/crm/expansion/forecast-snapshots/:id/adjust` | Adjust Forecast | `crm.opportunity.update` |
| POST | `/crm/expansion/quotas` | Create Quota | `crm.sales-target.update` |
| GET | `/crm/expansion/quotas` | Get Quotas | `crm.sales-target.read` |
| POST | `/crm/expansion/opportunities/:id/tags` | Add Deal Tag | `crm.opportunity.update` |
| DELETE | `/crm/expansion/opportunities/:id/tags/:tag` | Remove Deal Tag | `crm.opportunity.update` |
| POST | `/crm/expansion/opportunities/:id/team` | Add Deal Team Member | `crm.opportunity.update` |
| DELETE | `/crm/expansion/opportunities/:id/team/:userId` | Remove Deal Team Member | `crm.opportunity.update` |
| POST | `/crm/expansion/account-plans` | Create Account Plan | `crm.customer.update` |
| GET | `/crm/expansion/account-plans` | Get Account Plans | `crm.customer.read` |
| POST | `/crm/expansion/opportunities/:id/contact-roles` | Assign Contact Role | `crm.opportunity.update` |
| DELETE | `/crm/expansion/opportunities/:id/contact-roles/:contactId` | Remove Contact Role | `crm.opportunity.update` |
| POST | `/crm/expansion/customers/:id/health` | Log Customer Health | `crm.customer.update` |
| GET | `/crm/expansion/customers/:id/health` | Get Customer Health Logs | `crm.customer.update` |
| POST | `/crm/expansion/customers/merge` | Merge Accounts | `crm.customer.update` |
| GET | `/crm/expansion/customers/:customerId/hierarchy` | Get Account Hierarchy Real | `crm.customer.read` |
| PUT | `/crm/expansion/customers/:customerId/parent` | Set Parent Account | `crm.customer.read` |
| GET | `/crm/expansion/customers/:customerId/hierarchy-tree` | Get Hierarchy Tree | `crm.customer.update` |
| GET | `/crm/expansion/customers/:customerId/hierarchy-rollup` | Get Hierarchy Rollup | `crm.customer.read` |
| POST | `/crm/gamification/leaderboard/recompute` | Recompute + persist the leaderboard snapshot for a period | `crm.commission.update` |
| GET | `/crm/gamification/leaderboard` | Get the leaderboard for a period | `crm.commission.read` |
| GET | `/crm/gamification/leaderboard/periods` | List periods that have a computed leaderboard | `crm.commission.read` |
| POST | `/crm/gamification/streaks/recompute` | Recompute activity/deals-won streaks for every rep | `crm.commission.read` |
| GET | `/crm/gamification/streaks` | List current rep streaks | `crm.commission.read` |
| GET | `/crm/gamification/badges` | List badge definitions | `crm.commission.read` |
| POST | `/crm/gamification/badges` | Create a badge definition | `crm.commission.read` |
| PATCH | `/crm/gamification/badges/:id` | Update a badge definition | `crm.commission.manage` |
| DELETE | `/crm/gamification/badges/:id` | Soft-delete a badge definition | `crm.commission.manage` |
| POST | `/crm/gamification/badges/evaluate` | Evaluate every active badge against current deal/activity data and award new ones | `crm.commission.update` |
| GET | `/crm/gamification/badges/awards` | List badge awards (optionally for one user) | `crm.commission.read` |
| GET | `/crm/gamification/me` | Get my own gamification summary (rank, badges, streaks) | `crm.commission.read` |
| GET | `/crm/ml-models` | Get ML models | `crm.lead-scoring.read` |
| POST | `/crm/ml-models/train` | Train lead scoring ML model | `crm.lead-scoring.read` |
| GET | `/crm/leads/:id/scoring-factors` | Get lead scoring factors (top-3) | `crm.lead-scoring.create` |
| GET | `/crm/journey/:entityType/:entityId` | Get journey timeline for entity | `crm.contact.read` |
| GET | `/crm/opportunities/:id/attribution` | Calculate attribution for opportunity | `crm.opportunity.read` |
| GET | `/crm/sentiment/:entityType/:entityId` | Analyze sentiment for entity | `crm.contact.read` |
| GET | `/crm/opportunities/:id/deal-health` | Get deal health indicator | `crm.opportunity.read` |
| GET | `/crm/customers/:id/health` | Get customer health score | `crm.contact.read` |
| GET | `/crm/customers/at-risk` | Get at-risk customers dashboard | `crm.contact.read` |
| GET | `/crm/analytics/deal-velocity` | Get deal velocity analysis | `crm.report.read` |
| GET | `/crm/customers/:id/clv` | Get customer lifetime value | `crm.contact.read` |
| POST | `/crm/social-enrich/:entityType/:entityId` | Enrich social profile for entity | `crm.contact.create` |
| GET | `/crm/customers/:id/intent-signals` | Get intent signals for account | `crm.contact.read` |
| GET | `/crm/partners/performance` | Get partner performance | `crm.contact.read` |
| POST | `/crm/partners/lead` | Register partner lead | `crm.contact.read` |
| GET | `/crm/partners/:id/mdf` | Get partner MDF summary | `crm.contact.read` |
| GET | `/crm/campaigns-analytics` | Get campaign intelligence analytics | `crm.report.read` |
| GET | `/crm/campaigns-analytics/send-time` | Get send time optimization | `crm.report.read` |
| GET | `/crm/campaigns-analytics/:id/ab-test` | Get email A/B test results | `crm.report.read` |
| GET | `/crm/lead-scoring/rules` | List lead scoring rules | `crm.lead-scoring.read` |
| GET | `/crm/lead-scoring/rules/:id` | List lead scoring rules | `crm.lead-scoring.read` |
| POST | `/crm/lead-scoring/rules` | Create | `crm.lead-scoring.read` |
| PUT | `/crm/lead-scoring/rules/:id` | Update | `crm.lead-scoring.create` |
| DELETE | `/crm/lead-scoring/rules/:id` | Remove | `crm.lead-scoring.update` |
| POST | `/crm/leads/:id/recalculate-score` | Recalc One | `crm.lead-scoring.delete` |
| POST | `/crm/lead-scoring/recalculate-all` | Recalc All | `crm.lead-scoring.recalculate` |
| GET | `/crm/mailbox-connections` | List mailbox connections for the current user | `crm.mailbox.read` |
| POST | `/crm/mailbox-connections/connect` | Begin OAuth consent flow for a mailbox provider | `crm.mailbox.read` |
| POST | `/crm/mailbox-connections/callback` | Handle OAuth callback: exchange code for tokens and store the connection | `crm.mailbox.create` |
| DELETE | `/crm/mailbox-connections/:id` | Disconnect a mailbox | `crm.mailbox.create` |
| POST | `/crm/mailbox-connections/:id/sync` | Manually trigger a sync for a connected mailbox | `crm.mailbox.delete` |
| POST | `/crm/pipeline-risk/recompute` | Recompute stage-change risk alerts across the whole pipeline | `crm.opportunity.update` |
| GET | `/crm/pipeline-risk` | List open risk alerts (dashboard) | `crm.opportunity.read` |
| GET | `/crm/pipeline-risk/summary` | Risk alert summary counts (by risk level / type) | `crm.opportunity.read` |
| GET | `/crm/pipeline-risk/opportunities/:opportunityId` | List risk alerts for one opportunity | `crm.opportunity.read` |
| POST | `/crm/pipeline-risk/:id/acknowledge` | Acknowledge a risk alert | `crm.opportunity.read` |
| POST | `/crm/pipeline-risk/:id/snooze` | Snooze a risk alert for N days | `crm.opportunity.update` |
| POST | `/crm/pipeline-risk/:id/resolve` | Resolve a risk alert | `crm.opportunity.update` |
| GET | `/crm/pipelines/:pipelineId/stages` | List | `crm.pipelines.read` |
| GET | `/crm/pipelines/:pipelineId/stages/:id` | Get One | `crm.pipelines.read` |
| POST | `/crm/pipelines/:pipelineId/stages` | Create | `crm.pipelines.read` |
| PUT | `/crm/pipelines/:pipelineId/stages/:id` | Update | `crm.pipelines.update` |
| DELETE | `/crm/pipelines/:pipelineId/stages/:id` | Remove | `crm.pipelines.delete` |
| POST | `/crm/pipelines/:pipelineId/stages/reorder` | Reorder | `crm.pipelines.delete` |
| GET | `/crm/quote-signature/quotations/:quotationId` | List signature requests for a quotation | `crm.opportunity.read` |
| POST | `/crm/quote-signature/request` | Request an e-signature for a quotation | `crm.opportunity.read` |
| GET | `/crm/quote-signature/certificates/:signatureId` | Get the signature audit certificate | `crm.opportunity.read` |
| GET | `/crm/quote-signature/certificates/:signatureId/document` | Render the certificate document (text content a PDF export would embed) | `crm.opportunity.read` |
| GET | `/crm/quote-signature/:token` | Look up a pending signature request by token | — |
| POST | `/crm/quote-signature/sign` | Sign the quotation via the emailed token | — |
| GET | `/crm/quote-signature/certificates/:signatureId/document` | Public: fetch the issued certificate document for a signed quotation | — |
| POST | `/crm/revenue-intelligence/digest/generate` | Generate and send the deal-risk digest to reps + managers (admin/scheduler-triggered) | `crm.opportunity.update` |
| GET | `/crm/revenue-intelligence/digest/runs` | List past digest runs (audit history), optionally scoped to one recipient | `crm.opportunity.read` |
| GET | `/crm/segments` | List | `crm.segments.read` |
| GET | `/crm/segments/:id` | Get One | `crm.segments.read` |
| POST | `/crm/segments` | Create | `crm.segments.read` |
| PUT | `/crm/segments/:id` | Update | `crm.segments.create` |
| DELETE | `/crm/segments/:id` | Remove | `crm.segments.update` |
| POST | `/crm/segments/:id/refresh` | Refresh | `crm.segments.delete` |
| GET | `/crm/segments/:id/members` | Members | `crm.segments.update` |
| GET | `/crm/sla-policies` | List SLA policies for the tenant. | `crm.sla-policies.read` |
| GET | `/crm/sla-policies/:id` | Get a single SLA policy by id. | `crm.sla-policies.read` |
| POST | `/crm/sla-policies` | Create a new SLA policy. | `crm.sla-policies.read` |
| PUT | `/crm/sla-policies/:id` | Update an existing SLA policy. | `crm.sla-policies.create` |
| DELETE | `/crm/sla-policies/:id` | Delete an SLA policy. | `crm.sla-policies.update` |
| GET | `/crm/sla/breaches` | List detected SLA breaches. | `crm.sla-policies.delete` |
| POST | `/crm/sla/detect-breaches` | Run SLA breach detection now. | `crm.sla-policies.read` |
| GET | `/crm/territory-rules` | List territory assignment rules | `crm.settings.read` |
| GET | `/crm/territory-rules/:id` | Get a territory assignment rule | `crm.settings.read` |
| POST | `/crm/territory-rules` | Create a territory assignment rule | `crm.settings.read` |
| PUT | `/crm/territory-rules/:id` | Update a territory assignment rule | `crm.settings.update` |
| DELETE | `/crm/territory-rules/:id` | Delete a territory assignment rule | `crm.settings.delete` |
| GET | `/crm/territory-rules/log/entries` | Get territory assignment audit log | `crm.report.read` |
| POST | `/crm/territory-rules/assign` | Run territory assignment rules against a lead | `crm.report.read` |
| POST | `/crm/territory-rules/reassign-all` | Bulk re-run territory assignment for all open leads | `crm.lead.update` |
| GET | `/crm/customers` | Get customers | `crm.contact.read` |
| GET | `/crm/customers/tags` | Get customer tags | `crm.contact.read` |
| POST | `/crm/customers/tags` | Create customer tag | `crm.contact.read` |
| DELETE | `/crm/customers/tags/:id` | Delete customer tag | `crm.contact.delete` |
| POST | `/crm/customers/:id/tags` | Assign customer tag | `crm.contact.delete` |
| DELETE | `/crm/customers/:id/tags/:tagId` | Remove customer tag | `crm.contact.update` |
| GET | `/crm/customers/:id` | Get customer by id | `crm.contact.read` |
| GET | `/crm/customers/:id/summary` | Get customer summary / 360 view | `crm.contact.read` |
| POST | `/crm/customers` | Create customer | `crm.contact.read` |
| PUT | `/crm/customers/:id` | Update customer | `crm.contact.update` |
| DELETE | `/crm/customers/:id` | Delete customer | `crm.contact.delete` |
| PATCH | `/crm/customers/:id/status` | Change customer status | `crm.contact.delete` |
| POST | `/crm/customers/:id/credit-hold` | Place customer on credit hold | `crm.contact.update` |
| POST | `/crm/customers/:id/credit-release` | Release credit hold for customer | `crm.contact.update` |
| GET | `/crm/customers/:id/notes` | Get customer notes/activities | `crm.contact.read` |
| POST | `/crm/customers/:id/notes` | Add customer note/activity | `crm.contact.read` |
| POST | `/crm/customers/bulk-status` | Bulk update customer status | `crm.contact.update` |
| GET | `/crm/customers-export` | Export customers (CSV-ready JSON) | `crm.contact.read` |
| GET | `/crm/vendors` | Get vendors (paginated, searchable, sortable) | `procurement.vendor.read` |
| POST | `/crm/vendors` | Create vendor | `procurement.vendor.create` |
| GET | `/crm/vendors/:id` | Get vendor by ID | `procurement.vendor.read` |
| GET | `/crm/vendors/:id/summary` | Get vendor 360° summary | `procurement.vendor.read` |
| PUT | `/crm/vendors/:id` | Update vendor | `procurement.vendor.read` |
| DELETE | `/crm/vendors/:id` | Delete vendor (soft) | `procurement.vendor.delete` |
| PATCH | `/crm/vendors/:id/status` | Change vendor status | `procurement.vendor.delete` |
| GET | `/crm/vendors/:id/notes` | Get vendor notes/activities | `procurement.vendor.read` |
| POST | `/crm/vendors/:id/notes` | Add vendor note/activity | `procurement.vendor.read` |
| POST | `/crm/vendors/bulk-status` | Bulk update vendor status | `procurement.vendor.update` |
| GET | `/crm/vendors-export` | Export vendors (CSV-ready JSON) | `procurement.vendor.read` |
| GET | `/crm/contacts` | Get contacts (paginated, searchable, sortable) | `crm.contact.read` |
| GET | `/crm/contacts/:id` | Get contact by ID | `crm.contact.read` |
| POST | `/crm/contacts` | Create contact | `crm.contact.read` |
| PUT | `/crm/contacts/:id` | Update contact | `crm.contact.update` |
| DELETE | `/crm/contacts/:id` | Delete contact | `crm.contact.delete` |
| GET | `/crm/lead-sources` | Get lead sources | `crm.lead.read` |
| GET | `/crm/leads` | Get leads (paginated, searchable, sortable) | `crm.lead.read` |
| GET | `/crm/leads/stalled` | Get leads with no recent activity (at risk of going cold) | `crm.lead.read` |
| GET | `/crm/leads/:id` | Get lead by id | `crm.lead.read` |
| GET | `/crm/leads/:id/summary` | Get lead 360 summary (activities, converted opportunities, scoring metrics) | `crm.lead.read` |
| POST | `/crm/leads` | Create lead | `crm.lead.read` |
| PUT | `/crm/leads/:id` | Update lead | `crm.lead.create` |
| PATCH | `/crm/leads/:id/status` | Update lead status | `crm.lead.update` |
| POST | `/crm/leads/:id/convert` | Convert lead | `crm.lead.update` |
| DELETE | `/crm/leads/:id` | Delete lead | `crm.lead.delete` |
| POST | `/crm/leads/:id/reactivate` | Reactivate a disqualified lead (win-back) | `crm.lead.delete` |
| POST | `/crm/leads/bulk-status` | Bulk update lead status | `crm.lead.update` |
| GET | `/crm/leads-export` | Export leads (CSV-ready JSON) | `crm.lead.read` |
| GET | `/crm/pipelines` | Get pipelines | `crm.pipelines.read` |
| POST | `/crm/pipelines` | Create pipeline | `crm.pipelines.read` |
| GET | `/crm/opportunities` | Get opportunities (paginated, searchable, sortable) | `crm.opportunity.read` |
| GET | `/crm/opportunities/:id` | Get opportunity by id | `crm.opportunity.read` |
| GET | `/crm/opportunities/:id/summary` | Get opportunity 360 summary (line items, activities, weighted value, aging) | `crm.opportunity.read` |
| POST | `/crm/opportunities` | Create opportunity | `crm.opportunity.read` |
| PUT | `/crm/opportunities/:id` | Update opportunity | `crm.opportunity.create` |
| PATCH | `/crm/opportunities/:id/stage` | Update opportunity stage | `crm.opportunity.update` |
| DELETE | `/crm/opportunities/:id` | Delete opportunity | `crm.opportunity.delete` |
| GET | `/crm/opportunities-export` | Export opportunities (CSV-ready JSON) | `crm.opportunity.delete` |
| POST | `/crm/opportunities/bulk-stage` | Bulk update opportunity stage | `crm.opportunity.update` |
| GET | `/crm/activities` | Get activities | `crm.activity.read` |
| POST | `/crm/activities` | Create activity | `crm.activity.create` |
| PATCH | `/crm/activities/:id/complete` | Complete activity | `crm.activity.create` |
| GET | `/crm/email-templates` | Get email templates | `crm.settings.read` |
| POST | `/crm/email-templates` | Create email template | `crm.settings.read` |
| PUT | `/crm/email-templates/:id` | Update email template | `crm.settings.create` |
| DELETE | `/crm/email-templates/:id` | Delete email template | `crm.settings.update` |
| GET | `/crm/analytics/pipeline-funnel` | Get pipeline funnel | `crm.report.read` |
| GET | `/crm/analytics/win-rate` | Get win rate | `crm.report.read` |
| GET | `/crm/analytics/lead-source-breakdown` | Get lead source breakdown | `crm.report.read` |
| GET | `/crm/campaigns` | Get campaigns | `crm.lead.read` |
| POST | `/crm/campaigns` | Create campaign | `crm.lead.read` |
| GET | `/crm/opportunities/:id/line-items` | Get opportunity line items | `crm.opportunity.read` |
| POST | `/crm/opportunities/:id/line-items` | Add opportunity line item | `crm.opportunity.read` |
| PUT | `/crm/opportunities/:id/line-items/:itemId` | Update opportunity line item | `crm.opportunity.update` |
| DELETE | `/crm/opportunities/:id/line-items/:itemId` | Delete opportunity line item | `crm.opportunity.update` |
| GET | `/crm/products` | Get crm products (paginated, searchable, sortable) | `crm.product.read` |
| POST | `/crm/products` | Create crm product | `crm.product.create` |
| PUT | `/crm/products/:id` | Update crm product | `crm.product.update` |
| DELETE | `/crm/products/:id` | Delete crm product | `crm.product.delete` |
| GET | `/crm/price-books` | Get price books (paginated, searchable, sortable) | `crm.product.delete` |
| POST | `/crm/price-books` | Create price book | `crm.product.create` |
| PUT | `/crm/price-books/:id` | Update price book | `crm.product.create` |
| DELETE | `/crm/price-books/:id` | Delete price book | `crm.product.update` |
| GET | `/crm/price-books/:id/entries` | Get price book entries | `crm.product.delete` |
| POST | `/crm/price-books/:id/entries` | Add price book entry | `crm.product.read` |
| DELETE | `/crm/price-book-entries/:id` | Delete price book entry | `crm.product.create` |
| GET | `/crm/analytics/revenue-forecast` | Get revenue forecast | `crm.report.read` |
| GET | `/crm/analytics/deal-aging` | Get deal aging | `crm.report.read` |
| GET | `/crm/contacts/tags` | Get contact tags | `crm.contact.read` |
| POST | `/crm/contacts/tags` | Create contact tag | `crm.contact.read` |
| DELETE | `/crm/contacts/tags/:id` | Delete contact tag | `crm.contact.create` |
| POST | `/crm/contacts/:id/tags` | Assign contact tag | `crm.contact.delete` |
| DELETE | `/crm/contacts/:id/tags/:tagId` | Remove contact tag | `crm.contact.update` |
| GET | `/crm/contacts/:id/timeline` | Get contact timeline | `crm.contact.update` |
| GET | `/crm/contacts/duplicates` | Find duplicate contacts | `crm.contact.read` |
| GET | `/crm/analytics/stage-duration` | Get stage duration | `crm.report.read` |
| GET | `/crm/analytics/pipeline-health` | Get pipeline health | `crm.report.read` |
| GET | `/crm/targets` | Get sales targets | `crm.settings.read` |
| POST | `/crm/targets` | Create sales target | `crm.settings.read` |
| PUT | `/crm/targets/:id` | Update sales target | `crm.settings.create` |
| DELETE | `/crm/targets/:id` | Delete sales target | `crm.settings.update` |
| GET | `/crm/analytics/forecast` | Get forecast | `crm.report.read` |
| GET | `/crm/analytics/rep-performance` | Get rep performance | `crm.report.read` |
| GET | `/crm/analytics/forecast-by-rep` | Get pipeline-weighted forecast grouped by rep | `crm.report.read` |
| GET | `/crm/analytics/conversion-funnel` | Get conversion funnel | `crm.report.read` |
| GET | `/crm/analytics/cohort` | Get cohort analysis | `crm.report.read` |
| GET | `/crm/reports/saved` | Get saved reports | `crm.report.read` |
| POST | `/crm/reports/saved` | Create saved report | `crm.report.read` |
| GET | `/crm/reports/saved/:id/run` | Run saved report | `crm.report.create` |
| DELETE | `/crm/reports/saved/:id` | Delete saved report | `crm.report.read` |
| GET | `/crm/workflows` | Get workflow rules | `crm.settings.read` |
| POST | `/crm/workflows` | Create workflow rule | `crm.settings.read` |
| PUT | `/crm/workflows/:id` | Update workflow rule | `crm.settings.create` |
| PATCH | `/crm/workflows/:id/toggle` | Toggle workflow rule | `crm.settings.update` |
| DELETE | `/crm/workflows/:id` | Delete workflow rule | `crm.settings.update` |
| GET | `/crm/sequences` | Get email sequences | `crm.settings.read` |
| POST | `/crm/sequences` | Create email sequence | `crm.settings.read` |
| POST | `/crm/sequences/:id/enroll` | Enroll in sequence | `crm.settings.create` |
| PATCH | `/crm/sequences/enrollments/:id/pause` | Pause enrollment | `crm.settings.create` |
| DELETE | `/crm/sequences/:id` | Delete email sequence | `crm.settings.update` |
| GET | `/crm/territories` | Get territories | `crm.settings.read` |
| POST | `/crm/territories` | Create territory | `crm.settings.read` |
| PUT | `/crm/territories/:id` | Update territory | `crm.settings.create` |
| DELETE | `/crm/territories/:id` | Delete territory | `crm.settings.update` |
| POST | `/crm/territories/:id/members` | Add team member | `crm.settings.delete` |
| DELETE | `/crm/territories/:id/members/:userId` | Remove team member | `crm.settings.create` |
| GET | `/crm/analytics/territory-performance` | Get territory performance | `crm.settings.delete` |
| GET | `/crm/commissions/rules` | Get commission rules | `crm.settings.read` |
| POST | `/crm/commissions/rules` | Create commission rule | `crm.settings.read` |
| PUT | `/crm/commissions/rules/:id` | Update commission rule | `crm.settings.create` |
| DELETE | `/crm/commissions/rules/:id` | Delete commission rule | `crm.settings.update` |
| GET | `/crm/commissions/entries` | Get commission entries | `crm.settings.delete` |
| POST | `/crm/commissions/calculate` | Calculate commissions | `crm.report.read` |
| GET | `/crm/forms` | Get web forms | `crm.settings.read` |
| POST | `/crm/forms` | Create web form | `crm.settings.read` |
| PUT | `/crm/forms/:id` | Update web form | `crm.settings.create` |
| DELETE | `/crm/forms/:id` | Delete web form | `crm.settings.update` |
| POST | `/crm/forms/:id/submit` | Submit web form | `crm.create` |
| GET | `/crm/forms/:id/embed` | Get web form embed | `crm.settings.read` |
| GET | `/crm/documents` | Get crm documents | `crm.contact.read` |
| POST | `/crm/documents` | Create crm document | `crm.contact.read` |
| DELETE | `/crm/documents/:id` | Delete crm document | `crm.contact.create` |
| POST | `/crm/contacts/import` | Import contacts | `crm.contact.create` |
| GET | `/crm/contacts/export` | Export contacts | `crm.contact.create` |
| POST | `/crm/leads/import` | Import leads | `crm.contact.read` |
| GET | `/crm/custom-fields` | Get custom fields | `crm.settings.read` |
| POST | `/crm/custom-fields` | Create custom field | `crm.settings.read` |
| PUT | `/crm/custom-fields/:id` | Update custom field | `crm.settings.create` |
| DELETE | `/crm/custom-fields/:id` | Delete custom field | `crm.settings.update` |
| GET | `/crm/custom-field-values/:entityType/:entityId` | Get custom field values | `crm.settings.delete` |
| PUT | `/crm/custom-field-values/:entityType/:entityId` | Upsert custom field values | `crm.contact.read` |
| GET | `/crm/record-types` | Get record types | `crm.contact.update` |
| POST | `/crm/record-types` | Create record type | `crm.settings.read` |
| PUT | `/crm/record-types/:id` | Update record type | `crm.settings.create` |
| DELETE | `/crm/record-types/:id` | Delete record type | `crm.settings.update` |
| GET | `/crm/approval-processes` | Get approval processes | `crm.settings.read` |
| POST | `/crm/approval-processes` | Create approval process | `crm.settings.read` |
| PUT | `/crm/approval-processes/:id` | Update approval process | `crm.settings.create` |
| DELETE | `/crm/approval-processes/:id` | Delete approval process | `crm.settings.update` |
| POST | `/crm/approval-requests` | Submit for approval | `crm.settings.delete` |
| GET | `/crm/approval-requests/pending` | Get pending approvals | `crm.contact.create` |
| GET | `/crm/approval-requests/:entityType/:entityId` | Get approval history | `crm.contact.read` |
| POST | `/crm/approval-requests/:id/approve` | Approve request | `crm.contact.read` |
| POST | `/crm/approval-requests/:id/reject` | Reject request | `crm.contact.update` |
| POST | `/crm/approval-requests/:id/recall` | Recall request | `crm.contact.update` |
| GET | `/crm/quotation-templates` | Get quotation templates | `crm.settings.read` |
| POST | `/crm/quotation-templates` | Create quotation template | `crm.settings.read` |
| PUT | `/crm/quotation-templates/:id` | Update quotation template | `crm.settings.create` |
| DELETE | `/crm/quotation-templates/:id` | Delete quotation template | `crm.settings.update` |
| POST | `/crm/quotations/:id/versions` | Create quotation version | `crm.settings.delete` |
| GET | `/crm/quotations/:id/versions` | Get quotation versions | `crm.opportunity.update` |
| POST | `/crm/quotations/:id/clone` | Clone quotation | `crm.opportunity.read` |
| POST | `/crm/quotations/:id/send-for-signature` | Send for signature | `crm.opportunity.create` |
| GET | `/crm/quotation-sign/:token` | Get quotation by sign token | `crm.read` |
| POST | `/crm/quotation-sign/:token` | Submit signature | `crm.create` |
| GET | `/crm/comments/:entityType/:entityId` | Get comments | `crm.contact.read` |
| POST | `/crm/comments/:entityType/:entityId` | Create comment | `crm.contact.read` |
| PUT | `/crm/comments/:id` | Update comment | `crm.contact.create` |
| DELETE | `/crm/comments/:id` | Delete comment | `crm.contact.update` |
| POST | `/crm/comments/:id/pin` | Toggle pin comment | `crm.contact.delete` |
| GET | `/crm/followers/:entityType/:entityId` | Get followers | `crm.contact.update` |
| POST | `/crm/followers/:entityType/:entityId` | Follow record | `crm.contact.read` |
| DELETE | `/crm/followers/:entityType/:entityId` | Unfollow record | `crm.contact.create` |
| GET | `/crm/notes/:entityType/:entityId` | Get notes | `crm.contact.delete` |
| POST | `/crm/notes/:entityType/:entityId` | Create note | `crm.contact.read` |
| PUT | `/crm/notes/:id` | Update note | `crm.contact.create` |
| DELETE | `/crm/notes/:id` | Delete note | `crm.contact.update` |
| POST | `/crm/notes/:id/pin` | Toggle pin note | `crm.contact.delete` |
| GET | `/crm/activity-feed/:entityType/:entityId` | Get unified activity feed | `crm.contact.update` |
| GET | `/crm/playbooks` | Get playbooks | `crm.settings.read` |
| POST | `/crm/playbooks` | Create playbook | `crm.settings.read` |
| PUT | `/crm/playbooks/:id` | Update playbook | `crm.settings.create` |
| DELETE | `/crm/playbooks/:id` | Delete playbook | `crm.settings.update` |
| GET | `/crm/playbooks/:id/stages` | Get playbook stages | `crm.settings.delete` |
| PUT | `/crm/playbooks/:id/stages` | Upsert playbook stages | `crm.settings.read` |
| GET | `/crm/battlecards` | Get battlecards | `crm.settings.update` |
| POST | `/crm/battlecards` | Create battlecard | `crm.settings.read` |
| PUT | `/crm/battlecards/:id` | Update battlecard | `crm.settings.create` |
| DELETE | `/crm/battlecards/:id` | Delete battlecard | `crm.settings.update` |
| GET | `/crm/battlecards/by-competitor/:competitor` | Get battlecard by competitor | `crm.settings.delete` |
| GET | `/crm/opportunities/:id/checklist` | Get opportunity checklist | `crm.settings.read` |
| PUT | `/crm/opportunities/:id/checklist/:itemId` | Toggle checklist item | `crm.opportunity.read` |
| POST | `/crm/opportunities/:id/validate-stage-advance` | Validate stage advance | `crm.opportunity.update` |
| GET | `/crm/dashboards` | Get dashboards | `crm.report.read` |
| POST | `/crm/dashboards` | Create dashboard | `crm.report.read` |
| PUT | `/crm/dashboards/:id` | Update dashboard | `crm.report.create` |
| DELETE | `/crm/dashboards/:id` | Delete dashboard | `crm.report.update` |
| POST | `/crm/dashboards/:id/clone` | Clone dashboard | `crm.report.delete` |
| POST | `/crm/dashboards/:id/widgets` | Add widget | `crm.report.create` |
| PUT | `/crm/dashboards/:id/widgets/:widgetId` | Update widget | `crm.report.create` |
| DELETE | `/crm/dashboards/:id/widgets/:widgetId` | Remove widget | `crm.report.update` |
| PUT | `/crm/dashboards/:id/layout` | Update dashboard layout | `crm.report.delete` |
| GET | `/crm/dashboards/widget-data/:widgetId` | Get widget data | `crm.report.update` |
| GET | `/crm/dashboards/available-metrics` | Get available metrics | `crm.report.read` |
| GET | `/crm/cases` | Get customer service cases | `crm.case.read` |
| GET | `/crm/cases/sla-status` | Get case SLA compliance status | `crm.case.read` |
| GET | `/crm/cases/:id` | Get case by id | `crm.case.read` |
| GET | `/crm/cases/:id/summary` | Get case 360 summary (SLA rollup + comments + customer/contact) | `crm.case.read` |
| POST | `/crm/cases` | Create case | `crm.case.create` |
| PATCH | `/crm/cases/:id` | Update case | `crm.case.update` |
| POST | `/crm/cases/:id/reopen` | Reopen a CLOSED case | `crm.case.update` |
| POST | `/crm/cases/:id/comments` | Add a comment to a case | `crm.case.update` |
| POST | `/crm/cases/bulk-status` | Bulk update case status | `crm.case.update` |
| GET | `/crm/cases-export` | Export cases (CSV-ready JSON) | `crm.case.read` |
| POST | `/crm/customers/:customerId/portal-users` | Invite a customer portal user | `crm.customer-portal.manage` |
| GET | `/crm/customers/:customerId/portal-users` | List customer portal users | `crm.customer-portal.manage` |
| PATCH | `/crm/customers/:customerId/portal-users/:userId/disable` | Disable a customer portal user | `crm.customer-portal.manage` |
| PATCH | `/crm/customers/:customerId/portal-users/:userId/reactivate` | Reactivate a customer portal user | `crm.customer-portal.manage` |
| POST | `/portal/auth/login` | Customer portal login | — |
| GET | `/portal/dashboard` | Portal dashboard summary | — |
| GET | `/portal/quotations` | List my quotations | — |
| GET | `/portal/quotations/:id` | Get one of my quotations | — |
| POST | `/portal/quotations/:id/accept` | Accept one of my quotations | — |
| POST | `/portal/quotations/:id/reject` | Reject one of my quotations | — |
| GET | `/portal/orders` | List my sales orders | — |
| GET | `/portal/orders/:id` | Get one of my sales orders | — |
| GET | `/portal/invoices` | List my invoices | — |
| GET | `/portal/invoices/:id` | Get one of my invoices | — |
| GET | `/portal/quotations/:id/pdf` | Download a PDF of one of my quotations | — |
| GET | `/portal/invoices/:id/pdf` | Download a PDF of one of my invoices | — |
| GET | `/portal/payments` | List my invoice payment intents | — |
| POST | `/portal/invoices/:id/pay` | Initiate an online payment for one of my invoices | — |
| POST | `/portal/payments/:intentId/confirm` | Confirm an initiated invoice payment | — |
| GET | `/portal/cases` | List my support cases | — |
| GET | `/portal/cases/:id` | Get one of my support cases with public comments | — |
| POST | `/portal/cases` | Submit a new support case | — |
| POST | `/portal/cases/:id/comments` | Add a comment to one of my support cases | — |

## devops

3 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/admin/devops/metrics` | Get metrics | `admin.devops.read` |
| GET | `/admin/devops/errors` | Get recent errors | `admin.devops.read` |
| GET | `/admin/devops/integrations` | Get integrations | `admin.devops.read` |

## documents

21 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/drive/folders` | Get folders | `documents.folder.read` |
| POST | `/drive/folders` | Create folder | `documents.folder.create` |
| POST | `/drive/folders/:id/star` | Toggle folder starred | `documents.folder.create` |
| POST | `/drive/folders/:id/share` | Share folder | `documents.folder.create` |
| POST | `/drive/folders/:id/legal-hold` | Toggle folder legal hold | `documents.folder.create` |
| DELETE | `/drive/folders/:id` | Trash folder | `documents.folder.create` |
| POST | `/drive/folders/:id/restore` | Restore folder | `documents.folder.create` |
| DELETE | `/drive/folders/:id/permanent` | Permanently delete folder | `documents.folder.create` |
| GET | `/drive/documents` | Get documents | `documents.document.read` |
| POST | `/drive/documents` | Create document | `documents.document.create` |
| POST | `/drive/documents/:id/star` | Toggle document starred | `documents.document.create` |
| POST | `/drive/documents/:id/share` | Share document | `documents.document.create` |
| POST | `/drive/documents/:id/legal-hold` | Toggle document legal hold | `documents.document.create` |
| POST | `/drive/documents/:id/versions` | Add version | `documents.document.create` |
| GET | `/drive/documents/versions/:versionId/download` | Download version | `documents.document.read` |
| DELETE | `/drive/documents/:id` | Trash document | `documents.document.create` |
| POST | `/drive/documents/:id/restore` | Restore document | `documents.document.create` |
| DELETE | `/drive/documents/:id/permanent` | Permanently delete document | `documents.document.create` |
| GET | `/drive/usage` | Get usage | `documents.document.read` |
| GET | `/drive/search` | Search | `documents.document.read` |
| GET | `/drive/users` | Get users | `documents.document.read` |

## ecommerce

23 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/ecommerce/config` | Get this tenant\ | `ecommerce.storefront.read` |
| PUT | `/ecommerce/config` | Get this tenant\ | `ecommerce.storefront.read` |
| GET | `/ecommerce/categories` | List storefront categories | `ecommerce.category.read` |
| GET | `/ecommerce/categories/:id` | List storefront categories | `ecommerce.category.read` |
| POST | `/ecommerce/categories` | Get a storefront category by id | `ecommerce.category.read` |
| PATCH | `/ecommerce/categories/:id` | Create a storefront category | `ecommerce.category.update` |
| DELETE | `/ecommerce/categories/:id` | Delete a storefront category | `ecommerce.category.delete` |
| GET | `/ecommerce/listings` | List storefront product listings (joined with Product + Category) | `ecommerce.listing.read` |
| GET | `/ecommerce/listings/:id` | List storefront product listings (joined with Product + Category) | `ecommerce.listing.read` |
| POST | `/ecommerce/listings` | Get a storefront product listing by id | `ecommerce.listing.read` |
| PATCH | `/ecommerce/listings/:id` | Publish an existing Inventory Product to the storefront | `ecommerce.listing.update` |
| DELETE | `/ecommerce/listings/:id` | Unpublish/remove a storefront listing | `ecommerce.listing.delete` |
| GET | `/store/:tenantSlug/config` | [PUBLIC] Get storefront branding info (name, logo, currency) | — |
| GET | `/store/:tenantSlug/categories` | [PUBLIC] Get storefront branding info (name, logo, currency) | — |
| GET | `/store/:tenantSlug/products` | [PUBLIC] List storefront categories | — |
| GET | `/store/:tenantSlug/products/:listingId` | [PUBLIC] Get a single published product listing | — |
| POST | `/store/:tenantSlug/cart` | [PUBLIC] Get a single published product listing | — |
| GET | `/store/:tenantSlug/cart/:sessionToken` | [PUBLIC] Create a new anonymous cart, returns a sessionToken | — |
| POST | `/store/:tenantSlug/cart/:sessionToken/items` | [PUBLIC] Get a cart and its items by sessionToken | — |
| PATCH | `/store/:tenantSlug/cart/:sessionToken/items/:itemId` | [PUBLIC] Update a cart item\ | — |
| DELETE | `/store/:tenantSlug/cart/:sessionToken/items/:itemId` | [PUBLIC] Remove an item from the cart | — |
| POST | `/store/:tenantSlug/checkout` | — | — |
| POST | `/store/:tenantSlug/webhooks/stripe` | [PUBLIC] Stripe Webhook receiver for order payment completions | — |

## ext-gateway

3 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/ext-callback/records/:slug` | Read an extension app | — |
| POST | `/ext-callback/records:batch` | Read several schemas in one round trip | — |
| POST | `/ext-callback/records/:slug` | Create a record in the app | — |

## finance

27 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/finance/invoices` | Get invoices | `finance.invoice.read` |
| GET | `/finance/invoices/stats` | Get invoice stats | `finance.invoice.read` |
| GET | `/finance/invoices/:id` | Get invoice by id | `finance.invoice.read` |
| POST | `/finance/invoices` | Create invoice | `finance.invoice.read` |
| PATCH | `/finance/invoices/:id` | Update invoice | `finance.invoice.update` |
| DELETE | `/finance/invoices/:id` | Delete invoice | `finance.invoice.delete` |
| POST | `/finance/invoices/:id/send` | Send invoice | `finance.invoice.delete` |
| POST | `/finance/invoices/:id/void` | Void invoice | `finance.invoice.update` |
| POST | `/finance/invoices/bulk` | Bulk action | `finance.invoice.update` |
| POST | `/finance/payments` | Create payment | `finance.payment.create` |
| GET | `/finance/invoices/:id/payments` | Get payments | `finance.payment.read` |
| GET | `/finance/leases` | List leases with pagination, search, and filters | `finance.leases.read` |
| GET | `/finance/leases/summary` | Get aggregate lease portfolio summary | `finance.leases.read` |
| GET | `/finance/leases/upcoming-payments` | Get upcoming lease payments within a day window | `finance.leases.read` |
| GET | `/finance/leases/expiring-soon` | Get leases expiring within a day window | `finance.leases.read` |
| GET | `/finance/leases/analytics` | Get lease analytics (cost trends, breakdowns) | `finance.leases.read` |
| POST | `/finance/leases/bulk-post` | Bulk post monthly lease journal entries for a period | `finance.leases.read` |
| GET | `/finance/leases/:id` | Get a lease by id | `finance.leases.read` |
| GET | `/finance/leases/:id/schedule` | Get the amortization schedule for a lease | `finance.leases.read` |
| GET | `/finance/leases/:id/journal-entries` | Get journal entries posted for a lease | `finance.leases.read` |
| POST | `/finance/leases` | Create a new lease | `finance.leases.read` |
| PATCH | `/finance/leases/:id` | Update lease details | `finance.leases.update` |
| PATCH | `/finance/leases/:id/status` | Update the status of a lease | `finance.leases.update` |
| DELETE | `/finance/leases/:id` | Delete a lease | `finance.leases.delete` |
| POST | `/finance/leases/:id/post-month` | Post the monthly journal entry for a lease period | `finance.leases.post` |
| POST | `/finance/leases/:id/terminate` | Terminate a lease early | `finance.leases.update` |
| POST | `/finance/leases/:id/renew` | Renew a lease with a new end date and present value | `finance.leases.update` |

## fixed-assets

9 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/fixed-assets/categories` | List all asset categories | `assets.category.manage` |
| POST | `/fixed-assets/categories` | List all asset categories | `assets.category.manage` |
| GET | `/fixed-assets` | List fixed assets with optional filters | `assets.asset.read` |
| GET | `/fixed-assets/:id` | Retrieve asset details by ID | `assets.asset.read` |
| POST | `/fixed-assets` | Retrieve asset details by ID | `assets.asset.read` |
| PUT | `/fixed-assets/:id` | Update asset details | `assets.asset.update` |
| POST | `/fixed-assets/:id/transfer` | Record an asset location or custodian transfer | `assets.transfer.manage` |
| POST | `/fixed-assets/:id/maintenance` | Log a maintenance event for a fixed asset | `assets.maintenance.manage` |
| POST | `/fixed-assets/:id/depreciate` | Calculate and post depreciation for a single asset | `assets.depreciation.post` |

## hr

8 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/hr/employees` | Get employees | `hr.employee.read` |
| GET | `/hr/employees/stats` | Get employee stats | `hr.employee.read` |
| GET | `/hr/employees/:id` | Get employee by id | `hr.employee.read` |
| POST | `/hr/employees` | Create employee | `hr.employee.read` |
| PATCH | `/hr/employees/:id` | Update employee | `hr.employee.update` |
| DELETE | `/hr/employees/:id` | Delete employee | `hr.employee.update` |
| POST | `/hr/employees/bulk` | Bulk action | `hr.employee.delete` |
| GET | `/hr/departments` | Get departments | `hr.employee.update` |

## inventory

104 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/inventory/costing/valuation/:productId` | Get product valuation | `inventory.stock.read` |
| GET | `/inventory/costing/valuation-report` | Get valuation report | `inventory.stock.read` |
| POST | `/inventory/costing/landed-cost` | Calculate landed cost | `inventory.stock.read` |
| GET | `/inventory/costing/barcode/:barcode` | Lookup barcode | `inventory.stock.adjust` |
| GET | `/inventory/products` | Get products | `inventory.product.read` |
| GET | `/inventory/products/stats` | Get inventory stats | `inventory.product.read` |
| GET | `/inventory/products/:id` | Get product by id | `inventory.product.read` |
| POST | `/inventory/products` | Create product | `inventory.product.read` |
| PATCH | `/inventory/products/:id` | Update product | `inventory.product.update` |
| DELETE | `/inventory/products/:id` | Delete product | `inventory.product.update` |
| POST | `/inventory/products/bulk` | Bulk action | `inventory.product.delete` |
| GET | `/inventory/warehouses` | Get warehouses | `inventory.warehouse.read` |
| GET | `/inventory/warehouses/:id` | Get warehouse by id | `inventory.warehouse.read` |
| POST | `/inventory/warehouses` | Create warehouse | `inventory.warehouse.read` |
| PATCH | `/inventory/warehouses/:id` | Update warehouse | `inventory.warehouse.update` |
| DELETE | `/inventory/warehouses/:id` | Delete warehouse | `inventory.warehouse.update` |
| GET | `/inventory/stock-levels` | Get stock levels | `inventory.stock.read` |
| GET | `/inventory/categories` | Get categories | `inventory.product.read` |
| GET | `/inventory/categories/:id` | Get category by id | `inventory.product.read` |
| POST | `/inventory/categories` | Create category | `inventory.product.read` |
| PATCH | `/inventory/categories/:id` | Update category | `inventory.product.update` |
| DELETE | `/inventory/categories/:id` | Delete category | `inventory.product.update` |
| GET | `/inventory/products/:id/variants` | Get product variants | `inventory.product.read` |
| POST | `/inventory/products/variants` | Create product variant | `inventory.product.read` |
| PATCH | `/inventory/variants/:id` | Update product variant | `inventory.product.create` |
| DELETE | `/inventory/variants/:id` | Delete product variant | `inventory.product.update` |
| GET | `/inventory/uoms` | Get uo ms | `inventory.product.read` |
| POST | `/inventory/uoms` | Create uo m | `inventory.product.read` |
| GET | `/inventory/uom-conversions` | Get uo m conversions | `inventory.product.create` |
| POST | `/inventory/uom-conversions` | Create uo m conversion | `inventory.product.read` |
| GET | `/inventory/bin-locations` | Get bin locations | `inventory.warehouse.read` |
| GET | `/inventory/bin-locations/:id` | Get bin location by id | `inventory.warehouse.read` |
| POST | `/inventory/bin-locations` | Create bin location | `inventory.warehouse.read` |
| PATCH | `/inventory/bin-locations/:id` | Update bin location | `inventory.warehouse.create` |
| DELETE | `/inventory/bin-locations/:id` | Delete bin location | `inventory.warehouse.update` |
| GET | `/inventory/serial-numbers` | Get serial numbers | `inventory.stock.read` |
| GET | `/inventory/serial-numbers/:id` | Get serial number by id | `inventory.stock.read` |
| POST | `/inventory/serial-numbers` | Create serial number | `inventory.stock.read` |
| PATCH | `/inventory/serial-numbers/:id` | Update serial number | `inventory.stock.create` |
| GET | `/inventory/serial-numbers/:id/history` | Get serial number history | `inventory.stock.update` |
| GET | `/inventory/batches` | Get batches | `inventory.stock.read` |
| GET | `/inventory/batches/:id` | Get batch by id | `inventory.stock.read` |
| POST | `/inventory/batches` | Create batch | `inventory.stock.read` |
| PATCH | `/inventory/batches/:id` | Update batch | `inventory.stock.create` |
| GET | `/inventory/stock-entries` | Get stock entries | `inventory.stock.read` |
| GET | `/inventory/stock-entries/:id` | Get stock entry by id | `inventory.stock.read` |
| POST | `/inventory/stock-entries` | Create stock entry | `inventory.stock.read` |
| POST | `/inventory/stock-entries/:id/submit` | Submit stock entry | `inventory.stock.update` |
| POST | `/inventory/stock-entries/:id/cancel` | Cancel stock entry | `inventory.stock.update` |
| GET | `/inventory/stock-ledger` | Get stock ledger | `inventory.stock.read` |
| POST | `/inventory/transfers` | Transfer stock | `inventory.stock.create` |
| GET | `/inventory/cycle-counts` | Get cycle counts | `inventory.stock.read` |
| GET | `/inventory/cycle-counts/:id` | Get cycle count by id | `inventory.stock.read` |
| POST | `/inventory/cycle-counts` | Create cycle count | `inventory.stock.read` |
| POST | `/inventory/cycle-counts/:id/submit` | Submit cycle count | `inventory.stock.update` |
| POST | `/inventory/cycle-counts/:id/approve` | Approve cycle count | `inventory.stock.update` |
| GET | `/inventory/cycle-count-schedules` | Get cycle count schedules | `inventory.stock.read` |
| GET | `/inventory/cycle-count-schedules/due` | Get due cycle count schedules | `inventory.stock.read` |
| GET | `/inventory/cycle-count-schedules/accuracy` | Get cycle count accuracy KPI | `inventory.stock.read` |
| POST | `/inventory/cycle-count-schedules` | Create cycle count schedule | `inventory.stock.create` |
| PATCH | `/inventory/cycle-count-schedules/:id` | Update cycle count schedule | `inventory.stock.create` |
| POST | `/inventory/cycle-count-schedules/:id/roll-forward` | Roll forward cycle count schedule due date | `inventory.stock.update` |
| DELETE | `/inventory/cycle-count-schedules/:id` | Delete cycle count schedule | `inventory.stock.update` |
| GET | `/inventory/license-plates` | Get license plates | `inventory.stock.read` |
| GET | `/inventory/license-plates/:id` | Get license plate by id | `inventory.stock.read` |
| POST | `/inventory/license-plates` | Create license plate | `inventory.stock.read` |
| POST | `/inventory/license-plates/:id/items` | Add item to license plate | `inventory.stock.create` |
| POST | `/inventory/license-plates/:id/move` | Move license plate to another bin (barcode scan move) | `inventory.stock.update` |
| POST | `/inventory/license-plates/:id/close` | Close license plate | `inventory.stock.update` |
| GET | `/inventory/putaway-tasks` | Get putaway tasks | `inventory.stock.read` |
| GET | `/inventory/putaway-tasks/suggest-bin/:inventoryItemId` | Suggest putaway bin for an inventory item (zone-based optimization) | `inventory.stock.read` |
| POST | `/inventory/putaway-tasks` | Create putaway task | `inventory.stock.read` |
| POST | `/inventory/putaway-tasks/:id/complete` | Complete putaway task (barcode scan confirm) | `inventory.stock.create` |
| POST | `/inventory/batches/:id/quarantine` | Quarantine a batch | `inventory.stock.update` |
| POST | `/inventory/batches/:id/quarantine/release` | Release a batch from quarantine | `inventory.stock.update` |
| POST | `/inventory/batches/:id/quarantine/reject` | Reject a quarantined batch (mark expired/unusable) | `inventory.stock.update` |
| GET | `/inventory/batches/:id/quarantine-log` | Get batch quarantine log | `inventory.stock.update` |
| GET | `/inventory/batches/:id/genealogy` | Get batch genealogy trace | `inventory.stock.read` |
| GET | `/inventory/serial-numbers/:id/trace` | Get serial number where-used trace | `inventory.stock.read` |
| GET | `/inventory/stock-reservations` | Get stock reservations | `inventory.stock.read` |
| GET | `/inventory/stock-reservations/allocation-summary` | Get allocation summary for a product in a warehouse | `inventory.stock.read` |
| POST | `/inventory/stock-reservations` | Create stock reservation | `inventory.stock.read` |
| POST | `/inventory/stock-reservations/:id/release` | Release a stock reservation | `inventory.stock.create` |
| POST | `/inventory/stock-reservations/:id/fulfill` | Fulfill a stock reservation | `inventory.stock.update` |
| GET | `/inventory/analytics/abc-classification` | Get ABC classification report | `inventory.stock.read` |
| GET | `/inventory/analytics/dead-stock` | Get dead-stock report | `inventory.stock.read` |
| GET | `/inventory/analytics/turnover` | Get inventory turnover report | `inventory.stock.read` |
| GET | `/inventory/qa-inspections` | Get q a inspections | `inventory.stock.read` |
| GET | `/inventory/qa-inspections/:id` | Get q a inspection by id | `inventory.stock.read` |
| POST | `/inventory/qa-inspections` | Create q a inspection | `inventory.stock.read` |
| POST | `/inventory/qa-inspections/:id/submit` | Submit q a inspection | `inventory.stock.update` |
| GET | `/inventory/reorder-rules` | Get reorder rules | `inventory.product.read` |
| POST | `/inventory/reorder-rules` | Create reorder rule | `inventory.product.create` |
| PATCH | `/inventory/reorder-rules/:id` | Update reorder rule | `inventory.product.create` |
| DELETE | `/inventory/reorder-rules/:id` | Delete reorder rule | `inventory.product.update` |
| GET | `/inventory/alerts` | Get stock alerts | `inventory.stock.read` |
| POST | `/inventory/alerts/:id/resolve` | Resolve stock alert | `inventory.stock.update` |
| GET | `/inventory/kits` | Get product kits | `inventory.product.read` |
| GET | `/inventory/kits/:id` | Get product kit by id | `inventory.product.read` |
| POST | `/inventory/kits` | Create product kit | `inventory.product.read` |
| PATCH | `/inventory/kits/:id` | Update product kit | `inventory.product.update` |
| DELETE | `/inventory/kits/:id` | Delete product kit | `inventory.product.update` |
| GET | `/inventory/valuations` | Get valuation report | `inventory.stock.read` |
| GET | `/inventory/aging` | Get inventory aging | `inventory.stock.read` |

## localization

4 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/admin/localization/languages` | Get languages | `localization.read` |
| GET | `/admin/localization/overrides` | Get overrides | `admin.localization.read` |
| POST | `/admin/localization/overrides` | Create or update override | `admin.localization.read` |
| DELETE | `/admin/localization/overrides/:id` | Delete override | `admin.localization.delete` |

## manufacturing

43 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/manufacturing/boms` | Get b o ms | `manufacturing.bom.read` |
| POST | `/manufacturing/boms` | Create b o m | `manufacturing.bom.read` |
| GET | `/manufacturing/workstations` | Get workstations | `manufacturing.work-order.read` |
| POST | `/manufacturing/workstations` | Create workstation | `manufacturing.work-order.read` |
| GET | `/manufacturing/workstations/load-balancing` | Get workstation load balancing | `manufacturing.work-order.read` |
| GET | `/manufacturing/work-orders` | Get work orders | `manufacturing.work-order.read` |
| POST | `/manufacturing/work-orders` | Create work order | `manufacturing.work-order.read` |
| POST | `/manufacturing/work-orders/:id/start` | Start work order | `manufacturing.work-order.update` |
| PATCH | `/manufacturing/work-orders/:id/status` | Update work order status | `manufacturing.work-order.update` |
| PATCH | `/manufacturing/work-orders/:id/oee` | Log scrap and oee | `manufacturing.work-order.update` |
| GET | `/manufacturing/mrp/runs` | Get m r p runs | `manufacturing.work-order.read` |
| POST | `/manufacturing/mrp/run` | Run m r p | `manufacturing.work-order.read` |
| POST | `/manufacturing/mrp/planned-items/:id/process` | Process m r p planned item | `manufacturing.work-order.create` |
| GET | `/manufacturing/quality/plans` | Get quality plans | `manufacturing.bom.read` |
| POST | `/manufacturing/quality/plans` | Create quality plan | `manufacturing.bom.read` |
| POST | `/manufacturing/quality/inspections` | Log inspection | `manufacturing.work-order.update` |
| GET | `/manufacturing/quality/ncr` | Get n c rs | `manufacturing.work-order.read` |
| POST | `/manufacturing/quality/ncr` | Create n c r | `manufacturing.work-order.read` |
| PATCH | `/manufacturing/quality/ncr/:id` | Resolve n c r | `manufacturing.work-order.update` |
| GET | `/manufacturing/maintenance` | Get maintenance requests | `manufacturing.work-order.read` |
| POST | `/manufacturing/maintenance` | Create maintenance request | `manufacturing.work-order.read` |
| GET | `/manufacturing/downtime` | Get downtime logs | `manufacturing.work-order.read` |
| POST | `/manufacturing/downtime` | Log downtime | `manufacturing.work-order.read` |
| GET | `/manufacturing/subcontracting` | Get subcontracting orders | `manufacturing.bom.read` |
| POST | `/manufacturing/subcontracting` | Create subcontracting order | `manufacturing.bom.read` |
| PATCH | `/manufacturing/subcontracting/:id` | Update subcontracting status | `manufacturing.bom.update` |
| GET | `/manufacturing/boms/:id/tree` | Get b o m tree | `manufacturing.bom.read` |
| GET | `/manufacturing/work-orders/:id/operations` | Get work order operations | `manufacturing.bom.read` |
| POST | `/manufacturing/work-orders/:id/operations/:opId/start` | Start operation step | `manufacturing.work-order.read` |
| POST | `/manufacturing/work-orders/:id/operations/:opId/complete` | Complete operation step | `manufacturing.work-order.update` |
| GET | `/manufacturing/tools` | Get equipment tools | `manufacturing.work-order.read` |
| GET | `/manufacturing/shifts` | Get workstation shifts | `manufacturing.work-order.read` |
| POST | `/manufacturing/shifts` | Create workstation shift | `manufacturing.work-order.read` |
| GET | `/manufacturing/subcontracting/:id/materials` | Get subcontracting materials | `manufacturing.bom.read` |
| POST | `/manufacturing/subcontracting/:id/issue` | Issue subcontracting materials | `manufacturing.bom.read` |
| POST | `/manufacturing/subcontracting/:id/reconcile` | Reconcile subcontracting materials | `manufacturing.bom.update` |
| GET | `/manufacturing/ecos` | Get e c os | `manufacturing.bom.read` |
| POST | `/manufacturing/ecos` | Submit e c o | `manufacturing.bom.read` |
| POST | `/manufacturing/ecos/:id/resolve` | Resolve e c o | `manufacturing.bom.update` |
| GET | `/manufacturing/diagnostics/oee` | Get detailed o e e analytics | `manufacturing.work-order.read` |
| GET | `/manufacturing/diagnostics/genealogy/:lotNumber` | Get lot genealogy | `manufacturing.work-order.read` |
| POST | `/manufacturing/scheduling/schedule` | Schedule work orders | `manufacturing.create` |
| GET | `/manufacturing/scheduling/bom-cost/:bomId` | Get bom cost | `manufacturing.read` |

## marketplace

17 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/developer/me` | My vendor | `admin.platform.read` |
| PUT | `/developer/me` | Update my vendor | `admin.platform.read` |
| GET | `/developer/apps` | My apps | `admin.platform.read` |
| POST | `/developer/apps` | Create app | `admin.platform.update` |
| POST | `/developer/apps/:packageId/bundles` | Create bundle | `admin.platform.update` |
| PUT | `/developer/bundles/:bundleId/submit` | Submit | `admin.platform.update` |
| GET | `/developer/review/pending` | Pending | `admin.platform.update` |
| PUT | `/developer/review/:bundleId/approve` | Approve | `admin.platform.update` |
| PUT | `/developer/review/:bundleId/reject` | Reject | `admin.platform.update` |
| PUT | `/developer/apps/:packageId/rollback` | Rollback | `admin.platform.update` |
| GET | `/storefront/apps` | List apps | `marketplace.read` |
| GET | `/storefront/apps/:slug` | Get app | `marketplace.read` |
| GET | `/storefront/categories` | Get categories | `marketplace.read` |
| GET | `/storefront/featured` | Get featured | `marketplace.read` |
| GET | `/storefront/vendor/:slug` | Get vendor apps | `marketplace.read` |
| POST | `/storefront/apps/:slug/review` | Submit review | `marketplace.create` |
| GET | `/storefront/developer/:vendorId` | Get developer dashboard | `marketplace.read` |

## notifications

6 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/notifications/preferences` | Get user preferences | `communication.notification.read` |
| PATCH | `/notifications/preferences` | Update user preferences | `communication.notification.read` |
| GET | `/notifications-config/channels` | Get channels | `communication.notification.read` |
| PUT | `/notifications-config/channels` | Update channel | `communication.notification.read` |
| GET | `/notifications-config/preferences` | Get preferences | `communication.notification.update` |
| POST | `/notifications-config/preferences` | Save preference | `communication.notification.update` |

## pos

73 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/pos/terminals` | Get terminals | `pos.terminal.read` |
| GET | `/pos/terminals/:id` | Get terminal | `pos.terminal.read` |
| POST | `/pos/terminals` | Create terminal | `pos.terminal.read` |
| PUT | `/pos/terminals/:id` | Update terminal | `pos.terminal.create` |
| DELETE | `/pos/terminals/:id` | Delete terminal | `pos.terminal.create` |
| GET | `/pos/registers` | Get registers | `pos.register.read` |
| POST | `/pos/registers/open` | Open register | `pos.register.read` |
| PUT | `/pos/registers/:id/close` | Close register | `pos.register.create` |
| GET | `/pos/registers/:registerId/shifts` | Get shifts | `pos.shift.read` |
| POST | `/pos/registers/:registerId/shifts/start` | Start shift | `pos.shift.read` |
| PUT | `/pos/shifts/:shiftId/end` | End shift | `pos.shift.create` |
| GET | `/pos/registers/:registerId/cash-entries` | Get cash entries | `pos.cash-entry.read` |
| POST | `/pos/registers/:registerId/cash-entries` | Add cash entry | `pos.cash-entry.read` |
| POST | `/pos/orders` | Create order | `pos.order.create` |
| GET | `/pos/orders` | Get orders | `pos.order.read` |
| GET | `/pos/orders/:id` | Get order | `pos.order.read` |
| GET | `/pos/orders/number/:orderNumber` | Get order by number | `pos.order.read` |
| POST | `/pos/orders/:id/void` | Void order | `pos.order.read` |
| POST | `/pos/orders/:id/receipt` | Generate receipt | `pos.order.read` |
| GET | `/pos/products/search` | Search products | `pos.product.search` |
| POST | `/pos/discounts` | Create discount | `pos.discount.create` |
| GET | `/pos/discounts` | Get discounts | `pos.discount.read` |
| GET | `/pos/discounts/:id` | Get discount | `pos.discount.read` |
| POST | `/pos/coupons/validate` | Validate coupon | `pos.discount.read` |
| POST | `/pos/coupons` | Create coupon | `pos.coupon.create` |
| GET | `/pos/coupons` | Get coupons | `pos.coupon.read` |
| POST | `/pos/tax-profiles` | Create tax profile | `pos.tax-profile.create` |
| GET | `/pos/tax-profiles` | Get tax profiles | `pos.tax-profile.read` |
| GET | `/pos/terminals/:id/quick-keys` | Get quick keys | `pos.terminal.read` |
| PUT | `/pos/terminals/:id/quick-keys` | Save quick keys | `pos.terminal.read` |
| GET | `/pos/customers/search` | Search customers | `pos.customer.read` |
| POST | `/pos/customers/walk-in` | Create walk in customer | `pos.customer.create` |
| POST | `/pos/loyalty/programs` | Create loyalty program | `pos.loyalty.create` |
| GET | `/pos/loyalty/programs` | Get loyalty programs | `pos.loyalty.read` |
| GET | `/pos/loyalty/programs/:programId/members` | Get loyalty members | `pos.loyalty.read` |
| GET | `/pos/loyalty/:customerId/balance` | Get loyalty balance | `pos.loyalty.read` |
| POST | `/pos/loyalty/redeem` | Redeem loyalty points | `pos.loyalty.read` |
| POST | `/pos/gift-cards` | Issue gift card | `pos.gift-card.create` |
| POST | `/pos/gift-cards/check-balance` | Check gift card balance | `pos.gift-card.read` |
| GET | `/pos/gift-cards` | Get gift cards | `pos.gift-card.read` |
| GET | `/pos/store-credits/:customerId` | Get store credit | `pos.gift-card.read` |
| POST | `/pos/returns` | Process return | `pos.return.create` |
| GET | `/pos/returns` | Get returns | `pos.return.read` |
| GET | `/pos/returns/:id` | Get return | `pos.return.read` |
| POST | `/pos/returns/:id/approve` | Approve return | `pos.return.read` |
| POST | `/pos/held-orders` | Hold order | `pos.held-order.create` |
| GET | `/pos/held-orders` | Get held orders | `pos.held-order.read` |
| PUT | `/pos/held-orders/:id/resume` | Resume held order | `pos.held-order.create` |
| DELETE | `/pos/held-orders/:id` | Discard held order | `pos.held-order.create` |
| POST | `/pos/price-lists` | Create price list | `pos.price-list.create` |
| GET | `/pos/price-lists` | Get price lists | `pos.price-list.read` |
| POST | `/pos/promotions` | Create promotion | `pos.promotion.create` |
| GET | `/pos/promotions` | Get promotions | `pos.promotion.read` |
| POST | `/pos/open-tabs` | Create open tab | `pos.open-tab.create` |
| GET | `/pos/open-tabs` | Get open tabs | `pos.open-tab.read` |
| PUT | `/pos/open-tabs/:id/close` | Close open tab | `pos.open-tab.read` |
| POST | `/pos/layaway` | Create layaway | `pos.layaway.create` |
| GET | `/pos/layaway` | Get layaways | `pos.layaway.read` |
| POST | `/pos/layaway/:id/payment` | Record layaway payment | `pos.layaway.read` |
| GET | `/pos/customer-display/:terminalId` | Get customer display config | `pos.terminal.read` |
| PUT | `/pos/customer-display/:terminalId` | Update customer display config | `pos.terminal.read` |
| GET | `/pos/summary/daily` | Get daily summary | `pos.report.read` |
| GET | `/pos/summary/shift/:shiftId` | Get shift report | `pos.report.read` |
| GET | `/pos/reports/sales-by-product` | Get sales by product | `pos.report.read` |
| GET | `/pos/reports/sales-by-cashier` | Get sales by cashier | `pos.report.read` |
| GET | `/pos/reports/sales-by-hour` | Get sales by hour | `pos.report.read` |
| GET | `/pos/reports/sales-by-payment` | Get sales by payment method | `pos.report.read` |
| GET | `/pos/reports/discount-usage` | Get discount usage | `pos.report.read` |
| GET | `/pos/reports/customer-insights` | Get customer insights | `pos.report.read` |
| GET | `/pos/reports/register-summary` | Get register summary | `pos.report.read` |
| PUT | `/pos/terminals/:id/receipt-template` | Update terminal receipt template | `pos.terminal.create` |
| GET | `/pos/terminals/:id/diagnostics` | Get terminal diagnostics | `pos.terminal.read` |
| PUT | `/pos/terminals/:id/diagnostics` | Update terminal diagnostics | `pos.terminal.read` |

## procurement

38 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/procurement/contracts` | Get contracts | `procurement.purchase-order.read` |
| GET | `/procurement/contracts/expiring` | Get expiring | `procurement.purchase-order.read` |
| GET | `/procurement/contracts/:id/compliance` | Get compliance | `procurement.purchase-order.read` |
| GET | `/procurement/purchase-orders` | Get purchase orders | `procurement.purchase-order.read` |
| GET | `/procurement/purchase-orders/:id` | Get purchase order by id | `procurement.purchase-order.read` |
| POST | `/procurement/purchase-orders` | Create purchase order | `procurement.purchase-order.read` |
| PATCH | `/procurement/purchase-orders/:id/status` | Update purchase order status | `procurement.purchase-order.update` |
| POST | `/procurement/purchase-receipts` | Create purchase receipt | `procurement.purchase-receipt.create` |
| GET | `/procurement/purchase-receipts` | Get purchase receipts | `procurement.purchase-receipt.create` |
| GET | `/procurement/rfqs` | Get r f qs | `procurement.purchase-order.read` |
| GET | `/procurement/rfqs/:id` | Get r f q by id | `procurement.purchase-order.read` |
| POST | `/procurement/rfqs` | Create r f q | `procurement.purchase-order.read` |
| GET | `/procurement/supplier-quotations` | Get supplier quotations | `procurement.purchase-order.read` |
| GET | `/procurement/supplier-quotations/:id` | Get supplier quotation by id | `procurement.purchase-order.read` |
| POST | `/procurement/supplier-quotations` | Create supplier quotation | `procurement.purchase-order.read` |
| PATCH | `/procurement/supplier-quotations/:id/status` | Update supplier quotation status | `procurement.purchase-order.update` |
| POST | `/procurement/supplier-quotations/:id/convert-po` | Convert supplier quotation to p o | `procurement.purchase-order.create` |
| GET | `/procurement/returns` | Get purchase returns | `procurement.purchase-order.read` |
| POST | `/procurement/returns` | Create purchase return | `procurement.purchase-order.read` |
| GET | `/procurement/requisitions` | Get requisitions | `procurement.purchase-order.read` |
| GET | `/procurement/requisitions/:id` | Get requisition by id | `procurement.purchase-order.read` |
| POST | `/procurement/requisitions` | Create requisition | `procurement.purchase-order.read` |
| PATCH | `/procurement/requisitions/:id/approve` | Approve requisition | `procurement.purchase-order.update` |
| PATCH | `/procurement/requisitions/:id/reject` | Reject requisition | `procurement.purchase-order.update` |
| POST | `/procurement/requisitions/:id/convert-po` | Convert requisition to p o | `procurement.purchase-order.update` |
| GET | `/procurement/blanket-agreements` | Get blanket agreements | `procurement.purchase-order.read` |
| GET | `/procurement/blanket-agreements/:id` | Get blanket agreement by id | `procurement.purchase-order.read` |
| POST | `/procurement/blanket-agreements` | Create blanket agreement | `procurement.purchase-order.read` |
| POST | `/procurement/blanket-agreements/:id/release` | Create release order | `procurement.purchase-order.create` |
| GET | `/procurement/vendors/:id/scorecard` | Get vendor performance metrics | `procurement.purchase-order.read` |
| GET | `/procurement/purchase-orders/:id/three-way-match` | Get three way match report | `procurement.purchase-order.read` |
| POST | `/procurement/vendors/:vendorId/portal-users` | Invite a vendor portal user | `procurement.vendor.manage` |
| GET | `/procurement/vendors/:vendorId/portal-users` | List vendor portal users | `procurement.vendor.manage` |
| PATCH | `/procurement/portal-users/:userId/disable` | Disable a vendor portal user | `procurement.vendor.manage` |
| GET | `/procurement/vendors/:vendorId/portal/purchase-orders` | Get POs visible to the portal user\ | `procurement.vendor.manage` |
| GET | `/procurement/vendors/:vendorId/portal/rfqs` | Get RFQs visible to the portal user\ | `procurement.vendor.manage` |
| GET | `/procurement/public/rfqs/:rfqNumber` | Get public r f q by number | — |
| POST | `/procurement/public/rfqs/:rfqNumber/submit-bid` | Submit public bid | — |

## projects

25 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/projects` | Get projects | `projects.project.read` |
| GET | `/projects/resource-workload` | Get resource workload for a week (defaults to the current week) | `projects.project.read` |
| GET | `/projects/revenue-recognition` | Get project revenue recognition schedule (time-based percentage-of-completion) | `projects.project.read` |
| GET | `/projects/portfolios` | Get portfolios | `projects.project.read` |
| POST | `/projects/portfolios` | Create portfolio | `projects.project.read` |
| GET | `/projects/wip-summary` | Get WIP summary across all projects | `projects.project.read` |
| GET | `/projects/:id` | Get project by id | `projects.project.read` |
| POST | `/projects` | Create project | `projects.project.read` |
| GET | `/projects/:id/tasks` | Get tasks | `projects.project.read` |
| POST | `/projects/:id/tasks` | Create task | `projects.project.read` |
| POST | `/projects/tasks/:taskId/timesheets` | Log time | `projects.timesheet.create` |
| POST | `/projects/:id/baseline` | Save baseline | `projects.project.create` |
| POST | `/projects/:id/critical-path` | Compute critical path | `projects.project.read` |
| GET | `/projects/:projectId/risks` | Get risks | `projects.project.read` |
| POST | `/projects/:projectId/risks` | Create risk | `projects.project.read` |
| PUT | `/projects/risks/:riskId` | Update risk | `projects.project.create` |
| GET | `/projects/:projectId/change-requests` | Get change requests | `projects.project.read` |
| POST | `/projects/:projectId/change-requests` | Create change request | `projects.project.read` |
| PUT | `/projects/change-requests/:changeRequestId/approve` | Approve change request | `projects.project.create` |
| GET | `/projects/:id/evm` | Get project e v m | `projects.project.read` |
| POST | `/projects/:id/invoice` | Generate project invoice | `finance.invoice.create` |
| GET | `/projects/:id/wip` | Get project WIP details | `projects.project.read` |
| POST | `/projects/:id/costs` | Create cost entry for project | `projects.project.read` |
| GET | `/projects/:id/costs` | Get cost entries for project | `projects.project.read` |
| DELETE | `/projects/costs/:costEntryId` | Delete cost entry | `projects.project.read` |

## pwa

3 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/admin/pwa-sync/queue` | Get sync queue | `admin.sync.read` |
| POST | `/admin/pwa-sync/push` | Push offline operations | `admin.sync.read` |
| PUT | `/admin/pwa-sync/reconcile/:id` | Reconcile operation | `admin.sync.create` |

## reporting

12 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/reporting/engine/semantic-layer` | Handle request | `reporting.read` |
| POST | `/reporting/engine/query` | Execute query | `reporting.create` |
| POST | `/reporting/engine/export` | Export query | `reporting.create` |
| GET | `/reporting/widgets` | Get widgets | `finance.report.read` |
| POST | `/reporting/widgets` | Create widget | `finance.report.read` |
| GET | `/reporting/views` | Get views | `finance.report.read` |
| POST | `/reporting/views` | Create view | `finance.report.read` |
| GET | `/reporting/scheduled` | Get scheduled reports | `finance.report.read` |
| POST | `/reporting/scheduled` | Create scheduled report | `finance.report.read` |
| PATCH | `/reporting/scheduled/:id` | Update scheduled report | `finance.report.read` |
| DELETE | `/reporting/scheduled/:id` | Delete scheduled report | `finance.report.read` |
| POST | `/reporting/scheduled/:id/run` | Run scheduled report | `finance.report.read` |

## saas

13 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/billing/subscription` | Get current subscription | `saas.read` |
| POST | `/billing/checkout` | Create checkout | `saas.create` |
| POST | `/billing/change-plan` | Change plan | `saas.create` |
| POST | `/billing/cancel` | Cancel subscription | `saas.create` |
| GET | `/billing/usage` | Get usage | `saas.read` |
| POST | `/billing/webhook` | Stripe webhook | `saas.create` |
| GET | `/saas/plans` | Get plans | `saas.read` |
| GET | `/saas/subscription` | Get subscription | `finance.invoice.read` |
| GET | `/saas/usage` | Get usage | `finance.invoice.read` |
| POST | `/saas/webhooks/stripe` | Stripe webhook | `saas.create` |
| GET | `/saas/installed-apps` | Get installed apps | `saas.read` |
| POST | `/saas/install` | Install app | `saas.create` |
| POST | `/saas/uninstall` | Uninstall app | `saas.create` |

## sales

29 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| POST | `/sales/pricing/calculate` | Calculate price for a product/quantity/customer | `sales.quotation.create` |
| GET | `/sales/pricing/availability/:productId` | Calculate price for a product/quantity/customer | `sales.quotation.create` |
| GET | `/sales/expansion/product-configuration/:productId` | Get Product Configuration | `sales.quotation.read` |
| GET | `/sales/expansion/quote-margin-analysis/:quotationId` | Get Quote Margin Analysis | `sales.quotation.read` |
| GET | `/sales/expansion/quote-profitability` | Get Quote Profitability | `sales.quotation.read` |
| GET | `/sales/expansion/backorders` | Get Backorders | `sales.order.read` |
| GET | `/sales/expansion/order-sla-status` | Get Order Sla Status | `sales.order.read` |
| GET | `/sales/expansion/order-profitability` | Get Order Profitability | `sales.order.read` |
| GET | `/sales/quotations` | List quotations | `sales.quotation.read` |
| POST | `/sales/quotations` | List quotations | `sales.quotation.read` |
| GET | `/sales/orders` | List sales orders | `sales.order.read` |
| GET | `/sales/orders/:id` | Get a sales order by id | `sales.order.read` |
| POST | `/sales/orders` | Get a sales order by id | `sales.order.read` |
| PATCH | `/sales/orders/:id/status` | Update sales order status | `sales.order.update` |
| POST | `/sales/orders/:id/convert` | Convert a quotation to a sales order | `sales.order.create` |
| PATCH | `/sales/orders/:id/approve-credit` | Approve a credit hold on a sales order | `sales.order.update` |
| POST | `/sales/orders/:id/payment` | Record a payment against a sales order | `sales.order.update` |
| POST | `/sales/orders/:id/purchase-order` | Convert a sales order to a purchase order | `sales.order.update` |
| GET | `/sales/quotations/:id` | Get a quotation by id | `sales.quotation.read` |
| PATCH | `/sales/quotations/:id/status` | Get a quotation by id | `sales.quotation.read` |
| GET | `/sales/delivery-notes` | List delivery notes | `sales.delivery-note.read` |
| GET | `/sales/delivery-notes/:id` | List delivery notes | `sales.delivery-note.read` |
| POST | `/sales/delivery-notes` | Get a delivery note by id | `sales.delivery-note.read` |
| PATCH | `/sales/delivery-notes/:id/ship` | Mark a delivery note as shipped | `sales.delivery-note.update` |
| GET | `/sales/returns` | List sales returns | `sales.return.read` |
| GET | `/sales/returns/:id` | List sales returns | `sales.return.read` |
| POST | `/sales/returns` | Get a sales return by id | `sales.return.read` |
| PATCH | `/sales/returns/:id/process` | Process a sales return (approve/reject/receive/refund) | `sales.return.update` |
| GET | `/sales/stats` | Sales dashboard statistics | `sales.order.read` |

## storage

6 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/storage/files` | Get files | `documents.document.read` |
| POST | `/storage/files` | Register file | `documents.document.read` |
| GET | `/storage/generated` | Get generated documents | `documents.document.read` |
| POST | `/storage/generate` | Generate document | `documents.document.read` |
| POST | `/storage/presigned` | Generate presigned url | `documents.document.read` |
| POST | `/storage/lifecycle` | Update lifecycle policy | `documents.document.create` |

## subscriptions

14 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/subscriptions` | List subscriptions (paginated, sortable, filterable) | `finance.subscription.read` |
| GET | `/subscriptions/stats` | List subscriptions (paginated, sortable, filterable) | `finance.subscription.read` |
| GET | `/subscriptions/metrics` | Get subscription stats by status | `finance.subscription.read` |
| GET | `/subscriptions/:id` | Get MRR/ARR/churn metrics | `finance.subscription.read` |
| POST | `/subscriptions` | Get subscription by ID | `finance.subscription.read` |
| PATCH | `/subscriptions/:id` | Update subscription | `finance.subscription.update` |
| DELETE | `/subscriptions/:id` | Cancel a subscription | `finance.subscription.delete` |
| POST | `/subscriptions/:id/pause` | Pause a subscription | `finance.subscription.update` |
| POST | `/subscriptions/:id/resume` | Pause a subscription | `finance.subscription.update` |
| POST | `/subscriptions/:id/cancel` | Resume a paused subscription | `finance.subscription.update` |
| POST | `/subscriptions/billing/run` | Run billing for all due subscriptions | `finance.subscription.manage` |
| POST | `/subscriptions/:id/usage` | Record usage for a subscription | `finance.subscription.update` |
| GET | `/subscriptions/:id/usage` | Get usage records for a subscription | `finance.subscription.read` |
| GET | `/subscriptions/:id/usage/summary` | Get usage records for a subscription | `finance.subscription.read` |

## supply-chain

5 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| GET | `/supply-chain/shipments` | Get shipments | `supply-chain.shipment.read` |
| GET | `/supply-chain/shipments/:id` | Get shipment by id | `supply-chain.shipment.read` |
| POST | `/supply-chain/shipments` | Create shipment | `supply-chain.shipment.read` |
| PATCH | `/supply-chain/shipments/:id/status` | Update shipment status | `supply-chain.shipment.update` |
| GET | `/supply-chain/forecast` | Get demand forecast | `supply-chain.forecast.read` |

## workflow

8 features

| Method | Route | Functionality | Permission |
|:--|:--|:--|:--|
| POST | `/workflows/engine/:id/execute` | Execute workflow | `workflow.create` |
| POST | `/workflows/engine/trigger` | Process event trigger | `workflow.create` |
| GET | `/workflows` | Get workflows | `admin.setting.read` |
| POST | `/workflows` | Create workflow | `admin.setting.read` |
| GET | `/workflows/approvals` | Get approval chains | `admin.setting.read` |
| PUT | `/workflows/approvals/:id` | Submit approval action | `admin.setting.read` |
| POST | `/workflows/sla-check` | Check sla breaches | `admin.setting.create` |
| POST | `/workflows/simulate` | Simulate workflow | `admin.setting.create` |
