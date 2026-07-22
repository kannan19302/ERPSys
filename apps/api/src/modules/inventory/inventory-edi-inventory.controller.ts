import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryEdiInventoryService,
  createEdiTransactionSchema,
  updateEdiStatusSchema,
} from './inventory-edi-inventory.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-edi')
@Controller('inventory/edi')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryEdiInventoryController {
  constructor(private readonly service: InventoryEdiInventoryService) {}

  @Permissions('inventory.edi.read')
  @Get('transactions')
  @ApiOperation({ summary: 'List EDI transactions' })
  listTransactions(
    @Req() req: AuthReq,
    @Query('ediType') ediType?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listTransactions(req.user.tenantId, {
      ediType,
      direction,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Permissions('inventory.edi.read')
  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get an EDI transaction' })
  getTransaction(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getTransaction(req.user.tenantId, id);
  }

  @Permissions('inventory.edi.manage')
  @Post('transactions')
  @ApiOperation({ summary: 'Create an EDI transaction' })
  createTransaction(@Req() req: AuthReq, @ZodBody(createEdiTransactionSchema) dto: any) {
    return this.service.createTransaction(req.user.tenantId, dto);
  }

  @Permissions('inventory.edi.manage')
  @Patch('transactions/:id/status')
  @ApiOperation({ summary: 'Update EDI transaction status' })
  updateStatus(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateEdiStatusSchema) dto: any) {
    return this.service.updateTransactionStatus(req.user.tenantId, id, dto.status, dto.errorMessage);
  }

  @Permissions('inventory.edi.read')
  @Get('dashboard')
  @ApiOperation({ summary: 'EDI transaction dashboard' })
  dashboard(@Req() req: AuthReq) {
    return this.service.getEdiDashboard(req.user.tenantId);
  }
}
