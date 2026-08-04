import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { BuilderEnterpriseService } from "./builder-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("builder/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class BuilderEnterpriseController {
  constructor(private readonly service: BuilderEnterpriseService) {}

  @Get("builder-analytics")
  @Permissions("builder.enterprise.read")
  async getBuilderAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getBuilderAnalytics(req.user.tenantId, dateRange);
  }

  @Get("usage-metrics")
  @Permissions("builder.enterprise.read")
  async getUsageMetrics(
    @Req() req: AuthenticatedRequest,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getUsageMetrics(req.user.tenantId, dateRange);
  }

  @Get("template-performance")
  @Permissions("builder.enterprise.read")
  async getTemplatePerformance(@Req() req: AuthenticatedRequest) {
    return this.service.getTemplatePerformance(req.user.tenantId);
  }

  @Get("governance")
  @Permissions("builder.enterprise.read")
  async getGovernance(@Req() req: AuthenticatedRequest) {
    return this.service.getNoCodeGovernance(req.user.tenantId);
  }

  @Get("dashboard-kpis")
  @Permissions("builder.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getBuilderDashboardKpis(req.user.tenantId);
  }
}
