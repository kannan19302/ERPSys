import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { z } from 'zod';
import {
  InventoryRfidService,
  registerTagSchema,
  recordReadEventSchema,
  updateTagLocationSchema,
} from './inventory-rfid.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-rfid')
@Controller('inventory/rfid')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryRfidController {
  constructor(private readonly service: InventoryRfidService) {}

  @Permissions('inventory.rfid.read')
  @Get('tags')
  @ApiOperation({ summary: 'List RFID tags' })
  listTags(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('tagType') tagType?: string,
  ) {
    return this.service.listTags(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      productId,
      tagType,
    });
  }

  @Permissions('inventory.rfid.manage')
  @Post('tags')
  @ApiOperation({ summary: 'Register a new RFID tag' })
  registerTag(@Req() req: AuthReq, @ZodBody(registerTagSchema) dto: any) {
    return this.service.registerTag(req.user.tenantId, dto);
  }

  @Permissions('inventory.rfid.manage')
  @Post('tags/bulk')
  @ApiOperation({ summary: 'Bulk register RFID tags' })
  bulkRegisterTags(@Req() req: AuthReq, @ZodBody(z.array(registerTagSchema)) dto: any) {
    return this.service.bulkRegisterTags(req.user.tenantId, dto);
  }

  @Permissions('inventory.rfid.read')
  @Get('tags/:id')
  @ApiOperation({ summary: 'Get RFID tag by ID' })
  getTagById(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getTagById(req.user.tenantId, id);
  }

  @Permissions('inventory.rfid.read')
  @Get('tags/epc/:epc')
  @ApiOperation({ summary: 'Get RFID tag by EPC code' })
  getTagByEpc(@Req() req: AuthReq, @Param('epc') epc: string) {
    return this.service.getTagByEpc(req.user.tenantId, epc);
  }

  @Permissions('inventory.rfid.manage')
  @Patch('tags/:id')
  @ApiOperation({ summary: 'Update an RFID tag' })
  updateTag(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(registerTagSchema.partial()) dto: any) {
    return this.service.updateTag(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.rfid.manage')
  @Patch('tags/:id/location')
  @ApiOperation({ summary: 'Update RFID tag location' })
  updateTagLocation(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateTagLocationSchema) dto: any) {
    return this.service.updateTagLocation(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.rfid.manage')
  @Post('tags/:id/retire')
  @ApiOperation({ summary: 'Retire an RFID tag' })
  retireTag(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.retireTag(req.user.tenantId, id);
  }

  @Permissions('inventory.rfid.read')
  @Get('read-events')
  @ApiOperation({ summary: 'List RFID read events' })
  listReadEvents(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tagId') tagId?: string,
    @Query('location') location?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.listReadEvents(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      tagId,
      location,
      startDate,
      endDate,
    });
  }

  @Permissions('inventory.rfid.manage')
  @Post('read-events')
  @ApiOperation({ summary: 'Record an RFID read event' })
  recordReadEvent(@Req() req: AuthReq, @ZodBody(recordReadEventSchema) dto: any) {
    return this.service.recordReadEvent(req.user.tenantId, dto);
  }

  @Permissions('inventory.rfid.read')
  @Get('tags/:id/location-history')
  @ApiOperation({ summary: 'Get location history for an RFID tag' })
  getTagLocationHistory(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getTagLocationHistory(req.user.tenantId, id);
  }

  @Permissions('inventory.rfid.read')
  @Get('dashboard')
  @ApiOperation({ summary: 'RFID dashboard with status counts and recent reads' })
  getRfidDashboard(@Req() req: AuthReq) {
    return this.service.getRfidDashboard(req.user.tenantId);
  }
}