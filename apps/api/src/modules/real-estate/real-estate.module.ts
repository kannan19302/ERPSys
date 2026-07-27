import { Module } from "@nestjs/common";
import { RealEstateController } from "./real-estate.controller";
import { RealEstatePropertiesService } from "./real-estate-properties.service";
import { RealEstateLeasingService } from "./real-estate-leasing.service";
import { RealEstateOperationsService } from "./real-estate-operations.service";

@Module({
  controllers: [RealEstateController],
  providers: [
    RealEstatePropertiesService,
    RealEstateLeasingService,
    RealEstateOperationsService,
  ],
  exports: [
    RealEstatePropertiesService,
    RealEstateLeasingService,
    RealEstateOperationsService,
  ],
})
export class RealEstateModule {}
