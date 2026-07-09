import { Module } from '@nestjs/common';
import { AdvancedFinanceController } from './advanced-finance.controller';
import { AdvancedFinanceService } from './advanced-finance.service';
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
} from './services';
import { TaxEngineDeepService } from './services/tax-engine-deep.service';
import { TreasuryDeepService } from './services/treasury-deep.service';
import { ApIntelligenceService } from './services/ap-intelligence.service';
import { ArCollectionsService } from './services/ar-collections.service';
import { FixedAssetDeepService } from './services/fixed-asset-deep.service';
import { FpaDeepService } from './services/fpa-deep.service';
import { RevenueBillingService } from './services/revenue-billing.service';
import { ComplianceControlsService } from './services/compliance-controls.service';

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
];

@Module({
  controllers: [AdvancedFinanceController],
  providers: [AdvancedFinanceService, ...domainServices],
  exports: [AdvancedFinanceService, ...domainServices],
})
export class AdvancedFinanceModule {}

