import { Controller, Get, Post, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { InventoryService } from './inventory.service';
import { CreateProductInput } from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('products')
  @Permissions('inventory.product.read')
  async getProducts(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.getProducts(tenantId);
  }

  @Post('products')
  @Permissions('inventory.product.create')
  async createProduct(@Req() req: AuthenticatedRequest, @Body() dto: CreateProductInput) {
    const tenantId = req.user.tenantId;
    const orgId = req.user.orgId || 'org-system-default';
    return this.inventoryService.createProduct(tenantId, orgId, dto);
  }

  @Get('warehouses')
  @Permissions('inventory.warehouse.read')
  async getWarehouses(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.getWarehouses(tenantId);
  }

  @Get('stock')
  @Permissions('inventory.stock.read')
  async getStockLevels(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    return this.inventoryService.getStockLevels(tenantId);
  }

  @Get('serial-numbers')
  @Permissions('inventory.stock.read')
  async getSerialNumbers(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getSerialNumbers(req.user.tenantId);
  }

  @Post('serial-numbers')
  @Permissions('inventory.stock.create')
  async createSerialNumber(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { productId: string; warehouseId: string; serialNumber: string }
  ) {
    return this.inventoryService.createSerialNumber(req.user.tenantId, dto);
  }

  @Get('batches')
  @Permissions('inventory.stock.read')
  async getBatches(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getBatches(req.user.tenantId);
  }

  @Post('batches')
  @Permissions('inventory.stock.create')
  async createBatch(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { productId: string; batchNumber: string; expiryDate?: string; quantity: number; costPrice?: number }
  ) {
    return this.inventoryService.createBatch(req.user.tenantId, dto);
  }

  @Get('bin-locations')
  @Permissions('inventory.warehouse.read')
  async getBinLocations(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getBinLocations(req.user.tenantId);
  }

  @Post('bin-locations')
  @Permissions('inventory.warehouse.create')
  async createBinLocation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { warehouseId: string; name: string; zone?: string; shelf?: string; bin?: string }
  ) {
    return this.inventoryService.createBinLocation(req.user.tenantId, dto);
  }

  @Get('cycle-counts')
  @Permissions('inventory.stock.read')
  async getCycleCounts(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getCycleCounts(req.user.tenantId);
  }

  @Get('cycle-counts/:id')
  @Permissions('inventory.stock.read')
  async getCycleCountById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.inventoryService.getCycleCountById(req.user.tenantId, id);
  }

  @Post('cycle-counts')
  @Permissions('inventory.stock.create')
  async createCycleCount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { warehouseId: string; notes?: string; items: { productId: string; expectedQty: number; countedQty: number }[] }
  ) {
    return this.inventoryService.createCycleCount(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Put('cycle-counts/:id/complete')
  @Permissions('inventory.stock.create')
  async completeCycleCount(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.inventoryService.completeCycleCount(req.user.tenantId, id);
  }
}
