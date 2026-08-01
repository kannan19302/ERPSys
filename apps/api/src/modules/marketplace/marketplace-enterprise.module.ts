import { Module } from "@nestjs/common";
import { MarketplaceEnterpriseService } from "./marketplace-enterprise.service";
import { MarketplaceEnterpriseController } from "./marketplace-enterprise.controller";

@Module({
  controllers: [MarketplaceEnterpriseController],
  providers: [MarketplaceEnterpriseService],
  exports: [MarketplaceEnterpriseService],
})
export class MarketplaceEnterpriseModule {}
