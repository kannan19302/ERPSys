# Cycle 35 — CRM Deepening to 1500+ Features

## Phase: M (Module strengthening) | Focus: CRM & Sales (786 + 709 = 1495 features)

## Why

CRM & Sales is next in the Phase M focus order. Combined feature count (1495) is 5 short of the 1500+ completion bar, but many features are stub endpoints. This cycle adds **real, production-grade CRM sub-domains** missing vs. market leaders, closing the 1500+ gap and strengthening genuine competitive parity.

## Scope (4 sub-domains, ~55 new real endpoints + 3 new Prisma models)

### 1. Knowledge Base (15 API endpoints + 2 UI pages)

- **Models**: `KnowledgeBaseArticle`, `KnowledgeBaseCategory` (new Prisma models)
- **API**: CRUD for articles, categories; publish/draft lifecycle; search; article feedback; category tree
- **UI**: KB list page, KB article editor/reader page
- **Why**: All top-10 CRMs (Salesforce, HubSpot, Zendesk) ship a KB; CRM is incomplete without it

### 2. Win/Loss Analytics (12 API endpoints + 2 UI pages)

- **Models**: `WinLossReason`, `Competitor` (new Prisma models)
- **API**: Reason CRUD, competitor CRUD, win/loss analytics (rate by reason, by competitor, by rep, by period), deal-level win/loss tracking
- **UI**: Win/loss dashboard, competitor tracking page
- **Why**: Critical for sales process improvement; all major CRMs have this

### 3. Partner Relationship Management (PRM) Deepening (15 API endpoints + 2 UI pages)

- **Models**: Extend existing `SalesPartner`, `SalesPartnerTier`
- **API**: Partner portal access, deal registration, co-branded quotes, partner performance analytics, MDF fund tracking, partner tier management
- **UI**: Partner management hub, partner portal
- **Why**: Existing partner model exists but no deal registration or portal

### 4. Multi-Channel Communication Templates (13 API endpoints + 2 UI pages)

- **Models**: Extend with `CommunicationTemplate` (SMS, WhatsApp, email variants)
- **API**: Template CRUD per channel, channel config, send tracking, message log, analytics
- **UI**: Communication template library, channel settings
- **Why**: CRM needs omni-channel template management beyond just email

## Duplicate check

- Grep `KnowledgeBaseArticle`, `WinLossReason`, `Competitor`, `SalesPartner` — none exist in current schema
- Feature ledger scanned — none of these sub-domains have endpoints

## Total: ~55 new endpoints, 8 new UI pages

Well above the 40-feature floor.

## Gate tier: FAST

- No risky migrations (additive only)
- No breaking API changes
- Standard RBAC + @TrackChanges on mutations

## Rollback

- All Prisma models are additive (`prisma db deploy` adds tables, never drops)
- New controllers are behind `@Permissions` guards — no auth bypass risk
- UI pages are new routes — no old route change
