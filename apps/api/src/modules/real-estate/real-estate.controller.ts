import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { AppInstalledGuard } from '../../common/guards/app-installed.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RealEstateService } from './real-estate.service';
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

@ApiTags('real-estate')
@ApiBearerAuth()
@Controller('real-estate')
@UseGuards(JwtAuthGuard, RbacGuard, AppInstalledGuard)
export class RealEstateController {
  constructor(private readonly service: RealEstateService) {}

  @ApiOperation({ summary: 'Get properties' })
  @Get('properties')
  @Permissions('hr.employee.read')
  async getProperties(@Req() req: AuthenticatedRequest) {
    return this.service.getProperties(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create property' })
  @Post('properties')
  @Permissions('hr.employee.read')
  async createProperty(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; type: string; portfolio: string; address: string; parentId?: string }
  ) {
    return this.service.createProperty(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get leases' })
  @Get('leases')
  @Permissions('hr.employee.read')
  async getLeases(@Req() req: AuthenticatedRequest) {
    return this.service.getLeases(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create lease' })
  @Post('leases')
  @Permissions('hr.employee.read')
  async createLease(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { propertyId: string; tenantName: string; startDate: string; endDate: string; rentAmount: number; securityDeposit: number; billingFrequency: string }
  ) {
    return this.service.createLease(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get property maintenances' })
  @Get('maintenances')
  @Permissions('hr.employee.read')
  async getPropertyMaintenances(@Req() req: AuthenticatedRequest) {
    return this.service.getPropertyMaintenances(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create property maintenance' })
  @Post('maintenances')
  @Permissions('hr.employee.read')
  async createPropertyMaintenance(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { propertyId: string; description: string; vendorId?: string; cost?: number }
  ) {
    return this.service.createPropertyMaintenance(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get agent commissions' })
  @Get('commissions')
  @Permissions('hr.employee.read')
  async getAgentCommissions(@Req() req: AuthenticatedRequest) {
    return this.service.getAgentCommissions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create agent commission' })
  @Post('commissions')
  @Permissions('hr.employee.read')
  async createAgentCommission(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { agentId: string; amount: number; splitRatio: number; generalLedgerRef: string }
  ) {
    return this.service.createAgentCommission(req.user.tenantId, dto);
  }
}
