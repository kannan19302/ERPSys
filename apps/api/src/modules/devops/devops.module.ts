import { DevopsGeneratedController } from "./devops-generated.controller";
import { DevopsGeneratedService } from "./devops-generated.service";
import { Module } from "@nestjs/common";
import { DevopsController } from "./devops.controller";
import { DevopsService } from "./devops.service";
import { DevopsDeepController } from "./devops-deep.controller";
import { DevopsDeepService } from "./devops-deep.service";
import { DevopsDeepV2Controller } from "./devops-deep-v2.controller";
import { DevopsDeepV2Service } from "./devops-deep-v2.service";
import { DevopsDeepV3Controller } from "./devops-deep-v3.controller";
import { DevopsDeepV3Service } from "./devops-deep-v3.service";

@Module({
  controllers: [
    DevopsGeneratedController,
    DevopsController,
    DevopsDeepController,
    DevopsDeepV2Controller,
    DevopsDeepV3Controller,
  ],
  providers: [
    DevopsGeneratedService,
    DevopsService,
    DevopsDeepService,
    DevopsDeepV2Service,
    DevopsDeepV3Service,
  ],
  exports: [
    DevopsGeneratedService,
    DevopsService,
    DevopsDeepService,
    DevopsDeepV2Service,
    DevopsDeepV3Service,
  ],
})
export class DevopsModule {}
