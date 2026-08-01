import { Module } from "@nestjs/common";
import { ProcurementEnterpriseController } from "./procurement-enterprise.controller";
import { ProcurementEnterpriseService } from "./procurement-enterprise.service";

@Module({
  controllers: [ProcurementEnterpriseController],
  providers: [ProcurementEnterpriseService],
  exports: [ProcurementEnterpriseService],
})
export class ProcurementEnterpriseModule {}
