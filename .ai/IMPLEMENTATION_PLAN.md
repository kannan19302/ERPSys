# Cycle 30 — CRM Module: 1000+ Features + Finance-Style Tab UI

**Cycle**: 30 of 29 (DEV)
**Phase**: M — Module strengthening (Foundation SEALED)
**Focus**: CRM module deepening (704 → 1000+ features) + UI redesign (FinanceTabLayout pattern)
**Scope**: Add 300+ production endpoints, create CrmTabLayout, refactor CRM UI to follow Finance tab pattern

## Why

CRM (704 features, Complete/👑) is one of UniERP's flagship modules but lacks the modern tab-based navigation and executive dashboard that Finance users enjoy. Competitors (Salesforce, HubSpot, Dynamics 365 Sales, Zoho CRM, Pipedrive) each have >1500 CRM features with polished dashboards and pipeline analytics. Bringing CRM to 1000+ features closes the gap.

## Ordered Slice List

### Slice A: CrmTabLayout & Architecture (platform)

- Create `/crm` layout.tsx using ModuleTabLayout from @unerp/ui-layout (CrmTabLayout)
- Create tab constants for each sub-module group (Pipeline, Accounts, Marketing, Service, Enablement, Intelligence, Settings)
- Register new navigation descriptor segments

### Slice B: Executive CRM Dashboard (frontend + backend)

- Create GET /crm/dashboard — aggregated KPIs, pipeline health, lead velocity, win rate, forecast
- Build MultiPageDashboard CRM dashboard (5 pages: Executive Overview, Pipeline Analytics, Customer Health, Forecast & Revenue, Activity Stream)
- Wire KPI cards, charts, ListViews to real data

### Slice C: CRM Deepening — Sales Automation (120+ endpoints)

- `CrmSalesAutomationController` — lead scoring automation, auto-assignment rules, round-robin, escalation triggers
- `CrmForecastDeepController` — multi-scenario forecasting, AI predictions, quota attainment rollups
- Services: `crm-sales-automation.service`, `crm-forecast-deep.service`
- Tests for both services

### Slice D: CRM Deepening — Customer Success (80+ endpoints)

- `CrmCustomerSuccessController` — health scoring, NPS surveys, retention analysis, onboarding checklists
- `CrmChurnPreventionController` — at-risk detection, churn prediction, save campaigns, win-back flows
- Services: `crm-customer-success.service`, `crm-churn-prevention.service`
- Tests for both services

### Slice E: CRM Deepening — Marketing Automation (70+ endpoints)

- `CrmMarketingAutomationController` — campaign automation, drip sequences, email analytics (open/click/bounce), A/B testing, landing pages
- `CrmLeadGenController` — lead enrichment, intent signals, webhook ingestion, social listening feeds
- Services: `crm-marketing-automation.service`, `crm-lead-gen.service`
- Tests for both services

### Slice F: Frontend Tab Refactoring (all pages)

- Convert `/crm/page.tsx` to MultiPageDashboard
- Convert `/crm/leads/page.tsx` to CrmTabLayout with tabs (Overview, All Leads, Kanban, Analytics, Settings)
- Convert `/crm/opportunities/page.tsx` to CrmTabLayout (Pipeline, Forecast, Deal Rooms, Coaching)
- Convert `/crm/customers/page.tsx` to CrmTabLayout (Customers, Vendors, Contacts, Contracts)
- Convert `/crm/cases/page.tsx` to CrmTabLayout (Cases, SLA, Ticket Analytics)
- Create new pages for Sales Automation, Customer Success, Churn Prevention, Marketing Automation, Lead Gen

### Slice G: Tests & Verification

- Unit tests for all new services (target 80% coverage)
- Full typecheck (api + web + shared)
- Full test suite (vitest)

**Total new features: ~300+ endpoints**

## Duplicate Check

None of these new endpoint prefixes (`crm/dashboard`, `crm/sales-automation`, `crm/forecast-deep`, `crm/customer-success`, `crm/churn-prevention`, `crm/marketing-automation`, `crm/lead-gen`) exist in the current CRM module. Generated feature ledger will confirm.

## Acceptance Criteria

1. All 300+ new endpoints return correct tenant-scoped data with proper error handling
2. All endpoints have Zod validation and proper RBAC permissions
3. `pnpm typecheck` clean (api + web + shared)
4. CRM feature count jumps from 704 to 1000+ in FEATURE_LEDGER
5. CrmTabLayout working with tab-based navigation (like Finance)
6. Executive dashboard with real data KPIs and charts
7. 80%+ coverage on new services
8. All 3000+ existing tests still passing

## Gate Tier

MILESTONE (risky — large module refactoring with cross-cutting impact)

## Rollback Note

All changes are additive (new services, new controllers, new frontend tabs + layout). Rollback by reverting the commit. CrmTabLayout import errors would break CRM pages — rollback immediately if typecheck fails.
