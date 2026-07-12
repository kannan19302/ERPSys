import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryAutomationService,
  createReplenishmentRuleSchema,
  createHoldSchema,
  releaseHoldSchema,
} from './inventory-automation.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-automation')
@Controller('inventory/automation')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryAutomationController {
  constructor(private readonly service: InventoryAutomationService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Automation rules and holds overview' })
  getDashboard(@Req() req: AuthReq) {
    return this.service.getAutomationDashboard(req.user.tenantId);
  }

  @Get('replenishment-rules')
  @ApiOperation({ summary: 'List bin replenishment rules' })
  listRules(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.listReplenishmentRules(req.user.tenantId, warehouseId);
  }

  @Post('replenishment-rules')
  @ApiOperation({ summary: 'Create a bin replenishment rule' })
  createRule(@Req() req: AuthReq, @ZodBody(createReplenishmentRuleSchema) dto: any) {
    return this.service.createReplenishmentRule(req.user.tenantId, dto);
  }

  @Patch('replenishment-rules/:id')
  @ApiOperation({ summary: 'Update replenishment rule thresholds' })
  updateRule(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(createReplenishmentRuleSchema.partial()) dto: any) {
    return this.service.updateReplenishmentRule(req.user.tenantId, id, dto);
  }

  @Delete('replenishment-rules/:id')
  @ApiOperation({ summary: 'Deactivate a replenishment rule' })
  deleteRule(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.deleteReplenishmentRule(req.user.tenantId, id);
  }

  @Post('replenishment-rules/evaluate')
  @ApiOperation({ summary: 'Evaluate all active rules for a warehouse' })
  evaluateRules(@Req() req: AuthReq, @Query('warehouseId') warehouseId: string) {
    return this.service.evaluateReplenishmentRules(req.user.tenantId, warehouseId);
  }

  @Get('holds')
  @ApiOperation({ summary: 'List inventory holds' })
  listHolds(
    @Req() req: AuthReq,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listHolds(req.user.tenantId, { productId, warehouseId, status });
  }

  @Post('holds')
  @ApiOperation({ summary: 'Place an inventory hold' })
  createHold(@Req() req: AuthReq, @ZodBody(createHoldSchema) dto: any) {
    return this.service.createHold(req.user.tenantId, dto);
  }

  @Post('holds/:id/release')
  @ApiOperation({ summary: 'Release an inventory hold' })
  releaseHold(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(releaseHoldSchema) dto: any) {
    return this.service.releaseHold(req.user.tenantId, id, dto);
  }

  @Post('holds/:id/cancel')
  @ApiOperation({ summary: 'Cancel an inventory hold' })
  cancelHold(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.cancelHold(req.user.tenantId, id);
  }
}
