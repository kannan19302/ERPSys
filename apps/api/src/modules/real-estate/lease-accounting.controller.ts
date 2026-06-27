import { Controller, Get, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { LeaseAccountingService } from './lease-accounting.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('real-estate')
@ApiBearerAuth()
@Controller('real-estate/leasing')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class LeaseAccountingController {
  constructor(private readonly leaseAccounting: LeaseAccountingService) {}

  @ApiOperation({ summary: 'Get lease schedule' })
  @Permissions('real_estate.read')
  @Get('schedule/:leaseId')
  async getLeaseSchedule(@Req() req: AuthReq, @Param('leaseId') leaseId: string, @Query('discountRate') rate?: string) {
    return this.leaseAccounting.calculateLeaseSchedule(req.user.tenantId, leaseId, Number(rate) || 0.05);
  }

  @ApiOperation({ summary: 'Get portfolio' })
  @Permissions('real_estate.read')
  @Get('portfolio')
  async getPortfolio(@Req() req: AuthReq) {
    return this.leaseAccounting.getPortfolioSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get rent roll' })
  @Permissions('real_estate.read')
  @Get('rent-roll')
  async getRentRoll(@Req() req: AuthReq) {
    return this.leaseAccounting.getRentRoll(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get expiring' })
  @Permissions('real_estate.read')
  @Get('expiring')
  async getExpiring(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.leaseAccounting.getExpiringLeases(req.user.tenantId, Number(days) || 90);
  }
}
