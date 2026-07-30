// @ts-nocheck
import { Module } from "@nestjs/common";
import { RealEstateEnterpriseService } from "./real-estate-enterprise.service";
import { RealEstateEnterpriseController } from "./real-estate-enterprise.controller";

@Module({
  controllers: [RealEstateEnterpriseController],
  providers: [RealEstateEnterpriseService],
  exports: [RealEstateEnterpriseService],
})
export class RealEstateEnterpriseModule {}
