import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { InventoryService } from './inventory.service';
import { InventoryWarehousesService } from './inventory-warehouses.service';
import {
  CreateProductInput, UpdateProductInput,
  CreateWarehouseInput, UpdateWarehouseInput,
  CreateCategoryInput, UpdateCategoryInput,
  CreateVariantInput, CreateBinLocationInput,
  CreateSerialNumberInput, UpdateSerialNumberInput,
  CreateBatchInput, UpdateBatchInput,
  CreateCycleCountInput, SubmitCycleCountInput,
  CreateCycleCountScheduleInput, UpdateCycleCountScheduleInput,
  CreateLicensePlateInput, AddLicensePlateItemInput, MoveLicensePlateInput,
  CreatePutawayTaskInput, CompletePutawayTaskInput,
  QuarantineBatchInput, ReleaseBatchQuarantineInput,
  CreateStockReservationInput,
  AssembleKitInput, DisassembleKitInput,
  CreateTransferApprovalRuleInput, UpdateTransferApprovalRuleInput, RejectTransferInput,
  CreatePickWaveInput, RecordPickInput,
  CreateConsignmentStockInput, RecordConsignmentConsumptionInput,
  ReceiveWithTraceabilityInput,
  CreateQAInspectionTemplateInput, UpdateQAInspectionTemplateInput,
  CreateRequisitionFromReorderRuleInput,
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
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inventoryWarehousesService: InventoryWarehousesService,
  ) {}

  // ─── PRODUCTS ─────────────────────────────────────

  @ApiOperation({ summary: 'Get products' })
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
  @Get('products/stats')
  @Permissions('inventory.product.read')
  async getInventoryStats(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getInventoryStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get product by id' })
  @Get('products/:id')
  @Permissions('inventory.product.read')
  async getProductById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create product' })
  @Post('products')
  @Permissions('inventory.product.create')
  async createProduct(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateProductInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProduct(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update product' })
  @Patch('products/:id')
  @Permissions('inventory.product.update')
  async updateProduct(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateProductInput) {
    return this.inventoryService.updateProduct(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete product' })
  @Delete('products/:id')
  @Permissions('inventory.product.delete')
  async deleteProduct(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Bulk action' })
  @Post('products/bulk')
  @Permissions('inventory.product.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: BulkActionInput) {
    return this.inventoryService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  // ─── WAREHOUSES ────────────────────────────────────

  @ApiOperation({ summary: 'Get warehouses' })
  @Get('warehouses')
  @Permissions('inventory.warehouse.read')
  async getWarehouses(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryWarehousesService.getWarehouses(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get warehouse by id' })
  @Get('warehouses/:id')
  @Permissions('inventory.warehouse.read')
  async getWarehouseById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryWarehousesService.getWarehouseById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create warehouse' })
  @Post('warehouses')
  @Permissions('inventory.warehouse.create')
  async createWarehouse(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateWarehouseInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryWarehousesService.createWarehouse(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update warehouse' })
  @Patch('warehouses/:id')
  @Permissions('inventory.warehouse.update')
  async updateWarehouse(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateWarehouseInput) {
    return this.inventoryWarehousesService.updateWarehouse(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete warehouse' })
  @Delete('warehouses/:id')
  @Permissions('inventory.warehouse.delete')
  async deleteWarehouse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryWarehousesService.deleteWarehouse(req.user.tenantId, id);
  }

  // ─── STOCK LEVELS ──────────────────────────────────

  @ApiOperation({ summary: 'Get stock levels' })
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
  @Get('categories/:id')
  @Permissions('inventory.product.read')
  async getCategoryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCategoryById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create category' })
  @Post('categories')
  @Permissions('inventory.product.create')
  async createCategory(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCategoryInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createCategory(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update category' })
  @Patch('categories/:id')
  @Permissions('inventory.product.update')
  async updateCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCategoryInput) {
    return this.inventoryService.updateCategory(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete category' })
  @Delete('categories/:id')
  @Permissions('inventory.product.delete')
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteCategory(req.user.tenantId, id);
  }

  // ─── VARIANTS ──────────────────────────────────────

  @ApiOperation({ summary: 'Get product variants' })
  @Get('products/:id/variants')
  @Permissions('inventory.product.read')
  async getProductVariants(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductVariants(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create product variant' })
  @Post('products/variants')
  @Permissions('inventory.product.create')
  async createProductVariant(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateVariantInput) {
    return this.inventoryService.createProductVariant(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update product variant' })
  @Patch('variants/:id')
  @Permissions('inventory.product.update')
  async updateProductVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateProductVariant(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete product variant' })
  @Delete('variants/:id')
  @Permissions('inventory.product.delete')
  async deleteProductVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProductVariant(req.user.tenantId, id);
  }

  // ─── UNITS OF MEASURE ───────────────────────────────

  @ApiOperation({ summary: 'Get uo ms' })
  @Get('uoms')
  @Permissions('inventory.product.read')
  async getUoMs(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUoMs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create uo m' })
  @Post('uoms')
  @Permissions('inventory.product.create')
  async createUoM(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.createUoM(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get uo m conversions' })
  @Get('uom-conversions')
  @Permissions('inventory.product.read')
  async getUoMConversions(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUoMConversions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create uo m conversion' })
  @Post('uom-conversions')
  @Permissions('inventory.product.create')
  async createUoMConversion(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.createUoMConversion(req.user.tenantId, dto);
  }

  // ─── BIN LOCATIONS ──────────────────────────────────

  @ApiOperation({ summary: 'Get bin locations' })
  @Get('bin-locations')
  @Permissions('inventory.warehouse.read')
  async getBinLocations(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getBinLocations(req.user.tenantId, warehouseId);
  }

  @ApiOperation({ summary: 'Get bin location by id' })
  @Get('bin-locations/:id')
  @Permissions('inventory.warehouse.read')
  async getBinLocationById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBinLocationById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create bin location' })
  @Post('bin-locations')
  @Permissions('inventory.warehouse.create')
  async createBinLocation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateBinLocationInput) {
    return this.inventoryService.createBinLocation(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update bin location' })
  @Patch('bin-locations/:id')
  @Permissions('inventory.warehouse.update')
  async updateBinLocation(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateBinLocation(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete bin location' })
  @Delete('bin-locations/:id')
  @Permissions('inventory.warehouse.delete')
  async deleteBinLocation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteBinLocation(req.user.tenantId, id);
  }

  // ─── SERIAL NUMBERS ──────────────────────────────────

  @ApiOperation({ summary: 'Get serial numbers' })
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
  @Get('serial-numbers/:id')
  @Permissions('inventory.stock.read')
  async getSerialNumberById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create serial number' })
  @Post('serial-numbers')
  @Permissions('inventory.stock.create')
  async createSerialNumber(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSerialNumberInput) {
    return this.inventoryService.createSerialNumber(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update serial number' })
  @Patch('serial-numbers/:id')
  @Permissions('inventory.stock.update')
  async updateSerialNumber(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateSerialNumberInput) {
    return this.inventoryService.updateSerialNumber(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Get serial number history' })
  @Get('serial-numbers/:id/history')
  @Permissions('inventory.stock.read')
  async getSerialNumberHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberHistory(req.user.tenantId, id);
  }

  // ─── BATCHES ────────────────────────────────────────

  @ApiOperation({ summary: 'Get batches' })
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
  @Get('batches/:id')
  @Permissions('inventory.stock.read')
  async getBatchById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create batch' })
  @Post('batches')
  @Permissions('inventory.stock.create')
  async createBatch(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateBatchInput) {
    return this.inventoryService.createBatch(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update batch' })
  @Patch('batches/:id')
  @Permissions('inventory.stock.update')
  async updateBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateBatchInput) {
    return this.inventoryService.updateBatch(req.user.tenantId, id, dto);
  }

  // ─── STOCK ENTRIES ───────────────────────────────────

  @ApiOperation({ summary: 'Get stock entries' })
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
  @Get('stock-entries/:id')
  @Permissions('inventory.stock.read')
  async getStockEntryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getStockEntryById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create stock entry' })
  @Post('stock-entries')
  @Permissions('inventory.stock.create')
  async createStockEntry(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateStockEntryInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createStockEntry(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Submit stock entry' })
  @Post('stock-entries/:id/submit')
  @Permissions('inventory.stock.update')
  async submitStockEntry(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.submitStockEntry(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Cancel stock entry' })
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
  @Post('transfers')
  @Permissions('inventory.stock.create')
  async transferStock(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: TransferStockInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.transferStock(req.user.tenantId, orgId, req.user.userId, dto);
  }

  // ─── TRANSFER APPROVAL WORKFLOW ──────────────────────

  @ApiOperation({ summary: 'Get transfer approval rules' })
  @Get('transfer-approval-rules')
  @Permissions('inventory.stock.read')
  async getTransferApprovalRules(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getTransferApprovalRules(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      warehouseId,
    });
  }

  @ApiOperation({ summary: 'Create transfer approval rule' })
  @Post('transfer-approval-rules')
  @Permissions('inventory.stock.create')
  async createTransferApprovalRule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateTransferApprovalRuleInput) {
    return this.inventoryService.createTransferApprovalRule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update transfer approval rule' })
  @Patch('transfer-approval-rules/:id')
  @Permissions('inventory.stock.update')
  async updateTransferApprovalRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateTransferApprovalRuleInput) {
    return this.inventoryService.updateTransferApprovalRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete transfer approval rule' })
  @Delete('transfer-approval-rules/:id')
  @Permissions('inventory.stock.delete')
  async deleteTransferApprovalRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteTransferApprovalRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Request approval to submit a transfer stock entry (auto-submits below threshold)' })
  @Post('stock-entries/:id/request-transfer-approval')
  @Permissions('inventory.stock.update')
  async requestTransferApproval(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.requestTransferApproval(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get pending transfer approvals' })
  @Get('transfer-approvals/pending')
  @Permissions('inventory.stock.read')
  async getPendingTransferApprovals(@Req() req: AuthenticatedRequest, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.inventoryService.getPendingTransferApprovals(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @ApiOperation({ summary: 'Approve a pending transfer (submits the stock entry)' })
  @Post('transfer-approvals/:id/approve')
  @Permissions('inventory.stock.update')
  async approveTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.approveTransfer(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Reject a pending transfer' })
  @Post('transfer-approvals/:id/reject')
  @Permissions('inventory.stock.update')
  async rejectTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: RejectTransferInput) {
    return this.inventoryService.rejectTransfer(req.user.tenantId, id, req.user.userId, dto);
  }

  // ─── MOVEMENT HISTORY / AUDIT TRAIL ──────────────────

  @ApiOperation({ summary: 'Get consolidated movement history / audit trail' })
  @Get('movement-history')
  @Permissions('inventory.stock.read')
  async getMovementHistory(
    @Req() req: AuthenticatedRequest,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovementHistory(req.user.tenantId, { productId, warehouseId, limit: limit ? parseInt(limit) : undefined });
  }

  // ─── WAVE PICK / PACK-LIST GENERATION ─────────────────

  @ApiOperation({ summary: 'Get pick waves' })
  @Get('pick-waves')
  @Permissions('inventory.stock.read')
  async getPickWaves(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getPickWaves(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      warehouseId, status,
    });
  }

  @ApiOperation({ summary: 'Get pick wave by id' })
  @Get('pick-waves/:id')
  @Permissions('inventory.stock.read')
  async getPickWaveById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getPickWaveById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create pick wave from multiple sales orders' })
  @Post('pick-waves')
  @Permissions('inventory.stock.create')
  async createPickWave(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePickWaveInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createPickWave(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Record a pick against a wave item' })
  @Post('pick-waves/items/:id/record-pick')
  @Permissions('inventory.stock.update')
  async recordPick(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: RecordPickInput) {
    return this.inventoryService.recordPick(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Get pack list for a wave' })
  @Get('pick-waves/:id/pack-list')
  @Permissions('inventory.stock.read')
  async getPackList(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getPackList(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Complete a pick wave' })
  @Post('pick-waves/:id/complete')
  @Permissions('inventory.stock.update')
  async completePickWave(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.completePickWave(req.user.tenantId, id);
  }

  // ─── VENDOR-MANAGED / CONSIGNMENT INVENTORY ──────────

  @ApiOperation({ summary: 'Get consignment stocks' })
  @Get('consignment-stocks')
  @Permissions('inventory.stock.read')
  async getConsignmentStocks(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getConsignmentStocks(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      warehouseId, status,
    });
  }

  @ApiOperation({ summary: 'Create consignment stock' })
  @Post('consignment-stocks')
  @Permissions('inventory.stock.create')
  async createConsignmentStock(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateConsignmentStockInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createConsignmentStock(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Record consignment consumption (consumption-triggered billing)' })
  @Post('consignment-stocks/:id/consume')
  @Permissions('inventory.stock.update')
  async recordConsignmentConsumption(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: RecordConsignmentConsumptionInput) {
    return this.inventoryService.recordConsignmentConsumption(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Get unbilled consignment consumptions' })
  @Get('consignment-stocks/consumptions/unbilled')
  @Permissions('inventory.stock.read')
  async getUnbilledConsignmentConsumptions(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getUnbilledConsignmentConsumptions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mark a consignment consumption as billed' })
  @Post('consignment-stocks/consumptions/:id/mark-billed')
  @Permissions('inventory.stock.update')
  async markConsignmentConsumptionBilled(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.markConsignmentConsumptionBilled(req.user.tenantId, id);
  }

  // ─── RECEIPT WITH TRACEABILITY CAPTURE ───────────────

  @ApiOperation({ summary: 'Receive stock with serial/lot traceability captured at receipt' })
  @Post('receive-with-traceability')
  @Permissions('inventory.stock.create')
  async receiveWithTraceability(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: ReceiveWithTraceabilityInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.receiveWithTraceability(req.user.tenantId, orgId, req.user.userId, dto);
  }

  // ─── BARCODE LABEL GENERATION ─────────────────────────

  @ApiOperation({ summary: 'Get product barcode label data' })
  @Get('labels/product/:id')
  @Permissions('inventory.stock.read')
  async getProductLabel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductLabel(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get batch barcode label data' })
  @Get('labels/batch/:id')
  @Permissions('inventory.stock.read')
  async getBatchLabel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchLabel(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get license plate barcode label data' })
  @Get('labels/license-plate/:id')
  @Permissions('inventory.stock.read')
  async getLicensePlateLabel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getLicensePlateLabel(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get bin location barcode label data' })
  @Get('labels/bin/:id')
  @Permissions('inventory.stock.read')
  async getBinLabel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBinLabel(req.user.tenantId, id);
  }

  // ─── CYCLE COUNTS ───────────────────────────────────

  @ApiOperation({ summary: 'Get cycle counts' })
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
  @Get('cycle-counts/:id')
  @Permissions('inventory.stock.read')
  async getCycleCountById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCycleCountById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create cycle count' })
  @Post('cycle-counts')
  @Permissions('inventory.stock.create')
  async createCycleCount(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCycleCountInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createCycleCount(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Submit cycle count' })
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
  @Post('cycle-counts/:id/approve')
  @Permissions('inventory.stock.update')
  async approveCycleCount(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.approveCycleCount(req.user.tenantId, id, req.user.userId);
  }

  // ─── CYCLE COUNT SCHEDULES ───────────────────────────

  @ApiOperation({ summary: 'Get cycle count schedules' })
  @Get('cycle-count-schedules')
  @Permissions('inventory.stock.read')
  async getCycleCountSchedules(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('active') active?: string,
  ) {
    return this.inventoryService.getCycleCountSchedules(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      warehouseId, active,
    });
  }

  @ApiOperation({ summary: 'Get due cycle count schedules' })
  @Get('cycle-count-schedules/due')
  @Permissions('inventory.stock.read')
  async getDueCycleCountSchedules(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getDueCycleCountSchedules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get cycle count accuracy KPI' })
  @Get('cycle-count-schedules/accuracy')
  @Permissions('inventory.stock.read')
  async getCycleCountAccuracy(
    @Req() req: AuthenticatedRequest,
    @Query('warehouseId') warehouseId?: string,
    @Query('sinceDays') sinceDays?: string,
  ) {
    return this.inventoryService.getCycleCountAccuracy(req.user.tenantId, warehouseId, sinceDays ? parseInt(sinceDays) : undefined);
  }

  @ApiOperation({ summary: 'Create cycle count schedule' })
  @Post('cycle-count-schedules')
  @Permissions('inventory.stock.create')
  async createCycleCountSchedule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateCycleCountScheduleInput) {
    return this.inventoryService.createCycleCountSchedule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update cycle count schedule' })
  @Patch('cycle-count-schedules/:id')
  @Permissions('inventory.stock.update')
  async updateCycleCountSchedule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateCycleCountScheduleInput) {
    return this.inventoryService.updateCycleCountSchedule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Roll forward cycle count schedule due date' })
  @Post('cycle-count-schedules/:id/roll-forward')
  @Permissions('inventory.stock.update')
  async rollForwardCycleCountSchedule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.rollForwardCycleCountSchedule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Delete cycle count schedule' })
  @Delete('cycle-count-schedules/:id')
  @Permissions('inventory.stock.delete')
  async deleteCycleCountSchedule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteCycleCountSchedule(req.user.tenantId, id);
  }

  // ─── LICENSE PLATES ──────────────────────────────────

  @ApiOperation({ summary: 'Get license plates' })
  @Get('license-plates')
  @Permissions('inventory.stock.read')
  async getLicensePlates(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getLicensePlates(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      warehouseId, status,
    });
  }

  @ApiOperation({ summary: 'Get license plate by id' })
  @Get('license-plates/:id')
  @Permissions('inventory.stock.read')
  async getLicensePlateById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getLicensePlateById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create license plate' })
  @Post('license-plates')
  @Permissions('inventory.stock.create')
  async createLicensePlate(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateLicensePlateInput) {
    return this.inventoryService.createLicensePlate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Add item to license plate' })
  @Post('license-plates/:id/items')
  @Permissions('inventory.stock.update')
  async addLicensePlateItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: AddLicensePlateItemInput) {
    return this.inventoryService.addLicensePlateItem(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Move license plate to another bin (barcode scan move)' })
  @Post('license-plates/:id/move')
  @Permissions('inventory.stock.update')
  async moveLicensePlate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: MoveLicensePlateInput) {
    return this.inventoryService.moveLicensePlate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Close license plate' })
  @Post('license-plates/:id/close')
  @Permissions('inventory.stock.update')
  async closeLicensePlate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.closeLicensePlate(req.user.tenantId, id);
  }

  // ─── DIRECTED PUT-AWAY ───────────────────────────────

  @ApiOperation({ summary: 'Get putaway tasks' })
  @Get('putaway-tasks')
  @Permissions('inventory.stock.read')
  async getPutawayTasks(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('stockEntryId') stockEntryId?: string,
  ) {
    return this.inventoryService.getPutawayTasks(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status, stockEntryId,
    });
  }

  @ApiOperation({ summary: 'Suggest putaway bin for an inventory item (zone-based optimization)' })
  @Get('putaway-tasks/suggest-bin/:inventoryItemId')
  @Permissions('inventory.stock.read')
  async suggestPutawayBin(@Req() req: AuthenticatedRequest, @Param('inventoryItemId') inventoryItemId: string) {
    return this.inventoryService.suggestPutawayBin(req.user.tenantId, inventoryItemId);
  }

  @ApiOperation({ summary: 'Create putaway task' })
  @Post('putaway-tasks')
  @Permissions('inventory.stock.create')
  async createPutawayTask(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePutawayTaskInput) {
    return this.inventoryService.createPutawayTask(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Complete putaway task (barcode scan confirm)' })
  @Post('putaway-tasks/:id/complete')
  @Permissions('inventory.stock.update')
  async completePutawayTask(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: CompletePutawayTaskInput) {
    return this.inventoryService.completePutawayTask(req.user.tenantId, id, dto);
  }

  // ─── BATCH QUARANTINE WORKFLOW ───────────────────────

  @ApiOperation({ summary: 'Quarantine a batch' })
  @Post('batches/:id/quarantine')
  @Permissions('inventory.stock.update')
  async quarantineBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: QuarantineBatchInput) {
    return this.inventoryService.quarantineBatch(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Release a batch from quarantine' })
  @Post('batches/:id/quarantine/release')
  @Permissions('inventory.stock.update')
  async releaseBatchQuarantine(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: ReleaseBatchQuarantineInput) {
    return this.inventoryService.releaseBatchQuarantine(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Reject a quarantined batch (mark expired/unusable)' })
  @Post('batches/:id/quarantine/reject')
  @Permissions('inventory.stock.update')
  async rejectBatchQuarantine(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: ReleaseBatchQuarantineInput) {
    return this.inventoryService.rejectBatchQuarantine(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Get batch quarantine log' })
  @Get('batches/:id/quarantine-log')
  @Permissions('inventory.stock.read')
  async getBatchQuarantineLog(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchQuarantineLog(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get batch genealogy trace' })
  @Get('batches/:id/genealogy')
  @Permissions('inventory.stock.read')
  async getBatchGenealogy(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchGenealogy(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get batch recall notice (genealogy + affected sales orders)' })
  @Get('batches/:id/recall-notice')
  @Permissions('inventory.stock.read')
  async getBatchRecallNotice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getBatchRecallNotice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get expiring batches report (FEFO-sorted)' })
  @Get('batches/reports/expiring')
  @Permissions('inventory.stock.read')
  async getExpiringBatchesReport(@Req() req: AuthenticatedRequest, @Query('withinDays') withinDays?: string) {
    return this.inventoryService.getExpiringBatchesReport(req.user.tenantId, withinDays ? parseInt(withinDays) : undefined);
  }

  @ApiOperation({ summary: 'Get FEFO pick suggestion for a product/warehouse/quantity' })
  @Get('batches/reports/fefo-suggestion')
  @Permissions('inventory.stock.read')
  async getFefoPickSuggestion(
    @Req() req: AuthenticatedRequest,
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
    @Query('quantity') quantity: string,
  ) {
    return this.inventoryService.getFefoPickSuggestion(req.user.tenantId, productId, warehouseId, parseFloat(quantity));
  }

  @ApiOperation({ summary: 'Get serial number where-used trace' })
  @Get('serial-numbers/:id/trace')
  @Permissions('inventory.stock.read')
  async getSerialNumberTrace(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getSerialNumberTrace(req.user.tenantId, id);
  }

  // ─── STOCK RESERVATIONS & ALLOCATION ─────────────────

  @ApiOperation({ summary: 'Get stock reservations' })
  @Get('stock-reservations')
  @Permissions('inventory.stock.read')
  async getStockReservations(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getStockReservations(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      productId, warehouseId, status,
    });
  }

  @ApiOperation({ summary: 'Get allocation summary for a product in a warehouse' })
  @Get('stock-reservations/allocation-summary')
  @Permissions('inventory.stock.read')
  async getAllocationSummary(@Req() req: AuthenticatedRequest, @Query('productId') productId: string, @Query('warehouseId') warehouseId: string) {
    return this.inventoryService.getAllocationSummary(req.user.tenantId, productId, warehouseId);
  }

  @ApiOperation({ summary: 'Create stock reservation' })
  @Post('stock-reservations')
  @Permissions('inventory.stock.create')
  async createStockReservation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateStockReservationInput) {
    return this.inventoryService.createStockReservation(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Release a stock reservation' })
  @Post('stock-reservations/:id/release')
  @Permissions('inventory.stock.update')
  async releaseStockReservation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.releaseStockReservation(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Fulfill a stock reservation' })
  @Post('stock-reservations/:id/fulfill')
  @Permissions('inventory.stock.update')
  async fulfillStockReservation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.fulfillStockReservation(req.user.tenantId, id);
  }

  // ─── INVENTORY ANALYTICS ─────────────────────────────

  @ApiOperation({ summary: 'Get ABC classification report' })
  @Get('analytics/abc-classification')
  @Permissions('inventory.stock.read')
  async getAbcClassification(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getAbcClassification(req.user.tenantId, warehouseId);
  }

  @ApiOperation({ summary: 'Get dead-stock report' })
  @Get('analytics/dead-stock')
  @Permissions('inventory.stock.read')
  async getDeadStockReport(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string, @Query('sinceDays') sinceDays?: string) {
    return this.inventoryService.getDeadStockReport(req.user.tenantId, warehouseId, sinceDays ? parseInt(sinceDays) : undefined);
  }

  @ApiOperation({ summary: 'Get inventory turnover report' })
  @Get('analytics/turnover')
  @Permissions('inventory.stock.read')
  async getTurnoverReport(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string, @Query('sinceDays') sinceDays?: string) {
    return this.inventoryService.getTurnoverReport(req.user.tenantId, warehouseId, sinceDays ? parseInt(sinceDays) : undefined);
  }

  // ─── QA INSPECTIONS ─────────────────────────────────

  @ApiOperation({ summary: 'Get q a inspections' })
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
  @Get('qa-inspections/:id')
  @Permissions('inventory.stock.read')
  async getQAInspectionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getQAInspectionById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create q a inspection' })
  @Post('qa-inspections')
  @Permissions('inventory.stock.create')
  async createQAInspection(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateQAInspectionInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createQAInspection(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Submit q a inspection' })
  @Post('qa-inspections/:id/submit')
  @Permissions('inventory.stock.update')
  async submitQAInspection(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: SubmitQAInspectionInput,
  ) {
    return this.inventoryService.submitQAInspection(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Route a resolved inspection disposition to a downstream action (e.g. batch quarantine)' })
  @Post('qa-inspections/:id/route-disposition')
  @Permissions('inventory.stock.update')
  async routeQAInspectionDisposition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.routeQAInspectionDisposition(req.user.tenantId, id, req.user.userId);
  }

  // ─── QA INSPECTION TEMPLATES ──────────────────────────

  @ApiOperation({ summary: 'Get QA inspection templates' })
  @Get('qa-inspection-templates')
  @Permissions('inventory.stock.read')
  async getQAInspectionTemplates(@Req() req: AuthenticatedRequest, @Query('page') page?: string, @Query('limit') limit?: string, @Query('productId') productId?: string) {
    return this.inventoryService.getQAInspectionTemplates(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      productId,
    });
  }

  @ApiOperation({ summary: 'Create QA inspection template' })
  @Post('qa-inspection-templates')
  @Permissions('inventory.stock.create')
  async createQAInspectionTemplate(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateQAInspectionTemplateInput) {
    return this.inventoryService.createQAInspectionTemplate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update QA inspection template' })
  @Patch('qa-inspection-templates/:id')
  @Permissions('inventory.stock.update')
  async updateQAInspectionTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateQAInspectionTemplateInput) {
    return this.inventoryService.updateQAInspectionTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete QA inspection template' })
  @Delete('qa-inspection-templates/:id')
  @Permissions('inventory.stock.delete')
  async deleteQAInspectionTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteQAInspectionTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create QA inspection pre-populated from a template' })
  @Post('qa-inspection-templates/:id/create-inspection')
  @Permissions('inventory.stock.create')
  async createQAInspectionFromTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: CreateQAInspectionInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createQAInspectionFromTemplate(req.user.tenantId, orgId, req.user.userId, id, dto);
  }

  // ─── REORDER RULES ──────────────────────────────────

  @ApiOperation({ summary: 'Get reorder rules' })
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
  @Post('reorder-rules')
  @Permissions('inventory.product.create')
  async createReorderRule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateReorderRuleInput) {
    return this.inventoryService.createReorderRule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update reorder rule' })
  @Patch('reorder-rules/:id')
  @Permissions('inventory.product.update')
  async updateReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateReorderRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete reorder rule' })
  @Delete('reorder-rules/:id')
  @Permissions('inventory.product.delete')
  async deleteReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteReorderRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get reorder dashboard (triggered rules with lead-time-aware suggested order date)' })
  @Get('reorder-rules/dashboard')
  @Permissions('inventory.product.read')
  async getReorderDashboard(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getReorderDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create purchase requisition from a triggered reorder rule' })
  @Post('reorder-rules/:id/create-requisition')
  @Permissions('inventory.product.create')
  async createRequisitionFromReorderRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: CreateRequisitionFromReorderRuleInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createRequisitionFromReorderRule(req.user.tenantId, orgId, req.user.userId, id, dto);
  }

  // ─── STOCK ALERTS ───────────────────────────────────

  @ApiOperation({ summary: 'Get stock alerts' })
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
  @Post('alerts/:id/resolve')
  @Permissions('inventory.stock.update')
  async resolveStockAlert(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.resolveStockAlert(req.user.tenantId, id);
  }

  // ─── PRODUCT KITS ───────────────────────────────────

  @ApiOperation({ summary: 'Get product kits' })
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
  @Get('kits/:id')
  @Permissions('inventory.product.read')
  async getProductKitById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getProductKitById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create product kit' })
  @Post('kits')
  @Permissions('inventory.product.create')
  async createProductKit(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateKitInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProductKit(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update product kit' })
  @Patch('kits/:id')
  @Permissions('inventory.product.update')
  async updateProductKit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.inventoryService.updateProductKit(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete product kit' })
  @Delete('kits/:id')
  @Permissions('inventory.product.delete')
  async deleteProductKit(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.deleteProductKit(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get kit component availability / max buildable quantity' })
  @Get('kits/:id/availability')
  @Permissions('inventory.stock.read')
  async getKitAvailability(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('warehouseId') warehouseId: string) {
    return this.inventoryService.getKitAvailability(req.user.tenantId, id, warehouseId);
  }

  @ApiOperation({ summary: 'Get kit cost rollup and margin' })
  @Get('kits/:id/cost-rollup')
  @Permissions('inventory.stock.read')
  async getKitCostRollup(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getKitCostRollup(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Assemble kits (consume components, produce finished kit stock)' })
  @Post('kits/:id/assemble')
  @Permissions('inventory.stock.create')
  async assembleKit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: AssembleKitInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.assembleKit(req.user.tenantId, orgId, req.user.userId, id, dto);
  }

  @ApiOperation({ summary: 'Disassemble kits (consume finished kit stock, produce components)' })
  @Post('kits/:id/disassemble')
  @Permissions('inventory.stock.create')
  async disassembleKit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: DisassembleKitInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.disassembleKit(req.user.tenantId, orgId, req.user.userId, id, dto);
  }

  // ─── VALUATION & REPORTS ────────────────────────────

  @ApiOperation({ summary: 'Get valuation report' })
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
  @Get('aging')
  @Permissions('inventory.stock.read')
  async getInventoryAging(@Req() req: AuthenticatedRequest, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getInventoryAging(req.user.tenantId, { warehouseId });
  }
}