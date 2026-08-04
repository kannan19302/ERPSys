import { Module } from "@nestjs/common";
import { OperationsController } from "./v1/operations.controller";
import { OperationsService } from "./v1/operations.service";
import { SaasClusterRoutingDeepController } from "./v1/cluster-routing.controller";
import { SaasClusterRoutingDeepService } from "./v1/cluster-routing.service";
import { SaasEnterpriseScaleMasterController } from "./v1/enterprise-scale.controller";
import { SaasEnterpriseScaleMasterService } from "./v1/enterprise-scale.service";
import { SaasFeatureFlagsMeteringDeepController } from "./v1/feature-flags-metering.controller";
import { SaasFeatureFlagsMeteringDeepService } from "./v1/feature-flags-metering.service";
import { SaasResellerChannelDeepController } from "./v1/reseller-channel.controller";
import { SaasResellerChannelDeepService } from "./v1/reseller-channel.service";
import { SaasTenantMigrationDeepController } from "./v1/tenant-migration.controller";
import { SaasTenantMigrationDeepService } from "./v1/tenant-migration.service";
import { SaasWhiteLabelDeepController } from "./v1/white-label.controller";
import { SaasWhiteLabelDeepService } from "./v1/white-label.service";
import { SuperAdminController } from "./v1/super-admin.controller";
import { SuperAdminService } from "./v1/super-admin.service";
import { TenantLifecycleController } from "./v1/tenant-lifecycle.controller";
import { TenantLifecycleService } from "./v1/tenant-lifecycle.service";

@Module({
  imports: [],
  controllers: [
    OperationsController,
    SaasClusterRoutingDeepController,
    SaasEnterpriseScaleMasterController,
    SaasFeatureFlagsMeteringDeepController,
    SaasResellerChannelDeepController,
    SaasTenantMigrationDeepController,
    SaasWhiteLabelDeepController,
    SuperAdminController,
    TenantLifecycleController,
  ],
  providers: [
    OperationsService,
    SaasClusterRoutingDeepService,
    SaasEnterpriseScaleMasterService,
    SaasFeatureFlagsMeteringDeepService,
    SaasResellerChannelDeepService,
    SaasTenantMigrationDeepService,
    SaasWhiteLabelDeepService,
    SuperAdminService,
    TenantLifecycleService,
  ],
  exports: [],
})
export class PlatformModule {}
