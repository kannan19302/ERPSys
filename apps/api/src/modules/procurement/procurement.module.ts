import { Module } from "@nestjs/common";
import { ProcurementController } from "./procurement.controller";
import { ProcurementPublicController } from "./procurement.public.controller";
import { ProcurementService } from "./procurement.service";
import { ContractsService } from "./contracts.service";
import { ContractsController } from "./contracts.controller";
import { VendorPortalService } from "./vendor-portal.service";

import { ProcurementExpansionController } from "./procurement-expansion.controller";
import { ProcurementIntelligenceController } from "./procurement-intelligence.controller";
import { ProcurementSchedulingController } from "./procurement-scheduling.controller";
import { SubcontractingService } from "./subcontracting.service";
import { DebitNotesService } from "./debit-notes.service";
import { VendorRmaService } from "./vendor-rma.service";
import { SupplierNcrCarService } from "./supplier-ncr-car.service";
import { RfqAuctionsService } from "./rfq-auctions.service";
import { PaymentSchedulesService } from "./payment-schedules.service";
import { SupplierScorecardService } from "./supplier-scorecard.service";
import { ProcurementAnalyticsService } from "./procurement-analytics.service";
import { ProcurementApprovalsService } from "./procurement-approvals.service";
import { ProcurementSourcingService } from "./procurement-sourcing.service";
import { ProcurementSourcingController } from "./procurement-sourcing.controller";
import { ProcurementDeepExpansionBulkController } from "./procurement-deep-expansion-bulk.controller";
import { ProcurementSettingsController } from "./settings.controller";
import { ProcurementEnterpriseController } from "./procurement-enterprise.controller";
import { ProcurementEnterpriseService } from "./procurement-enterprise.service";
import { ProcurementEnterpriseModule } from "./procurement-enterprise.module";
import { SupplierPerformanceService } from "./services/supplier-performance.service";
import { ProcurementSupplierPerformanceController } from "./procurement-supplier-performance.controller";

@Module({
  imports: [ProcurementEnterpriseModule],
  controllers: [
    ProcurementController,
    ProcurementPublicController,
    ContractsController,

    ProcurementExpansionController,
    ProcurementIntelligenceController,
    ProcurementSchedulingController,
    ProcurementSourcingController,
    ProcurementDeepExpansionBulkController,
    ProcurementSettingsController,
    ProcurementEnterpriseController,
    ProcurementSupplierPerformanceController,
  ],
  providers: [
    ProcurementService,
    ContractsService,
    VendorPortalService,
    SubcontractingService,
    DebitNotesService,
    VendorRmaService,
    SupplierNcrCarService,
    RfqAuctionsService,
    PaymentSchedulesService,
    SupplierScorecardService,
    ProcurementAnalyticsService,
    ProcurementApprovalsService,
    ProcurementSourcingService,
    ProcurementEnterpriseService,
    SupplierPerformanceService,
  ],
  exports: [
    ProcurementService,
    ContractsService,
    VendorPortalService,
    SubcontractingService,
    DebitNotesService,
    VendorRmaService,
    SupplierNcrCarService,
    RfqAuctionsService,
    PaymentSchedulesService,
    SupplierScorecardService,
    ProcurementAnalyticsService,
    ProcurementApprovalsService,
    ProcurementSourcingService,
    ProcurementEnterpriseService,
  ],
})
export class ProcurementModule {}
