import { Module } from "@nestjs/common";
import { EcommerceEnterpriseService } from "./ecommerce-enterprise.service";
import { EcommerceEnterpriseController } from "./ecommerce-enterprise.controller";

@Module({
  controllers: [EcommerceEnterpriseController],
  providers: [EcommerceEnterpriseService],
  exports: [EcommerceEnterpriseService],
})
export class EcommerceEnterpriseModule {}
