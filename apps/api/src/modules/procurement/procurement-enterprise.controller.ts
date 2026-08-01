import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ProcurementEnterpriseService } from "./procurement-enterprise.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("procurement-enterprise")
@ApiBearerAuth()
@Controller("procurement/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementEnterpriseController {
  constructor(private readonly service: ProcurementEnterpriseService) {}

  @Get("spend-analysis")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary: "Spend analysis by category/vendor with maverick detection",
  })
  @ApiQuery({ name: "periodStart", required: false })
  @ApiQuery({ name: "periodEnd", required: false })
  @ApiQuery({ name: "groupBy", required: false })
  async getSpendAnalysis(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
    @Query("groupBy") groupBy?: string,
  ) {
    return this.service.getSpendAnalysis(
      req.user.tenantId,
      periodStart,
      periodEnd,
      groupBy,
    );
  }

  @Get("vendor-scorecard/:vendorId")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary:
      "Vendor performance scorecard - composite quality/delivery/cost/compliance/sustainability",
  })
  async getVendorScorecard(
    @Req() req: AuthenticatedRequest,
    @Param("vendorId") vendorId: string,
    @Query("period") period?: string,
  ) {
    return this.service.getVendorPerformanceScorecard(
      req.user.tenantId,
      vendorId,
      period,
    );
  }

  @Get("savings")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary:
      "Procurement savings analysis - negotiated, cost avoidance, savings rate",
  })
  async getSavings(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getProcurementSavings(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("contract-compliance/:vendorId")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({ summary: "Contract compliance analysis for a vendor" })
  async getContractCompliance(
    @Req() req: AuthenticatedRequest,
    @Param("vendorId") vendorId: string,
    @Query("period") period?: string,
  ) {
    return this.service.getContractCompliance(
      req.user.tenantId,
      vendorId,
      period,
    );
  }

  @Get("sourcing-cycle-time")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary: "Sourcing cycle time - RFx cycle, time to award, time to contract",
  })
  async getSourcingCycleTime(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getSourcingCycleTime(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("price-variance/:productId")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary: "Purchase price variance analysis - standard vs actual",
  })
  async getPriceVariance(
    @Req() req: AuthenticatedRequest,
    @Param("productId") productId: string,
    @Query("period") period?: string,
  ) {
    return this.service.getPurchasePriceVariance(
      req.user.tenantId,
      productId,
      period,
    );
  }

  @Get("supplier-risk/:vendorId")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary:
      "Supplier risk assessment - financial, operational, geopolitical, compliance",
  })
  async getSupplierRisk(
    @Req() req: AuthenticatedRequest,
    @Param("vendorId") vendorId: string,
  ) {
    return this.service.getSupplierRiskAssessment(req.user.tenantId, vendorId);
  }

  @Get("analytics")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary:
      "Procurement operational analytics - PO volume, receipt rate, approval cycle",
  })
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getProcurementAnalytics(req.user.tenantId, dateRange);
  }

  @Get("vendor-consolidation")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary: "Vendor consolidation analysis with concentration metrics",
  })
  async getVendorConsolidation(
    @Req() req: AuthenticatedRequest,
    @Query("category") category?: string,
  ) {
    return this.service.getVendorConsolidation(req.user.tenantId, category);
  }

  @Get("maverick-spend")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({
    summary: "Maverick spend detection - non-compliant spend analysis",
  })
  async getMaverickSpend(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getMaverickSpend(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("dashboard-kpis")
  @Permissions("procurement.enterprise.read")
  @ApiOperation({ summary: "Executive procurement dashboard KPIs" })
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getProcurementDashboardKpis(req.user.tenantId);
  }

  @Get("export/:reportType")
  @Permissions("procurement.enterprise.export")
  @ApiOperation({ summary: "Export procurement report in specified format" })
  async exportReport(
    @Req() req: AuthenticatedRequest,
    @Param("reportType") reportType: string,
    @Query("format") format?: string,
    @Query() params?: any,
  ) {
    return this.service.exportProcurementReport(
      req.user.tenantId,
      reportType,
      format || "json",
      params,
    );
  }
}
