// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InventoryIntelligenceService } from "./inventory-intelligence.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("inventory-intelligence")
@ApiBearerAuth()
@Controller("inventory/intelligence")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryIntelligenceController {
  constructor(private readonly svc: InventoryIntelligenceService) {}

  // ── Dashboard ──
  @Get("dashboard")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory intelligence dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getIntelligenceDashboard(req.user.tenantId);
  }

  // ── Demand Intelligence ──
  @Get("demand-patterns")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Demand patterns analysis" })
  async getDemandPatterns(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.svc.getDemandPatterns(req.user.tenantId, productId);
  }

  @Get("forecast-accuracy")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Demand forecast accuracy" })
  async getForecastAccuracy(@Req() req: AuthReq) {
    return this.svc.getForecastAccuracy(req.user.tenantId);
  }

  @Get("seasonality/:productId")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Product seasonality analysis" })
  async getSeasonality(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getSeasonalityAnalysis(req.user.tenantId, productId);
  }

  @Get("turnover-by-category")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory turnover by category" })
  async getTurnoverByCategory(@Req() req: AuthReq) {
    return this.svc.getInventoryTurnoverByCategory(req.user.tenantId);
  }

  @Get("top-selling")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Top selling products" })
  async getTopSelling(@Req() req: AuthReq, @Query("limit") limit: string) {
    return this.svc.getTopSellingProducts(
      req.user.tenantId,
      parseInt(limit) || 20,
    );
  }

  @Get("slow-moving")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Slow-moving inventory" })
  async getSlowMoving(@Req() req: AuthReq, @Query("days") days: string) {
    return this.svc.getSlowMovingInventory(
      req.user.tenantId,
      parseInt(days) || 90,
    );
  }

  // ── Supply Chain Analytics ──
  @Get("supply-chain-health")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Supply chain health metrics" })
  async getSupplyChainHealth(@Req() req: AuthReq) {
    return this.svc.getSupplyChainHealth(req.user.tenantId);
  }

  @Get("supplier-performance-matrix")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Supplier performance matrix" })
  async getSupplierMatrix(@Req() req: AuthReq) {
    return this.svc.getSupplierPerformanceMatrix(req.user.tenantId);
  }

  @Get("risk-analysis")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory risk analysis" })
  async getRiskAnalysis(@Req() req: AuthReq) {
    return this.svc.getInventoryRiskAnalysis(req.user.tenantId);
  }

  @Get("optimization-suggestions")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory optimization suggestions" })
  async getOptimizationSuggestions(@Req() req: AuthReq) {
    return this.svc.getInventoryOptimizationSuggestions(req.user.tenantId);
  }

  @Get("warehouse-efficiency")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Warehouse efficiency metrics" })
  async getWarehouseEfficiency(@Req() req: AuthReq) {
    return this.svc.getWarehouseEfficiencyMetrics(req.user.tenantId);
  }

  @Get("cost-of-carrying")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Cost of carrying inventory" })
  async getCostOfCarrying(@Req() req: AuthReq) {
    return this.svc.getCostOfCarryingInventory(req.user.tenantId);
  }

  @Post("eoq-calculator")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Economic order quantity calculator" })
  async calculateEOQ(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.getEconomicOrderQuantity(req.user.tenantId, dto);
  }

  @Get("stockout-cost-analysis")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Stockout cost analysis" })
  async getStockoutCostAnalysis(@Req() req: AuthReq) {
    return this.svc.getStockoutCostAnalysis(req.user.tenantId);
  }

  // ── KPIs & Reports ──
  @Get("kpis")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory KPIs" })
  async getKPIs(@Req() req: AuthReq) {
    return this.svc.getInventoryKPIs(req.user.tenantId);
  }

  @Get("reports/executive")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Executive inventory report" })
  async getExecutiveReport(@Req() req: AuthReq) {
    return this.svc.getInventoryExecutiveReport(req.user.tenantId);
  }

  @Get("reports/variance")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory variance report" })
  async getVarianceReport(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getInventoryVarianceReport(req.user.tenantId, q);
  }

  @Get("reports/audit")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory audit report" })
  async getAuditReport(@Req() req: AuthReq) {
    return this.svc.getInventoryAuditReport(req.user.tenantId);
  }

  @Get("reports/carbon-footprint")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Carbon footprint estimate" })
  async getCarbonFootprint(@Req() req: AuthReq) {
    return this.svc.getCarbonFootprintEstimate(req.user.tenantId);
  }

  @Get("reports/loss-writeoff")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Loss and write-off report" })
  async getLossReport(@Req() req: AuthReq) {
    return this.svc.getLossAndWriteOffReport(req.user.tenantId);
  }

  @Post("reports/custom-dashboard")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Custom intelligence dashboard" })
  async getCustomDashboard(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.getCustomDashboard(req.user.tenantId, dto);
  }
}
