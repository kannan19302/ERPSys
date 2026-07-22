import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryAtpCtpService,
  computeAtpSchema,
  createAtpReservationSchema,
  multiWarehouseAtpSchema,
} from './inventory-atp-ctp.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-atp-ctp')
@Controller('inventory/atp-ctp')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryAtpCtpController {
  constructor(private readonly service: InventoryAtpCtpService) {}

  @Permissions('inventory.atp-ctp.manage')
  @Post('compute')
  @ApiOperation({ summary: 'Compute ATP/CTP availability' })
  computeAtp(@Req() req: AuthReq, @ZodBody(computeAtpSchema) dto: any) {
    return this.service.computeAtp(req.user.tenantId, dto.productId, dto.warehouseId);
  }

  @Permissions('inventory.atp-ctp.read')
  @Get('status')
  @ApiOperation({ summary: 'Get ATP status records' })
  getAtpStatus(
    @Req() req: AuthReq,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAtpStatus(req.user.tenantId, productId, warehouseId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Permissions('inventory.atp-ctp.read')
  @Get('product/:productId')
  @ApiOperation({ summary: 'Get product availability across all warehouses' })
  getProductAvailability(@Req() req: AuthReq, @Param('productId') productId: string) {
    return this.service.getProductAvailability(req.user.tenantId, productId);
  }

  @Permissions('inventory.atp-ctp.manage')
  @Post('multi-warehouse')
  @ApiOperation({ summary: 'Get ATP for specific warehouses' })
  getMultiWarehouseAtp(@Req() req: AuthReq, @ZodBody(multiWarehouseAtpSchema) dto: any) {
    return this.service.getMultiWarehouseAtp(req.user.tenantId, dto.warehouseIds);
  }

  @Permissions('inventory.atp-ctp.read')
  @Get('reservations')
  @ApiOperation({ summary: 'List ATP reservations' })
  listReservations(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('atpId') atpId?: string,
  ) {
    return this.service.listReservations(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      atpId,
    });
  }

  @Permissions('inventory.atp-ctp.manage')
  @Post('reservations')
  @ApiOperation({ summary: 'Create an ATP reservation' })
  createReservation(@Req() req: AuthReq, @ZodBody(createAtpReservationSchema) dto: any) {
    return this.service.createReservation(req.user.tenantId, dto);
  }

  @Permissions('inventory.atp-ctp.manage')
  @Patch('reservations/:id/release')
  @ApiOperation({ summary: 'Release an ATP reservation' })
  releaseReservation(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.releaseReservation(req.user.tenantId, id);
  }

  @Permissions('inventory.atp-ctp.manage')
  @Patch('reservations/:id/fulfill')
  @ApiOperation({ summary: 'Fulfill an ATP reservation' })
  fulfillReservation(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.fulfillReservation(req.user.tenantId, id);
  }

  @Permissions('inventory.atp-ctp.read')
  @Get('dashboard')
  @ApiOperation({ summary: 'ATP/CTP dashboard overview' })
  getAtpDashboard(@Req() req: AuthReq) {
    return this.service.getAtpDashboard(req.user.tenantId);
  }
}
