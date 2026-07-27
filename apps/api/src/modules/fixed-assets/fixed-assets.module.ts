import { Module } from "@nestjs/common";
import { FixedAssetsController } from "./fixed-assets.controller";
import { FixedAssetsService } from "./fixed-assets.service";
import { AssetDepreciationService } from "./asset-depreciation.service";
import { AssetMaintenanceService } from "./asset-maintenance.service";

@Module({
  controllers: [FixedAssetsController],
  providers: [
    FixedAssetsService,
    AssetDepreciationService,
    AssetMaintenanceService,
  ],
  exports: [
    FixedAssetsService,
    AssetDepreciationService,
    AssetMaintenanceService,
  ],
})
export class FixedAssetsModule {}
