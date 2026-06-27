import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── PRODUCTS ─────────────────────────────────────

  @ApiOperation({ summary: 'Get products' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get inventory stats' })
  @Permissions('inventory.read')
  @Get('products/stats')
  @Permissions('inventory.product.read')
  async getInventoryStats(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getInventoryStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get product by id' })
  @Permissions('inventory.read')
  @Get('products/:id')
  @Permissions('inventory.product.read')
  async getProductById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create product' })
  @Permissions('inventory.create')
  @Post('products')
  @Permissions('inventory.product.create')
  async createProduct(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateProductInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProduct(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update product' })
  @Permissions('inventory.update')
  @Patch('products/:id')
  @Permissions('inventory.product.update')
  async updateProduct(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateProductInput) {
    return this.inventoryService.updateProduct(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete product' })
  @Permissions('inventory.delete')
  @Delete('products/:id')
  @Permissions('inventory.product.delete')
  async deleteProduct(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Bulk action' })
  @Permissions('inventory.create')
  @Post('products/bulk')
  @Permissions('inventory.product.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: BulkActionInput) {
    return this.inventoryService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  // ─── WAREHOUSES ────────────────────────────────────

  @ApiOperation({ summary: 'Get warehouses' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get warehouse by id' })
  @Permissions('inventory.read')
  @Get('warehouses/:id')
  @Permissions('inventory.warehouse.read')
  async getWarehouseById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getWarehouseById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create warehouse' })
  @Permissions('inventory.create')
  @Post('warehouses')
  @Permissions('inventory.warehouse.create')
  async createWarehouse(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateWarehouseInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createWarehouse(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update warehouse' })
  @Permissions('inventory.update')
  @Patch('warehouses/:id')
  @Permissions('inventory.warehouse.update')
  async updateWarehouse(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateWarehouseInput) {
    return this.inventoryService.updateWarehouse(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete warehouse' })
  @Permissions('inventory.delete')
  @Delete('warehouses/:id')
  @Permissions('inventory.warehouse.delete')
  async deleteWarehouse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(req.user.tenantId, id);
  }

  // ─── STOCK LEVELS ──────────────────────────────────

  @ApiOperation({ summary: 'Get stock levels' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get categories' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get category by id' })
  @Permissions('inventory.read')
  @Get('categories/:id')
  @Permissions('inventory.product.read')
  async getCategoryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCategoryById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create category' })
  @Permissions('inventory.create')
  @Post('categories')
  @Permissions('inventory.product.create')
  async createCategory(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCategoryInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createCategory(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update category' })
  @Permissions('inventory.update')
  @Patch('categories/:id')
  @Permissions('inventory.product.update')
  async updateCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCategoryInput) {
    return this.inventoryService.updateCategory(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete category' })
  @Permissions('inventory.delete')
  @Delete('categories/:id')
  @Permissions('inventory.product.delete')
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteCategory(req.user.tenantId, id);
  }

  // ─── VARIANTS ──────────────────────────────────────

  @ApiOperation({ summary: 'Get product variants' })
  @Permissions('inventory.read')
  @Get('products/:id/variants')
  @Permissions('inventory.product.read')
  async getProductVariants(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductVariants(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create product variant' })
  @Permissions('inventory.create')
  @Post('products/variants')
  @Permissions('inventory.product.create')
  async createProductVariant(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateVariantInput) {
    return this.inventoryService.createProductVariant(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update product variant' })
  @Permissions('inventory.update')
  @Patch('variants/:id')
  @Permissions('inventory.product.update')
  async updateProductVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateProductVariant(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete product variant' })
  @Permissions('inventory.delete')
  @Delete('variants/:id')
  @Permissions('inventory.product.delete')
  async deleteProductVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProductVariant(req.user.tenantId, id);
  }

  // ─── UNITS OF MEASURE ───────────────────────────────

  @ApiOperation({ summary: 'Get uo ms' })
  @Permissions('inventory.read')
  @Get('uoms')
  @Permissions('inventory.product.read')
  async getUoMs(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUoMs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create uo m' })
  @Permissions('inventory.create')
  @Post('uoms')
  @Permissions('inventory.product.create')
  async createUoM(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.createUoM(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get uo m conversions' })
  @Permissions('inventory.read')
  @Get('uom-conversions')
  @Permissions('inventory.product.read')
  async getUoMConversions(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUoMConversions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create uo m conversion' })
  @Permissions('inventory.create')
  @Post('uom-conversions')
  @Permissions('inventory.product.create')
  async createUoMConversion(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.createUoMConversion(req.user.tenantId, dto);
  }

  // ─── BIN LOCATIONS ──────────────────────────────────

  @ApiOperation({ summary: 'Get bin locations' })
  @Permissions('inventory.read')
  @Get('bin-locations')
  @Permissions('inventory.warehouse.read')
  async getBinLocations(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getBinLocations(req.user.tenantId, warehouseId);
  }

  @ApiOperation({ summary: 'Get bin location by id' })
  @Permissions('inventory.read')
  @Get('bin-locations/:id')
  @Permissions('inventory.warehouse.read')
  async getBinLocationById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBinLocationById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create bin location' })
  @Permissions('inventory.create')
  @Post('bin-locations')
  @Permissions('inventory.warehouse.create')
  async createBinLocation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateBinLocationInput) {
    return this.inventoryService.createBinLocation(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update bin location' })
  @Permissions('inventory.update')
  @Patch('bin-locations/:id')
  @Permissions('inventory.warehouse.update')
  async updateBinLocation(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateBinLocation(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete bin location' })
  @Permissions('inventory.delete')
  @Delete('bin-locations/:id')
  @Permissions('inventory.warehouse.delete')
  async deleteBinLocation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteBinLocation(req.user.tenantId, id);
  }

  // ─── SERIAL NUMBERS ──────────────────────────────────

  @ApiOperation({ summary: 'Get serial numbers' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get serial number by id' })
  @Permissions('inventory.read')
  @Get('serial-numbers/:id')
  @Permissions('inventory.stock.read')
  async getSerialNumberById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create serial number' })
  @Permissions('inventory.create')
  @Post('serial-numbers')
  @Permissions('inventory.stock.create')
  async createSerialNumber(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSerialNumberInput) {
    return this.inventoryService.createSerialNumber(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update serial number' })
  @Permissions('inventory.update')
  @Patch('serial-numbers/:id')
  @Permissions('inventory.stock.update')
  async updateSerialNumber(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateSerialNumberInput) {
    return this.inventoryService.updateSerialNumber(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Get serial number history' })
  @Permissions('inventory.read')
  @Get('serial-numbers/:id/history')
  @Permissions('inventory.stock.read')
  async getSerialNumberHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberHistory(req.user.tenantId, id);
  }

  // ─── BATCHES ────────────────────────────────────────

  @ApiOperation({ summary: 'Get batches' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get batch by id' })
  @Permissions('inventory.read')
  @Get('batches/:id')
  @Permissions('inventory.stock.read')
  async getBatchById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create batch' })
  @Permissions('inventory.create')
  @Post('batches')
  @Permissions('inventory.stock.create')
  async createBatch(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateBatchInput) {
    return this.inventoryService.createBatch(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update batch' })
  @Permissions('inventory.update')
  @Patch('batches/:id')
  @Permissions('inventory.stock.update')
  async updateBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateBatchInput) {
    return this.inventoryService.updateBatch(req.user.tenantId, id, dto);
  }

  // ─── STOCK ENTRIES ───────────────────────────────────

  @ApiOperation({ summary: 'Get stock entries' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get stock entry by id' })
  @Permissions('inventory.read')
  @Get('stock-entries/:id')
  @Permissions('inventory.stock.read')
  async getStockEntryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getStockEntryById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create stock entry' })
  @Permissions('inventory.create')
  @Post('stock-entries')
  @Permissions('inventory.stock.create')
  async createStockEntry(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateStockEntryInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createStockEntry(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Submit stock entry' })
  @Permissions('inventory.create')
  @Post('stock-entries/:id/submit')
  @Permissions('inventory.stock.update')
  async submitStockEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.submitStockEntry(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Cancel stock entry' })
  @Permissions('inventory.create')
  @Post('stock-entries/:id/cancel')
  @Permissions('inventory.stock.update')
  async cancelStockEntry(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.inventoryService.cancelStockEntry(req.user.tenantId, id, req.user.userId, reason);
  }

  @ApiOperation({ summary: 'Get stock ledger' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Transfer stock' })
  @Permissions('inventory.create')
  @Post('transfers')
  @Permissions('inventory.stock.create')
  async transferStock(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: TransferStockInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.transferStock(req.user.tenantId, orgId, req.user.userId, dto);
  }

  // ─── CYCLE COUNTS ───────────────────────────────────

  @ApiOperation({ summary: 'Get cycle counts' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get cycle count by id' })
  @Permissions('inventory.read')
  @Get('cycle-counts/:id')
  @Permissions('inventory.stock.read')
  async getCycleCountById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCycleCountById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create cycle count' })
  @Permissions('inventory.create')
  @Post('cycle-counts')
  @Permissions('inventory.stock.create')
  async createCycleCount(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCycleCountInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createCycleCount(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Submit cycle count' })
  @Permissions('inventory.create')
  @Post('cycle-counts/:id/submit')
  @Permissions('inventory.stock.update')
  async submitCycleCount(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: SubmitCycleCountInput,
  ) {
    return this.inventoryService.submitCycleCount(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Approve cycle count' })
  @Permissions('inventory.create')
  @Post('cycle-counts/:id/approve')
  @Permissions('inventory.stock.update')
  async approveCycleCount(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.approveCycleCount(req.user.tenantId, id, req.user.userId);
  }

  // ─── QA INSPECTIONS ─────────────────────────────────

  @ApiOperation({ summary: 'Get q a inspections' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get q a inspection by id' })
  @Permissions('inventory.read')
  @Get('qa-inspections/:id')
  @Permissions('inventory.stock.read')
  async getQAInspectionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getQAInspectionById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create q a inspection' })
  @Permissions('inventory.create')
  @Post('qa-inspections')
  @Permissions('inventory.stock.create')
  async createQAInspection(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateQAInspectionInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createQAInspection(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Submit q a inspection' })
  @Permissions('inventory.create')
  @Post('qa-inspections/:id/submit')
  @Permissions('inventory.stock.update')
  async submitQAInspection(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: SubmitQAInspectionInput,
  ) {
    return this.inventoryService.submitQAInspection(req.user.tenantId, id, req.user.userId, dto);
  }

  // ─── REORDER RULES ──────────────────────────────────

  @ApiOperation({ summary: 'Get reorder rules' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Create reorder rule' })
  @Permissions('inventory.create')
  @Post('reorder-rules')
  @Permissions('inventory.product.create')
  async createReorderRule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateReorderRuleInput) {
    return this.inventoryService.createReorderRule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update reorder rule' })
  @Permissions('inventory.update')
  @Patch('reorder-rules/:id')
  @Permissions('inventory.product.update')
  async updateReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateReorderRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete reorder rule' })
  @Permissions('inventory.delete')
  @Delete('reorder-rules/:id')
  @Permissions('inventory.product.delete')
  async deleteReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteReorderRule(req.user.tenantId, id);
  }

  // ─── STOCK ALERTS ───────────────────────────────────

  @ApiOperation({ summary: 'Get stock alerts' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Resolve stock alert' })
  @Permissions('inventory.create')
  @Post('alerts/:id/resolve')
  @Permissions('inventory.stock.update')
  async resolveStockAlert(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.resolveStockAlert(req.user.tenantId, id);
  }

  // ─── PRODUCT KITS ───────────────────────────────────

  @ApiOperation({ summary: 'Get product kits' })
  @Permissions('inventory.read')
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

  @ApiOperation({ summary: 'Get product kit by id' })
  @Permissions('inventory.read')
  @Get('kits/:id')
  @Permissions('inventory.product.read')
  async getProductKitById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductKitById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create product kit' })
  @Permissions('inventory.create')
  @Post('kits')
  @Permissions('inventory.product.create')
  async createProductKit(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateKitInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProductKit(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update product kit' })
  @Permissions('inventory.update')
  @Patch('kits/:id')
  @Permissions('inventory.product.update')
  async updateProductKit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateProductKit(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete product kit' })
  @Permissions('inventory.delete')
  @Delete('kits/:id')
  @Permissions('inventory.product.delete')
  async deleteProductKit(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProductKit(req.user.tenantId, id);
  }

  // ─── VALUATION & REPORTS ────────────────────────────

  @ApiOperation({ summary: 'Get valuation report' })
  @Permissions('inventory.read')
  @Get('valuations')
  @Permissions('inventory.stock.read')
  async getValuationReport(
    @Req() req: AuthenticatedRequest,
    @Query('warehouseId') warehouseId?: string,
    @Query('method') method?: string,
  ) {
    return this.inventoryService.getValuationReport(req.user.tenantId, { warehouseId, method });
  }

  @ApiOperation({ summary: 'Get inventory aging' })
  @Permissions('inventory.read')
  @Get('aging')
  @Permissions('inventory.stock.read')
  async getInventoryAging(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getInventoryAging(req.user.tenantId, { warehouseId });
  }
}