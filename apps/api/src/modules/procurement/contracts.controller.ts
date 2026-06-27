import { Controller, Get, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ContractsService } from './contracts.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('procurement')
@ApiBearerAuth()
@Controller('procurement/contracts')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @ApiOperation({ summary: 'Get contracts' })
  @Permissions('procurement.read')
  @Get()
  @Permissions('procurement.purchase-order.read')
  async getContracts(@Req() req: AuthReq, @Query('vendorId') vendorId?: string) {
    return this.contracts.getContracts(req.user.tenantId, vendorId);
  }

  @ApiOperation({ summary: 'Get expiring' })
  @Permissions('procurement.read')
  @Get('expiring')
  @Permissions('procurement.purchase-order.read')
  async getExpiring(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.contracts.getExpiringContracts(req.user.tenantId, Number(days) || 60);
  }

  @ApiOperation({ summary: 'Get compliance' })
  @Permissions('procurement.read')
  @Get(':id/compliance')
  @Permissions('procurement.purchase-order.read')
  async getCompliance(@Req() req: AuthReq, @Param('id') id: string) {
    return this.contracts.getContractCompliance(req.user.tenantId, id);
  }
}
