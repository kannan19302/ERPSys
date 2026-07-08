# Finance Batch: Payables & Reporting Integration

**Batch ID**: Finance-Payables-Integration-2026-07-09  
**Status**: SCOPED (Ready for Build)  
**Claimed by**: claude-code (2026-07-09 via AUTOPILOT cycle)  
**Focus Module**: Finance & Accounting (current, per MODULE_FOCUS.md)  
**Target Duration**: 1 cycle (1 development session)  

---

## Executive Summary

Three benchmark features from the Finance module's Up Next queue (MODULE_REGISTRY.md § 2):

1. **AP three-way matching** (RICE 110): auto-match PO → goods receipt → vendor invoice with configurable tolerance rules
2. **Financial statement drill-through** (RICE 441): click P&L / BS line → see underlying journal entries → source documents
3. **Batch vendor payment run** (RICE 100): select open AP invoices → generate payment batch → export bank files + GL posting

**Deliverables**: 18 features (numbered below), full DB→API→UI→tests stack, 4 new permissions, aligned to competitor parity (NetSuite, SAP S/4HANA, Dynamics 365, Odoo).

**Gates**: TypeScript strict, 80%+ test coverage, zero cross-module imports, RBAC on all endpoints, multi-tenancy enforced, nav/breadcrumbs registered, CHANGELOG + MODULE_REGISTRY updated.

---

## Feature 1: AP Matching Rule Configuration (Schema + CRUD)

**User story**: As a Payables Manager, I want to define per-vendor tolerance thresholds for quantity and price variance so that our matching engine auto-accepts invoices within our comfort zone and flags outliers for review.

**Description**: Backend schema + API for managing `APMatchRule` entities (tolerance %, per-vendor, effective date, status).

**Acceptance Criteria**:
- Given I am a Finance Manager with `finance.payables.rule.manage` permission
- When I POST `/finance/payables/match-rules` with `{ vendorId, quantityTolerancePercent: 5, priceTolerancePercent: 2, effectiveDate, status: 'ACTIVE' }`
- Then a new `APMatchRule` row is created in Prisma, tenant-scoped, with `created_by` / `updated_by` audit fields
- And I can GET `/finance/payables/match-rules?vendorId=X` (paginated, sorted by effectiveDate desc)
- And I can PATCH `/finance/payables/match-rules/:id` to update thresholds or deactivate
- And soft-delete is supported (`DELETE /finance/payables/match-rules/:id` marks deleted_at)
- And `@Permissions('finance.payables.rule.manage')` guards all mutating endpoints
- And all endpoints carry `@TrackChanges('APMatchRule')` + `@UseInterceptors(ChangeHistoryInterceptor)`

**Competitor Parity**:
- NetSuite: per-vendor tolerance (NetSuite Accounts Payable > Matching Rules) — parity ✓
- SAP S/4HANA: per-vendor tolerance in Material Ledger — parity ✓
- Dynamics 365: vendor-level tolerance settings — parity ✓
- Odoo: account-level tolerance — simplified implementation, parity acceptable

**Dependencies**: Finance module already exists; Prisma `@unerp/database` ready.

**Schema Changes**:
```prisma
model APMatchRule {
  id                           String   @id @default(cuid2())
  tenant_id                    String
  vendor_id                    String   // FK to Vendor (soft, or nullable for default org rule)
  quantity_tolerance_percent   Decimal  @db.Decimal(5, 2) // e.g. 5.00 = ±5%
  price_tolerance_percent      Decimal  @db.Decimal(5, 2)   // e.g. 2.00 = ±2%
  effective_date               DateTime
  status                       String   @default("ACTIVE") // ACTIVE, INACTIVE
  created_at                   DateTime @default(now())
  updated_at                   DateTime @updatedAt
  created_by                   String
  updated_by                   String
  deleted_at                   DateTime?
  deleted_by                   String?

  @@map("ap_match_rules")
  @@unique([tenant_id, vendor_id, effective_date]) // per-vendor, per-effective-date unique
  @@index([tenant_id, vendor_id, status])
}
```

**Definition of Done**:
- Prisma model + migration (`20260709_ap_match_rules` idempotent, `migrate deploy` passing)
- Service method `APMatchRulesService` with `findAll`, `findById`, `create`, `update`, `delete` (soft-delete)
- Controller `POST/GET/PATCH/DELETE /finance/payables/match-rules` + `:id` routes
- Zod validator in `packages/shared/src/validators/ap-match.validator.ts`
- 8 unit tests (`ap-match-rules.service.spec.ts`) — CRUD, soft-delete, tenant isolation, permission checks via mock guard
- Permission strings registered: `finance.payables.rule.manage`, `finance.payables.rule.read`
- No UI page needed (backend-only in this feature; UI comes in Feature 6)
- Code: zero `any` type, strict TS, ESLint clean

---

## Feature 2: Matching Engine Service (PO + GR + Invoice Match Logic)

**User story**: As a Finance System, I want a matching engine that compares vendor invoices against PO and goods receipt records to identify matches within configured tolerance, calculate price/quantity variance, and mark the match confidence level so that downstream features can auto-post GL or flag exceptions.

**Description**: Core business logic service that accepts an invoice and searches for matching PO + GR records, applies tolerance rules, computes variance metrics, and returns match results.

**Acceptance Criteria**:
- Given a vendor invoice with `{ vendorId, invoiceNumber, amount, lineItems: [{ poLineId?, grLineId?, quantity, unitPrice, description }] }`
- When I call `APMatchingService.findMatches(invoice, toleranceRules)` (async)
- Then the service searches for:
  - PO lines from the same vendor matching the description / GST code / product ID
  - GR (goods receipt) lines that reference those PO lines
  - Compares: quantity (GR qty vs invoice line qty), price (GR unit price vs invoice unit price vs PO unit price)
- And returns an array of match results: `[{ matchType: 'EXACT' | 'WITHIN_TOLERANCE' | 'VARIANCE', poLineId, grlId, variance: { qty, price }, confidence: 95 }, ...]`
- And `matchType = 'EXACT'` when qty and price both match exactly
- And `matchType = 'WITHIN_TOLERANCE'` when both variance % fall within the vendor's configured tolerance
- And `matchType = 'VARIANCE'` when at least one variance exceeds tolerance (for exception queue)
- And the service is tenant-scoped (uses `getTenantId()` from AsyncLocalStorage)
- And no external API calls (deterministic, fast, suitable for sync execution)

**Competitor Parity**:
- NetSuite LIV (3-way matching) engine: PO + receipt + invoice matching with tolerance — parity ✓
- SAP S/4HANA: invoice verification at the line level with GR matching — parity ✓
- Dynamics 365: purchase order matching policies — parity ✓
- Odoo: purchase order matching at invoice line level — parity ✓

**Dependencies**: Feature 1 (APMatchRule), Finance module, Inventory module (GR records), Procurement module (PO records). No cross-module imports; use domain events or inject repo-scoped queries.

**Algorithm (Pseudocode)**:
```
function findMatches(invoice, toleranceRules):
  matches = []
  for each invoiceLine in invoice.lineItems:
    poSearchResults = queryPOLines(
      vendor_id = invoice.vendorId,
      description ≈ invoiceLine.description,
      status = 'OPEN' | 'PARTIALLY_RECEIVED'
    )
    for each poLine in poSearchResults:
      grSearchResults = queryGRLines(
        po_line_id = poLine.id,
        quantity >= invoiceLine.quantity * 0.95, // allow slight variance
        created_at >= invoiceLine.invoice_date - 90 days
      )
      for each grLine in grSearchResults:
        tolerance = toleranceRules.find(r => r.vendor_id = invoice.vendor_id, r.status = 'ACTIVE')
        qtyVariance = abs(grLine.quantity - invoiceLine.quantity) / grLine.quantity
        priceVariance = abs(grLine.unitPrice - invoiceLine.unitPrice) / grLine.unitPrice
        matchType = classify(qtyVariance, priceVariance, tolerance)
        confidence = computeConfidence(match_quality_score)
        matches.push({ matchType, poLineId, grLineId, variance: { qty, price }, confidence })
  return matches (sorted by confidence desc)
```

**Definition of Done**:
- Service `APMatchingService` in `apps/api/src/modules/advanced-finance/services/ap-matching.service.ts`
- Methods: `findMatches(invoice, toleranceRules)`, `classifyMatch(qtyVar, priceVar, tolerance)`, `computeConfidence(score)`
- Queries: use Prisma `PurchaseOrder`, `GoodsReceipt`, `Invoice` models (no raw SQL, no cross-module imports)
- 12 unit tests (`ap-matching.service.spec.ts`): exact match, within tolerance, variance, no matches found, edge cases (zero prices, null values, boundary conditions)
- TypeScript strict, no `any`, 80%+ coverage
- No controller/API endpoint here (Feature 3 wraps this)

---

## Feature 3: Invoice Matching Endpoint (POST /finance/payables/invoices/:id/match)

**User story**: As a Payables Clerk, I want to match a vendor invoice against purchase orders and goods receipts with a single API call, so that the system identifies matching records and I can decide whether to auto-post the GL or escalate for review.

**Description**: Controller endpoint that accepts an invoice ID, applies the matching engine (Feature 2), returns match candidates with variance details, and optionally accepts a `confirmMatchId` parameter to lock in a match.

**Acceptance Criteria**:
- Given an invoice ID and an authenticated Payables user
- When I POST `/finance/payables/invoices/:id/match` with optional `{ confirmMatchId: 'po_line_123' }`
- Then:
  - The endpoint loads the invoice (404 if not found, 403 if not accessible due to permissions or tenant)
  - Calls `APMatchingService.findMatches(invoice, toleranceRules)` (Feature 2)
  - Returns `{ data: { matches: [{ id, matchType, poLineId, grLineId, variance, confidence }], status: 'UNMATCHED' | 'MATCHED' | 'REQUIRES_REVIEW' }, meta: { totalMatches } }`
- And if `confirmMatchId` is provided:
  - The endpoint validates the match exists in the result set
  - Updates the invoice record: `matchedPoLineId = confirmMatchId`, `matchedAt = now()`, `matchStatus = matchType`
  - Emits domain event `finance.invoice.matched` with `{ invoiceId, poLineId, matchType, variance }`
  - Returns the confirmed match result with `matchedAt` timestamp
- And the endpoint is guarded by `@Permissions('finance.payables.match')` + `@UseGuards(JwtAuthGuard, RbacGuard)`
- And errors: 404 (invoice not found), 422 (match data incomplete), 400 (variance exceeds limits, if rejection is a business rule)

**Competitor Parity**:
- NetSuite: "Match Invoice" action on Vendor Bill → shows matching POs + receipts, one-click confirm — parity ✓
- SAP S/4HANA: Invoice Verification (IV) matching PO + GR in a Parked state — parity ✓
- Dynamics 365: "Match" button on Purchase Invoice → matching candidates list — parity ✓
- Odoo: One-to-One line matching on receipt, matching purchase order lines — parity ✓

**Dependencies**: Feature 1 (rules), Feature 2 (engine), existing Invoice entity.

**Definition of Done**:
- Controller method `matchInvoice(invoiceId, confirmMatchId?)` in `advanced-finance.controller.ts`
- Zod DTO: `MatchInvoiceRequestDto { confirmMatchId?: string }`
- Response DTO: `MatchInvoiceResponseDto { matches: [], status, meta }`
- Service method `APMatchingService.confirmMatch(invoiceId, poLineId)` updates the invoice row
- Event emission: `@OnEvent('finance.invoice.matched')` listener (if any handler exists; if not, no-op)
- `@TrackChanges('Invoice')` + `@UseInterceptors(ChangeHistoryInterceptor)` on the confirm mutation
- 6 unit tests: find matches, confirm match, already-matched invoice (idempotent), not found, permission denied
- Integration test: full flow from invoice creation to match confirmation (using test data)
- TypeScript strict, no `any`
- API typecheck + test suite green

---

## Feature 4: AP Invoice Exception Queue (Schema + List Page)

**User story**: As a Payables Supervisor, I want a queue of invoices that have matching variance exceeding tolerance so that I can review each one, decide whether to approve the variance or reject the invoice.

**Description**: Prisma model for `APMatchException` (invoice + expected vs. actual variance), plus backend list/detail endpoints, plus frontend list page with filters and actions.

**Acceptance Criteria**:
- Given an invoice with matched PO/GR but variance exceeds tolerance
- When the matching engine (Feature 2) classifies the match as `VARIANCE`
- Then an `APMatchException` row is created automatically: `{ invoiceId, poLineId, varianceType: 'QUANTITY' | 'PRICE' | 'BOTH', varianceAmount, variancePercent, status: 'PENDING', createdAt, resolvedAt, resolutionNotes }`
- And I can GET `/finance/payables/exceptions` (paginated, filterable by status/varianceType/vendorId, sortable by varianceAmount desc)
- And I can GET `/finance/payables/exceptions/:id` (detail view with invoice + PO + GR line comparison side-by-side)
- And I can PATCH `/finance/payables/exceptions/:id` to set `{ status: 'APPROVED' | 'REJECTED', resolutionNotes }`
- And on `status = 'APPROVED'`, the exception is marked resolved and the invoice can proceed to GL posting (Feature 5)
- And on `status = 'REJECTED'`, the invoice is marked `REJECTED`, a notification is sent to the vendor contact
- And the exception queue front-end page at `/finance/advanced/ap-exceptions` displays all PENDING exceptions, sorted by variance amount descending
- And each row shows: Invoice Number, Vendor, PO Reference, Variance Type/Amount/%, Created Date, Status badge, View & Approve/Reject actions
- And a detail slide-over shows the full invoice + PO + GR comparison with memo input for resolution notes

**Competitor Parity**:
- NetSuite: Matching Exception Queue (Accounts Payable > Match Exceptions) — parity ✓
- SAP S/4HANA: Invoice Verification exception handling in IV posting — parity ✓
- Dynamics 365: Purchase Invoice exception list — parity ✓

**Schema**:
```prisma
model APMatchException {
  id                       String   @id @default(cuid2())
  tenant_id                String
  invoice_id               String   // FK to Invoice
  po_line_id               String   // FK to PurchaseOrderLine
  variance_type            String   // QUANTITY, PRICE, BOTH
  variance_amount          Decimal  @db.Decimal(15, 2)
  variance_percent         Decimal  @db.Decimal(5, 2)
  expected_value           String   // JSON { qty, price } for display
  actual_value             String   // JSON { qty, price } for display
  status                   String   @default("PENDING") // PENDING, APPROVED, REJECTED
  resolution_notes         String?
  created_at               DateTime @default(now())
  resolved_at              DateTime?
  created_by               String
  updated_by               String
  resolved_by              String?

  @@map("ap_match_exceptions")
  @@unique([tenant_id, invoice_id, po_line_id])
  @@index([tenant_id, status, created_at])
}
```

**Definition of Done**:
- Prisma model + migration
- Service: `APMatchExceptionService` with `findAll`, `findById`, `create` (auto-triggered by Feature 3), `update` (approve/reject)
- Controller: `/finance/payables/exceptions` CRUD endpoints
- Zod validators
- Frontend page `/finance/advanced/ap-exceptions` (list with filters, detail slide-over)
- Navigation registered in `SEGMENT_NAMES`
- 8 unit tests (CRUD, auto-creation on match, approve/reject flow, filters)
- Permission: `finance.payables.exception.review`, `finance.payables.exception.approve`
- TypeScript strict, no `any`

---

## Feature 5: Auto GL Posting for Matched Invoices (Journal Creation)

**User story**: As a Payables Manager, I want the system to automatically create general ledger entries for matched vendor invoices so that the accounts payable balance is reflected in GL without manual journal entry.

**Description**: When an invoice is matched (Feature 3) and marked APPROVED (or has no exceptions), the system auto-creates a GL journal entry debiting the Expense account (or AP Asset account if prepaid) and crediting the AP Liability account, posting it to the GL.

**Acceptance Criteria**:
- Given an invoice matched to a PO + GR with status = 'APPROVED' (or no exception created)
- When the invoice status transitions to 'APPROVED' or when Feature 3's confirmMatch is called with no exceptions
- Then the system calls `APMatchingService.postGLForInvoice(invoiceId)` which:
  - Finds or creates a `Journal` record (dated today, in the current financial period, status = 'DRAFT')
  - Creates `JournalEntry` lines: 
    - Debit: Expense account (from invoice GL account mapping) by invoice.amount
    - Credit: AP Liability account by invoice.amount
  - Sets invoice fields: `glJournalId = journal.id`, `glPosted = true`, `glPostedAt = now()`
  - Posts the journal automatically (status = 'POSTED', ledgerPosted = true, posting_date = today)
  - Emits domain event `finance.invoice.glPosted` with `{ invoiceId, journalId }`
- And if the invoice has line items (not a summary), each line item may generate its own GL entry (configurable)
- And the endpoint is idempotent: calling it twice on the same invoice should not create duplicate GL entries
- And the endpoint is guarded by `@Permissions('finance.payables.post')` (Finance Manager only)
- And if GL posting fails (e.g., account not found, journal period closed), a `GlPostingException` is thrown and logged

**Competitor Parity**:
- NetSuite: "Match and Post" button auto-posts AP invoice to GL upon matching — parity ✓
- SAP S/4HANA: LIV posting automatically creates invoice verification ledger entries — parity ✓
- Dynamics 365: Auto GL posting on purchase invoice approval — parity ✓

**Dependencies**: Feature 3 (matching), Finance module (Journal/JournalEntry), existing GL account mapping.

**Algorithm**:
```
function postGLForInvoice(invoiceId):
  invoice = getInvoice(invoiceId)
  if invoice.glPosted:
    return { success: true, message: "Already posted" } // idempotent
  
  currentPeriod = getCurrentFinancialPeriod()
  if currentPeriod.status != 'OPEN':
    throw GlPostingException("Period is closed")
  
  apAccount = getApLiabilityAccount()
  expenseAccount = invoice.expenseAccount || getDefaultExpenseAccount()
  
  journal = Journal.create({
    date: today(),
    period_id: currentPeriod.id,
    description: "AP Invoice GL Posting: " + invoice.invoiceNumber,
    status: 'DRAFT'
  })
  
  JournalEntry.create({ journal_id, account: expenseAccount, debit: invoice.amount, description: "..." })
  JournalEntry.create({ journal_id, account: apAccount, credit: invoice.amount, description: "..." })
  
  journal.post() // status = POSTED, ledger_posted = true
  
  invoice.update({ gl_journal_id, gl_posted, gl_posted_at })
  
  emit event finance.invoice.glPosted
  return { journalId, invoiceId, amountPosted }
```

**Definition of Done**:
- Service method `APMatchingService.postGLForInvoice(invoiceId)` (or new `APGlPostingService`)
- Controller endpoint: `POST /finance/payables/invoices/:id/post-gl` (or triggered automatically in Feature 3)
- Idempotency: check `invoice.glPosted` before creating entries
- Error handling: GlPostingException if period closed, account not found, etc.
- 10 unit tests: successful posting, already posted, period closed, account not found, GL entry values validated
- Smoke test: end-to-end from invoice creation to GL posting (may involve Playwright for full stack)
- Permissions: `finance.payables.post`
- TypeScript strict, structured logger (no console.log)

---

## Feature 6: AP Matching Configuration UI Page

**User story**: As a Payables Manager, I want a UI page to configure and manage AP matching tolerance rules by vendor so that I can set up the system's matching behavior without writing code.

**Description**: Next.js page at `/finance/advanced/ap-matching` with two tabs: "Rules" (list + create/edit matching tolerances) and "Recent Matches" (history of matched invoices).

**Acceptance Criteria**:
- Given I navigate to `/finance/advanced/ap-matching`
- Then I see a tabbed page:
  - **Rules tab**: DataTable of `APMatchRule` entities (vendor, qty tolerance, price tolerance, effective date, status badge, created by, created date), sortable by all columns, filterable by vendor/status, pagination, a "+ Create Rule" button
  - Create Rule flow: modal or slide-over with form fields (vendor dropdown, qty tolerance input, price tolerance input, effective date picker, status toggle), validation via Zod, POST to Feature 1 endpoint
  - Edit Rule: click a row → slide-over pre-fills the form, PATCH endpoint to update
  - Delete: trash icon with confirm dialog, calls DELETE endpoint
  - **Recent Matches tab**: DataTable of recently matched invoices (invoice number, vendor, matched po, variance type, match type badge, created date), sortable, filterable by match type/vendor, click row to view details slide-over
- And all actions are wrapped with `<ProtectedComponent permission="finance.payables.rule.manage">` for create/edit/delete
- And the page uses `.frappe-*` utility classes and `design-tokens.css` tokens (no inline styles)
- And breadcrumb is registered: Apps / Finance / AP Matching
- And empty state when no rules: "No matching rules configured. Create your first rule..." with a CTA button
- And loading skeleton on first render

**Competitor Parity**: Configuration UI for matching rules — parity equivalent to NetSuite, SAP, Dynamics

**Dependencies**: Feature 1 (API endpoints), Feature 3 (matching history), @unerp/ui components

**Definition of Done**:
- Page file: `apps/web/app/(dashboard)/finance/advanced/ap-matching/page.tsx`
- Import: `DataTable`, `Modal`, `Form` from `@unerp/ui`
- Component structure: Server Component for data fetch, Client Component for interactivity
- API calls: `apiGet`, `apiPost`, `apiPatch`, `apiDelete` from `_components/api.ts`
- Zod validation: `CreateAPMatchRuleDto` on client side before submit
- Error handling: toast.error() on failures
- Navigation: registered in `SEGMENT_NAMES` in `layout.tsx`
- Vitest test: component renders, form validation, API call mocking (4 tests)
- TypeScript strict, ESLint clean

---

## Feature 7: Financial Statement Drill-Through Service (GL Query)

**User story**: As a Finance Analyst, I want a backend service that retrieves all journal entries underlying a specific P&L or Balance Sheet line total for a given period, so that I can verify the reported figures by seeing the source GL entries.

**Description**: Service that accepts a GL account ID (or range), a financial period, and a report type (P&L or BS), and returns all posted journal entries (with paging, sorting, filters) that contributed to that line's balance.

**Acceptance Criteria**:
- Given a GL account code (e.g., "4000 - Sales Revenue") and a financial period (e.g., "2026-07")
- When I call `StatementDrillThroughService.getDrilldownEntries({ accountId, period, reportType: 'PNL' | 'BALANCE_SHEET' })`
- Then the service returns:
  - Array of `JournalEntry` rows with fields: `{ id, accountCode, accountName, debit, credit, date, description, reference (e.g., invoice #), sourceDocumentType (Invoice, Payment, etc.), sourceDocumentId }`
  - Filtered to only the specified financial period (using `JournalEntry.posting_date >= period_start_date AND posting_date <= period_end_date`)
  - Sorted by posting date (latest first)
  - Paginated (limit 100 default, offset/page param)
  - Running balance column (cumulative debit - credit, to verify total matches the report)
- And the service is tenant-scoped (uses AsyncLocalStorage tenant context)
- And no raw SQL queries (use Prisma `.findMany()` with `.include()` for related entities)
- And performance: response time < 1 second for typical month (100-500 entries)

**Competitor Parity**:
- NetSuite SuiteAnalytics: click P&L line → see GL entries in a side panel — parity ✓
- Sage Intacct: Financial Statement Drill-down (click total → GL subledger) — parity ✓
- Dynamics 365: P&L inquiries drilled to GL transactions — parity ✓

**Dependencies**: Finance module, Advanced Finance module (Journal/JournalEntry models)

**Definition of Done**:
- Service `StatementDrillThroughService` in `apps/api/src/modules/advanced-finance/services/statement-drillthrough.service.ts`
- Methods: `getDrilldownEntries(filter)`, `getAccountBalance(accountId, period)`, `getRunningBalance(entries)` (helper)
- Zod DTO: `DrillDownQueryDto { accountId: string, period: string, reportType: 'PNL' | 'BALANCE_SHEET', limit?: number, offset?: number }`
- Response DTO: `DrillDownResponseDto { entries: JournalEntry[], total: number, accountBalance: Decimal, runningBalance: Decimal[] }`
- 8 unit tests: single account, multiple entries, period filtering, pagination, account not found, empty result
- TypeScript strict, no `any`, 80%+ coverage

---

## Feature 8: Statement Drill-Through API Endpoint (GET /advanced-finance/reports/:reportType/drilldown)

**User story**: As a Finance User, I want an API endpoint that drills through a P&L or Balance Sheet report line to see all underlying GL entries so that I can integrate drill-through links into the report UI.

**Description**: Controller endpoint that wraps Feature 7, accepts query parameters for account, period, report type, and returns the drilldown data in a standardized JSON envelope.

**Acceptance Criteria**:
- Given a GET request to `/advanced-finance/reports/{reportType}/drilldown?account={accountCode}&period={YYYY-MM}`
- Where `reportType` is one of: `pnl`, `balance-sheet`, `cash-flow`, `trial-balance`
- When the endpoint is called
- Then it:
  - Validates the account code and period format (Zod DTO)
  - Calls `StatementDrillThroughService.getDrilldownEntries(filter)` (Feature 7)
  - Returns `{ data: { entries, total, accountBalance, runningBalance }, meta: { period, account, reportType } }`
  - Handles errors: 400 (invalid params), 404 (account not found), 403 (no permission)
- And the endpoint is guarded by `@Permissions('finance.reports.read')` (read-only, any user can drill)
- And response is paginated via `?limit=100&offset=0` query params
- And supports optional filter params: `?status=POSTED&minAmount=1000` (for GL entry filtering)

**Competitor Parity**: Drill-through endpoints — standard REST pattern, parity ✓

**Dependencies**: Feature 7, existing Report endpoints

**Definition of Done**:
- Controller method `getDrilldown(reportType, accountCode, period, limit?, offset?)` in `advanced-finance.controller.ts`
- Zod DTO validation
- Response DTO
- 6 unit tests: valid params, invalid account, no entries found, pagination, permission check
- Integration test: call Feature 8 endpoint and verify Feature 7 data returned
- API typecheck green

---

## Feature 9: P&L Report Drill-Through Click Handler (UI)

**User story**: As a Finance Analyst viewing the P&L report, I want to click a line total (e.g., "Revenue: $500K") to see all underlying invoices and GL entries so that I can verify the line balance in seconds.

**Description**: React component that enhances the existing P&L report page with clickable line totals. Clicking a total opens a side panel (slide-over) showing the drilldown results.

**Acceptance Criteria**:
- Given the P&L report is displayed (assume it exists or is built in a prior cycle)
- When I click on a total amount in any P&L line (revenue, expense, net income)
- Then:
  - A slide-over panel opens on the right side
  - The panel header shows: "Drill-down: [Account Name] - [Period]"
  - The panel body shows a DataTable of GL entries from Feature 8 with columns: Date, Reference (clickable link to source doc), Description, Debit, Credit, Running Balance
  - The table is paginated (20 rows per page), sortable by date/amount, searchable by reference/description
  - A "Download CSV" button exports the drilldown entries
  - A close button or click-outside dismisses the panel
- And the click handler calls Feature 8 endpoint with account + period params
- And loading state shows a skeleton table while data is fetched
- And error state shows a toast message if the endpoint fails
- And the component is server-rendered (page fetches P&L data) but the click handler is client-side (Client Component)

**Competitor Parity**: Drill-through UI in financial reports — standard UI pattern, parity ✓

**Dependencies**: Feature 8 (API), existing P&L report page

**Definition of Done**:
- Page enhancement: `apps/web/app/(dashboard)/finance/advanced/reports/pnl.tsx` (or wherever P&L lives)
- New Client Component: `DrillThroughPanel.tsx` with:
  - Props: `{ isOpen, accountCode, period, onClose }`
  - State: `entries`, `loading`, `error`, `pagination`
  - API call: `apiGet(/advanced-finance/reports/pnl/drilldown?account=${accountCode}&period=${period})`
  - DataTable with columns and download button
- Integration: wrap P&L line total `<span>` in a clickable button, wire onClick to open panel
- Vitest test: component renders, button click opens panel, API call made, CSV download triggered
- TypeScript strict, ESLint clean
- Breadcrumb already registered (P&L page exists)

---

## Feature 10: Balance Sheet Report Drill-Through Click Handler (UI)

**User story**: As a Finance Controller viewing the Balance Sheet, I want to click on asset/liability/equity balances to drill down to supporting GL entries so that I can perform year-end variance analysis.

**Description**: Same as Feature 9, but for the Balance Sheet report. Component is identical (`DrillThroughPanel`), just integrated into a different page.

**Acceptance Criteria**:
- Given the Balance Sheet report is displayed
- When I click on any account balance (asset, liability, equity)
- Then the same `DrillThroughPanel` opens with BS-specific drilldown data
- And the Feature 8 endpoint is called with `reportType=balance-sheet`

**Definition of Done**:
- Page enhancement: `apps/web/app/(dashboard)/finance/advanced/reports/balance-sheet.tsx`
- Reuse `DrillThroughPanel` component
- Vitest test: integration with BS report
- TypeScript strict, ESLint clean

---

## Feature 11: Payment Batch Schema (Models + Migrations)

**User story**: As a Payables Manager, I want to group open vendor invoices into a payment batch so that I can review, approve, and export them as a single unit for bank processing.

**Description**: Prisma models for `PaymentBatch` (parent record, tracks status and aggregates) and `PaymentBatchLine` (individual invoices in the batch).

**Acceptance Criteria**:
- Schema includes:
  - `PaymentBatch`: id, tenant_id, batch_number (unique per tenant), status (DRAFT, SCHEDULED, SUBMITTED, SENT_TO_BANK, SETTLED), created_at, created_by, submitted_at, submitted_by, exported_at, settlement_date, totalAmount, currency, bankAccount_id, paymentMethod (ACH, SEPA, WIRE, CHECK), notes
  - `PaymentBatchLine`: id, tenant_id, batch_id (FK), invoice_id (FK), amount, scheduled_payment_date, status (INCLUDED, EXCLUDED, SETTLED), settled_at
  - Indexes: (tenant_id, status), (tenant_id, batch_id)
  - Relationships: Batch ↔ PaymentBatchLine (1:many), Batch → BankAccount (many:1), PaymentBatchLine → Invoice (many:1)
- Migration is idempotent (handles existing schema)

**Schema**:
```prisma
model PaymentBatch {
  id                        String   @id @default(cuid2())
  tenant_id                 String
  batch_number              String   // e.g., "BATCH-20260709-001"
  status                    String   @default("DRAFT") // DRAFT, SCHEDULED, SUBMITTED, SENT_TO_BANK, SETTLED
  created_at                DateTime @default(now())
  created_by                String
  submitted_at              DateTime?
  submitted_by              String?
  exported_at               DateTime?
  settlement_date           DateTime?
  total_amount              Decimal  @db.Decimal(15, 2)
  currency                  String   @default("USD")
  bank_account_id           String   // FK to BankAccount
  payment_method            String   // ACH, SEPA, WIRE, CHECK
  notes                      String?
  updated_at                DateTime @updatedAt
  updated_by                String

  lines                     PaymentBatchLine[]

  @@map("payment_batches")
  @@unique([tenant_id, batch_number])
  @@index([tenant_id, status, created_at])
}

model PaymentBatchLine {
  id                        String   @id @default(cuid2())
  tenant_id                 String
  batch_id                  String   // FK to PaymentBatch
  invoice_id                String   // FK to Invoice
  amount                    Decimal  @db.Decimal(15, 2)
  scheduled_payment_date    DateTime
  status                    String   @default("INCLUDED") // INCLUDED, EXCLUDED, SETTLED
  settled_at                DateTime?
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt

  batch                     PaymentBatch @relation(fields: [batch_id], references: [id], onDelete: Cascade)

  @@map("payment_batch_lines")
  @@index([tenant_id, batch_id, status])
}
```

**Definition of Done**:
- Prisma schema + migration (`20260709_payment_batches` idempotent)
- `pnpm db:migrate deploy` passes
- No manual schema tweaks after migration

---

## Feature 12: Payment Batch Service (CRUD + Assembly Logic)

**User story**: As a Payables System, I want to assemble a payment batch from selected open invoices, calculate totals, validate payment terms, and prepare the batch for export so that downstream features can generate bank files and GL postings.

**Description**: Service with methods to create, list, update, and assemble payment batches from selected invoices.

**Acceptance Criteria**:
- Service methods:
  - `createBatch(filter)`: Creates a DRAFT `PaymentBatch` from a set of open invoices (e.g., due within N days, vendor-specific, over a certain amount). Takes `{ vendorIds?, dueInDays?, minAmount?, bankAccountId, paymentMethod }`, returns the created batch with line items
  - `findAllBatches(filters, pagination)`: List all batches, filterable by status/created_date/vendor, paginated
  - `findBatchById(id)`: Get batch detail with lines
  - `updateBatch(id, { notes, paymentMethod })`: Update batch metadata (only if DRAFT)
  - `submitBatch(id)`: Transition batch from DRAFT → SCHEDULED (after review), calculate totals, validate all lines
  - `deleteBatch(id)`: Soft-delete a DRAFT batch
  - `removeBatchLine(batchId, lineId)`: Remove an invoice from a batch (DRAFT only)
  - `recalculateBatchTotals(batchId)`: Recompute batch.total_amount from lines
- Assembly logic (createBatch):
  - Query open invoices matching the filter (status = 'UNPAID', amount > 0, not already in a SUBMITTED batch)
  - Validate vendor payment terms: if terms are 'NET 60', skip invoices due in < 60 days
  - Group by payment method (some invoices may be ACH-only)
  - Create a `PaymentBatch` + one `PaymentBatchLine` per invoice
  - Calculate and store `batch.total_amount`
  - Return the assembled batch with statistics (e.g., 25 invoices, $250K total)
- All methods are tenant-scoped and audit-tracked

**Dependencies**: Feature 11 (schema), Finance module (Invoice entity)

**Definition of Done**:
- Service `PaymentBatchService` in `apps/api/src/modules/advanced-finance/services/payment-batch.service.ts`
- Methods as listed above
- Zod DTOs: `CreatePaymentBatchDto`, `UpdatePaymentBatchDto`, `PaymentBatchResponseDto`
- 12 unit tests: create batch, filter by vendor, validate terms, update batch, submit batch, remove line, recalculate totals, not found, permission denied
- TypeScript strict, no `any`, 80%+ coverage
- Structured logger for audit trail

---

## Feature 13: Payment Batch CRUD Endpoints (API)

**User story**: As a Payables API Consumer, I want REST endpoints to create, list, detail, update, and submit payment batches so that I can build workflows around batch management.

**Description**: NestJS controller exposing payment batch operations.

**Acceptance Criteria**:
- Endpoints:
  - `POST /finance/payables/payment-batches` (create) — body: `{ vendorIds?, dueInDays, minAmount, bankAccountId, paymentMethod }`
  - `GET /finance/payables/payment-batches` (list) — query: `{ status, page, limit, sortBy }`
  - `GET /finance/payables/payment-batches/:id` (detail)
  - `PATCH /finance/payables/payment-batches/:id` (update metadata) — body: `{ notes, paymentMethod }`
  - `POST /finance/payables/payment-batches/:id/submit` (submit for approval)
  - `DELETE /finance/payables/payment-batches/:id` (delete DRAFT only)
  - `DELETE /finance/payables/payment-batches/:id/lines/:lineId` (remove invoice from batch)
- All endpoints are guarded by `@Permissions('finance.payables.batch.*')` permissions
- All mutating endpoints carry `@TrackChanges('PaymentBatch')`
- Responses follow standard `{ data, meta, error }` envelope

**Competitor Parity**: Payment batch CRUD — standard API, parity ✓

**Dependencies**: Feature 12 (service)

**Definition of Done**:
- Controller `PaymentBatchController` in `advanced-finance.controller.ts`
- Response DTOs and Zod validators
- 10 unit tests: create, list, detail, update, submit, delete, remove line, permission checks
- API typecheck green

---

## Feature 14: Payment Batch Export (SEPA XML + NACHA ACH + CSV)

**User story**: As a Payables Manager, I want to export a payment batch to a bank-compatible file format (SEPA XML for EU, NACHA ACH for US) so that I can upload it to our bank portal.

**Description**: Service that generates bank-specific file formats from a `PaymentBatch`.

**Acceptance Criteria**:
- Service method `exportBatch(batchId, format: 'SEPA_XML' | 'NACHA_ACH' | 'CSV')` generates:
  - **SEPA XML** (`.xml` file): ISO 20022 Pain.001.002.03 format, with:
    - Initiation header: batch_id, created_date, total amount, currency
    - Payment info block: originator bank account, originator name, payment method (SEPA Credit Transfer)
    - For each line (invoice/payment): creditor bank account (vendor's bank), creditor name (vendor), amount, reference (invoice #), due date
  - **NACHA ACH** (`.txt` file): NACHA file format, with:
    - File header: immediate destination (bank routing), immediate originator (company), file creation date/time
    - Batch header: company ID, batch # (from batch_id), entry count, total amount
    - For each line: PPD entry (payroll), originating company, destination routing, destination account (vendor), amount, reference (invoice #)
    - Batch trailer: entry count, total amount, total hash
    - File trailer: batch count
  - **CSV** (`.csv` file): Simple delimited format with columns: Invoice #, Vendor Name, Vendor Bank Account, Amount, Payment Date, Reference
- The service validates the batch is in a submittable state (not already exported, all lines have valid bank accounts)
- The service returns a file buffer (bytes) + filename suggestion (e.g., `BATCH-20260709-001.xml`)
- The export does NOT auto-post GL entries; that is Feature 15's responsibility

**Competitor Parity**:
- NetSuite: Payment Export to ACH/EFT/Check formats — parity ✓
- SAP S/4HANA: Payment method formats (SEPA, EDIFACT, custom) — parity ✓
- Dynamics 365: Payment file export (ACH, check, international) — parity ✓

**Dependencies**: Feature 12 (batch service), bank account details (assumed to exist on `BankAccount` and `Vendor` models)

**Definition of Done**:
- Service `PaymentExportService` in `apps/api/src/modules/advanced-finance/services/payment-export.service.ts`
- Methods: `exportBatch(batchId, format)`, `generateSepaXml(batch)`, `generateNachaAch(batch)`, `generateCsv(batch)` (helpers)
- Zod validators for SEPA/NACHA structures (to ensure valid output)
- 9 unit tests: SEPA XML structure validation, NACHA ACH structure validation, CSV generation, invalid batch, missing vendor bank account, malformed date
- No external API calls (deterministic file generation)
- TypeScript strict, no `any`

---

## Feature 15: Payment Batch Export Endpoint (POST /finance/payables/payment-batches/:id/export)

**User story**: As a Payables API Consumer, I want an endpoint to export a batch in a specific file format and download it so that I can send the file to the bank.

**Description**: Controller endpoint that wraps Feature 14, generates the file, and returns it as a downloadable attachment.

**Acceptance Criteria**:
- Endpoint: `POST /finance/payables/payment-batches/:id/export?format=SEPA_XML` (or `NACHA_ACH`, `CSV`)
- Response: HTTP 200 with headers:
  - `Content-Type: application/xml` (for SEPA), `text/plain` (for NACHA), or `text/csv` (for CSV)
  - `Content-Disposition: attachment; filename=...`
  - Body: the file buffer (binary or text)
- On success: marks the batch `exportedAt = now()`, updates `exported_at` in the DB, emits domain event `finance.paymentBatch.exported`
- Errors: 400 (invalid format), 404 (batch not found), 422 (batch not in exportable state, e.g., still DRAFT), 403 (permission denied)
- Guarded by `@Permissions('finance.payables.batch.export')`

**Definition of Done**:
- Controller method `exportBatch(batchId, format)` in `advanced-finance.controller.ts`
- Calls Feature 14 service
- Handles file download response (Nest.js `@Res()`)
- Updates batch `exported_at` after successful export
- 6 unit tests: successful export, invalid format, batch not exportable, permission denied
- API typecheck green

---

## Feature 16: Payment Batch GL Posting (Bulk GL Entry Creation)

**User story**: As a Finance System, I want to auto-post GL entries for all approved payment batches so that cash outflows are reflected in the GL without manual journal entry.

**Description**: Service that creates GL journal entries for a payment batch, debiting AP Liability and crediting Cash (or Bank account).

**Acceptance Criteria**:
- Service method `postBatchGLEntries(batchId)`:
  - Loads the batch and all lines
  - Validates batch is in SUBMITTED state
  - For each line (invoice in the batch):
    - Creates a `Journal` entry (or adds to an existing batch journal): Debit AP Liability account, Credit Bank/Cash account
    - Amount = line.amount
    - Description = "Payment Batch GL: " + batch_number + " " + invoice_number
    - Updates `PaymentBatchLine.status = 'SETTLED'`, `settled_at = now()`
  - Posts the journal (status = POSTED)
  - Updates `PaymentBatch.status = 'SENT_TO_BANK'`, `settlement_date = now()`
  - Emits domain event `finance.paymentBatch.glPosted`
  - Returns summary: `{ journalId, lineCount, totalAmount }`
- Idempotent: if already posted, returns success without duplicating entries
- Guarded by `@Permissions('finance.payables.batch.post')`

**Dependencies**: Feature 12 (batch), Finance module (Journal)

**Definition of Done**:
- Service method in `PaymentBatchService` or new `PaymentBatchGLService`
- Method: `postBatchGLEntries(batchId)`
- Idempotency check
- 8 unit tests: successful posting, idempotent call, batch not found, invalid state, GL account not found
- Structured logger
- TypeScript strict, no `any`, 80%+ coverage

---

## Feature 17: Payment Batch Run Summary UI Page

**User story**: As a Payables Manager, I want a dashboard page showing recent payment batches, their status (DRAFT, SCHEDULED, SENT, SETTLED), and summary statistics so that I can track batch progress at a glance.

**Description**: Next.js page at `/finance/advanced/payment-batches` displaying:
  - Summary cards: Total Pending Batches, Total Amount Pending, Recently Settled (this week), Settlement Success Rate
  - DataTable of all batches: Batch #, Created Date, Vendor Count, Total Amount, Payment Method, Status badge, Last Updated, Actions (View, Edit, Export, Delete)
  - Filters: Status dropdown, Date range picker, Vendor multi-select
  - Detail slide-over: View full batch with line-item table, totals, bank account info, export button

**Acceptance Criteria**:
- Page at `/finance/advanced/payment-batches`
- Four summary stat cards fetched from `GET /finance/payables/payment-batches/summary` endpoint (new Feature 18 helper)
- DataTable uses Feature 13's list endpoint with pagination/sorting/filtering
- "Create Batch" button opens a modal or navigates to a creation flow (deferred to a future feature; stub button OK here)
- Click a batch row → slide-over shows details + lines table + Export and Submit buttons
- Breadcrumb registered
- Empty state: "No payment batches. Create your first batch..."
- Loading skeleton
- Uses `.frappe-*` utility classes and `design-tokens.css`
- All actions wrapped with `<ProtectedComponent permission="finance.payables.batch.*">`

**Definition of Done**:
- Page file: `apps/web/app/(dashboard)/finance/advanced/payment-batches/page.tsx`
- Reusable detail slide-over component
- API calls via `_components/api.ts` helpers
- Vitest test: component renders, API calls mocked, drill-in works
- TypeScript strict, ESLint clean
- Navigation + breadcrumb registered

---

## Feature 18: Payment Batch Summary Endpoint (Stats)

**User story**: As a Payables Dashboard, I need aggregated statistics about payment batches (pending count, total amount, success rate) so that I can display KPI cards on the summary page.

**Description**: Controller endpoint that returns high-level batch statistics for the current tenant.

**Acceptance Criteria**:
- Endpoint: `GET /finance/payables/payment-batches/summary`
- Response: `{ data: { totalPending: number, totalAmountPending: Decimal, recentlySettled: number, successRate: Decimal, lastBatchDate: DateTime } }`
- Filters query params (optional): `?dateFrom=2026-07-01&dateTo=2026-07-31`
- Guarded by `@Permissions('finance.payables.batch.read')`

**Definition of Done**:
- Controller method in `advanced-finance.controller.ts`
- Response DTO
- Zod validators
- 4 unit tests: calculates pending correctly, calculates success rate, date filter works, no data returns zeros
- API typecheck green

---

## Cross-Cutting Requirements (All 18 Features)

### Multi-Tenancy
- Every new table has `tenant_id` (non-null, indexed)
- Every API endpoint filters by `getTenantId()` from AsyncLocalStorage (via existing `TenantInterceptor`)
- No data leakage between tenants in tests or production

### RBAC & Permissions
- All new permission strings registered in `packages/shared/src/permissions/registry.ts`:
  - `finance.payables.rule.manage` (create/update/delete AP match rules)
  - `finance.payables.rule.read` (view rules)
  - `finance.payables.match` (perform invoice matching)
  - `finance.payables.exception.review` (view exception queue)
  - `finance.payables.exception.approve` (approve/reject exceptions)
  - `finance.payables.post` (auto-post GL for matched invoices)
  - `finance.payables.batch.read` (view batches)
  - `finance.payables.batch.create` (create batches)
  - `finance.payables.batch.export` (export to bank files)
  - `finance.payables.batch.post` (post GL entries)
- Every controller method carries `@Permissions('...')` decorator + `@UseGuards(JwtAuthGuard, RbacGuard)`
- Every UI component wraps privileged actions with `<ProtectedComponent permission="...">`

### Change History & Audit Trail
- Every mutating endpoint on `APMatchRule`, `APMatchException`, `PaymentBatch` carries `@TrackChanges('Entity')` + `@UseInterceptors(ChangeHistoryInterceptor)`
- Every detail page (Features 6, 10, 17) includes a `<ChangeHistory entityType="X" entityId={id} />` component at the bottom

### Validation & Error Handling
- All input validated with Zod schemas (shared between frontend and backend)
- All errors wrapped in NestJS exceptions (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `UnprocessableEntityException`)
- No raw SQL queries or unsanitized user input
- Structured logging via `@unerp/shared` logger (no `console.log`)

### Testing Strategy
- **Unit tests**: all service methods (80%+ coverage target)
- **Integration tests**: controller endpoints with mocked guards
- **E2E smoke test**: add new routes to `apps/web/e2e/smoke.spec.ts` (if applicable)
- Test fixtures: leverage existing seed data or create minimal test data per test

### UI/UX Standards (Features 6, 9, 10, 17)
- Use `@unerp/ui` components only (`DataTable`, `Modal`, `Form`, `Button`, `Badge`, `Toast`, etc.)
- All forms validated with Zod before submit
- Success toast on create/update, error toast on failure
- Loading skeleton on first render
- Empty state with CTA when no data
- Breadcrumb navigation registered in `SEGMENT_NAMES` in `layout.tsx`
- No inline styles; use `.frappe-*` utility classes and `design-tokens.css` tokens
- Responsive (mobile-first, tested on 375px width minimum)

### Documentation & Navigation
- All new API routes documented in code via `@ApiOperation` comments (or JSDoc)
- All new UI pages registered in `SEGMENT_NAMES` in `apps/web/app/(dashboard)/layout.tsx`
- All new pages linked from sidebar navigation (e.g., Finance > Advanced > "AP Matching" link)

### Performance & Scalability
- All list endpoints paginate (20-100 rows per page)
- Index all frequently queried columns (`tenant_id`, `status`, `created_at`, `vendor_id`, etc.)
- No N+1 queries (use Prisma `.include()` + `.select()` to pre-fetch relations)
- Query response time < 1 second for typical dataset (100-5000 records)

---

## Delivery Order & Dependencies

```
Batch 1 (Schema + Backend):
├─ Feature 1: APMatchRule schema + CRUD (prerequisite for Features 2, 4)
├─ Feature 11: PaymentBatch schema (prerequisite for Features 12+)
└─ Feature 12: PaymentBatchService
    └─ Feature 13: PaymentBatch CRUD endpoints

Batch 2 (AP Matching Logic):
├─ Feature 2: Matching engine service (uses Feature 1)
├─ Feature 3: Invoice match endpoint (uses Feature 2)
├─ Feature 4: Exception queue (schema + CRUD)
├─ Feature 5: GL posting for matched invoices
└─ Feature 6: AP Matching config UI

Batch 3 (Statement Drill-Through):
├─ Feature 7: Drill-through service
├─ Feature 8: Drill-through API endpoint
└─ Feature 9 & 10: UI click handlers (reuse same component)

Batch 4 (Payment Batch Export + Posting):
├─ Feature 14: Export service (SEPA/NACHA/CSV)
├─ Feature 15: Export endpoint
└─ Feature 16: GL posting for batches
    └─ Feature 18: Summary stats endpoint
        └─ Feature 17: Payment Batches summary page
```

**Recommended Build Order (single cycle)**:
1. Features 1, 11 (schemas)
2. Features 2, 7, 12 (core services)
3. Features 3, 13, 8, 14, 15 (endpoints)
4. Feature 5, 16 (GL posting)
5. Features 4, 6, 9, 10, 17, 18 (UI + stats)

**Test Gates** (run after each batch or at the end):
- `pnpm --filter @unerp/api typecheck` (TypeScript strict)
- `pnpm --filter @unerp/api test` (all specs green)
- `pnpm --filter @unerp/web typecheck` (Next.js strict)
- `pnpm turbo run typecheck` (full monorepo)
- Smoke test: `pnpm --filter @unerp/web test:e2e --project=smoke` (13/13 routes green)

**Commit & Push** (after all gates pass):
- Add CHANGELOG entry (1 entry for the entire batch, with 18-feature count and per-feature summaries)
- Update MODULE_REGISTRY.md (§ Codebase Growth Tracker with new LOC count, § Collab Board move to Recently Completed)
- Regenerate FEATURE_LEDGER.md: `node scripts/feature-ledger.mjs` and commit
- Regenerate SPRINT_TRACKER.md: `node scripts/sprint-tracker.mjs` and commit
- Commit message: `feat(finance): Payables & Reporting Integration batch (AP matching + drill-through + payment batches, 18 features, DB+API+UI)`

---

## Success Metrics (How We'll Know It Worked)

1. **Functional**: All 18 features work end-to-end (create rule → match invoice → approve exception → auto-GL → export batch → settle).
2. **Parity**: AP matching tolerance logic matches NetSuite/SAP/Dynamics feature set; drill-through provides click-to-GL-entries flow; payment batch export generates valid SEPA XML or NACHA ACH files.
3. **Code Quality**: TypeScript strict mode, zero `any`, 80%+ test coverage on all services, ESLint clean, no `console.log`.
4. **Performance**: All list endpoints < 1 second, export generation < 2 seconds, matching engine < 500ms.
5. **UX**: All UI pages follow Frappe aesthetic, breadcrumbs registered, empty states present, loading skeletons on fetch, error toasts visible.
6. **Audit & Compliance**: All mutating endpoints tracked, all privileged actions protected by RBAC, all data tenant-scoped.
7. **Gates**: TypeScript strict (web + api), all 18 features' tests green (80%+ suite), smoke test 13/13 passing.

---

## Next Agents

| Role | Task | Files | Notes |
|:---|:---|:---|:---|
| **data-architect** | Features 1, 11: Prisma schema, migration, indexes | `packages/database/prisma/schema.prisma`, `apps/api/src/modules/advanced-finance/dto/` | Idempotent migration; verify soft-delete triggers |
| **backend-developer** | Features 2–5, 7, 8, 12–16, 18: Services + controllers + endpoints | `apps/api/src/modules/advanced-finance/services/`, `advanced-finance.controller.ts` | Start with Features 2, 7, 12 (core logic); then wrap in endpoints (3, 8, 13, 15); then GL posting (5, 16). Use existing Journal/Invoice models; no new cross-module imports. |
| **frontend-developer** | Features 6, 9, 10, 17: UI pages + click handlers | `apps/web/app/(dashboard)/finance/advanced/` | Reuse DataTable + Modal + Form from @unerp/ui; Features 9–10 share the same DrillThroughPanel component; register all breadcrumbs in layout.tsx. |
| **qa-tester** | Test plan: unit, integration, E2E | `apps/api/src/modules/advanced-finance/tests/`, `apps/web/e2e/` | Verify multi-tenancy isolation, RBAC enforcement on every endpoint, idempotency on GL posting, bank file format (SEPA/NACHA) compliance. |
| **business-analyst-uat** | UAT script: end-to-end flow (rule → match → exception → GL → batch → export → settle) | `scripts/uat/` (create if needed) | Verify competitor parity: NetSuite three-way matching, SAP LIV posting, Dynamics 365 invoice matching, Odoo purchase matching. Document UAT sign-off in CHANGELOG. |

---

## Known Gaps & Deferred Items

1. **Vendor Bank Account Details**: Features 14–15 assume `Vendor` has `bankAccountNumber`, `bankCode`, `swiftCode` fields. If missing, those features will fail GL export file validation. **Action**: Verify Vendor schema covers SEPA/NACHA requirements before starting Feature 14.
2. **Invoice Status Workflow**: Features 3, 5, 13 assume `Invoice` entity has a `status` field and transitions (`DRAFT → MATCHED → APPROVED → GL_POSTED`). If workflow is different, adjust Feature 3's acceptance criteria. **Action**: Confirm Invoice status enum with Finance domain lead.
3. **Bank File Testing**: SEPA XML and NACHA ACH file formats are code-generated (Features 14–15). **Action**: Obtain sample files from bank or regulatory body and validate generated output in UAT.
4. **GL Account Mapping**: Features 5, 16 assume a default GL account mapping exists (e.g., "4000 - Revenue" for sales, "2000 - AP Liability" for vendor invoices). If no mapping, GL posting fails. **Action**: Seed default GL accounts in the migration or admin settings.
5. **Financial Period Validation**: Feature 5 checks `currentPeriod.status` to allow/block GL posting. If the period model or state machine is different, adjust error handling.
6. **Performance**: Matching engine (Feature 2) may run slow on > 10K invoices/POs per vendor. Deferred: add caching or async batch matching (background job) in a follow-up phase.

---

## References & Competitor Benchmarks

- **NetSuite**: Accounts Payable > Match Invoices > Matching Rules (vendor-level tolerance, auto-post GL). SuiteAnalytics drill-down on P&L/BS lines.
- **SAP S/4HANA**: Logistics Execution > Goods Receipt > Invoice Verification (LIV) matching PO/GR/Invoice with configurable tolerances. Payment runs (batch) SEPA XML export.
- **Dynamics 365**: Purchase Orders > Purchase Invoices > 3-way matching policies. Drill-down reports (click line → GL transactions).
- **Odoo**: Purchase module > Purchase Orders > Line-level matching. Payment batch export (SEPA, NACHA).

---

**End of Batch Specification.**

