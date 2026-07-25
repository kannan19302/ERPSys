import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { InventoryAdvancedWmsService } from "./inventory-advanced-wms.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("inventory-advanced-wms")
@ApiBearerAuth()
@Controller("inventory/wms")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryAdvancedWmsController {
  constructor(private readonly svc: InventoryAdvancedWmsService) {}

  // ── WMS Dashboard ──
  @Get("dashboard")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "WMS dashboard overview" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getWmsDashboard(req.user.tenantId);
  }

  // ── Warehouse Locations ──
  @Get("locations")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List warehouse locations" })
  async getLocations(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getWarehouseLocations(req.user.tenantId, q);
  }

  @Post("locations")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create warehouse location" })
  async createLocation(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createWarehouseLocation(req.user.tenantId, dto);
  }

  @Post("locations/bulk-create")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Bulk create warehouse locations" })
  async bulkCreateLocations(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.bulkCreateLocations(req.user.tenantId, dto);
  }

  @Patch("locations/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update warehouse location" })
  async updateLocation(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateWarehouseLocation(req.user.tenantId, id, dto);
  }

  @Get("locations/:id/inventory")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get inventory at specific location" })
  async getLocationInventory(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getLocationInventory(req.user.tenantId, id);
  }

  @Get("utilization")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Warehouse utilization report" })
  async getUtilization(
    @Req() req: AuthReq,
    @Query("warehouseId") warehouseId?: string,
  ) {
    return this.svc.getWarehouseUtilization(req.user.tenantId, warehouseId);
  }

  // ── Inventory Moves ──
  @Get("moves")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List inventory moves" })
  async getMoves(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getInventoryMoves(req.user.tenantId, q);
  }

  @Post("moves")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create inventory move" })
  async createMove(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createInventoryMove(req.user.tenantId, dto);
  }

  @Post("moves/:id/confirm")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Confirm inventory move" })
  async confirmMove(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.confirmInventoryMove(req.user.tenantId, id);
  }

  @Post("moves/:id/cancel")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Cancel inventory move" })
  async cancelMove(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.cancelInventoryMove(req.user.tenantId, id);
  }

  @Get("moves/product/:productId/history")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get movement history for product" })
  async getMovementHistory(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getMovementHistory(req.user.tenantId, productId);
  }

  // ── Putaway Rules ──
  @Get("putaway-rules")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List putaway rules" })
  async getPutawayRules(@Req() req: AuthReq) {
    return this.svc.getPutawayRules(req.user.tenantId);
  }

  @Post("putaway-rules")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create putaway rule" })
  async createPutawayRule(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createPutawayRule(req.user.tenantId, dto);
  }

  @Patch("putaway-rules/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update putaway rule" })
  async updatePutawayRule(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updatePutawayRule(req.user.tenantId, id, dto);
  }

  @Delete("putaway-rules/:id")
  @Permissions("inventory.delete")
  @ApiOperation({ summary: "Delete putaway rule" })
  async deletePutawayRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deletePutawayRule(req.user.tenantId, id);
  }

  @Post("putaway-rules/suggest")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Suggest optimal putaway location" })
  async suggestPutaway(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.suggestPutawayLocation(req.user.tenantId, dto);
  }

  @Get("slotting-optimization")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Slotting optimization report" })
  async getSlottingOptimization(@Req() req: AuthReq) {
    return this.svc.getSlottingOptimizationReport(req.user.tenantId);
  }

  // ── Pick Orders ──
  @Get("pick-orders")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List pick orders" })
  async getPickOrders(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getPickOrders(req.user.tenantId, q);
  }

  @Get("pick-orders/:id")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get pick order details" })
  async getPickOrderById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getPickOrderById(req.user.tenantId, id);
  }

  @Post("pick-orders")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create pick order" })
  async createPickOrder(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createPickOrder(req.user.tenantId, dto);
  }

  @Post("pick-orders/:id/assign")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Assign pick order to worker" })
  async assignPickOrder(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.assignPickOrder(req.user.tenantId, id, dto);
  }

  @Post("pick-orders/lines/:lineId/confirm")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Confirm pick line" })
  async confirmPickLine(
    @Req() req: AuthReq,
    @Param("lineId") lineId: string,
    @Body() dto: any,
  ) {
    return this.svc.confirmPickLine(req.user.tenantId, lineId, dto);
  }

  @Post("pick-orders/:id/complete")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Complete pick order" })
  async completePickOrder(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.completePickOrder(req.user.tenantId, id);
  }

  @Get("pick-orders/:id/packing-slip")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Generate packing slip" })
  async getPackingSlip(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getPackingSlip(req.user.tenantId, id);
  }

  // ── Receiving Orders ──
  @Get("receiving-orders")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List receiving orders" })
  async getReceivingOrders(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getReceivingOrders(req.user.tenantId, q);
  }

  @Post("receiving-orders")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create receiving order" })
  async createReceivingOrder(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createReceivingOrder(req.user.tenantId, dto);
  }

  @Post("receiving-orders/:id/receive")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Receive goods against receiving order" })
  async receiveGoods(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.receiveGoods(req.user.tenantId, id, dto);
  }

  // ── Forecasting & Planning ──
  @Get("forecasts")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get inventory forecasts" })
  async getForecasts(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.svc.getInventoryForecast(req.user.tenantId, productId);
  }

  @Post("forecasts")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create demand forecast" })
  async createForecast(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createDemandForecast(req.user.tenantId, dto);
  }

  @Get("reorder-recommendations")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get reorder recommendations" })
  async getReorderRecommendations(@Req() req: AuthReq) {
    return this.svc.getReorderRecommendations(req.user.tenantId);
  }

  @Get("safety-stock")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get safety stock levels" })
  async getSafetyStock(@Req() req: AuthReq) {
    return this.svc.getSafetyStockLevels(req.user.tenantId);
  }

  @Patch("safety-stock/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update safety stock level" })
  async updateSafetyStock(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateSafetyStock(req.user.tenantId, id, dto);
  }

  @Get("aging")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory aging report" })
  async getAging(@Req() req: AuthReq) {
    return this.svc.getInventoryAging(req.user.tenantId);
  }

  @Get("abc-analysis")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "ABC analysis of inventory" })
  async getAbcAnalysis(@Req() req: AuthReq) {
    return this.svc.getAbcAnalysis(req.user.tenantId);
  }

  @Get("value-report")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory value report" })
  async getValueReport(@Req() req: AuthReq) {
    return this.svc.getInventoryValueReport(req.user.tenantId);
  }

  @Get("expiry-alerts")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Expiry date alerts" })
  async getExpiryAlerts(
    @Req() req: AuthReq,
    @Query("daysAhead") daysAhead: string,
  ) {
    return this.svc.getExpiryAlerts(
      req.user.tenantId,
      parseInt(daysAhead) || 30,
    );
  }

  // ── Cycle Counting ──
  @Get("cycle-count-schedules")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get cycle count schedules" })
  async getSchedules(@Req() req: AuthReq) {
    return this.svc.getCycleCountSchedules(req.user.tenantId);
  }

  @Post("cycle-count-schedules")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create cycle count schedule" })
  async createSchedule(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createCycleCountSchedule(req.user.tenantId, dto);
  }

  @Get("cycle-counts")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List cycle counts" })
  async getCycleCounts(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getCycleCounts(req.user.tenantId, q);
  }

  @Post("cycle-counts/start")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Start a cycle count" })
  async startCycleCount(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.startCycleCount(req.user.tenantId, dto);
  }

  @Post("cycle-counts/:countId/record")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Record cycle count item" })
  async recordCycleCountItem(
    @Req() req: AuthReq,
    @Param("countId") countId: string,
    @Body() dto: any,
  ) {
    return this.svc.recordCycleCountItem(req.user.tenantId, countId, dto);
  }

  @Post("cycle-counts/:id/finalize")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Finalize cycle count and apply variances" })
  async finalizeCycleCount(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.finalizeCycleCount(req.user.tenantId, id);
  }

  @Get("cycle-counts/:id/variance-report")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Cycle count variance report" })
  async getVarianceReport(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getCycleCountVarianceReport(req.user.tenantId, id);
  }

  // ── Reports ──
  @Get("reports/movement")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory movement report" })
  async getMovementReport(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getInventoryMovementReport(req.user.tenantId, q);
  }

  @Get("reports/turnover")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory turnover ratio" })
  async getTurnover(@Req() req: AuthReq) {
    return this.svc.getInventoryTurnoverRatio(req.user.tenantId);
  }

  @Get("reports/accuracy")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory accuracy score" })
  async getAccuracy(@Req() req: AuthReq) {
    return this.svc.getInventoryAccuracyScore(req.user.tenantId);
  }

  @Get("reports/health-summary")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory health summary" })
  async getHealthSummary(@Req() req: AuthReq) {
    return this.svc.getInventoryHealthSummary(req.user.tenantId);
  }
}
