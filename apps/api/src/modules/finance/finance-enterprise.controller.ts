import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { FinanceEnterpriseService } from "./finance-enterprise.service";

@Controller("finance/enterprise")
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
export class FinanceEnterpriseController {
  constructor(private readonly service: FinanceEnterpriseService) {}

  @Get("cash-flow")
  @Permissions("finance.report.read")
  async getCashFlowStatement(
    @Req() req: any,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getCashFlowStatement(
      req.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("ratios")
  @Permissions("finance.report.read")
  async getFinancialRatios(@Req() req: any, @Query("period") period?: string) {
    return this.service.getFinancialRatios(req.tenantId, period);
  }

  @Get("aging")
  @Permissions("finance.report.read")
  async getAgingReport(@Req() req: any, @Query("asOf") asOf?: string) {
    return this.service.getAgingReport(req.tenantId, asOf);
  }

  @Get("revenue-recognition")
  @Permissions("finance.revenue.read")
  async getRevenueRecognitionSchedule(
    @Req() req: any,
    @Query("contractId") contractId?: string,
  ) {
    return this.service.getRevenueRecognitionSchedule(req.tenantId, contractId);
  }

  @Get("deferred-revenue")
  @Permissions("finance.revenue.read")
  async getDeferredRevenue(@Req() req: any, @Query("asOf") asOf?: string) {
    return this.service.getDeferredRevenue(req.tenantId, asOf);
  }

  @Get("tax-summary")
  @Permissions("finance.tax.read")
  async getTaxSummary(
    @Req() req: any,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getTaxSummary(req.tenantId, periodStart, periodEnd);
  }

  @Get("budget-variance/:budgetId")
  @Permissions("finance.budget.read")
  async getBudgetVariance(
    @Req() req: any,
    @Param("budgetId") budgetId: string,
  ) {
    return this.service.getBudgetVariance(req.tenantId, budgetId);
  }

  @Get("working-capital")
  @Permissions("finance.report.read")
  async getWorkingCapital(@Req() req: any, @Query("asOf") asOf?: string) {
    return this.service.getWorkingCapital(req.tenantId, asOf);
  }

  @Get("dashboard-kpis")
  @Permissions("finance.report.read")
  async getFinancialDashboardKpis(@Req() req: any) {
    return this.service.getFinancialDashboardKpis(req.tenantId);
  }

  @Get("export/:reportType")
  @Permissions("finance.report.export")
  async exportFinancialReport(
    @Req() req: any,
    @Param("reportType") reportType: string,
    @Query("format") format: string,
    @Query() params: any,
  ) {
    return this.service.exportFinancialReport(
      req.tenantId,
      reportType,
      format || "json",
      params,
    );
  }
}
