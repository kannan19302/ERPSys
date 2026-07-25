import { Module } from "@nestjs/common";
import { AdvancedFinanceController } from "./advanced-finance.controller";
import { ArApDeepController } from "./ar-ap-deep.controller";
import { FinanceExpansionDeepController } from "./finance-expansion-deep.controller";
import { FinanceMoreDeepController } from "./finance-more-deep.controller";
import { FinanceTaxJournalDeepController } from "./finance-tax-journal-deep.controller";
import { EInvoiceController } from "./e-invoice.controller";
import { TreasuryDeepController } from "./treasury-deep.controller";
import { SubscriptionBillingController } from "./subscription-billing.controller";
import { FixedAssetDeepController } from "./fixed-asset-deep.controller";
import { Asc606DeepController } from "./asc606-deep.controller";
import { GlobalTaxDeepController } from "./global-tax-deep.controller";
import { FinancialInstrumentsController } from "./financial-instruments.controller";
import { BudgetDeepController } from "./budget-deep.controller";
import { NettingDeepController } from "./netting-deep.controller";
import { WorkingCapitalController } from "./working-capital.controller";
import { CloseManagementController } from "./close-management.controller";
import { ConsolidationV2Controller } from "./consolidation-v2.controller";
import { RiskManagementController } from "./risk-management.controller";
import { EsgAccountingController } from "./esg-accounting.controller";
import { TaxProvisioningController } from "./tax-provisioning.controller";
import { ApAutomationController } from "./ap-automation.controller";
import { AiAnalyticsController } from "./ai-analytics.controller";
import { AdvancedFinanceService } from "./advanced-finance.service";
import { FinanceExpansionDeepService } from "./services/finance-expansion-deep.service";
import {
  GlAccountingService,
  BudgetingService,
  BankingService,
  ExpenseManagementService,
  RevenueRecognitionService,
  TaxEngineService,
  TreasuryService,
  ConsolidationService,
  FinancialReportingService,
  PeriodManagementService,
  PaymentTermsService,
  BankFeedsService,
  CashFlowForecastService,
  InterCompanyService,
  FxRevaluationService,
  PayablesService,
  FpaService,
  InvoiceCaptureService,
  CardSpendLimitService,
  AllocationService,
  BudgetControlService,
  BudgetReallocationService,
  IntercompanyLoansService,
  AssetLifecycleService,
  CashPoolingService,
  ConsolidationDeepService,
  Form1099Service,
  TaxJurisdictionLookupService,
  TaxFilingCalendarService,
  RecurringJournalSchedulerService,
  Asc606DeepService,
  GlobalTaxDeepService,
  FinancialInstrumentsService,
  BudgetDeepService,
  NettingDeepService,
} from "./services";
import { TaxEngineDeepService } from "./services/tax-engine-deep.service";
import { TreasuryDeepService } from "./services/treasury-deep.service";
import { ApIntelligenceService } from "./services/ap-intelligence.service";
import { ArCollectionsService } from "./services/ar-collections.service";
import { FixedAssetDeepService } from "./services/fixed-asset-deep.service";
import { FpaDeepService } from "./services/fpa-deep.service";
import { RevenueBillingService } from "./services/revenue-billing.service";
import { ComplianceControlsService } from "./services/compliance-controls.service";
import { EconomicNexusService } from "./services/economic-nexus.service";
import { WorkingCapitalService } from "./services/working-capital.service";
import { CloseManagementService } from "./services/close-management.service";
import { ConsolidationV2Service } from "./services/consolidation-v2.service";
import { RiskManagementService } from "./services/risk-management.service";
import { EsgAccountingService } from "./services/esg-accounting.service";
import { TaxProvisioningService } from "./services/tax-provisioning.service";
import { ApAutomationService } from "./services/ap-automation.service";
import { AiAnalyticsService } from "./services/ai-analytics.service";

const domainServices = [
  GlAccountingService,
  BudgetingService,
  BankingService,
  CardSpendLimitService,
  ExpenseManagementService,
  RevenueRecognitionService,
  TaxEngineService,
  TreasuryService,
  ConsolidationService,
  FinancialReportingService,
  PeriodManagementService,
  PaymentTermsService,
  BankFeedsService,
  CashFlowForecastService,
  InterCompanyService,
  FxRevaluationService,
  PayablesService,
  FpaService,
  InvoiceCaptureService,
  AllocationService,
  BudgetControlService,
  BudgetReallocationService,
  // Big-phase batch services
  TaxEngineDeepService,
  TreasuryDeepService,
  ApIntelligenceService,
  ArCollectionsService,
  FixedAssetDeepService,
  FpaDeepService,
  RevenueBillingService,
  ComplianceControlsService,
  // New Phase M services
  Asc606DeepService,
  GlobalTaxDeepService,
  FinancialInstrumentsService,
  BudgetDeepService,
  NettingDeepService,
  // Hardening services
  IntercompanyLoansService,
  AssetLifecycleService,
  CashPoolingService,
  ConsolidationDeepService,
  Form1099Service,
  EconomicNexusService,
  FinanceExpansionDeepService,
  TaxJurisdictionLookupService,
  TaxFilingCalendarService,
  RecurringJournalSchedulerService,
  WorkingCapitalService,
  CloseManagementService,
  ConsolidationV2Service,
  RiskManagementService,
  EsgAccountingService,
  TaxProvisioningService,
  ApAutomationService,
  AiAnalyticsService,
];

@Module({
  controllers: [
    AdvancedFinanceController,
    ArApDeepController,
    FinanceExpansionDeepController,
    FinanceMoreDeepController,
    FinanceTaxJournalDeepController,
    EInvoiceController,
    TreasuryDeepController,
    SubscriptionBillingController,
    FixedAssetDeepController,
    Asc606DeepController,
    GlobalTaxDeepController,
    FinancialInstrumentsController,
    BudgetDeepController,
    NettingDeepController,
    WorkingCapitalController,
    CloseManagementController,
    ConsolidationV2Controller,
    RiskManagementController,
    EsgAccountingController,
    TaxProvisioningController,
    ApAutomationController,
    AiAnalyticsController,
  ],
  providers: [AdvancedFinanceService, ...domainServices],
  exports: [AdvancedFinanceService, ...domainServices],
})
export class AdvancedFinanceModule {}
