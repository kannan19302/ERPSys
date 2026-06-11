import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RealEstateService } from './real-estate.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('real-estate')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RealEstateController {
  constructor(private readonly service: RealEstateService) {}

  @Get('properties')
  @Permissions('hr.employee.read')
  async getProperties(@Req() req: AuthenticatedRequest) {
    return this.service.getProperties(req.user.tenantId);
  }

  @Post('properties')
  @Permissions('hr.employee.read')
  async createProperty(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; type: string; portfolio: string; address: string; parentId?: string }
  ) {
    return this.service.createProperty(req.user.tenantId, dto);
  }

  @Get('leases')
  @Permissions('hr.employee.read')
  async getLeases(@Req() req: AuthenticatedRequest) {
    return this.service.getLeases(req.user.tenantId);
  }

  @Post('leases')
  @Permissions('hr.employee.read')
  async createLease(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { propertyId: string; tenantName: string; startDate: string; endDate: string; rentAmount: number; securityDeposit: number; billingFrequency: string }
  ) {
    return this.service.createLease(req.user.tenantId, dto);
  }

  @Get('maintenances')
  @Permissions('hr.employee.read')
  async getPropertyMaintenances(@Req() req: AuthenticatedRequest) {
    return this.service.getPropertyMaintenances(req.user.tenantId);
  }

  @Post('maintenances')
  @Permissions('hr.employee.read')
  async createPropertyMaintenance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { propertyId: string; description: string; vendorId?: string; cost?: number }
  ) {
    return this.service.createPropertyMaintenance(req.user.tenantId, dto);
  }

  @Get('commissions')
  @Permissions('hr.employee.read')
  async getAgentCommissions(@Req() req: AuthenticatedRequest) {
    return this.service.getAgentCommissions(req.user.tenantId);
  }

  @Post('commissions')
  @Permissions('hr.employee.read')
  async createAgentCommission(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { agentId: string; amount: number; splitRatio: number; generalLedgerRef: string }
  ) {
    return this.service.createAgentCommission(req.user.tenantId, dto);
  }
}
