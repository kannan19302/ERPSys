import { Module } from "@nestjs/common";
import { ApiPlatformController } from "./api-platform.controller";
import { ApiPlatformService } from "./api-platform.service";
import { ApiRateLimitsService } from "./api-rate-limits.service";
import { ApiQuotasService } from "./api-quotas.service";

@Module({
  controllers: [ApiPlatformController],
  providers: [ApiPlatformService, ApiRateLimitsService, ApiQuotasService],
  exports: [ApiPlatformService, ApiRateLimitsService, ApiQuotasService],
})
export class ApiPlatformModule {}
