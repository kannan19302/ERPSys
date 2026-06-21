import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SubscriptionService } from './subscription.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@Controller('admin/subscription')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  @Permissions('admin.subscription.read')
  async getCurrentPlan(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getCurrentPlan(req.user.tenantId);
  }

  @Get('plans')
  @Permissions('admin.subscription.read')
  async getAvailablePlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @Post('change-plan')
  @Permissions('admin.subscription.update')
  async changePlan(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { planId: string },
  ) {
    return this.subscriptionService.changePlan(req.user.tenantId, dto.planId);
  }

  @Post('seats')
  @Permissions('admin.subscription.update')
  async updateSeats(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { seats: number },
  ) {
    return this.subscriptionService.updateSeats(req.user.tenantId, dto.seats);
  }

  @Get('billing-history')
  @Permissions('admin.subscription.read')
  async getBillingHistory(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionService.getBillingHistory(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
