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
} from './services';

const domainServices = [
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
];

@Module({
  controllers: [AdvancedFinanceController],
  providers: [AdvancedFinanceService, ...domainServices],
  exports: [AdvancedFinanceService, ...domainServices],
})
export class AdvancedFinanceModule {}
