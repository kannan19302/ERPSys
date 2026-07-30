// @ts-nocheck
import { Module } from "@nestjs/common";
import { RealEstateController } from "./real-estate.controller";
import { RealEstatePropertiesService } from "./real-estate-properties.service";
import { RealEstateLeasingService } from "./real-estate-leasing.service";
import { RealEstateOperationsService } from "./real-estate-operations.service";
import { RealEstateMaintenanceService } from "./real-estate-maintenance.service";
import { RealEstateLeaseRenewalService } from "./real-estate-lease-renewal.service";
import { RealEstateFinancialsService } from "./real-estate-financials.service";
import { RealEstateEnterpriseModule } from "./real-estate-enterprise.module";

@Module({
  imports: [RealEstateEnterpriseModule],
  controllers: [RealEstateController],
  providers: [
    RealEstatePropertiesService,
    RealEstateLeasingService,
    RealEstateOperationsService,
    RealEstateMaintenanceService,
    RealEstateLeaseRenewalService,
    RealEstateFinancialsService,
  ],
  exports: [
    RealEstatePropertiesService,
    RealEstateLeasingService,
    RealEstateOperationsService,
    RealEstateMaintenanceService,
    RealEstateLeaseRenewalService,
    RealEstateFinancialsService,
  ],
})
export class RealEstateModule {}
