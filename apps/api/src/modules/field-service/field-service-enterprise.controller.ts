import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { FieldServiceEnterpriseService } from "./field-service-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("field-service/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FieldServiceEnterpriseController {
  constructor(private readonly service: FieldServiceEnterpriseService) {}

  @Get("dispatch-optimization")
  @Permissions("field-service.enterprise.read")
  async getDispatchOptimization(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getDispatchOptimization(req.user.tenantId, dateRange);
  }

  @Get("sla-compliance")
  @Permissions("field-service.enterprise.read")
  async getSlaCompliance(@Req() req: AuthenticatedRequest, @Query("period") period?: string) {
    return this.service.getSlaCompliance(req.user.tenantId, period);
  }

  @Get("technician-performance")
  @Permissions("field-service.enterprise.read")
  async getTechnicianPerformance(@Req() req: AuthenticatedRequest, @Query("techId") techId?: string, @Query("period") period?: string) {
    return this.service.getTechnicianPerformance(req.user.tenantId, techId, period);
  }

  @Get("parts-inventory")
  @Permissions("field-service.enterprise.read")
  async getPartsInventory(@Req() req: AuthenticatedRequest, @Query("period") period?: string) {
    return this.service.getPartsInventory(req.user.tenantId, period);
  }

  @Get("customer-satisfaction")
  @Permissions("field-service.enterprise.read")
  async getCustomerSatisfaction(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getCustomerSatisfaction(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("contract-profitability")
  @Permissions("field-service.enterprise.read")
  async getContractProfitability(@Req() req: AuthenticatedRequest, @Query("contractId") contractId?: string) {
    return this.service.getContractProfitability(req.user.tenantId, contractId);
  }

  @Get("mobile-workforce")
  @Permissions("field-service.enterprise.read")
  async getMobileWorkforce(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getMobileWorkforceAnalytics(req.user.tenantId, dateRange);
  }

  @Get("preventive-maintenance")
  @Permissions("field-service.enterprise.read")
  async getPreventiveMaintenance(@Req() req: AuthenticatedRequest) {
    return this.service.getPreventiveMaintenanceCompliance(req.user.tenantId);
  }

  @Get("dashboard-kpis")
  @Permissions("field-service.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getFieldServiceDashboardKpis(req.user.tenantId);
  }
}
