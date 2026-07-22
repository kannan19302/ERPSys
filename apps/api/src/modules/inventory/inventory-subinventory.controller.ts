import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventorySubinventoryService,
  createSubinventorySchema,
  updateSubinventorySchema,
  transferBetweenSubinventoriesSchema,
} from './inventory-subinventory.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-subinventory')
@Controller('inventory/subinventory')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventorySubinventoryController {
  constructor(private readonly service: InventorySubinventoryService) {}

  @Permissions('inventory.subinventory.read')
  @Get()
  @ApiOperation({ summary: 'List subinventories' })
  list(
    @Req() req: AuthReq,
    @Query('warehouseId') warehouseId?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listSubinventories(req.user.tenantId, {
      warehouseId,
      type,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Permissions('inventory.subinventory.read')
  @Get(':id')
  @ApiOperation({ summary: 'Get a subinventory' })
  get(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getSubinventory(req.user.tenantId, id);
  }

  @Permissions('inventory.subinventory.manage')
  @Post()
  @ApiOperation({ summary: 'Create a subinventory' })
  create(@Req() req: AuthReq, @ZodBody(createSubinventorySchema) dto: any) {
    return this.service.createSubinventory(req.user.tenantId, dto);
  }

  @Permissions('inventory.subinventory.manage')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a subinventory' })
  update(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateSubinventorySchema) dto: any) {
    return this.service.updateSubinventory(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.subinventory.manage')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a subinventory' })
  delete(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.deleteSubinventory(req.user.tenantId, id);
  }

  @Permissions('inventory.subinventory.manage')
  @Post('transfer')
  @ApiOperation({ summary: 'Transfer stock between subinventories' })
  transfer(@Req() req: AuthReq, @ZodBody(transferBetweenSubinventoriesSchema) dto: any) {
    return this.service.transferStock(req.user.tenantId, dto);
  }
}
