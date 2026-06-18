import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { InventoryService } from './inventory.service';
import {
  CreateProductInput, UpdateProductInput,
  CreateWarehouseInput, UpdateWarehouseInput,
  BulkActionInput,
} from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  // ─── Products ─────────────────────────────────────

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

  // ─── Warehouses ───────────────────────────────────

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

  // ─── Stock Levels ─────────────────────────────────

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
}