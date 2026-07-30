// @ts-nocheck
import { Module } from "@nestjs/common";
import { SupplyChainEnterpriseController } from "./supply-chain-enterprise.controller";
import { SupplyChainEnterpriseService } from "./supply-chain-enterprise.service";

@Module({
  controllers: [SupplyChainEnterpriseController],
  providers: [SupplyChainEnterpriseService],
  exports: [SupplyChainEnterpriseService],
})
export class SupplyChainEnterpriseModule {}
