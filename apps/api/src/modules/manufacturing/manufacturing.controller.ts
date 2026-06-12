import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ManufacturingService } from './manufacturing.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  @Get('boms')
  @Permissions('manufacturing.bom.read')
  async getBOMs(@Req() req: AuthenticatedRequest): Promise<any> {
    return this.manufacturingService.getBOMs(req.user.tenantId);
  }

  @Post('boms')
  @Permissions('manufacturing.bom.create')
  async createBOM(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { productId: string; name: string; code: string; items: Array<{ productId: string; quantity: number }> }
  ): Promise<any> {
    return this.manufacturingService.createBOM(req.user.tenantId, dto);
  }

  @Get('work-orders')
  @Permissions('manufacturing.work-order.read')
  async getWorkOrders(@Req() req: AuthenticatedRequest): Promise<any> {
    return this.manufacturingService.getWorkOrders(req.user.tenantId);
  }

  @Post('work-orders')
  @Permissions('manufacturing.work-order.create')
  async createWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { bomId: string; workOrderNumber: string; quantity: number; startDate?: string }
  ): Promise<any> {
    return this.manufacturingService.createWorkOrder(req.user.tenantId, dto);
  }

  @Patch('work-orders/:id/status')
  @Permissions('manufacturing.work-order.update')
  async updateWorkOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: string }
  ): Promise<any> {
    return this.manufacturingService.updateWorkOrderStatus(req.user.tenantId, id, dto.status);
  }
}
