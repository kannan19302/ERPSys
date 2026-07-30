// @ts-nocheck
import { Module } from "@nestjs/common";
import { PosEnterpriseService } from "./pos-enterprise.service";
import { PosEnterpriseController } from "./pos-enterprise.controller";

@Module({
  controllers: [PosEnterpriseController],
  providers: [PosEnterpriseService],
  exports: [PosEnterpriseService],
})
export class PosEnterpriseModule {}
