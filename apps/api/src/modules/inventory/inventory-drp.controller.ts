import { Controller, Get, Post, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryDrpService,
  createPlanRunSchema,
} from './inventory-drp.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-drp')
@Controller('inventory/drp')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryDrpController {
  constructor(private readonly service: InventoryDrpService) {}

  @Permissions('inventory.drp.read')
  @Get('runs')
  @ApiOperation({ summary: 'List DRP plan runs' })
  listRuns(@Req() req: AuthReq, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.listPlanRuns(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Permissions('inventory.drp.read')
  @Get('runs/:id')
  @ApiOperation({ summary: 'Get a DRP plan run with plans' })
  getRun(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.getPlanRun(req.user.tenantId, id);
  }

  @Permissions('inventory.drp.manage')
  @Post('runs')
  @ApiOperation({ summary: 'Create a DRP plan run' })
  createRun(@Req() req: AuthReq, @ZodBody(createPlanRunSchema) dto: any) {
    return this.service.createPlanRun(req.user.tenantId, dto);
  }

  @Permissions('inventory.drp.manage')
  @Post('runs/:id/execute')
  @ApiOperation({ summary: 'Execute a DRP plan run' })
  executeRun(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.executePlanRun(req.user.tenantId, id);
  }

  @Permissions('inventory.drp.read')
  @Get('runs/:id/plans')
  @ApiOperation({ summary: 'List plans for a DRP run' })
  getPlansByRun(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Query('priority') priority?: string,
    @Query('productId') productId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getPlansByRun(req.user.tenantId, id, {
      priority,
      productId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Permissions('inventory.drp.read')
  @Get('plans')
  @ApiOperation({ summary: 'List all distribution plans' })
  listPlans(
    @Req() req: AuthReq,
    @Query('priority') priority?: string,
    @Query('productId') productId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listPlans(req.user.tenantId, {
      priority,
      productId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
