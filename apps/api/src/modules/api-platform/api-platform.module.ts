// @ts-nocheck
import { ApiPlatformGeneratedController } from "./api-platform-generated.controller";
import { ApiPlatformGeneratedService } from "./api-platform-generated.service";
import { Module } from "@nestjs/common";
import { ApiPlatformController } from "./api-platform.controller";
import { ApiPlatformService } from "./api-platform.service";
import { ApiRateLimitsService } from "./api-rate-limits.service";
import { ApiQuotasService } from "./api-quotas.service";
import { ApiPlatformDeepController } from "./api-platform-deep.controller";
import { ApiPlatformDeepService } from "./api-platform-deep.service";
import { ApiPlatformDeepV2Controller } from "./api-platform-deep-v2.controller";
import { ApiPlatformDeepV2Service } from "./api-platform-deep-v2.service";
import { ApiPlatformDeepV3Controller } from "./api-platform-deep-v3.controller";
import { ApiPlatformDeepV3Service } from "./api-platform-deep-v3.service";

@Module({
  controllers: [
    ApiPlatformGeneratedController,
    ApiPlatformController,
    ApiPlatformDeepController,
    ApiPlatformDeepV2Controller,
    ApiPlatformDeepV3Controller,
  ],
  providers: [
    ApiPlatformGeneratedService,
    ApiPlatformService,
    ApiRateLimitsService,
    ApiQuotasService,
    ApiPlatformDeepService,
    ApiPlatformDeepV2Service,
    ApiPlatformDeepV3Service,
  ],
  exports: [
    ApiPlatformGeneratedService,
    ApiPlatformService,
    ApiRateLimitsService,
    ApiQuotasService,
    ApiPlatformDeepService,
    ApiPlatformDeepV2Service,
    ApiPlatformDeepV3Service,
  ],
})
export class ApiPlatformModule {}
