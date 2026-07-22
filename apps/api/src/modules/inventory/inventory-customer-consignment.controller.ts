import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryCustomerConsignmentService,
  createCustomerConsignmentSchema,
  updateCustomerConsignmentSchema,
  recordConsumptionSchema,
} from './inventory-customer-consignment.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-customer-consignment')
@Controller('inventory/customer-consignment')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryCustomerConsignmentController {
  constructor(private readonly service: InventoryCustomerConsignmentService) {}

  @Permissions('inventory.customer-consignment.read')
  @Get()
  @ApiOperation({ summary: 'List customer consignments' })
  list(
    @Req() req: AuthReq,
    @Query('customerId') customerId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listConsignments(req.user.tenantId, {
      customerId,
      productId,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Permissions('inventory.customer-consignment.read')
  @Get('dashboard')
  @ApiOperation({ summary: 'Customer consignment dashboard' })
  dashboard(@Req() req: AuthReq) {
    return this.service.getConsignmentDashboard(req.user.tenantId);
  }

  @Permissions('inventory.customer-consignment.read')
  @Get(':id')
  @ApiOperation({ summary: 'Get a customer consignment with consumptions' })
  get(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getConsignment(req.user.tenantId, id);
  }

  @Permissions('inventory.customer-consignment.manage')
  @Post()
  @ApiOperation({ summary: 'Create a customer consignment' })
  create(@Req() req: AuthReq, @ZodBody(createCustomerConsignmentSchema) dto: any) {
    return this.service.createConsignment(req.user.tenantId, dto);
  }

  @Permissions('inventory.customer-consignment.manage')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer consignment' })
  update(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateCustomerConsignmentSchema) dto: any) {
    return this.service.updateConsignment(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.customer-consignment.manage')
  @Post(':id/close')
  @ApiOperation({ summary: 'Close a customer consignment' })
  close(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.closeConsignment(req.user.tenantId, id);
  }

  @Permissions('inventory.customer-consignment.manage')
  @Post('consumption')
  @ApiOperation({ summary: 'Record consumption against a consignment' })
  recordConsumption(@Req() req: AuthReq, @ZodBody(recordConsumptionSchema) dto: any) {
    return this.service.recordConsumption(req.user.tenantId, dto);
  }
}
