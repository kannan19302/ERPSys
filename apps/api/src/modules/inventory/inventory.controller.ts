import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
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
}
