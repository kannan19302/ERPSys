import { Controller, Get, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ContractsService } from './contracts.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('procurement/contracts')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get()
  @Permissions('procurement.purchase-order.read')
  async getContracts(@Req() req: AuthReq, @Query('vendorId') vendorId?: string) {
    return this.contracts.getContracts(req.user.tenantId, vendorId);
  }

  @Get('expiring')
  @Permissions('procurement.purchase-order.read')
  async getExpiring(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.contracts.getExpiringContracts(req.user.tenantId, Number(days) || 60);
  }

  @Get(':id/compliance')
  @Permissions('procurement.purchase-order.read')
  async getCompliance(@Req() req: AuthReq, @Param('id') id: string) {
    return this.contracts.getContractCompliance(req.user.tenantId, id);
  }
}
