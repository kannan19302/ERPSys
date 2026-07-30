// @ts-nocheck
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
import { InventoryQualityComplianceService } from "./inventory-quality-compliance.service";
import { Request } from "express";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles: string[] };
}

@ApiTags("inventory-quality-compliance")
@ApiBearerAuth()
@Controller("inventory/quality")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryQualityComplianceController {
  constructor(private readonly svc: InventoryQualityComplianceService) {}

  // ── Quality Dashboard ──
  @Get("dashboard")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Quality management dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getQualityDashboard(req.user.tenantId);
  }

  // ── Quality Inspections ──
  @Get("inspections")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "List quality inspections" })
  async getInspections(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getQualityInspections(req.user.tenantId, q);
  }

  @Post("inspections")
  @Permissions("inventory.quality.create")
  @ApiOperation({ summary: "Create quality inspection" })
  async createInspection(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createInspection(req.user.tenantId, dto);
  }

  @Post("inspections/:id/result")
  @Permissions("inventory.quality.update")
  @ApiOperation({ summary: "Submit inspection result" })
  async submitResult(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.submitInspectionResult(req.user.tenantId, id, dto);
  }

  @Get("checksheets")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "List inspection checksheets" })
  async getChecksheets(@Req() req: AuthReq) {
    return this.svc.getInspectionChecksheets(req.user.tenantId);
  }

  @Post("checksheets")
  @Permissions("inventory.quality.create")
  @ApiOperation({ summary: "Create inspection checksheet" })
  async createChecksheet(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createInspectionChecksheet(req.user.tenantId, dto);
  }

  @Patch("checksheets/:id")
  @Permissions("inventory.quality.update")
  @ApiOperation({ summary: "Update checksheet" })
  async updateChecksheet(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateInspectionChecksheet(req.user.tenantId, id, dto);
  }

  @Get("alerts")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Quality alerts" })
  async getAlerts(@Req() req: AuthReq) {
    return this.svc.getQualityAlerts(req.user.tenantId);
  }

  @Get("supplier-scorecard")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Supplier quality scorecard" })
  async getSupplierScorecard(
    @Req() req: AuthReq,
    @Query("supplierId") supplierId?: string,
  ) {
    return this.svc.getSupplierQualityScorecard(req.user.tenantId, supplierId);
  }

  @Get("trend")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Quality trend over time" })
  async getTrend(@Req() req: AuthReq, @Query("months") months: string) {
    return this.svc.getQualityTrend(req.user.tenantId, parseInt(months) || 6);
  }

  // ── NCR Management ──
  @Get("ncr")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "List NCRs" })
  async getNcrs(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getNonConformanceReports(req.user.tenantId, q);
  }

  @Post("ncr")
  @Permissions("inventory.quality.create")
  @ApiOperation({ summary: "Create NCR" })
  async createNcr(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createNcr(req.user.tenantId, dto);
  }

  @Post("ncr/:id/resolve")
  @Permissions("inventory.quality.update")
  @ApiOperation({ summary: "Resolve NCR" })
  async resolveNcr(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.resolveNcr(req.user.tenantId, id, dto);
  }

  @Get("corrective-actions")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "List corrective actions" })
  async getCorrectiveActions(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getCorrectiveActions(req.user.tenantId, q);
  }

  @Post("corrective-actions")
  @Permissions("inventory.quality.create")
  @ApiOperation({ summary: "Create corrective action" })
  async createCorrectiveAction(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createCorrectiveAction(req.user.tenantId, dto);
  }

  @Post("corrective-actions/:id/close")
  @Permissions("inventory.quality.update")
  @ApiOperation({ summary: "Close corrective action" })
  async closeCA(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.closeCorrectiveAction(req.user.tenantId, id, dto);
  }

  // ── Product Catalog ──
  @Get("products")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Product catalog" })
  async getCatalog(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getProductCatalog(req.user.tenantId, q);
  }

  @Get("products/:id")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get product by ID" })
  async getProductById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getProductById(req.user.tenantId, id);
  }

  @Post("products")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create product" })
  async createProduct(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createProduct(req.user.tenantId, dto);
  }

  @Patch("products/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update product" })
  async updateProduct(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateProduct(req.user.tenantId, id, dto);
  }

  @Post("products/:id/deactivate")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Deactivate product" })
  async deactivateProduct(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deactivateProduct(req.user.tenantId, id);
  }

  @Get("products/barcode/:barcode")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Lookup product by barcode" })
  async getByBarcode(@Req() req: AuthReq, @Param("barcode") barcode: string) {
    return this.svc.getProductByBarcode(req.user.tenantId, barcode);
  }

  @Get("products/:productId/stock-summary")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Product stock summary across warehouses" })
  async getStockSummary(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getProductStockSummary(req.user.tenantId, productId);
  }

  @Get("products/:productId/movement")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Product movement history" })
  async getMovementHistory(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
    @Query("days") days: string,
  ) {
    return this.svc.getProductMovementHistory(
      req.user.tenantId,
      productId,
      parseInt(days) || 30,
    );
  }

  // ── Product Categories ──
  @Get("categories")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List product categories" })
  async getCategories(@Req() req: AuthReq) {
    return this.svc.getProductCategories(req.user.tenantId);
  }

  @Post("categories")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Create product category" })
  async createCategory(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.createProductCategory(req.user.tenantId, dto);
  }

  @Patch("categories/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update product category" })
  async updateCategory(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateProductCategory(req.user.tenantId, id, dto);
  }

  // ── Product Attributes ──
  @Get("products/:productId/attributes")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get product attributes" })
  async getAttributes(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getProductAttributes(req.user.tenantId, productId);
  }

  @Post("product-attributes")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Add product attribute" })
  async addAttribute(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.addProductAttribute(req.user.tenantId, dto);
  }

  @Patch("product-attributes/:id")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Update product attribute" })
  async updateAttribute(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.svc.updateProductAttribute(req.user.tenantId, id, dto);
  }

  @Delete("product-attributes/:id")
  @Permissions("inventory.delete")
  @ApiOperation({ summary: "Delete product attribute" })
  async deleteAttribute(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteProductAttribute(req.user.tenantId, id);
  }

  // ── Product Pricing ──
  @Get("products/:productId/pricing")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get product pricing history" })
  async getPricing(@Req() req: AuthReq, @Param("productId") productId: string) {
    return this.svc.getProductPricing(req.user.tenantId, productId);
  }

  @Post("product-pricing")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Set product price" })
  async setPricing(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.setProductPricing(req.user.tenantId, dto);
  }

  @Post("products/bulk-price-update")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Bulk update product prices" })
  async bulkPriceUpdate(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.bulkUpdateProductPrices(req.user.tenantId, dto);
  }

  // ── Alternatives & Images ──
  @Get("products/:productId/alternatives")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get product alternatives" })
  async getAlternatives(
    @Req() req: AuthReq,
    @Param("productId") productId: string,
  ) {
    return this.svc.getProductAlternatives(req.user.tenantId, productId);
  }

  @Post("product-alternatives")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Add product alternative" })
  async addAlternative(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.addProductAlternative(req.user.tenantId, dto);
  }

  @Get("products/:productId/images")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "Get product images" })
  async getImages(@Req() req: AuthReq, @Param("productId") productId: string) {
    return this.svc.getProductImages(req.user.tenantId, productId);
  }

  @Post("product-images")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Add product image" })
  async addImage(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.addProductImage(req.user.tenantId, dto);
  }

  // ── Labels & Barcodes ──
  @Get("labels")
  @Permissions("inventory.read")
  @ApiOperation({ summary: "List inventory labels" })
  async getLabels(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getLabels(req.user.tenantId, q);
  }

  @Post("labels/generate")
  @Permissions("inventory.create")
  @ApiOperation({ summary: "Generate label" })
  async generateLabel(@Req() req: AuthReq, @Body() dto: any) {
    return this.svc.generateLabel(req.user.tenantId, dto);
  }

  @Post("labels/:labelId/print")
  @Permissions("inventory.update")
  @ApiOperation({ summary: "Record label print" })
  async recordPrint(@Req() req: AuthReq, @Param("labelId") labelId: string) {
    return this.svc.recordLabelPrint(req.user.tenantId, labelId);
  }

  // ── Compliance Reports ──
  @Get("reports/compliance-overview")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Quality & compliance overview" })
  async getComplianceOverview(@Req() req: AuthReq) {
    return this.svc.getComplianceOverview(req.user.tenantId);
  }

  @Get("reports/product-compliance")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Product compliance report" })
  async getProductCompliance(@Req() req: AuthReq) {
    return this.svc.getProductComplianceReport(req.user.tenantId);
  }

  @Get("reports/hazmat-inventory")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Hazardous materials inventory" })
  async getHazmatInventory(@Req() req: AuthReq) {
    return this.svc.getHazmatInventory(req.user.tenantId);
  }

  @Get("reports/expiry-management")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Expiry management report" })
  async getExpiryReport(@Req() req: AuthReq) {
    return this.svc.getExpiryManagementReport(req.user.tenantId);
  }

  @Get("reports/audit-log")
  @Permissions("inventory.quality.read")
  @ApiOperation({ summary: "Inventory compliance audit log" })
  async getAuditLog(@Req() req: AuthReq) {
    return this.svc.getInventoryComplianceAuditLog(req.user.tenantId);
  }
}
