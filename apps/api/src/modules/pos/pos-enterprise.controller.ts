import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PosEnterpriseService } from "./pos-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("pos/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PosEnterpriseController {
  constructor(private readonly service: PosEnterpriseService) {}

  @Get("sales-performance")
  @Permissions("pos.enterprise.read")
  async getSalesPerformance(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getSalesPerformance(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("inventory-sync")
  @Permissions("pos.enterprise.read")
  async getInventorySync(@Req() req: AuthenticatedRequest, @Query("period") period?: string) {
    return this.service.getInventorySync(req.user.tenantId, period);
  }

  @Get("employee-performance")
  @Permissions("pos.enterprise.read")
  async getEmployeePerformance(@Req() req: AuthenticatedRequest, @Query("employeeId") employeeId?: string, @Query("period") period?: string) {
    return this.service.getEmployeePerformance(req.user.tenantId, employeeId, period);
  }

  @Get("customer-analytics")
  @Permissions("pos.enterprise.read")
  async getCustomerAnalytics(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getCustomerAnalytics(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("menu-performance")
  @Permissions("pos.enterprise.read")
  async getMenuPerformance(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getMenuPerformance(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("peak-hour-analysis")
  @Permissions("pos.enterprise.read")
  async getPeakHourAnalysis(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getPeakHourAnalysis(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("payment-analytics")
  @Permissions("pos.enterprise.read")
  async getPaymentAnalytics(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getPaymentAnalytics(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("shift-compliance")
  @Permissions("pos.enterprise.read")
  async getShiftCompliance(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getShiftCompliance(req.user.tenantId, dateRange);
  }

  @Get("dashboard-kpis")
  @Permissions("pos.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getPosDashboardKpis(req.user.tenantId);
  }
}
