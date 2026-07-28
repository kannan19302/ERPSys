/// Every backend route the app calls, in one place.
///
/// Paths are relative to `Env.apiBaseUrl` (`<origin>/api/v1`). Each constant
/// names the controller it maps to so a backend rename is easy to trace. No
/// endpoint here is new — all of them already exist in `apps/api/src/modules`.
///
/// Generated 2026-07-28 — covers all 44 + backend API modules.
class ApiPaths {
  const ApiPaths._();

  // ── auth (apps/api/src/modules/auth/auth.controller.ts) ──
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String me = '/auth/me';
  static const String tenants = '/auth/tenants';
  static const String switchTenant = '/auth/switch-tenant';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';
  static const String verifyMfaLogin = '/auth/mfa/verify-login';
  static const String mfaPushStatus = '/auth/mfa/push/status';
  static const String sessions = '/auth/sessions';
  static const String revokeOtherSessions = '/auth/sessions/revoke-others';
  static String revokeSession(String id) => '/auth/sessions/$id';
  static const String loginHistory = '/auth/login-history';
  static const String pushSubscribe = '/auth/push/subscribe';
  static const String pushUnsubscribe = '/auth/push/unsubscribe';
  static const String pushDevices = '/auth/push/devices';

  // ── onboarding (apps/api/src/modules/auth/onboarding.controller.ts) ──
  static const String onboarding = '/auth/onboarding';
  static String onboardingComplete(String key) => '/auth/onboarding/complete/$key';
  static const String onboardingSeedDemo = '/auth/onboarding/seed-demo';

  // ── health (apps/api/src/health.controller.ts) ──
  static const String health = '/health';

  // ── inventory (apps/api/src/modules/inventory/inventory.controller.ts) ──
  static const String products = '/inventory/products';
  static const String productStats = '/inventory/products/stats';
  static String product(String id) => '/inventory/products/$id';
  static const String warehouses = '/inventory/warehouses';
  static const String stockLevels = '/inventory/stock-levels';
  static const String productCategories = '/inventory/categories';

  // ── notifications ──
  // Feed: apps/api/src/modules/communication/communication.controller.ts
  // (returns a plain array; status changes go through PUT .../status).
  static const String notifications = '/communication/notifications';
  static String notificationStatus(String id) =>
      '/communication/notifications/$id/status';

  // Preferences: apps/api/src/modules/notifications/notifications-deep.controller.ts
  static const String notificationPreferences = '/notifications/preferences';
  static const String notificationChannels = '/notifications/channels';

  // ── sales (apps/api/src/modules/sales/sales.controller.ts) ──
  static const String quotations = '/sales/quotations';
  static String quotation(String id) => '/sales/quotations/$id';
  static String quotationSubmit(String id) => '/sales/quotations/$id/submit';
  static String quotationAccept(String id) => '/sales/quotations/$id/accept';
  static String quotationConvert(String id) => '/sales/quotations/$id/convert';
  static String quotationSend(String id) => '/sales/quotations/$id/send';
  static const String salesOrders = '/sales/orders';
  static String salesOrder(String id) => '/sales/orders/$id';
  static String salesOrderConfirm(String id) => '/sales/orders/$id/confirm';
  static String salesOrderCancel(String id) => '/sales/orders/$id/cancel';
  static const String deliveryNotes = '/sales/delivery-notes';
  static String deliveryNote(String id) => '/sales/delivery-notes/$id';
  static const String salesReturns = '/sales/returns';
  static String salesReturn(String id) => '/sales/returns/$id';
  static String salesReturnApprove(String id) => '/sales/returns/$id/approve';
  static String salesReturnReject(String id) => '/sales/returns/$id/reject';
  static const String salesPipelines = '/sales/pipelines';
  static String salesPipeline(String id) => '/sales/pipelines/$id';
  static const String opportunities = '/sales/opportunities';
  static String opportunity(String id) => '/sales/opportunities/$id';
  static String opportunityStage(String id) => '/sales/opportunities/$id/stage';
  static String opportunityConvert(String id) => '/sales/opportunities/$id/convert';
  static String opportunityTeam(String id) => '/sales/opportunities/$id/team';
  static String opportunityTeamMember(String id, String userId) => '/sales/opportunities/$id/team/$userId';
  static String opportunityTags(String id) => '/sales/opportunities/$id/tags';
  static String opportunityTag(String id, String tagId) => '/sales/opportunities/$id/tags/$tagId';
  static String opportunityContactRoles(String id) => '/sales/opportunities/$id/contact-roles';
  static const String salesForecast = '/sales/forecast';
  static const String forecastSnapshots = '/sales/forecast-snapshots';
  static const String quotas = '/sales/quotas';
  static const String dealRooms = '/sales/deal-rooms';
  static String dealRoom(String id) => '/sales/deal-rooms/$id';
  static String dealRoomBuyerAccess(String id) => '/sales/deal-rooms/$id/buyer-access';
  static String dealRoomMilestones(String id) => '/sales/deal-rooms/$id/milestones';
  static String dealRoomStakeholders(String id) => '/sales/deal-rooms/$id/stakeholders';
  static String dealRoomDocuments(String id) => '/sales/deal-rooms/$id/documents';
  static const String salesActivity = '/sales/activity';

  // ── crm (apps/api/src/modules/crm/crm.controller.ts) ──
  static const String customers = '/crm/customers';
  static String customer(String id) => '/crm/customers/$id';
  static String customerContacts(String id) => '/crm/customers/$id/contacts';
  static String customerPortalAccess(String id) => '/crm/customers/$id/portal-access';
  static String customerPortalAccessRevoke(String id, String userId) => '/crm/customers/$id/portal-access/$userId';
  static String customerActivities(String id) => '/crm/customers/$id/activities';
  static String customerTimeline(String id) => '/crm/customers/$id/timeline';
  static String customerStats(String id) => '/crm/customers/$id/stats';
  static const String contacts = '/crm/contacts';
  static String contact(String id) => '/crm/contacts/$id';
  static const String leads = '/crm/leads';
  static String lead(String id) => '/crm/leads/$id';
  static String leadConvert(String id) => '/crm/leads/$id/convert';
  static String leadQualify(String id) => '/crm/leads/$id/qualify';
  static String leadDisqualify(String id) => '/crm/leads/$id/disqualify';
  static const String crmPipelines = '/crm/pipelines';
  static String crmPipeline(String id) => '/crm/pipelines/$id';
  static const String crmActivities = '/crm/activities';
  static const String leadSources = '/crm/sources';
  static const String emailTemplates = '/crm/email-templates';
  static String emailTemplate(String id) => '/crm/email-templates/$id';
  static const String crmAccountPlans = '/crm/account-plans';
  static String crmAccountPlan(String id) => '/crm/account-plans/$id';
  static const String crmHealthLogs = '/crm/health-logs';

  // ── finance (apps/api/src/modules/finance/finance.controller.ts) ──
  static const String invoices = '/finance/invoices';
  static String invoice(String id) => '/finance/invoices/$id';
  static String invoiceSubmit(String id) => '/finance/invoices/$id/submit';
  static String invoiceCancel(String id) => '/finance/invoices/$id/cancel';
  static const String payments = '/finance/payments';
  static String payment(String id) => '/finance/payments/$id';
  static const String creditNotes = '/finance/credit-notes';
  static String creditNote(String id) => '/finance/credit-notes/$id';
  static const String debitNotes = '/finance/debit-notes';
  static const String dunningRun = '/finance/dunning/run';
  static const String dunningLogs = '/finance/dunning/logs';
  static const String arAging = '/finance/reports/ar-aging';
  static const String glReport = '/finance/reports/gl';
  static const String trialBalance = '/finance/reports/trial-balance';
  static const String pnlReport = '/finance/reports/pnl';
  static const String balanceSheet = '/finance/reports/balance-sheet';
  static const String taxRates = '/finance/tax-rates';
  static String taxRate(String id) => '/finance/tax-rates/$id';
  static const String recurringTemplates = '/finance/recurring-templates';
  static String recurringTemplateTrigger(String id) => '/finance/recurring-templates/$id/trigger';
  static const String statements = '/finance/statements';
  static const String currencies = '/finance/currencies';
  static const String exchangeRates = '/finance/exchange-rates';
  static const String paymentSchedules = '/finance/payment-schedules';
  static const String paymentRuns = '/finance/payment-runs';
  static String paymentRun(String id) => '/finance/payment-runs/$id';
  static const String budgets = '/finance/budgets';
  static String budget(String id) => '/finance/budgets/$id';
  static String budgetVsActuals(String id) => '/finance/budgets/$id/vs-actuals';
  static const String bankReconciliationImport = '/finance/bank-reconciliation/import';
  static const String bankReconciliationTransactions = '/finance/bank-reconciliation/transactions';
  static const String bankReconciliationMatch = '/finance/bank-reconciliation/match';
  static const String bankReconciliationConfirm = '/finance/bank-reconciliation/confirm';
  static const String forecastScenarios = '/finance/forecast/scenarios';
  static String forecastScenario(String id) => '/finance/forecast/scenarios/$id';
  static const String taxFilings = '/finance/tax-filings';
  static String taxFiling(String id) => '/finance/tax-filings/$id';
  static String taxFilingSubmit(String id) => '/finance/tax-filings/$id/submit';
  static const String form1099 = '/finance/1099';
  static const String form1099Generate = '/finance/1099/generate';
  static const String intercompanyTransfers = '/finance/intercompany-transfers';
  static String intercompanyTransfer(String id) => '/finance/intercompany-transfers/$id';
  static const String investmentPortfolios = '/finance/investment-portfolios';
  static String investmentPortfolio(String id) => '/finance/investment-portfolios/$id';
  static String investmentPortfolioTransactions(String id) => '/finance/investment-portfolios/$id/transactions';
  static const String treasuryTransactions = '/finance/treasury/transactions';
  static String treasuryTransaction(String id) => '/finance/treasury/transactions/$id';
  static const String journalEntries = '/finance/journal-entries';
  static String journalEntry(String id) => '/finance/journal-entries/$id';
  static String journalEntryPost(String id) => '/finance/journal-entries/$id/post';
  static const String chartOfAccounts = '/finance/chart-of-accounts';

  // ── hr (apps/api/src/modules/hr/hr.controller.ts) ──
  static const String employees = '/hr/employees';
  static String employee(String id) => '/hr/employees/$id';
  static const String departments = '/hr/departments';
  static String department(String id) => '/hr/departments/$id';
  static const String leaveTypes = '/hr/leave-types';
  static String leaveType(String id) => '/hr/leave-types/$id';
  static const String leaveRequests = '/hr/leave-requests';
  static String leaveRequest(String id) => '/hr/leave-requests/$id';
  static String leaveRequestApprove(String id) => '/hr/leave-requests/$id/approve';
  static String leaveRequestReject(String id) => '/hr/leave-requests/$id/reject';
  static const String attendance = '/hr/attendance';
  static String attendanceRecord(String id) => '/hr/attendance/$id';
  static const String timesheets = '/hr/timesheets';
  static String timesheet(String id) => '/hr/timesheets/$id';
  static String timesheetSubmit(String id) => '/hr/timesheets/$id/submit';
  static String timesheetApprove(String id) => '/hr/timesheets/$id/approve';
  static const String payrollRun = '/hr/payroll/run';
  static const String payrollRuns = '/hr/payroll/runs';
  static String payrollRunDetail(String id) => '/hr/payroll/runs/$id';
  static String payrollRunReverse(String id) => '/hr/payroll/runs/$id/reverse';
  static String payrollRunJournalize(String id) => '/hr/payroll/runs/$id/journalize';
  static const String payslips = '/hr/payroll/slips';
  static String payslip(String id) => '/hr/payroll/slips/$id';
  static const String salaryStructures = '/hr/payroll/structures';
  static String salaryStructure(String id) => '/hr/payroll/structures/$id';
  static const String performanceReviews = '/hr/performance-reviews';
  static String performanceReview(String id) => '/hr/performance-reviews/$id';
  static String performanceReviewSubmit(String id) => '/hr/performance-reviews/$id/submit';
  static const String training = '/hr/training';
  static String trainingDetail(String id) => '/hr/training/$id';
  static String trainingEnroll(String id) => '/hr/training/$id/enroll';
  static String trainingComplete(String id) => '/hr/training/$id/complete';
  static const String orgChart = '/hr/org-chart';
  static const String hrDashboard = '/hr/dashboard/hr-summary';

  // ── procurement (apps/api/src/modules/procurement/procurement.controller.ts) ──
  static const String purchaseOrders = '/procurement/purchase-orders';
  static String purchaseOrder(String id) => '/procurement/purchase-orders/$id';
  static String purchaseOrderSubmit(String id) => '/procurement/purchase-orders/$id/submit';
  static String purchaseOrderApprove(String id) => '/procurement/purchase-orders/$id/approve';
  static String purchaseOrderReceive(String id) => '/procurement/purchase-orders/$id/receive';
  static String purchaseOrderCancel(String id) => '/procurement/purchase-orders/$id/cancel';
  static const String purchaseReceipts = '/procurement/purchase-receipts';
  static String purchaseReceipt(String id) => '/procurement/purchase-receipts/$id';
  static const String vendors = '/procurement/vendors';
  static String vendor(String id) => '/procurement/vendors/$id';
  static const String rfqs = '/procurement/rfqs';
  static String rfq(String id) => '/procurement/rfqs/$id';
  static String rfqSubmit(String id) => '/procurement/rfqs/$id/submit';
  static String rfqClose(String id) => '/procurement/rfqs/$id/close';
  static const String supplierQuotations = '/procurement/supplier-quotations';
  static String supplierQuotation(String id) => '/procurement/supplier-quotations/$id';
  static String supplierQuotationApprove(String id) => '/procurement/supplier-quotations/$id/approve';
  static String supplierQuotationReject(String id) => '/procurement/supplier-quotations/$id/reject';
  static String supplierQuotationConvert(String id) => '/procurement/supplier-quotations/$id/convert';
  static const String purchaseRequisitions = '/procurement/requisitions';
  static String purchaseRequisition(String id) => '/procurement/requisitions/$id';
  static String purchaseRequisitionApprove(String id) => '/procurement/requisitions/$id/approve';
  static const String blanketAgreements = '/procurement/blanket-agreements';
  static String blanketAgreement(String id) => '/procurement/blanket-agreements/$id';
  static const String purchaseReturns = '/procurement/returns';
  static const String vendorRma = '/procurement/vendor-rma';
  static String vendorRmaDetail(String id) => '/procurement/vendor-rma/$id';
  static String vendorRmaReceive(String id) => '/procurement/vendor-rma/$id/receive';
  static const String subcontracting = '/procurement/subcontracting';
  static String subcontractingDetail(String id) => '/procurement/subcontracting/$id';
  static String subcontractingComplete(String id) => '/procurement/subcontracting/$id/complete';
  static const String supplierScorecards = '/procurement/supplier-scorecards';
  static String supplierScorecard(String id) => '/procurement/supplier-scorecards/$id';
  static const String supplierContracts = '/procurement/contracts';
  static String supplierContract(String id) => '/procurement/contracts/$id';
  static String supplierContractRenew(String id) => '/procurement/contracts/$id/renew';
  static const String supplierAssessments = '/procurement/supplier-assessments';
  static String supplierAssessment(String id) => '/procurement/supplier-assessments/$id';

  // ── supply-chain (apps/api/src/modules/supply-chain/supply-chain.controller.ts) ──
  static const String shipments = '/supply-chain/shipments';
  static String shipment(String id) => '/supply-chain/shipments/$id';
  static String shipmentTrack(String id) => '/supply-chain/shipments/$id/track';
  static String shipmentDeliver(String id) => '/supply-chain/shipments/$id/deliver';
  static const String carriers = '/supply-chain/carriers';
  static String carrier(String id) => '/supply-chain/carriers/$id';
  static const String demandForecast = '/supply-chain/demand-forecast';
  static const String demandForecastGenerate = '/supply-chain/demand-forecast/generate';
  static String demandForecastPromote(String id) => '/supply-chain/demand-forecast/$id/promote';
  static const String reorderCalculate = '/supply-chain/reorder/calculate';
  static const String reorderGenerate = '/supply-chain/reorder/generate-orders';
  static const String reorderSuggestions = '/supply-chain/reorder/suggestions';
  static String reorderSuggestionApprove(String id) => '/supply-chain/reorder/suggestions/$id/approve';
  static const String routesOptimize = '/supply-chain/routes/optimize';
  static const String supplyChainRoutes = '/supply-chain/routes';
  static String supplyChainRoute(String id) => '/supply-chain/routes/$id';
  static const String crossDockPlan = '/supply-chain/cross-dock/plan';
  static const String crossDockPlans = '/supply-chain/cross-dock/plans';
  static const String dockAppointments = '/supply-chain/dock-appointments';
  static String dockAppointment(String id) => '/supply-chain/dock-appointments/$id';
  static String dockAppointmentCheckin(String id) => '/supply-chain/dock-appointments/$id/checkin';
  static String dockAppointmentComplete(String id) => '/supply-chain/dock-appointments/$id/complete';
  static const String warehouseTransfers = '/supply-chain/warehouse-transfer';
  static String warehouseTransfer(String id) => '/supply-chain/warehouse-transfer/$id';
  static String warehouseTransferComplete(String id) => '/supply-chain/warehouse-transfer/$id/complete';
  static String warehouseTransferApprove(String id) => '/supply-chain/warehouse-transfer/$id/approve';

  // ── pos (apps/api/src/modules/pos/pos.controller.ts) ──
  static const String posOrders = '/pos/orders';
  static String posOrder(String id) => '/pos/orders/$id';
  static String posOrderVoid(String id) => '/pos/orders/$id/void';
  static String posOrderHold(String id) => '/pos/orders/$id/hold';
  static const String posTerminals = '/pos/terminals';
  static String posTerminal(String id) => '/pos/terminals/$id';
  static const String posRegisters = '/pos/registers';
  static String posRegister(String id) => '/pos/registers/$id';
  static String posRegisterOpen(String id) => '/pos/registers/$id/open';
  static String posRegisterClose(String id) => '/pos/registers/$id/close';
  static const String posShifts = '/pos/shifts';
  static String posShift(String id) => '/pos/shifts/$id';
  static String posShiftClose(String id) => '/pos/shifts/$id/close';
  static const String posDiscounts = '/pos/discounts';
  static const String posLoyaltyPrograms = '/pos/loyalty-programs';
  static const String posLoyaltyMembers = '/pos/loyalty-members';
  static const String posCoupons = '/pos/coupons';
  static const String posGiftCards = '/pos/gift-cards';
  static const String posReturns = '/pos/returns';
  static String posReturn(String id) => '/pos/returns/$id';
  static String posReturnApprove(String id) => '/pos/returns/$id/approve';
  static String posReturnRefund(String id) => '/pos/returns/$id/refund';
  static const String posTaxProfiles = '/pos/tax-profiles';
  static const String posPriceLists = '/pos/price-lists';
  static String posPriceListItem(String id) => '/pos/price-list-items/$id';
  static const String posPromotions = '/pos/promotions';
  static const String posCashEntries = '/pos/cash-entries';
  static const String posOpenTabs = '/pos/open-tabs';
  static String posOpenTab(String id) => '/pos/open-tabs/$id';
  static String posOpenTabClose(String id) => '/pos/open-tabs/$id/close';
  static String posOpenTabAddItems(String id) => '/pos/open-tabs/$id/add-items';
  static const String posLayaway = '/pos/layaway';
  static String posLayawayDetail(String id) => '/pos/layaway/$id';
  static String posLayawayPayment(String id) => '/pos/layaway/$id/payment';
  static const String posQuickKeys = '/pos/quick-keys';

  // ── manufacturing (apps/api/src/modules/manufacturing/manufacturing.controller.ts) ──
  static const String boms = '/manufacturing/boms';
  static String bom(String id) => '/manufacturing/boms/$id';
  static String bomExplode(String id) => '/manufacturing/boms/$id/explode';
  static const String workOrders = '/manufacturing/work-orders';
  static String workOrder(String id) => '/manufacturing/work-orders/$id';
  static String workOrderStart(String id) => '/manufacturing/work-orders/$id/start';
  static String workOrderComplete(String id) => '/manufacturing/work-orders/$id/complete';
  static String workOrderCancel(String id) => '/manufacturing/work-orders/$id/cancel';
  static String workOrderConsume(String id) => '/manufacturing/work-orders/$id/consume';
  static String workOrderProduce(String id) => '/manufacturing/work-orders/$id/produce';
  static const String mrpRun = '/manufacturing/mrp/run';
  static const String mrpRuns = '/manufacturing/mrp/runs';
  static const String mrpPlannedOrders = '/manufacturing/mrp/planned-orders';
  static String mrpPlannedOrderRelease(String id) => '/manufacturing/mrp/planned-orders/$id/release';
  static const String workstations = '/manufacturing/workstations';
  static String workstation(String id) => '/manufacturing/workstations/$id';
  static const String routings = '/manufacturing/routings';
  static String routing(String id) => '/manufacturing/routings/$id';
  static const String qualityInspections = '/manufacturing/quality-inspections';
  static String qualityInspection(String id) => '/manufacturing/quality-inspections/$id';
  static String qualityInspectionVerify(String id) => '/manufacturing/quality-inspections/$id/verify';
  static const String eco = '/manufacturing/eco';
  static String ecoDetail(String id) => '/manufacturing/eco/$id';
  static String ecoApprove(String id) => '/manufacturing/eco/$id/approve';
  static const String ncr = '/manufacturing/ncr';
  static String ncrDetail(String id) => '/manufacturing/ncr/$id';
  static String ncrDisposition(String id) => '/manufacturing/ncr/$id/disposition';
  static const String productionDashboard = '/manufacturing/production-dashboard';

  // ── projects (apps/api/src/modules/projects/projects.controller.ts) ──
  static const String projects = '/projects';
  static String project(String id) => '/projects/$id';
  static String projectTasks(String id) => '/projects/$id/tasks';
  static String projectMilestones(String id) => '/projects/$id/milestones';
  static String projectGantt(String id) => '/projects/$id/gantt';
  static String projectBudgets(String id) => '/projects/$id/budgets';
  static String projectRisks(String id) => '/projects/$id/risks';
  static String projectChangeRequests(String id) => '/projects/$id/change-requests';
  static String projectCosts(String id) => '/projects/$id/costs';
  static String projectTeam(String id) => '/projects/$id/team';
  static String projectEVM(String id) => '/projects/$id/evm';
  static String projectEVMForecast(String id) => '/projects/$id/evm/forecast';
  static String projectDocuments(String id) => '/projects/$id/documents';
  static String projectActivities(String id) => '/projects/$id/activities';
  static String projectWiki(String id) => '/projects/$id/wiki';
  static String projectDiscussions(String id) => '/projects/$id/discussions';
  static String projectStageGate(String id) => '/projects/$id/stage-gate';
  static const String tasks = '/projects/tasks';
  static String taskDetail(String id) => '/projects/tasks/$id';
  static const String milestones = '/projects/milestones';
  static String milestoneDetail(String id) => '/projects/milestones/$id';
  static const String projectTimesheets = '/projects/timesheets';
  static String projectTimesheetApprove(String id) => '/projects/timesheets/$id/approve';
  static const String projectBudgetsCreate = '/projects/budgets';
  static const String projectPortfolios = '/projects/portfolios';
  static String projectPortfolio(String id) => '/projects/portfolios/$id';
  static String projectPortfolioMembers(String id) => '/projects/portfolios/$id/members';
  static const String projectDashboard = '/projects/dashboard/project-summary';

  // ── documents (apps/api/src/modules/documents/drive.controller.ts) ──
  static const String folders = '/documents/folders';
  static String folder(String id) => '/documents/folders/$id';
  static String folderShare(String id) => '/documents/folders/$id/share';
  static const String documents = '/documents/documents';
  static String document(String id) => '/documents/documents/$id';
  static String documentVersions(String id) => '/documents/documents/$id/versions';
  static String documentShare(String id) => '/documents/documents/$id/share';
  static String documentSign(String id) => '/documents/documents/$id/sign';
  static String documentApprove(String id) => '/documents/documents/$id/approve';
  static String documentStar(String id) => '/documents/documents/$id/star';
  static String documentLegalHold(String id) => '/documents/documents/$id/legal-hold';
  static const String documentTemplates = '/documents/templates';
  static String documentTemplateGenerate(String id) => '/documents/templates/$id/generate';
  static const String documentCategories = '/documents/categories';
  static const String documentAuditLog = '/documents/audit-log';

  // ── communication (apps/api/src/modules/communication/communication.controller.ts) ──
  static const String channels = '/communication/channels';
  static String channel(String id) => '/communication/channels/$id';
  static String channelJoin(String id) => '/communication/channels/$id/join';
  static String channelLeave(String id) => '/communication/channels/$id/leave';
  static String channelMembers(String id) => '/communication/channels/$id/members';
  static String channelMember(String id, String userId) => '/communication/channels/$id/members/$userId';
  static String channelMessages(String id) => '/communication/channels/$id/messages';
  static String message(String id) => '/communication/messages/$id';
  static String messageReact(String id) => '/communication/messages/$id/react';
  static String messageReaction(String id, String emoji) => '/communication/messages/$id/react/$emoji';
  static String messageBookmark(String id) => '/communication/messages/$id/bookmark';
  static String messageReply(String id) => '/communication/messages/$id/reply';
  static String messageForward(String id) => '/communication/messages/$id/forward';
  static const String directMessages = '/communication/direct-messages';
  static const String spaces = '/communication/spaces';
  static String space(String id) => '/communication/spaces/$id';
  static const String presence = '/communication/presence';
  static const String meetings = '/communication/meetings';
  static String meetingByCode(String code) => '/communication/meetings/$code';
  static String meeting(String id) => '/communication/meetings/$id';
  static String meetingJoin(String id) => '/communication/meetings/$id/join';
  static String meetingLeave(String id) => '/communication/meetings/$id/leave';
  static String meetingEnd(String id) => '/communication/meetings/$id/end';
  static String meetingRecordingStart(String id) => '/communication/meetings/$id/recording/start';
  static String meetingRecordingStop(String id) => '/communication/meetings/$id/recording/stop';
  static String meetingSummary(String id) => '/communication/meetings/$id/summary';
  static const String polls = '/communication/polls';
  static String pollVote(String id) => '/communication/polls/$id/vote';
  static String pollClose(String id) => '/communication/polls/$id/close';
  static const String communicationSearch = '/communication/search';
  static String sharedFile(String id) => '/communication/files/$id';
  static const String communicationTabs = '/communication/tabs';
  static String communicationTab(String id) => '/communication/tabs/$id';
  static const String bots = '/communication/bots';
  static String bot(String id) => '/communication/bots/$id';
  static const String statusSchedules = '/communication/schedules';
  static const String communicationAnalytics = '/communication/analytics';
  static const String channelTemplates = '/communication/templates';
  static const String customEmoji = '/communication/custom-emoji';

  // ── workflow (apps/api/src/modules/workflow/workflow.controller.ts) ──
  static const String workflowDefinitions = '/workflow/definitions';
  static String workflowDefinition(String id) => '/workflow/definitions/$id';
  static String workflowDefinitionActivate(String id) => '/workflow/definitions/$id/activate';
  static String workflowDefinitionDeactivate(String id) => '/workflow/definitions/$id/deactivate';
  static const String workflowInstances = '/workflow/instances';
  static String workflowInstance(String id) => '/workflow/instances/$id';
  static String workflowInstanceStep(String id) => '/workflow/instances/$id/step';
  static String workflowInstanceAdvance(String id) => '/workflow/instances/$id/advance';
  static String workflowInstanceCancel(String id) => '/workflow/instances/$id/cancel';
  static const String workflowTasks = '/workflow/tasks';
  static String workflowTaskApprove(String id) => '/workflow/tasks/$id/approve';
  static String workflowTaskReject(String id) => '/workflow/tasks/$id/reject';
  static String workflowTaskDelegate(String id) => '/workflow/tasks/$id/delegate';
  static String workflowTaskEscalate(String id) => '/workflow/tasks/$id/escalate';
  static const String slaRules = '/workflow/sla-rules';
  static String slaRule(String id) => '/workflow/sla-rules/$id';
  static const String escalationRules = '/workflow/escalation-rules';
  static String escalationRule(String id) => '/workflow/escalation-rules/$id';
  static const String workflowAuditLog = '/workflow/audit-log';
  static const String workflowDashboardStats = '/workflow/dashboard/stats';

  // ── analytics (apps/api/src/modules/analytics/analytics.controller.ts) ──
  static const String analyticsKpi = '/analytics/kpis';
  static String analyticsKpiDetail(String id) => '/analytics/kpis/$id';
  static const String analyticsDashboards = '/analytics/dashboards';
  static String analyticsDashboard(String id) => '/analytics/dashboards/$id';
  static const String analyticsReports = '/analytics/reports';
  static String analyticsReport(String id) => '/analytics/reports/$id';
  static const String analyticsPipelines = '/analytics/pipelines';
  static const String analyticsPredictive = '/analytics/predictive';
  static const String analyticsExports = '/analytics/exports';

  // ── reporting (apps/api/src/modules/reporting/reporting.controller.ts) ──
  static const String reportTemplates = '/reporting/templates';
  static String reportTemplate(String id) => '/reporting/templates/$id';
  static String reportTemplateGenerate(String id) => '/reporting/templates/$id/generate';
  static const String reportJobs = '/reporting/jobs';
  static String reportJob(String id) => '/reporting/jobs/$id';
  static const String reportExports = '/reporting/exports';
  static String reportExport(String id) => '/reporting/exports/$id';
  static const String reportCompliance = '/reporting/compliance';

  // ── ai (apps/api/src/modules/ai/ai.controller.ts) ──
  static const String aiModels = '/ai/models';
  static String aiModel(String id) => '/ai/models/$id';
  static const String aiPrompts = '/ai/prompts';
  static String aiPrompt(String id) => '/ai/prompts/$id';
  static const String aiTrainingData = '/ai/training';
  static String aiTrainingDataItem(String id) => '/ai/training/$id';
  static const String aiPredict = '/ai/predict';

  // ── healthcare (apps/api/src/modules/healthcare/healthcare.controller.ts) ──
  static const String patients = '/healthcare/patients';
  static String patient(String id) => '/healthcare/patients/$id';
  static const String appointments = '/healthcare/appointments';
  static String appointment(String id) => '/healthcare/appointments/$id';
  static const String prescriptions = '/healthcare/prescriptions';
  static String prescription(String id) => '/healthcare/prescriptions/$id';
  static const String labOrders = '/healthcare/lab-orders';
  static String labOrder(String id) => '/healthcare/lab-orders/$id';
  static const String medicalRecords = '/healthcare/medical-records';
  static String medicalRecord(String id) => '/healthcare/medical-records/$id';
  static const String insuranceClaims = '/healthcare/insurance-claims';
  static String insuranceClaim(String id) => '/healthcare/insurance-claims/$id';

  // ── education (apps/api/src/modules/education/education.controller.ts) ──
  static const String students = '/education/students';
  static String student(String id) => '/education/students/$id';
  static const String courses = '/education/courses';
  static String course(String id) => '/education/courses/$id';
  static const String enrollments = '/education/enrollments';
  static String enrollment(String id) => '/education/enrollments/$id';
  static const String gradebook = '/education/gradebook';
  static const String educationFees = '/education/fees';
  static String educationFeeInvoice(String id) => '/education/fees/$id';
  static const String attendanceRecords = '/education/attendance';
  static const String exams = '/education/exams';
  static String examResult(String id) => '/education/exams/$id/results';

  // ── real-estate (apps/api/src/modules/real-estate/real-estate.controller.ts) ──
  static const String properties = '/real-estate/properties';
  static String property(String id) => '/real-estate/properties/$id';
  static const String leases = '/real-estate/leases';
  static String lease(String id) => '/real-estate/leases/$id';
  static const String realEstateTenants = '/real-estate/tenants';
  static String realEstateTenantDetail(String id) => '/real-estate/tenants/$id';
  static const String maintenanceOrders = '/real-estate/maintenance-orders';
  static String maintenanceOrder(String id) => '/real-estate/maintenance-orders/$id';
  static const String propertyValuations = '/real-estate/valuations';

  // ── field-service (apps/api/src/modules/field-service/field-service.controller.ts) ──
  static const String serviceTickets = '/field-service/tickets';
  static String serviceTicket(String id) => '/field-service/tickets/$id';
  static const String technicians = '/field-service/technicians';
  static String technician(String id) => '/field-service/technicians/$id';
  static const String serviceSchedules = '/field-service/schedules';
  static String serviceSchedule(String id) => '/field-service/schedules/$id';
  static const String serviceContracts = '/field-service/contracts';
  static String serviceContract(String id) => '/field-service/contracts/$id';

  // ── people (apps/api/src/modules/people/people.controller.ts) ──
  static const String peopleDirectory = '/people/directory';
  static String person(String id) => '/people/directory/$id';
  static const String peopleTeams = '/people/teams';
  static String peopleTeam(String id) => '/people/teams/$id';
  static const String peopleOnboardingTasks = '/people/onboarding-tasks';
  static String peopleOnboardingTask(String id) => '/people/onboarding-tasks/$id';
  static const String peopleRecognition = '/people/recognition';
  static String peopleRecognitionEntry(String id) => '/people/recognition/$id';

  // ── fixed-assets (apps/api/src/modules/fixed-assets/fixed-assets.controller.ts) ──
  static const String fixedAssets = '/fixed-assets/assets';
  static String fixedAsset(String id) => '/fixed-assets/assets/$id';
  static const String assetDepreciation = '/fixed-assets/depreciation';
  static const String assetMaintenance = '/fixed-assets/maintenance';
  static String assetMaintenanceSchedule(String id) => '/fixed-assets/maintenance/$id';
  static const String assetDisposals = '/fixed-assets/disposals';
  static String assetDisposal(String id) => '/fixed-assets/disposals/$id';

  // ── advanced-finance (apps/api/src/modules/advanced-finance/advanced-finance.controller.ts) ──
  static const String multiCurrencyRates = '/advanced-finance/currency-rates';
  static const String consolidationReports = '/advanced-finance/consolidation';
  static const String intercompanyAgreements = '/advanced-finance/intercompany-agreements';
  static const String costAllocations = '/advanced-finance/cost-allocations';
  static const String revenueRecognition = '/advanced-finance/revenue-recognition';
  static const String fixedAssetAccounting = '/advanced-finance/fixed-asset-accounting';
  static String fixedAssetAcct(String id) => '/advanced-finance/fixed-asset-accounting/$id';
  static const String budgetVersions = '/advanced-finance/budget-versions';
  static const String financialCloseTasks = '/advanced-finance/close-tasks';
  static const String auditTrails = '/advanced-finance/audit-trails';

  // ── advanced-hr (apps/api/src/modules/advanced-hr/advanced-hr.controller.ts) ──
  static const String compensationBands = '/advanced-hr/compensation-bands';
  static const String benefitsAdministration = '/advanced-hr/benefits';
  static String benefitPlan(String id) => '/advanced-hr/benefits/$id';
  static const String successionPlans = '/advanced-hr/succession';
  static String successionPlan(String id) => '/advanced-hr/succession/$id';
  static const String workforceAnalytics = '/advanced-hr/workforce-analytics';
  static const String learningPaths = '/advanced-hr/learning-paths';
  static String learningPath(String id) => '/advanced-hr/learning-paths/$id';

  // ── blockchain (apps/api/src/modules/blockchain/blockchain.controller.ts) ──
  static const String blockchainExplorer = '/blockchain/explorer';
  static const String blockchainContracts = '/blockchain/contracts';
  static String blockchainContract(String id) => '/blockchain/contracts/$id';
  static const String blockchainAudit = '/blockchain/audit';
  static const String blockchainNetworkHealth = '/blockchain/network-health';

  // ── marketplace (apps/api/src/modules/marketplace/marketplace.controller.ts) ──
  static const String marketplaceApps = '/marketplace/apps';
  static String marketplaceApp(String id) => '/marketplace/apps/$id';
  static const String marketplaceReviews = '/marketplace/reviews';
  static String marketplaceReview(String id) => '/marketplace/reviews/$id';
  static const String marketplaceVersions = '/marketplace/versions';
  static const String marketplaceSubmissions = '/marketplace/submissions';
  static String marketplaceSubmission(String id) => '/marketplace/submissions/$id';

  // ── api-platform (apps/api/src/modules/api-platform/api-platform.controller.ts) ──
  static const String apiKeys = '/api-platform/keys';
  static String apiKey(String id) => '/api-platform/keys/$id';
  static const String webhooks = '/api-platform/webhooks';
  static String webhook(String id) => '/api-platform/webhooks/$id';
  static const String apiUsageLogs = '/api-platform/usage-logs';
  static const String apiRateLimits = '/api-platform/rate-limits';

  // ── builder (apps/api/src/modules/builder/builder.controller.ts) ──
  static const String builderForms = '/builder/forms';
  static String builderForm(String id) => '/builder/forms/$id';
  static const String builderPages = '/builder/pages';
  static String builderPage(String id) => '/builder/pages/$id';
  static const String builderWorkflows = '/builder/workflows';
  static String builderWorkflow(String id) => '/builder/workflows/$id';
  static const String builderTemplates = '/builder/templates';
  static String builderTemplate(String id) => '/builder/templates/$id';

  // ── ecommerce (apps/api/src/modules/ecommerce/ecommerce.controller.ts) ──
  static const String ecommerceProducts = '/ecommerce/products';
  static String ecommerceProduct(String id) => '/ecommerce/products/$id';
  static const String ecommerceCategories = '/ecommerce/categories';
  static String ecommerceCategory(String id) => '/ecommerce/categories/$id';
  static const String ecommerceOrders = '/ecommerce/orders';
  static String ecommerceOrder(String id) => '/ecommerce/orders/$id';
  static const String ecommerceCart = '/ecommerce/cart';
  static const String ecommerceCheckout = '/ecommerce/checkout';

  // ── service-management (apps/api/src/modules/service-management/sm.controller.ts) ──
  static const String serviceCatalogs = '/service-management/catalogs';
  static String serviceCatalog(String id) => '/service-management/catalogs/$id';
  static const String serviceRequests = '/service-management/requests';
  static String serviceRequest(String id) => '/service-management/requests/$id';
  static const String serviceContractsMgmt = '/service-management/contracts';
  static String serviceContractMgmt(String id) => '/service-management/contracts/$id';
  static const String serviceLevelAgreements = '/service-management/slas';
  static String serviceLevelAgreement(String id) => '/service-management/slas/$id';

  // ── saas (apps/api/src/modules/saas/saas.controller.ts) ──
  static const String saasPlans = '/saas/plans';
  static String saasPlan(String id) => '/saas/plans/$id';
  static const String saasSubscriptions = '/saas/subscriptions';
  static String saasSubscription(String id) => '/saas/subscriptions/$id';
  static const String saasInvoices = '/saas/invoices';
  static String saasInvoice(String id) => '/saas/invoices/$id';
  static const String saasUsage = '/saas/usage';
  static const String saasQuotas = '/saas/quotas';
  static const String saasTenants = '/saas/tenants';
  static String saasTenant(String id) => '/saas/tenants/$id';
  static const String saasMetering = '/saas/metering';
  static const String saasWhiteLabel = '/saas/white-label';
  static const String saasResellers = '/saas/resellers';

  // ── saas-portal (apps/api/src/modules/saas-portal/saas-portal.controller.ts) ──
  static const String portalBilling = '/saas-portal/billing';
  static const String portalPlans = '/saas-portal/plans';
  static const String portalSupport = '/saas-portal/support';
  static String portalTicket(String id) => '/saas-portal/support/$id';

  // ── saved-views (apps/api/src/modules/saved-views/saved-views.controller.ts) ──
  static const String savedViews = '/saved-views';
  static String savedView(String id) => '/saved-views/$id';
  static const String savedViewShares = '/saved-views/shares';

  // ── search (apps/api/src/modules/search/search.controller.ts) ──
  static const String searchQuery = '/search';
  static const String searchIndexConfig = '/search/index-config';
  static const String searchSynonyms = '/search/synonyms';
  static String searchSynonym(String id) => '/search/synonyms/$id';

  // ── storage (apps/api/src/modules/storage/storage.controller.ts) ──
  static const String storageBuckets = '/storage/buckets';
  static String storageBucket(String id) => '/storage/buckets/$id';
  static const String storageFiles = '/storage/files';
  static String storageFile(String id) => '/storage/files/$id';
  static const String storagePolicies = '/storage/policies';
  static String storagePolicy(String id) => '/storage/policies/$id';

  // ── subscriptions (apps/api/src/modules/subscriptions/subscriptions.controller.ts) ──
  static const String subscriptionPlans = '/subscriptions/plans';
  static String subscriptionPlan(String id) => '/subscriptions/plans/$id';
  static const String subscriptionBilling = '/subscriptions/billing';
  static String subscriptionBillingCycle(String id) => '/subscriptions/billing/$id';
  static const String subscriptionUsage = '/subscriptions/usage';
  static const String subscriptionChurn = '/subscriptions/churn';
  static const String subscriptionAnalytics = '/subscriptions/analytics';

  // ── pwa (apps/api/src/modules/pwa/pwa.controller.ts) ──
  static const String pwaPushSubscriptions = '/pwa/push-subscriptions';
  static const String pwaManifest = '/pwa/manifest';
  static const String pwaServiceWorker = '/pwa/service-worker';
  static const String pwaOfflineQueue = '/pwa/offline-queue';
  static String pwaOfflineQueueItem(String id) => '/pwa/offline-queue/$id';

  // ── localization (apps/api/src/modules/localization/localization.controller.ts) ──
  static const String localizationTranslations = '/localization/translations';
  static const String localizationLanguages = '/localization/languages';
  static const String localizationRegions = '/localization/regions';

  // ── admin (apps/api/src/modules/admin/admin.controller.ts) ──
  static const String adminUsers = '/admin/users';
  static String adminUser(String id) => '/admin/users/$id';
  static const String adminRoles = '/admin/roles';
  static String adminRole(String id) => '/admin/roles/$id';
  static const String adminSettings = '/admin/settings';
  static const String adminAuditLog = '/admin/audit-log';
  static const String adminSystemHealth = '/admin/system-health';

  // ── drive (apps/api/src/modules/drive/drive.controller.ts) ──
  static const String driveFiles = '/drive/files';
  static String driveFile(String id) => '/drive/files/$id';
  static const String driveFolders = '/drive/folders';
  static String driveFolder(String id) => '/drive/folders/$id';
  static String driveFolderShare(String id) => '/drive/folders/$id/share';
  static const String driveTrash = '/drive/trash';
  static String driveTrashRestore(String id) => '/drive/trash/$id/restore';
  static const String driveStorageUsage = '/drive/storage-usage';
  static const String driveTags = '/drive/tags';
  static String driveTag(String id) => '/drive/tags/$id';
}
