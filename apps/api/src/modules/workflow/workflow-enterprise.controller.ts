// @ts-nocheck
import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { WorkflowEnterpriseService } from "./workflow-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("workflow/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowEnterpriseController {
  constructor(private readonly service: WorkflowEnterpriseService) {}

  @Get("workflow-analytics")
  @Permissions("workflow.enterprise.read")
  async getWorkflowAnalytics(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getWorkflowAnalytics(req.user.tenantId, dateRange);
  }

  @Get("process-efficiency")
  @Permissions("workflow.enterprise.read")
  async getProcessEfficiency(@Req() req: AuthenticatedRequest, @Query("workflowId") workflowId?: string) {
    return this.service.getProcessEfficiency(req.user.tenantId, workflowId);
  }

  @Get("sla-tracking")
  @Permissions("workflow.enterprise.read")
  async getSlaTracking(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getSlaTracking(req.user.tenantId, dateRange);
  }

  @Get("automation")
  @Permissions("workflow.enterprise.read")
  async getWorkflowAutomation(@Req() req: AuthenticatedRequest) {
    return this.service.getWorkflowAutomation(req.user.tenantId);
  }

  @Get("approval-matrix")
  @Permissions("workflow.enterprise.read")
  async getApprovalMatrix(@Req() req: AuthenticatedRequest, @Query("approverId") approverId?: string) {
    return this.service.getApprovalMatrix(req.user.tenantId, approverId);
  }

  @Get("dashboard-kpis")
  @Permissions("workflow.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getWorkflowDashboardKpis(req.user.tenantId);
  }
}
