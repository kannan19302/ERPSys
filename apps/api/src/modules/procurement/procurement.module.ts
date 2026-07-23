import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementPublicController } from './procurement.public.controller';
import { ProcurementService } from './procurement.service';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { VendorPortalService } from './vendor-portal.service';
import { ProcurementDeepController } from './procurement-deep.controller';
import { ProcurementExpansionController } from './procurement-expansion.controller';
import { ProcurementIntelligenceController } from './procurement-intelligence.controller';
import { ProcurementSchedulingController } from './procurement-scheduling.controller';
import { SubcontractingService } from './subcontracting.service';
import { DebitNotesService } from './debit-notes.service';
import { VendorRmaService } from './vendor-rma.service';
import { SupplierNcrCarService } from './supplier-ncr-car.service';
import { RfqAuctionsService } from './rfq-auctions.service';
import { PaymentSchedulesService } from './payment-schedules.service';
import { SupplierScorecardService } from './supplier-scorecard.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';
import { ProcurementApprovalsService } from './procurement-approvals.service';

@Module({
  controllers: [
    ProcurementController,
    ProcurementPublicController,
    ContractsController,
    ProcurementDeepController,
    ProcurementExpansionController,
    ProcurementIntelligenceController,
    ProcurementSchedulingController,
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
  ],
})
export class ProcurementModule {}
