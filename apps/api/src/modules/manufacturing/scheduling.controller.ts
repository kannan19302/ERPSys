import { Controller, Get, Post, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { SchedulingService } from './scheduling.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('manufacturing')
@ApiBearerAuth()
@Controller('manufacturing/scheduling')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @ApiOperation({ summary: 'Schedule work orders' })
  @Permissions('manufacturing.create')
  @Post('schedule')
  async scheduleWorkOrders(@Req() req: AuthReq, @ZodBody(z.any()) body: { algorithm?: 'FORWARD' | 'BACKWARD'; startDate?: string }) {
    return this.schedulingService.scheduleWorkOrders(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get bom cost' })
  @Permissions('manufacturing.read')
  @Get('bom-cost/:bomId')
  async getBomCost(@Req() req: AuthReq, @Param('bomId') bomId: string) {
    return this.schedulingService.calculateBomCost(req.user.tenantId, bomId);
  }
}
