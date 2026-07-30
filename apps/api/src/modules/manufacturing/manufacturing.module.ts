// @ts-nocheck
import { Module } from "@nestjs/common";
import { ManufacturingController } from "./manufacturing.controller";
import { ManufacturingService } from "./manufacturing.service";
import { SchedulingService } from "./scheduling.service";
import { SchedulingController } from "./scheduling.controller";
import { ManufacturingExpansionController } from "./manufacturing-expansion.controller";
import { ManufacturingExpansionService } from "./manufacturing-expansion.service";
import { ManufacturingSettingsController } from "./settings.controller";
import { ManufacturingAdvancedQualityService } from "./manufacturing-advanced-quality.service";
import { ManufacturingAdvancedQualityController } from "./manufacturing-advanced-quality.controller";
import { ManufacturingToolingService } from "./manufacturing-tooling.service";
import { ManufacturingToolingController } from "./manufacturing-tooling.controller";
import { ManufacturingApsService } from "./manufacturing-aps.service";
import { ManufacturingApsController } from "./manufacturing-aps.controller";
import { ManufacturingEnergyService } from "./manufacturing-energy.service";
import { ManufacturingEnergyController } from "./manufacturing-energy.controller";
import { ManufacturingLeanService } from "./manufacturing-lean.service";
import { ManufacturingLeanController } from "./manufacturing-lean.controller";
import { ManufacturingTpmService } from "./manufacturing-tpm.service";
import { ManufacturingTpmController } from "./manufacturing-tpm.controller";
import { ManufacturingContractMfgService } from "./manufacturing-contract-mfg.service";
import { ManufacturingContractMfgController } from "./manufacturing-contract-mfg.controller";
import { ManufacturingDdmrpService } from "./manufacturing-ddmrp.service";
import { ManufacturingDdmrpController } from "./manufacturing-ddmrp.controller";

import { MfgDeepExpansionController } from "./controllers/mfg-deep-expansion.controller";
import { MfgDeepExpansionService } from "./services/mfg-deep-expansion.service";
import { ManufacturingEnterpriseModule } from "./manufacturing-enterprise.module";
import { ManufacturingEnterpriseController } from "./manufacturing-enterprise.controller";
import { ManufacturingEnterpriseService } from "./manufacturing-enterprise.service";
import { ManufacturingMpsService } from "./manufacturing-mps.service";
import { ManufacturingMpsController } from "./manufacturing-mps.controller";
import { ManufacturingJobCostService } from "./manufacturing-job-cost.service";
import { ManufacturingJobCostController } from "./manufacturing-job-cost.controller";

@Module({
  imports: [ManufacturingEnterpriseModule],
  controllers: [
    ManufacturingController,
    SchedulingController,
    ManufacturingExpansionController,
    ManufacturingSettingsController,
    ManufacturingAdvancedQualityController,
    ManufacturingToolingController,
    ManufacturingApsController,
    ManufacturingEnergyController,
    ManufacturingLeanController,
    ManufacturingTpmController,
    ManufacturingContractMfgController,
    ManufacturingDdmrpController,
    ManufacturingEnterpriseController,
    MfgDeepExpansionController,
    ManufacturingMpsController,
    ManufacturingJobCostController,
  ],
  providers: [
    ManufacturingService,
    SchedulingService,
    ManufacturingExpansionService,
    ManufacturingAdvancedQualityService,
    ManufacturingToolingService,
    ManufacturingApsService,
    ManufacturingEnergyService,
    ManufacturingLeanService,
    ManufacturingTpmService,
    ManufacturingContractMfgService,
    ManufacturingDdmrpService,
    ManufacturingEnterpriseService,
    ManufacturingEnterpriseController,
    MfgDeepExpansionService,
    ManufacturingMpsService,
    ManufacturingJobCostService,
  ],
  exports: [
    ManufacturingService,
    SchedulingService,
    ManufacturingExpansionService,
    ManufacturingEnterpriseService,
    MfgDeepExpansionService,
    ManufacturingMpsService,
    ManufacturingJobCostService,
  ],
})
export class ManufacturingModule {}
