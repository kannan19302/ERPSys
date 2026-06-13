# Implementation Plan — Tiers 2-5 Finance Features

## Strategy
Implement the highest-value features across all tiers in a single pass. Each feature includes backend service methods, controller endpoints, frontend page, and tests.

## Features to Implement

### Tier 2 — Transactional & Compliance
1. **Budget vs Actuals** — Compare budget amounts vs actual journal entry totals per account
2. **Recurring Invoice Generation** — Auto-create invoices from recurring templates
3. **Multi-Currency Auto-Rate Fetch** — Fetch/update exchange rates, conversion in reports
4. **Tax Computation Engine** — Compute tax from TaxRule + TaxComponent on invoices
5. **Bank Reconciliation Full Flow** — Statement import, auto-matching, unreconciled items

### Tier 3 — Operational Finance
6. **Expense Management** — Employee expense reports, approval workflows
7. **Revenue Recognition** — Revenue schedules with deferred revenue tracking
8. **Payment Run Batch Processing** — Batch pay with approval workflow
9. **Fixed Asset Depreciation Run** — Batch compute monthly depreciation
10. **Financial Period Close Checklist** — Pre-close validation checks

### Tier 4 — Advanced Analytics
11. **Cash Position Dashboard** — Real-time cash across bank accounts
12. **Financial Ratios Dashboard** — Current ratio, quick ratio, ROI, etc.
13. **Cash Flow Forecasting** — Predictive model from open invoices/schedules
14. **Finance Audit Trail** — Track changes to financial records

### Tier 5 — Niche/Specialized
15. **VAT/GST Auto-Computation** — Auto-compute from taxable transactions
16. **Account Reconciliation** — Sub-ledger to GL matching
17. **Intercompany Reconciliation** — Auto-match between orgs
18. **Multi-Entity Consolidation** — Combined financial statements