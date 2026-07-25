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
import { InventorySupplyChainService } from "./inventory-supply-chain.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("inventory-supply-chain")
@ApiBearerAuth()
@Controller("inventory/supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventorySupplyChainController {
  constructor(private readonly svc: InventorySupplyChainService) {}

  // ── Multi-Site ──
  @Get("multi-site/dashboard")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Multi-site inventory dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getMultiSiteDashboard(req.user.tenantId);
  }

  @Get("multi-site/products/:productId")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Inventory across all sites for a product" })
  async getAcrossSites(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getInventoryAcrossSites(req.user.tenantId, productId);
  }

  @Get("multi-site/network-balance")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Network-wide inventory balance" })
  async getNetworkBalance(@Req() req: AuthReq) {
    return this.svc.getNetworkInventoryBalance(req.user.tenantId);
  }

  @Get("multi-site/transfer-lead-times")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Average transfer lead times by route" })
  async getLeadTimes(@Req() req: AuthReq) {
    return this.svc.getTransferLeadTimes(req.user.tenantId);
  }

  // ── Inter-Site Transfers ──
  @Get("transfers")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List inter-site transfer requests" })
  async getTransfers(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getInterSiteTransferRequests(req.user.tenantId, q);
  }

  @Post("transfers")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create inter-site transfer request" })
  async createTransfer(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createInterSiteTransfer(req.user.tenantId, dto);
  }

  @Post("transfers/:id/approve")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Approve inter-site transfer" })
  async approveTransfer(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.approveInterSiteTransfer(req.user.tenantId, id);
  }

  @Post("transfers/:id/ship")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Ship inter-site transfer" })
  async shipTransfer(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.shipInterSiteTransfer(req.user.tenantId, id, dto);
  }

  @Post("transfers/:id/receive")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Receive inter-site transfer" })
  async receiveTransfer(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.receiveInterSiteTransfer(req.user.tenantId, id, dto);
  }

  // ── VMI Programs ──
  @Get("vmi")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List VMI programs" })
  async getVmiPrograms(@Req() req: AuthReq) {
    return this.svc.getVmiPrograms(req.user.tenantId);
  }

  @Post("vmi")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create VMI program" })
  async createVmiProgram(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createVmiProgram(req.user.tenantId, dto);
  }

  @Patch("vmi/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update VMI program" })
  async updateVmiProgram(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateVmiProgram(req.user.tenantId, id, dto);
  }

  @Get("vmi/:id/levels")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "VMI inventory levels for program" })
  async getVmiLevels(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getVmiInventoryLevels(req.user.tenantId, id);
  }

  @Post("vmi/:id/replenishment")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Generate VMI replenishment order" })
  async generateVmiReplenishment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.generateVmiReplenishmentOrder(req.user.tenantId, id);
  }

  @Get("supplier-portal/:supplierId")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Supplier portal data" })
  async getSupplierPortal(
    @Req() req: AuthReq,
    @Param("supplierId") supplierId: string,
  ) {
    return this.svc.getSupplierPortalData(req.user.tenantId, supplierId);
  }

  // ── Consignment Inventory ──
  @Get("consignment")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List consignment inventory" })
  async getConsignment(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getConsignmentInventory(req.user.tenantId, q);
  }

  @Post("consignment")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create consignment record" })
  async createConsignment(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createConsignmentRecord(req.user.tenantId, dto);
  }

  @Post("consignment/:id/reconcile")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Reconcile consignment" })
  async reconcileConsignment(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.reconciledConsignment(req.user.tenantId, id, dto);
  }

  @Post("consignment/:id/terminate")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Terminate consignment arrangement" })
  async terminateConsignment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.terminateConsignment(req.user.tenantId, id);
  }

  // ── Kitting & Assembly (BOM) ──
  @Get("bom")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List BOMs" })
  async getBoms(@Req() req: AuthReq, @Query("productId") productId?: string) {
    return this.svc.getBomDefinitions(req.user.tenantId, { productId });
  }

  @Post("bom")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create BOM" })
  async createBom(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createBom(req.user.tenantId, dto);
  }

  @Patch("bom/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update BOM" })
  async updateBom(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateBom(req.user.tenantId, id, dto);
  }

  @Post("bom/:bomId/components")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Add component to BOM" })
  async addBomComponent(
    @Req() req: AuthReq,
    @Param("bomId") bomId: string,
    @Body() dto: any,
  ) {
    return this.svc.addBomComponent(req.user.tenantId, bomId, dto);
  }

  @Delete("bom/components/:componentId")
  @Permissions("inventory.delete")
  @ApiOperation({ summary: "Remove component from BOM" })
  async removeBomComponent(
    @Req() req: AuthReq,
    @Param("componentId") componentId: string,
  ) {
    return this.svc.removeBomComponent(req.user.tenantId, componentId);
  }

  @Get("kitting-orders")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List kitting orders" })
  async getKittingOrders(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getKittingOrders(req.user.tenantId, q);
  }

  @Post("kitting-orders")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create kitting order" })
  async createKittingOrder(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createKittingOrder(req.user.tenantId, dto);
  }

  @Post("kitting-orders/:id/process")
  @Permissions("inventory.update")
  @ApiOperation({
    summary:
      "Process kitting order (consume components, create finished goods)",
  })
  async processKittingOrder(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.processKittingOrder(req.user.tenantId, id);
  }

  // ── Trade Compliance ──
  @Get("customs-declarations")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List customs declarations" })
  async getCustomsDeclarations(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getCustomsDeclarations(req.user.tenantId, q);
  }

  @Post("customs-declarations")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create customs declaration" })
  async createCustomsDeclaration(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createCustomsDeclaration(req.user.tenantId, dto);
  }

  @Get("trade-compliance/:productId")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get product trade compliance info" })
  async getTradeCompliance(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getTradeCompliance(req.user.tenantId, productId);
  }

  @Post("import-duty-calculator")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Calculate import duty and VAT" })
  async calculateImportDuty(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.getImportDutyCalculator(req.user.tenantId, dto);
  }

  // ── Adjustments & Reservations ──
  @Get("adjustments")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List inventory adjustments" })
  async getAdjustments(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getInventoryAdjustments(req.user.tenantId, q);
  }

  @Post("adjustments")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Create inventory adjustment" })
  async createAdjustment(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createInventoryAdjustment(req.user.tenantId, dto);
  }

  @Post("adjustments/bulk")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Bulk inventory adjustments" })
  async bulkAdjustment(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.bulkInventoryAdjustment(req.user.tenantId, dto);
  }

  @Get("adjustments/product/:productId/history")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Adjustment history for product" })
  async getAdjustmentHistory(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getAdjustmentHistory(req.user.tenantId, productId);
  }

  @Get("reservations")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List inventory reservations" })
  async getReservations(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.svc.getInventoryReservations(req.user.tenantId, productId);
  }

  @Post("reservations")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create inventory reservation" })
  async createReservation(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createReservation(req.user.tenantId, dto);
  }

  @Post("reservations/:id/release")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Release inventory reservation" })
  async releaseReservation(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.releaseReservation(req.user.tenantId, id);
  }
}
