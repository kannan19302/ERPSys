import { Controller, Get, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { LeaseAccountingService } from './lease-accounting.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('real-estate/leasing')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class LeaseAccountingController {
  constructor(private readonly leaseAccounting: LeaseAccountingService) {}

  @Get('schedule/:leaseId')
  async getLeaseSchedule(@Req() req: AuthReq, @Param('leaseId') leaseId: string, @Query('discountRate') rate?: string) {
    return this.leaseAccounting.calculateLeaseSchedule(req.user.tenantId, leaseId, Number(rate) || 0.05);
  }

  @Get('portfolio')
  async getPortfolio(@Req() req: AuthReq) {
    return this.leaseAccounting.getPortfolioSummary(req.user.tenantId);
  }

  @Get('rent-roll')
  async getRentRoll(@Req() req: AuthReq) {
    return this.leaseAccounting.getRentRoll(req.user.tenantId);
  }

  @Get('expiring')
  async getExpiring(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.leaseAccounting.getExpiringLeases(req.user.tenantId, Number(days) || 90);
  }
}
