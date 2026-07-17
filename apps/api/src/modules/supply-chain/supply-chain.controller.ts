import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SupplyChainService } from './supply-chain.service';
import { CreateShipmentInput, UpdateShipmentStatusInput } from '@unerp/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('supply-chain')
@ApiBearerAuth()
@Controller('supply-chain')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainController {
  constructor(private readonly supplyChainService: SupplyChainService) { }

  @ApiOperation({ summary: 'Get shipments' })
  @Get('shipments')
  @Permissions('supply-chain.shipment.read')
  async getShipments(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getShipments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get shipment by id' })
  @Get('shipments/:id')
  @Permissions('supply-chain.shipment.read')
  async getShipmentById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.supplyChainService.getShipmentById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create shipment' })
  @Post('shipments')
  @Permissions('supply-chain.shipment.create')
  async createShipment(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateShipmentInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.supplyChainService.createShipment(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Update shipment status' })
  @Patch('shipments/:id/status')
  @Permissions('supply-chain.shipment.update')
  async updateShipmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: UpdateShipmentStatusInput,
  ): Promise<unknown> {
    return this.supplyChainService.updateShipmentStatus(req.user.tenantId, id, dto.status);
  }

  @ApiOperation({ summary: 'Get demand forecast' })
  @Get('forecast')
  @Permissions('supply-chain.forecast.read')
  async getDemandForecast(@Req() req: AuthenticatedRequest) {
    return this.supplyChainService.getDemandForecast(req.user.tenantId);
  }
}
