import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InventoryEnterpriseService } from "./inventory-enterprise.service";

@Controller("inventory/enterprise")
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
export class InventoryEnterpriseController {
  constructor(private readonly service: InventoryEnterpriseService) {}

  @Get("valuation")
  @Permissions("inventory.stock.read")
  async getInventoryValuation(
    @Req() req: any,
    @Query("asOf") asOf?: string,
    @Query("valuationMethod") valuationMethod?: string,
  ) {
    return this.service.getInventoryValuation(
      req.tenantId,
      asOf,
      valuationMethod,
    );
  }

  @Get("stock-aging")
  @Permissions("inventory.stock.read")
  async getStockAgingAnalysis(@Req() req: any, @Query("asOf") asOf?: string) {
    return this.service.getStockAgingAnalysis(req.tenantId, asOf);
  }

  @Get("turnover")
  @Permissions("inventory.stock.read")
  async getInventoryTurnover(
    @Req() req: any,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getInventoryTurnover(
      req.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("stockout-analysis")
  @Permissions("inventory.stock.read")
  async getStockoutAnalysis(
    @Req() req: any,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getStockoutAnalysis(
      req.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("warehouse-utilization")
  @Permissions("inventory.warehouse.read")
  async getWarehouseCapacityUtilization(
    @Req() req: any,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.service.getWarehouseCapacityUtilization(
      req.tenantId,
      warehouseId,
    );
  }

  @Get("reorder-optimization")
  @Permissions("inventory.stock.read")
  async getReorderOptimization(@Req() req: any) {
    return this.service.getReOrderPointOptimization(req.tenantId);
  }

  @Get("abc-xyz-analysis")
  @Permissions("inventory.stock.read")
  async getABCXYZAnalysis(@Req() req: any) {
    return this.service.getABCXYZAnalysis(req.tenantId);
  }

  @Get("dashboard-kpis")
  @Permissions("inventory.stock.read")
  async getInventoryDashboardKpis(@Req() req: any) {
    return this.service.getInventoryDashboardKpis(req.tenantId);
  }

  @Get("export/:reportType")
  @Permissions("inventory.stock.read")
  async exportInventoryReport(
    @Req() req: any,
    @Param("reportType") reportType: string,
    @Query("format") format: string,
    @Query() params: any,
  ) {
    return this.service.exportInventoryReport(
      req.tenantId,
      reportType,
      format || "json",
      params,
    );
  }
}
