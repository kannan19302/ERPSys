import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceSettingsController } from "./settings.controller";
import { FinanceService } from "./finance.service";
import { FinanceEventHandler } from "./finance.event-handler";
import { LeaseAccountingService } from "./lease-accounting.service";
import { LeasesController } from "./leases.controller";
import { AppSettingsService } from "../../common/settings/settings.service";
import { FinanceDemoDataService } from "./finance-demo-data.service";
import { ArDeepService } from "./ar-deep.service";
import { ArDeepController } from "./ar-deep.controller";
import { ApDeepService } from "./ap-deep.service";
import { ApDeepController } from "./ap-deep.controller";
import { CloseOpsService } from "./close-ops.service";
import { CloseOpsController } from "./close-ops.controller";
import { ProjectAccountingService } from "./project-accounting.service";
import { ProjectAccountingController } from "./project-accounting.controller";
import { FinanceExpansionService } from "./finance-expansion.service";
import { FinanceExpansionController } from "./finance-expansion.controller";
import { FinanceOperationsService } from "./finance-operations.service";
import { FinanceOperationsController } from "./finance-operations.controller";

@Module({
  controllers: [
    FinanceController,
    LeasesController,
    FinanceSettingsController,
    ArDeepController,
    ApDeepController,
    CloseOpsController,
    ProjectAccountingController,
    FinanceExpansionController,
    FinanceOperationsController,
  ],
  providers: [
    FinanceService,
    FinanceEventHandler,
    LeaseAccountingService,
    FinanceDemoDataService,
    AppSettingsService,
    ArDeepService,
    ApDeepService,
    CloseOpsService,
    ProjectAccountingService,
    FinanceExpansionService,
    FinanceOperationsService,
  ],
  exports: [FinanceService, LeaseAccountingService, FinanceDemoDataService],
})
export class FinanceModule {}
