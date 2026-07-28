import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AiEnterpriseService } from "./ai-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("ai/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AiEnterpriseController {
  constructor(private readonly service: AiEnterpriseService) {}

  @Get("model-performance")
  @Permissions("ai.enterprise.read")
  async getModelPerformance(@Req() req: AuthenticatedRequest, @Query("modelId") modelId?: string) {
    return this.service.getModelPerformance(req.user.tenantId, modelId);
  }

  @Get("usage-analytics")
  @Permissions("ai.enterprise.read")
  async getUsageAnalytics(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getUsageAnalytics(req.user.tenantId, dateRange);
  }

  @Get("cost-optimization")
  @Permissions("ai.enterprise.read")
  async getCostOptimization(@Req() req: AuthenticatedRequest, @Query("period") period?: string) {
    return this.service.getCostOptimization(req.user.tenantId, period);
  }

  @Get("training-effectiveness")
  @Permissions("ai.enterprise.read")
  async getTrainingEffectiveness(@Req() req: AuthenticatedRequest, @Query("trainingId") trainingId?: string) {
    return this.service.getTrainingEffectiveness(req.user.tenantId, trainingId);
  }

  @Get("dashboard-kpis")
  @Permissions("ai.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getAiDashboardKpis(req.user.tenantId);
  }
}
