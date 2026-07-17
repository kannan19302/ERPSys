# MARKET_BENCHMARK.md — Cached PM Market Research

> **Generated/Maintained by**: PM hat (AI agents + Human product owner)
> **Cache TTL**: 7 days per module section
> **Usage**: Read before scoping features (AUTOPILOT.md DEV flow step 4) to identify feature gaps vs. top 10 leaders.

---

## Current Focus Module: Inventory & Supply Chain

_Researched: 2026-07-17_

| Feature Area                            | Competitor Coverage                                   | UniERP Status | RICE Score                                               | Action / Scope                                                              |
| :-------------------------------------- | :---------------------------------------------------- | :------------ | :------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **Cycle Counting & Perpetual Accuracy** | SAP (Extended Warehouse Mgmt), NetSuite WMS, Fishbowl | ✅ Partial    | Reach 50 · Impact 7 · Confidence 60% · Effort 4 = **53** | Schedule blind-count cycle counts; perpetual-inventory accuracy-rate KPI    |
| **Serial & Lot Genealogy Traceability** | NetSuite WMS, Manhattan Active WMS, Zoho Inventory    | ✅ Partial    | Reach 55 · Impact 8 · Confidence 55% · Effort 5 = **48** | Capture/verify serial/lot at receipt-scan; recall-notice generation         |
| **Directed Put-Away**                   | Manhattan Active WMS, NetSuite WMS, Oracle WMS        | ✅ Partial    | Reach 45 · Impact 7 · Confidence 50% · Effort 6 = **26** | Zone-based bin capacity optimization; scan-to-verify put-away path          |
| **Advance Shipping Notices (ASN)**      | SAP S/4HANA, NetSuite WMS, Microsoft Dynamics 365     | ❌ Gap        | Reach 60 · Impact 8 · Confidence 65% · Effort 5 = **62** | **HIGH PRIORITY**: Inbound logistics container tracking and shipment status |
| **Dock Appointment Scheduling**         | Manhattan Active WMS, SAP Yard Logistics, Odoo        | ✅ Shipped    | Reach 45 · Impact 5 · Confidence 60% · Effort 3 = **45** | Persisted dock check-in/utilization dashboard                               |

---

## Module: Finance & Accounting

_Researched: 2026-07-17_

| Feature Area                             | Competitor Coverage                     | UniERP Status | RICE Score                                                | Action / Scope                                                         |
| :--------------------------------------- | :-------------------------------------- | :------------ | :-------------------------------------------------------- | :--------------------------------------------------------------------- |
| **AP Three-Way Matching**                | Sage Intacct, NetSuite, Oracle ERP      | ✅ Shipped    | Reach 50 · Impact 8 · Confidence 80% · Effort 3 = **96**  | Automatic invoice, PO, and receipt quantity/rate variance matching     |
| **Multi-Book / Multi-GAAP**              | SAP S/4HANA (Parallel Ledger), NetSuite | ✅ Shipped    | Reach 40 · Impact 8 · Confidence 70% · Effort 4 = **56**  | Concurrent local vs consolidated financial ledger books                |
| **Sales/Use Tax Nexus Monitoring**       | Avalara AvaTax, TaxJar, Stripe Tax      | ✅ Shipped    | Reach 45 · Impact 6 · Confidence 70% · Effort 3 = **63**  | Trailing-12-month transaction and revenue threshold calculations       |
| **Bank Feeds Integration**               | Xero, QuickBooks Online, Sage           | ✅ Shipped    | Reach 55 · Impact 9 · Confidence 75% · Effort 3 = **123** | Plaid API sync with automatic GL transaction reconciliation            |
| **E-Invoicing Compliance (PEPPOL/ViDA)** | SAP Document Compliance, Sovos, Pagero  | ❌ Gap        | Reach 25 · Impact 4 · Confidence 40% · Effort 8 = **5**   | Low priority: structured PEPPOL XML document generation and validation |

---

## Module: CRM & Sales

_Researched: 2026-07-17_

| Feature Area                          | Competitor Coverage                                | UniERP Status | RICE Score                                                | Action / Scope                                                            |
| :------------------------------------ | :------------------------------------------------- | :------------ | :-------------------------------------------------------- | :------------------------------------------------------------------------ |
| **Territory Assignment Rules Engine** | Salesforce Sales Cloud, HubSpot Enterprise         | ✅ Shipped    | Reach 45 · Impact 7 · Confidence 70% · Effort 3 = **73**  | Geo, industry, round-robin, size-based auto assignment rules              |
| **Conversation Intelligence**         | Gong.io, Chorus, Salesforce Einstein Call Coaching | ✅ Shipped    | Reach 40 · Impact 8 · Confidence 60% · Effort 4 = **48**  | Call transcript keyword scanning, sentiment indicators, and summary       |
| **E-Signature Audit Certificate**     | DocuSign, Adobe Sign, PandaDoc                     | ✅ Shipped    | Reach 50 · Impact 8 · Confidence 75% · Effort 3 = **100** | Cryptographic hash seal on signed sales quotations with audit history     |
| **Commission Plan Accelerators**      | Spiff, CaptivateIQ, Salesforce Territory & Quota   | ✅ Shipped    | Reach 35 · Impact 8 · Confidence 70% · Effort 4 = **49**  | Tiered quotas, attainment levels, and SPIFF rewards rules engine          |
| **AI Deal Win-Probability Scoring**   | Salesforce Einstein, Zoho Zia, Gong Forecast       | ❌ Gap        | Reach 50 · Impact 6 · Confidence 55% · Effort 4 = **41**  | Blend stage velocity, activities, and historical performance into a score |
