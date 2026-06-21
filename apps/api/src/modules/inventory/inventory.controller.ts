import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { InventoryService } from './inventory.service';
import {
  CreateProductInput, UpdateProductInput,
  CreateWarehouseInput, UpdateWarehouseInput,
  CreateCategoryInput, UpdateCategoryInput,
  CreateVariantInput, CreateBinLocationInput,
  CreateSerialNumberInput, UpdateSerialNumberInput,
  CreateBatchInput, UpdateBatchInput,
  CreateCycleCountInput, SubmitCycleCountInput,
  CreateQAInspectionInput, SubmitQAInspectionInput,
  CreateReorderRuleInput, CreateKitInput,
  CreateStockEntryInput,
  TransferStockInput,
  BulkActionInput,
} from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── PRODUCTS ─────────────────────────────────────

  @Get('products')
  @Permissions('inventory.product.read')
  async getProducts(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return this.inventoryService.getProducts(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort, search, type, category,
    });
  }

  @Get('products/stats')
  @Permissions('inventory.product.read')
  async getInventoryStats(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getInventoryStats(req.user.tenantId);
  }

  @Get('products/:id')
  @Permissions('inventory.product.read')
  async getProductById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductById(req.user.tenantId, id);
  }

  @Post('products')
  @Permissions('inventory.product.create')
  async createProduct(@Req() req: AuthenticatedRequest, @Body() dto: CreateProductInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProduct(req.user.tenantId, orgId, dto);
  }

  @Patch('products/:id')
  @Permissions('inventory.product.update')
  async updateProduct(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateProductInput) {
    return this.inventoryService.updateProduct(req.user.tenantId, id, dto);
  }

  @Delete('products/:id')
  @Permissions('inventory.product.delete')
  async deleteProduct(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(req.user.tenantId, id);
  }

  @Post('products/bulk')
  @Permissions('inventory.product.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @Body() dto: BulkActionInput) {
    return this.inventoryService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  // ─── WAREHOUSES ────────────────────────────────────

  @Get('warehouses')
  @Permissions('inventory.warehouse.read')
  async getWarehouses(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getWarehouses(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('warehouses/:id')
  @Permissions('inventory.warehouse.read')
  async getWarehouseById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getWarehouseById(req.user.tenantId, id);
  }

  @Post('warehouses')
  @Permissions('inventory.warehouse.create')
  async createWarehouse(@Req() req: AuthenticatedRequest, @Body() dto: CreateWarehouseInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createWarehouse(req.user.tenantId, orgId, dto);
  }

  @Patch('warehouses/:id')
  @Permissions('inventory.warehouse.update')
  async updateWarehouse(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateWarehouseInput) {
    return this.inventoryService.updateWarehouse(req.user.tenantId, id, dto);
  }

  @Delete('warehouses/:id')
  @Permissions('inventory.warehouse.delete')
  async deleteWarehouse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(req.user.tenantId, id);
  }

  // ─── STOCK LEVELS ──────────────────────────────────

  @Get('stock-levels')
  @Permissions('inventory.stock.read')
  async getStockLevels(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getStockLevels(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search, warehouseId,
    });
  }

  // ─── CATEGORIES ────────────────────────────────────

  @Get('categories')
  @Permissions('inventory.product.read')
  async getCategories(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getCategories(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('categories/:id')
  @Permissions('inventory.product.read')
  async getCategoryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCategoryById(req.user.tenantId, id);
  }

  @Post('categories')
  @Permissions('inventory.product.create')
  async createCategory(@Req() req: AuthenticatedRequest, @Body() dto: CreateCategoryInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createCategory(req.user.tenantId, orgId, dto);
  }

  @Patch('categories/:id')
  @Permissions('inventory.product.update')
  async updateCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCategoryInput) {
    return this.inventoryService.updateCategory(req.user.tenantId, id, dto);
  }

  @Delete('categories/:id')
  @Permissions('inventory.product.delete')
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteCategory(req.user.tenantId, id);
  }

  // ─── VARIANTS ──────────────────────────────────────

  @Get('products/:id/variants')
  @Permissions('inventory.product.read')
  async getProductVariants(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductVariants(req.user.tenantId, id);
  }

  @Post('products/variants')
  @Permissions('inventory.product.create')
  async createProductVariant(@Req() req: AuthenticatedRequest, @Body() dto: CreateVariantInput) {
    return this.inventoryService.createProductVariant(req.user.tenantId, dto);
  }

  @Patch('variants/:id')
  @Permissions('inventory.product.update')
  async updateProductVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateProductVariant(req.user.tenantId, id, dto);
  }

  @Delete('variants/:id')
  @Permissions('inventory.product.delete')
  async deleteProductVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProductVariant(req.user.tenantId, id);
  }

  // ─── UNITS OF MEASURE ───────────────────────────────

  @Get('uoms')
  @Permissions('inventory.product.read')
  async getUoMs(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUoMs(req.user.tenantId);
  }

  @Post('uoms')
  @Permissions('inventory.product.create')
  async createUoM(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.inventoryService.createUoM(req.user.tenantId, dto);
  }

  @Get('uom-conversions')
  @Permissions('inventory.product.read')
  async getUoMConversions(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUoMConversions(req.user.tenantId);
  }

  @Post('uom-conversions')
  @Permissions('inventory.product.create')
  async createUoMConversion(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.inventoryService.createUoMConversion(req.user.tenantId, dto);
  }

  // ─── BIN LOCATIONS ──────────────────────────────────

  @Get('bin-locations')
  @Permissions('inventory.warehouse.read')
  async getBinLocations(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getBinLocations(req.user.tenantId, warehouseId);
  }

  @Get('bin-locations/:id')
  @Permissions('inventory.warehouse.read')
  async getBinLocationById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBinLocationById(req.user.tenantId, id);
  }

  @Post('bin-locations')
  @Permissions('inventory.warehouse.create')
  async createBinLocation(@Req() req: AuthenticatedRequest, @Body() dto: CreateBinLocationInput) {
    return this.inventoryService.createBinLocation(req.user.tenantId, dto);
  }

  @Patch('bin-locations/:id')
  @Permissions('inventory.warehouse.update')
  async updateBinLocation(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateBinLocation(req.user.tenantId, id, dto);
  }

  @Delete('bin-locations/:id')
  @Permissions('inventory.warehouse.delete')
  async deleteBinLocation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteBinLocation(req.user.tenantId, id);
  }

  // ─── SERIAL NUMBERS ──────────────────────────────────

  @Get('serial-numbers')
  @Permissions('inventory.stock.read')
  async getSerialNumbers(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getSerialNumbers(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      productId, status, search,
    });
  }

  @Get('serial-numbers/:id')
  @Permissions('inventory.stock.read')
  async getSerialNumberById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberById(req.user.tenantId, id);
  }

  @Post('serial-numbers')
  @Permissions('inventory.stock.create')
  async createSerialNumber(@Req() req: AuthenticatedRequest, @Body() dto: CreateSerialNumberInput) {
    return this.inventoryService.createSerialNumber(req.user.tenantId, dto);
  }

  @Patch('serial-numbers/:id')
  @Permissions('inventory.stock.update')
  async updateSerialNumber(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateSerialNumberInput) {
    return this.inventoryService.updateSerialNumber(req.user.tenantId, id, dto);
  }

  @Get('serial-numbers/:id/history')
  @Permissions('inventory.stock.read')
  async getSerialNumberHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberHistory(req.user.tenantId, id);
  }

  // ─── BATCHES ────────────────────────────────────────

  @Get('batches')
  @Permissions('inventory.stock.read')
  async getBatches(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getBatches(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      productId, status, search,
    });
  }

  @Get('batches/:id')
  @Permissions('inventory.stock.read')
  async getBatchById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchById(req.user.tenantId, id);
  }

  @Post('batches')
  @Permissions('inventory.stock.create')
  async createBatch(@Req() req: AuthenticatedRequest, @Body() dto: CreateBatchInput) {
    return this.inventoryService.createBatch(req.user.tenantId, dto);
  }

  @Patch('batches/:id')
  @Permissions('inventory.stock.update')
  async updateBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateBatchInput) {
    return this.inventoryService.updateBatch(req.user.tenantId, id, dto);
  }

  // ─── STOCK ENTRIES ───────────────────────────────────

  @Get('stock-entries')
  @Permissions('inventory.stock.read')
  async getStockEntries(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getStockEntries(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      type, status, search,
    });
  }

  @Get('stock-entries/:id')
  @Permissions('inventory.stock.read')
  async getStockEntryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getStockEntryById(req.user.tenantId, id);
  }

  @Post('stock-entries')
  @Permissions('inventory.stock.create')
  async createStockEntry(@Req() req: AuthenticatedRequest, @Body() dto: CreateStockEntryInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createStockEntry(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @Post('stock-entries/:id/submit')
  @Permissions('inventory.stock.update')
  async submitStockEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.submitStockEntry(req.user.tenantId, id, req.user.userId);
  }

  @Post('stock-entries/:id/cancel')
  @Permissions('inventory.stock.update')
  async cancelStockEntry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.inventoryService.cancelStockEntry(req.user.tenantId, id, req.user.userId, reason);
  }

  @Get('stock-ledger')
  @Permissions('inventory.stock.read')
  async getStockLedger(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getStockLedger(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      productId, warehouseId, search,
    });
  }

  @Post('transfers')
  @Permissions('inventory.stock.create')
  async transferStock(@Req() req: AuthenticatedRequest, @Body() dto: TransferStockInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.transferStock(req.user.tenantId, orgId, req.user.userId, dto);
  }

  // ─── CYCLE COUNTS ───────────────────────────────────

  @Get('cycle-counts')
  @Permissions('inventory.stock.read')
  async getCycleCounts(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getCycleCounts(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      warehouseId, status,
    });
  }

  @Get('cycle-counts/:id')
  @Permissions('inventory.stock.read')
  async getCycleCountById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCycleCountById(req.user.tenantId, id);
  }

  @Post('cycle-counts')
  @Permissions('inventory.stock.create')
  async createCycleCount(@Req() req: AuthenticatedRequest, @Body() dto: CreateCycleCountInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createCycleCount(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @Post('cycle-counts/:id/submit')
  @Permissions('inventory.stock.update')
  async submitCycleCount(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitCycleCountInput,
  ) {
    return this.inventoryService.submitCycleCount(req.user.tenantId, id, req.user.userId, dto);
  }

  @Post('cycle-counts/:id/approve')
  @Permissions('inventory.stock.update')
  async approveCycleCount(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.approveCycleCount(req.user.tenantId, id, req.user.userId);
  }

  // ─── QA INSPECTIONS ─────────────────────────────────

  @Get('qa-inspections')
  @Permissions('inventory.stock.read')
  async getQAInspections(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getQAInspections(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status, search,
    });
  }

  @Get('qa-inspections/:id')
  @Permissions('inventory.stock.read')
  async getQAInspectionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getQAInspectionById(req.user.tenantId, id);
  }

  @Post('qa-inspections')
  @Permissions('inventory.stock.create')
  async createQAInspection(@Req() req: AuthenticatedRequest, @Body() dto: CreateQAInspectionInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createQAInspection(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @Post('qa-inspections/:id/submit')
  @Permissions('inventory.stock.update')
  async submitQAInspection(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitQAInspectionInput,
  ) {
    return this.inventoryService.submitQAInspection(req.user.tenantId, id, req.user.userId, dto);
  }

  // ─── REORDER RULES ──────────────────────────────────

  @Get('reorder-rules')
  @Permissions('inventory.product.read')
  async getReorderRules(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getReorderRules(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('reorder-rules')
  @Permissions('inventory.product.create')
  async createReorderRule(@Req() req: AuthenticatedRequest, @Body() dto: CreateReorderRuleInput) {
    return this.inventoryService.createReorderRule(req.user.tenantId, dto);
  }

  @Patch('reorder-rules/:id')
  @Permissions('inventory.product.update')
  async updateReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateReorderRule(req.user.tenantId, id, dto);
  }

  @Delete('reorder-rules/:id')
  @Permissions('inventory.product.delete')
  async deleteReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteReorderRule(req.user.tenantId, id);
  }

  // ─── STOCK ALERTS ───────────────────────────────────

  @Get('alerts')
  @Permissions('inventory.stock.read')
  async getStockAlerts(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isResolved') isResolved?: string,
  ) {
    const resolved = isResolved === 'true' ? true : isResolved === 'false' ? false : undefined;
    return this.inventoryService.getStockAlerts(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      isResolved: resolved,
    });
  }

  @Post('alerts/:id/resolve')
  @Permissions('inventory.stock.update')
  async resolveStockAlert(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.resolveStockAlert(req.user.tenantId, id);
  }

  // ─── PRODUCT KITS ───────────────────────────────────

  @Get('kits')
  @Permissions('inventory.product.read')
  async getProductKits(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getProductKits(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('kits/:id')
  @Permissions('inventory.product.read')
  async getProductKitById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductKitById(req.user.tenantId, id);
  }

  @Post('kits')
  @Permissions('inventory.product.create')
  async createProductKit(@Req() req: AuthenticatedRequest, @Body() dto: CreateKitInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProductKit(req.user.tenantId, orgId, dto);
  }

  @Patch('kits/:id')
  @Permissions('inventory.product.update')
  async updateProductKit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.updateProductKit(req.user.tenantId, id, dto);
  }

  @Delete('kits/:id')
  @Permissions('inventory.product.delete')
  async deleteProductKit(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProductKit(req.user.tenantId, id);
  }

  // ─── VALUATION & REPORTS ────────────────────────────

  @Get('valuations')
  @Permissions('inventory.stock.read')
  async getValuationReport(
    @Req() req: AuthenticatedRequest,
    @Query('warehouseId') warehouseId?: string,
    @Query('method') method?: string,
  ) {
    return this.inventoryService.getValuationReport(req.user.tenantId, { warehouseId, method });
  }

  @Get('aging')
  @Permissions('inventory.stock.read')
  async getInventoryAging(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getInventoryAging(req.user.tenantId, { warehouseId });
  }
}