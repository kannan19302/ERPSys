import { Module } from "@nestjs/common";
import { SalesEnterpriseController } from "./sales-enterprise.controller";
import { SalesEnterpriseService } from "./sales-enterprise.service";

@Module({
  controllers: [SalesEnterpriseController],
  providers: [SalesEnterpriseService],
  exports: [SalesEnterpriseService],
})
export class SalesEnterpriseModule {}
