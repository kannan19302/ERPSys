// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SaasMarketplaceLifecycleDeepService } from "./saas-marketplace-lifecycle-deep.service";

@ApiTags("SaaS Marketplace & Lifecycle")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/marketplace-lifecycle")
export class SaasMarketplaceLifecycleDeepController {
  constructor(private readonly service: SaasMarketplaceLifecycleDeepService) {}

  // 1. Marketplace Apps
  @Post("marketplace/apps")
  @ApiOperation({ summary: "Publish marketplace app" })
  @Permissions("saas.marketplace.admin")
  async publishMarketplaceApp(@CurrentUser() user: any, @Body() appData: any) {
    return this.service.publishMarketplaceApp(user.tenantId, appData);
  }

  @Get("marketplace/apps")
  @ApiOperation({ summary: "Get marketplace apps" })
  @Permissions("saas.marketplace.read")
  async getMarketplaceApps(
    @CurrentUser() user: any,
    @Query("category") category?: string,
  ) {
    return this.service.getMarketplaceApps(user.tenantId, category);
  }

  @Get("marketplace/apps/:id")
  @ApiOperation({ summary: "Get marketplace app by ID" })
  @Permissions("saas.marketplace.read")
  async getMarketplaceAppById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.getMarketplaceAppById(user.tenantId, id);
  }

  @Patch("marketplace/apps/:id")
  @ApiOperation({ summary: "Update marketplace app" })
  @Permissions("saas.marketplace.admin")
  async updateMarketplaceApp(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() appData: any,
  ) {
    return this.service.updateMarketplaceApp(user.tenantId, id, appData);
  }

  @Post("marketplace/apps/:id/unpublish")
  @ApiOperation({ summary: "Unpublish marketplace app" })
  @Permissions("saas.marketplace.admin")
  async unpublishMarketplaceApp(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.unpublishMarketplaceApp(user.tenantId, id);
  }

  @Post("marketplace/apps/:appId/install")
  @ApiOperation({ summary: "Install marketplace app" })
  @Permissions("saas.marketplace.update")
  async installMarketplaceApp(
    @CurrentUser() user: any,
    @Param("appId") appId: string,
    @Body() config?: any,
  ) {
    return this.service.installMarketplaceApp(user.tenantId, appId, config);
  }

  @Delete("marketplace/installs/:installId")
  @ApiOperation({ summary: "Uninstall marketplace app" })
  @Permissions("saas.marketplace.update")
  async uninstallMarketplaceApp(
    @CurrentUser() user: any,
    @Param("installId") installId: string,
  ) {
    return this.service.uninstallMarketplaceApp(user.tenantId, installId);
  }

  @Get("marketplace/installed")
  @ApiOperation({ summary: "Get installed marketplace apps" })
  @Permissions("saas.marketplace.read")
  async getInstalledMarketplaceApps(@CurrentUser() user: any) {
    return this.service.getInstalledMarketplaceApps(user.tenantId);
  }

  @Post("marketplace/apps/:appId/reviews")
  @ApiOperation({ summary: "Submit app review" })
  @Permissions("saas.marketplace.update")
  async submitAppReview(
    @CurrentUser() user: any,
    @Param("appId") appId: string,
    @Body() body: any,
  ) {
    return this.service.submitAppReview(
      user.tenantId,
      appId,
      body?.rating,
      body?.reviewText,
    );
  }

  @Get("marketplace/apps/:appId/reviews")
  @ApiOperation({ summary: "Get app reviews" })
  @Permissions("saas.marketplace.read")
  async getAppReviews(@CurrentUser() user: any, @Param("appId") appId: string) {
    return this.service.getAppReviews(user.tenantId, appId);
  }

  // 2. Lifecycle & Clusters
  @Post("lifecycle/clusters/provision")
  @ApiOperation({ summary: "Provision new tenant cluster" })
  @Permissions("saas.cluster.admin")
  async provisionNewTenantCluster(
    @CurrentUser() user: any,
    @Body() clusterParams: any,
  ) {
    return this.service.provisionNewTenantCluster(user.tenantId, clusterParams);
  }

  @Get("lifecycle/clusters/health")
  @ApiOperation({ summary: "Get tenant cluster health" })
  @Permissions("saas.cluster.read")
  async getTenantClusterHealth(@CurrentUser() user: any) {
    return this.service.getTenantClusterHealth(user.tenantId);
  }

  @Post("lifecycle/clusters/migrate")
  @ApiOperation({ summary: "Migrate tenant data cluster" })
  @Permissions("saas.cluster.admin")
  async migrateTenantDataCluster(@CurrentUser() user: any, @Body() body: any) {
    return this.service.migrateTenantDataCluster(
      user.tenantId,
      body?.targetRegion,
    );
  }

  @Get("lifecycle/clusters/migrations/:migrationId")
  @ApiOperation({ summary: "Get tenant migration status" })
  @Permissions("saas.cluster.read")
  async getTenantMigrationStatus(
    @CurrentUser() user: any,
    @Param("migrationId") migrationId: string,
  ) {
    return this.service.getTenantMigrationStatus(user.tenantId, migrationId);
  }

  @Post("lifecycle/tenants/:targetTenantId/suspend")
  @ApiOperation({ summary: "Suspend tenant account" })
  @Permissions("saas.tenant.admin")
  async suspendTenantAccount(
    @CurrentUser() user: any,
    @Param("targetTenantId") targetTenantId: string,
    @Body() body: any,
  ) {
    return this.service.suspendTenantAccount(
      user.tenantId,
      targetTenantId,
      body?.reason,
    );
  }

  @Post("lifecycle/tenants/:targetTenantId/reactivate")
  @ApiOperation({ summary: "Reactivate tenant account" })
  @Permissions("saas.tenant.admin")
  async reactivateTenantAccount(
    @CurrentUser() user: any,
    @Param("targetTenantId") targetTenantId: string,
  ) {
    return this.service.reactivateTenantAccount(user.tenantId, targetTenantId);
  }
}
