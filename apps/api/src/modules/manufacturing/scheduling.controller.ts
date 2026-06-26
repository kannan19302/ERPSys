import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { SchedulingService } from './scheduling.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('manufacturing/scheduling')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('schedule')
  async scheduleWorkOrders(@Req() req: AuthReq, @Body() body: { algorithm?: 'FORWARD' | 'BACKWARD'; startDate?: string }) {
    return this.schedulingService.scheduleWorkOrders(req.user.tenantId, body);
  }

  @Get('bom-cost/:bomId')
  async getBomCost(@Req() req: AuthReq, @Param('bomId') bomId: string) {
    return this.schedulingService.calculateBomCost(req.user.tenantId, bomId);
  }
}
