import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryDropShipService,
  createProviderSchema,
  createDropShipOrderSchema,
  updateDropShipOrderStatusSchema,
} from './inventory-dropship.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-drop-ship')
@Controller('inventory/drop-ship')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryDropShipController {
  constructor(private readonly service: InventoryDropShipService) {}

  @Permissions('inventory.drop-ship.read')
  @Get('providers')
  @ApiOperation({ summary: 'List drop-ship providers' })
  listProviders(
    @Req() req: AuthReq,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.listProviders(req.user.tenantId, { search, isActive });
  }

  @Permissions('inventory.drop-ship.manage')
  @Post('providers')
  @ApiOperation({ summary: 'Create a drop-ship provider' })
  createProvider(@Req() req: AuthReq, @ZodBody(createProviderSchema) dto: any) {
    return this.service.createProvider(req.user.tenantId, dto);
  }

  @Permissions('inventory.drop-ship.manage')
  @Patch('providers/:id')
  @ApiOperation({ summary: 'Update a drop-ship provider' })
  updateProvider(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(createProviderSchema.partial()) dto: any) {
    return this.service.updateProvider(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.drop-ship.manage')
  @Delete('providers/:id')
  @ApiOperation({ summary: 'Deactivate a drop-ship provider' })
  deleteProvider(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.deleteProvider(req.user.tenantId, id);
  }

  @Permissions('inventory.drop-ship.read')
  @Get('orders')
  @ApiOperation({ summary: 'List drop-ship orders' })
  listOrders(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('providerId') providerId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.service.listOrders(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      providerId,
      vendorId,
    });
  }

  @Permissions('inventory.drop-ship.read')
  @Get('orders/:id')
  @ApiOperation({ summary: 'Get drop-ship order by id' })
  getOrderById(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getOrderById(req.user.tenantId, id);
  }

  @Permissions('inventory.drop-ship.manage')
  @Post('orders')
  @ApiOperation({ summary: 'Create a drop-ship order with items' })
  createOrder(@Req() req: AuthReq, @ZodBody(createDropShipOrderSchema) dto: any) {
    return this.service.createOrder(req.user.tenantId, dto);
  }

  @Permissions('inventory.drop-ship.manage')
  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update drop-ship order status' })
  updateOrderStatus(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateDropShipOrderStatusSchema) dto: any) {
    return this.service.updateOrderStatus(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.drop-ship.manage')
  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel a drop-ship order' })
  cancelOrder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.cancelOrder(req.user.tenantId, id);
  }

  @Permissions('inventory.drop-ship.read')
  @Get('dashboard')
  @ApiOperation({ summary: 'Drop-ship order dashboard counts' })
  getDashboard(@Req() req: AuthReq) {
    return this.service.getOrderDashboard(req.user.tenantId);
  }
}
