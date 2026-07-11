# MARKET_BENCHMARK.md — Competitive Gap Analysis Engine

> This file is how UniERP **generates new requirements autonomously**. Agents don't wait
> for humans to write requirements — they benchmark UniERP against the top ERP market
> leaders, log the gaps here, and feed them into the Collab Board "Up Next" queue via
> [`AUTOPILOT.md`](AUTOPILOT.md) Step 9 (REFILL & DISCOVER).
>
> **Staleness rule**: if a module's "Last benchmarked" date is > 45 days old, it is due.
> **Rotation rule**: every autonomous cycle benchmarks exactly ONE module (the most
> overdue one) during Step 9 — using web research when available, or the agent's own
> product knowledge of the competitors below when offline.

---

## 1. The Top-20 Benchmark Set

Compare against these market leaders. For each module, benchmark against the 3–5
competitors strongest in that domain (listed per module in § 3).

| # | Product | Segment / why it's in the set |
|:--|:--|:--|
| 1 | SAP S/4HANA | Enterprise ERP gold standard (finance, manufacturing, supply chain) |
| 2 | Oracle NetSuite | Cloud ERP leader for mid-market (finance, order-to-cash) |
| 3 | Oracle Fusion Cloud ERP | Large-enterprise finance/procurement/EPM |
| 4 | Microsoft Dynamics 365 (F&O + Business Central) | Full-suite ERP+CRM, deep Office integration |
| 5 | Odoo | Closest architectural comparable — composable, modular, huge app surface |
| 6 | ERPNext (Frappe) | UniERP's UI/UX reference; open-source full-suite ERP |
| 7 | Workday | HCM + financials leader (HR, payroll, talent, planning) |
| 8 | Sage Intacct | Best-in-class cloud accounting (dimensions, consolidation) |
| 9 | Infor CloudSuite | Industry-specific ERP (manufacturing, healthcare) |
| 10 | Epicor Kinetic | Manufacturing/distribution ERP |
| 11 | Acumatica | Cloud ERP, strong construction/distribution/field service |
| 12 | Zoho One | Breadth benchmark — 45+ integrated business apps |
| 13 | IFS Cloud | Field service management + asset-intensive ERP leader |
| 14 | Salesforce (Sales/Service Cloud) | CRM feature ceiling (SFA, CPQ, service) |
| 15 | HubSpot | CRM/marketing automation usability benchmark |
| 16 | ServiceNow | Workflow/ITSM platform — workflow engine + service catalog ceiling |
| 17 | Shopify (+ POS) | E-commerce & POS feature ceiling |
| 18 | Katana / MRPeasy | Modern lightweight MRP UX benchmark |
| 19 | Deltek / Unit4 | Project-based ERP (PSA, project accounting) |
| 20 | Epic/athenahealth + PowerSchool + Yardi + ServiceTitan | Industry-vertical ceilings for Healthcare / Education / Real-Estate / Field-Service modules |

## 2. Discovery Protocol (run during AUTOPILOT Step 9)

1. Pick the most overdue module from the Rotation Tracker (§ 4). Ties → lowest scorecard score.
2. Research the 3–5 reference competitors for that module (§ 3): current feature lists,
   release notes, G2/Capterra category grids. Use `WebSearch`/`WebFetch` when available;
   otherwise use built-in product knowledge and mark the row `(offline analysis)`.
3. Compare against what UniERP actually has — read the module's row in
   `MODULE_REGISTRY.md` **and skim its service/controller code** (the registry can
   undersell or oversell reality).
4. Log findings in the Gap Backlog (§ 3): feature name, competitors that have it,
   UniERP status (`MISSING` / `PARTIAL` / `WEAK-UX`), business value (H/M/L), size (S/M/L).
5. Promote the top 1–3 gaps into Collab Board § 2 "Up Next" as groomed items
   (prefix `[benchmark]`, include a RICE score per `AUTOPILOT.md` Step 9b and quote the
   competitor's actual capability so the parity checklist in Step 3 has a target),
   update the Rotation Tracker date, and note it in CHANGELOG.
6. Prune gaps that get built (mark `✅ SHIPPED <date>` — keep the row for history).

**Quality bar**: a gap is only loggable if it is a *real, named capability shipping in a
named competitor* — not generic "improve X". Improvements to existing UniERP features
(depth, UX, automation) count equally with brand-new features.

## 3. Gap Backlog (per module, seeded 2026-07-08 — offline analysis, verify on first web pass)

### Finance & Accounting — refs: NetSuite, Sage Intacct, SAP, Dynamics 365, Odoo
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Automated bank feeds (Plaid/Yodlee-style connections, not just statement import) | NetSuite, Intacct, Odoo, Dynamics | 🟢 SHIPPED 2026-07-08 (BankConnection OAuth model, connect/sync, auto-matching, bank-feeds + bank-recon pages) | H | M |
| Revenue recognition engine (ASC 606/IFRS 15 schedules, deferral rules) | NetSuite, Intacct, SAP | 🟢 SHIPPED 2026-07-04 | H | L |
| Multi-entity consolidation with inter-company eliminations | Intacct, NetSuite, SAP | 🟢 SHIPPED 2026-07-04 (elimination journal auto-posting shipped 2026-07-08) | H | L |
| Cash-flow forecasting (rolling 13-week, AI-assisted) | Dynamics, NetSuite | 🟢 SHIPPED 2026-07-08 (rolling 13-week ForecastWeek projections, overrides, custom scenarios, dashboard) | H | M |
| Dunning / automated payment reminders with escalation levels | Odoo, NetSuite, ERPNext | 🟢 SHIPPED 2026-07-08 (dunning levels, runs, pause/resume, stats + AR aging + customer statement + credit risk — full AR/collections suite) | M | S |
| Expense management (OCR receipt capture, employee reimbursement flow) | NetSuite, Zoho, Odoo | 🟢 SHIPPED 2026-07-08 (simulated OCR extraction, category policies, mileage/per-diem auto-calc, multi-level approval, GL reimbursement posting, corporate card matching) | M | M |
| Lease accounting (ASC 842/IFRS 16: right-of-use asset, lease liability amortization schedules) | NetSuite Fixed Assets, Sage Intacct Lease Accounting | ✅ SHIPPED 2026-07-08 (17 API endpoints, effective-interest amortization engine, GL posting, 3 UI pages, 23 tests) | H | M |
| Subscription billing & recurring-revenue metrics (MRR/ARR tracking, usage-based billing, dunning tied to subscriptions) | Sage Intacct, Zuora, NetSuite SuiteBilling | 🟢 SHIPPED 2026-07-09 (Subscription/SubscriptionLine/SubscriptionInvoice/SubscriptionUsage models, billing-run job, MRR/ARR/churn calc, 3 Next.js pages, 14 unit tests) | H | M |
| Unified spend management (corporate card issuing + real-time transaction controls + budget-linked approvals, beyond expense reports) | Ramp, Brex, Emburse, BILL Spend & Expense | PARTIAL (real-time per-card/per-category spend limits, pre-authorization checks, breach auto-freeze, threshold alerts, increase-request workflow SHIPPED 2026-07-09; only card *issuing* — provisioning new virtual/physical cards via a network processor — remains open, logged as item 19 in Up Next) | M | S (remainder) |
| Continuous close / close-management checklist with task automation and variance flagging | Sage Intacct, BlackLine, FloQast | 🟢 SHIPPED 2026-07-09 (CloseTask/VarianceFlag/BudgetScenario/BudgetScenarioLine models, close checklist CRUD, templates autogen, PoP variance engine, budget scenario CRUD, cloning, locking, driver computations, actuals vs scenario comparisons, 3 Next.js pages, 13 unit tests) | M | M |
| Project-based accounting (WIP, job costing, percentage-of-completion revenue recognition tied to projects) | Sage Intacct, Deltek, NetSuite SRP | 🟢 SHIPPED 2026-07-09 (estimatedCost/contractValue fields, ProjectCostEntry schema + CRUD endpoints, WIP calculation, WIP summary endpoint, new /projects detail tab and form, new /projects/wip-reports dashboard) | H | M |
| AP three-way matching (auto-match PO → GR → vendor invoice, tolerance rules, exception queue) | NetSuite, SAP S/4HANA, Dynamics 365, Odoo | 🟢 SHIPPED 2026-07-09 (APMatchRule CRUD, three-way match engine, exception queue) | H | M |
| Financial statement drill-through (click P&L/BS totals → underlying journal entries → source documents) | NetSuite SuiteAnalytics, Sage Intacct, Dynamics 365 | 🟢 SHIPPED 2026-07-09 (AP three-way matching + batch payment runs + report drill-through) | H | S |
| Vendor payment run (batch APR: select open invoices, auto-generate payment batch, print remittances, post payment GL entries) | SAP, NetSuite, Dynamics, Odoo | 🟢 SHIPPED 2026-07-09 (AP three-way matching + batch payment runs + report drill-through) | H | M |
| Multi-book / multi-GAAP accounting (support multiple standards like US GAAP, IFRS, local tax books in parallel) | NetSuite Multi-Book, Sage Intacct | 🟢 SHIPPED 2026-07-09 (GLBook, book rules, parallel journal auto-post engine, statement book filters) | H | M |
| 1099 / vendor tax reporting (US IRS Form 1099-NEC/MISC/INT/DIV: eligibility tracking, TIN match, backup withholding, e-file batches) | NetSuite 1099 Reporting, Sage Intacct 1099 Processing, QuickBooks Contractor Payments | 🟢 SHIPPED 2026-07-11 (Vendor1099Profile/Form1099/Form1099Batch models, 27 endpoints, `/finance/advanced/1099-reporting` UI, 21 tests) | M | M |
| Automated sales/use-tax nexus & economic-nexus monitoring (per-state registration thresholds, real-time multi-jurisdiction rate lookup) | Avalara AvaTax, Vertex, NetSuite SuiteTax | MISSING (existing `TaxEngineService`/`TaxEngineDeepService` compute flat/withholding tax; no nexus threshold tracking or jurisdiction-rate API integration) | H | M |
| E-invoicing / structured e-invoice compliance (PEPPOL/UBL, EU ViDA, Latin America CFDI-style mandates) | SAP, NetSuite, Sage Intacct (regional add-ons) | MISSING | M | L |

### CRM & Sales — refs: Salesforce, HubSpot, Dynamics 365, Zoho, Odoo
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Sales cadences / sequences with multi-channel touchpoints (call, email, task) auto-enrolled | Salesforce Sales Engagement, HubSpot | PARTIAL (EmailSequence exists; no multi-channel cadence engine) | H | M |
| Conversation intelligence (call logging + AI summary into Activity) | Salesforce Einstein, HubSpot | MISSING | M | M |
| Quote e-signature with legally-binding audit certificate | HubSpot, Zoho Sign, Odoo Sign | PARTIAL (QuotationSignature model; no cert/audit doc) | M | S |
| Territory assignment rules engine (auto-routing by geo/size/round-robin) | Salesforce, Dynamics | PARTIAL (Territory model exists; no auto-assignment rules) | H | M |
| Customer portal (self-service: view quotes/orders/invoices/tickets) | Odoo, Zoho, Dynamics | MISSING | H | L |

### Inventory / Supply Chain — refs: NetSuite, SAP, Odoo, Acumatica, Epicor
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Landed cost allocation (freight/duty/insurance spread across receipt lines) | NetSuite, Odoo, Acumatica | MISSING | H | M |
| Wave/batch picking + pick-path optimization | NetSuite WMS, SAP EWM | MISSING | M | L |
| Putaway strategies & directed putaway rules | SAP, NetSuite WMS | MISSING | M | M |
| Drop-shipment flow (SO → auto-PO to vendor → direct ship) | NetSuite, Odoo, Dynamics | MISSING | H | M |
| Carrier rate shopping (multi-carrier quote at shipment creation) | ShipStation-class, NetSuite | MISSING | M | M |

### Manufacturing — refs: Epicor, Infor, SAP, Katana, Odoo
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Finite-capacity scheduling (drag-and-drop Gantt against work-center capacity) | Epicor, Infor, Katana | MISSING | H | L |
| Quality management (inspection plans, SPC charts, NCR/CAPA) | SAP QM, Infor, Epicor | MISSING | H | L |
| Maintenance / OEE (downtime capture, preventive maintenance on work centers) | Infor EAM, Odoo Maintenance | MISSING | M | M |
| Subcontracting flow (send components out, receive finished) | SAP, Odoo | MISSING | M | M |

### HR / Payroll — refs: Workday, Dynamics, Zoho People, Odoo
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Succession planning & 9-box talent grid | Workday, SAP SuccessFactors | MISSING | M | M |
| Compensation benchmarking & merit-cycle planning | Workday | MISSING | M | M |
| Recruiting/ATS (job requisitions, pipeline, offer letters) | Workday, Zoho Recruit | MISSING | H | L |
| Employee engagement surveys (pulse, eNPS) | Workday Peakon, Zoho | MISSING | L | S |

### POS / E-Commerce — refs: Shopify, Square, Odoo, ERPNext
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Loyalty program (points, tiers, redemption at POS + storefront) | Shopify, Square, Odoo | MISSING | H | M |
| Gift cards / store credit (sell, redeem, balance tracking) | Shopify, Square | MISSING | M | M |
| Abandoned-cart recovery emails | Shopify, HubSpot | MISSING | M | S |
| Product reviews & ratings on storefront | Shopify, every leader | MISSING | M | S |

### Projects / PSA — refs: Deltek, Unit4, Dynamics PSA, Odoo
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Resource capacity planning (heatmap of allocation vs availability) | Deltek, Unit4, Dynamics | MISSING | H | M |
| Project billing methods (fixed-fee milestones, T&M caps, retainers) | Deltek, NetSuite SRP | PARTIAL (budgets exist; no billing-method engine) | H | M |

### Workflow / Platform — refs: ServiceNow, Salesforce Flow, Zoho Flow
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| SSO (SAML/OIDC) + SCIM user provisioning | Every enterprise leader | MISSING | H | M |
| Sandbox tenants (clone tenant config+sample data for testing) | Salesforce, NetSuite | MISSING | M | L |
| Scheduled/recurring workflow triggers (time-based, not just event-based) | ServiceNow, Salesforce Flow | PARTIAL | M | S |
| In-app guided onboarding tours / checklists | Every modern SaaS | MISSING | M | M |

### Analytics / BI — refs: NetSuite SuiteAnalytics, Power BI embedded, Zoho Analytics
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Natural-language query ("ask your data") over module datasets | Zoho, Power BI Copilot, NetSuite | MISSING (AI module exists — wire it) | H | M |
| Anomaly detection & smart alerts on KPIs | Dynamics, Zoho | MISSING | M | M |

### Industry verticals — refs: Epic/athenahealth (Healthcare), PowerSchool (Education), Yardi (Real Estate), ServiceTitan/IFS (Field Service)
| Gap | Who has it | UniERP | Value | Size |
|:--|:--|:--|:--|:--|
| Patient portal (appointments, results, bill-pay) | athenahealth, Epic MyChart | MISSING | H | L |
| Telehealth visit links on appointments | athenahealth | MISSING | M | S |
| Parent/guardian mobile communication feed | PowerSchool, ClassDojo | MISSING | M | M |
| Tenant screening & online rent payment (ACH/card) | Yardi, AppFolio | MISSING | H | M |
| Field-service customer booking page + "technician on the way" tracking | ServiceTitan | MISSING | H | M |

## 4. Rotation Tracker

| Module | Last benchmarked | Method | Notes |
|:--|:--|:--|:--|
| ALL (seed pass) | 2026-07-08 | offline analysis | Initial seed by claude-code; each module still owes a web-verified pass |
| Finance | 2026-07-11 (pass 6) | offline analysis (pass 6 — no WebSearch tool available this session) | Pass 1: bank feeds, cash-flow, dunning, expense-mgmt OCR all SHIPPED. Pass 2: lease accounting SHIPPED. Pass 3: spend management SHIPPED. Pass 4: multi-book SHIPPED. Pass 5: intercompany loans, cash pooling, asset revaluations, multi-currency translation consolidation all SHIPPED. Pass 6 (2026-07-11): 1099/vendor tax reporting SHIPPED; feature ledger crosses 500 (515). New gaps logged: sales/use-tax nexus monitoring (Avalara/Vertex-style), e-invoicing (PEPPOL/UBL/ViDA). Full exit-criteria checklist (scorecard 10/10, E2E smoke, UAT) still needs confirmation before advancing focus to CRM. |
| CRM & Sales | — (due) | — | |
| Inventory/Supply Chain | — (due) | — | |
| Manufacturing | — (due) | — | |
| HR | — (due) | — | |
| POS/E-Commerce | — (due) | — | |
| Projects | — (due) | — | |
| Workflow/Platform | — (due) | — | |
| Analytics/BI | — (due) | — | |
| Healthcare | — (due) | — | |
| Education | — (due) | — | |
| Real Estate | — (due) | — | |
| Field Service | — (due) | — | |

> Append a row (or update the module's row date) after every discovery pass. Never
> delete gap rows — mark shipped ones `✅ SHIPPED <date>` so agents don't re-log them.
