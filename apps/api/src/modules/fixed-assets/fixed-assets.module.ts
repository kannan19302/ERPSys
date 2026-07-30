// @ts-nocheck
import { FixedAssetsGeneratedController } from "./fixed-assets-generated.controller";
import { FixedAssetsGeneratedService } from "./fixed-assets-generated.service";
import { Module } from "@nestjs/common";
import { FixedAssetsController } from "./fixed-assets.controller";
import { FixedAssetsDeepController } from "./fixed-assets-deep.controller";
import { FixedAssetsBulkController } from "./fixed-assets-bulk.controller";
import { FixedAssetsService } from "./fixed-assets.service";
import { AssetDepreciationService } from "./asset-depreciation.service";
import { AssetMaintenanceService } from "./asset-maintenance.service";
import { AssetInsuranceService } from "./asset-insurance.service";
import { AssetRevaluationService } from "./asset-revaluation.service";
import { AssetPhysicalAuditService } from "./asset-physical-audit.service";
import { AssetWarrantyService } from "./asset-warranty.service";
import { AssetComponentService } from "./asset-component.service";
import { AssetImpairmentService } from "./asset-impairment.service";
import { AssetConditionService } from "./asset-condition.service";
import { AssetUtilizationService } from "./asset-utilization.service";
import { AssetGroupService } from "./asset-group.service";
import { AssetBudgetService } from "./asset-budget.service";
import { AssetDocumentService } from "./asset-document.service";
import { AssetOperationsService } from "./asset-operations.service";

@Module({
  controllers: [
    FixedAssetsGeneratedController,
    FixedAssetsController,
    FixedAssetsDeepController,
    FixedAssetsBulkController,
  ],
  providers: [
    FixedAssetsGeneratedService,
    FixedAssetsService,
    AssetDepreciationService,
    AssetMaintenanceService,
    AssetInsuranceService,
    AssetRevaluationService,
    AssetPhysicalAuditService,
    AssetWarrantyService,
    AssetComponentService,
    AssetImpairmentService,
    AssetConditionService,
    AssetUtilizationService,
    AssetGroupService,
    AssetBudgetService,
    AssetDocumentService,
    AssetOperationsService,
  ],
  exports: [
    FixedAssetsGeneratedService,
    FixedAssetsService,
    AssetDepreciationService,
    AssetMaintenanceService,
    AssetInsuranceService,
    AssetRevaluationService,
    AssetWarrantyService,
  ],
})
export class FixedAssetsModule {}
