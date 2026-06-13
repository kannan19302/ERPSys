import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SupplyChainService } from './supply-chain.service';
import { CreateShipmentInput, UpdateShipmentStatusInput } from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('supply-chain')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainController {
  constructor(private readonly supplyChainService: SupplyChainService) {}

  @Get('shipments')
  @Permissions('supply-chain.shipment.read')
  async getShipments(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getShipments(req.user.tenantId);
  }

  @Get('shipments/:id')
  @Permissions('supply-chain.shipment.read')
  async getShipmentById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.supplyChainService.getShipmentById(req.user.tenantId, id);
  }

  @Post('shipments')
  @Permissions('supply-chain.shipment.create')
  async createShipment(@Req() req: AuthenticatedRequest, @Body() dto: CreateShipmentInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.supplyChainService.createShipment(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('shipments/:id/status')
  @Permissions('supply-chain.shipment.update')
  async updateShipmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusInput,
  ): Promise<unknown> {
    return this.supplyChainService.updateShipmentStatus(req.user.tenantId, id, dto.status);
  }

  @Get('forecast')
  @Permissions('supply-chain.forecast.read')
  async getDemandForecast(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getDemandForecast(req.user.tenantId);
  }
}
