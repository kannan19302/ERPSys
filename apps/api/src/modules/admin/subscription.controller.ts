import { Controller, Get, Post, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SubscriptionService } from './subscription.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/subscription')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiOperation({ summary: 'Get current plan' })
  @Permissions('admin.read')
  @Get('current')
  @Permissions('admin.subscription.read')
  async getCurrentPlan(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getCurrentPlan(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get available plans' })
  @Permissions('admin.read')
  @Get('plans')
  @Permissions('admin.subscription.read')
  async getAvailablePlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @ApiOperation({ summary: 'Change plan' })
  @Permissions('admin.create')
  @Post('change-plan')
  @Permissions('admin.subscription.update')
  async changePlan(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { planId: string },
  ) {
    return this.subscriptionService.changePlan(req.user.tenantId, dto.planId);
  }

  @ApiOperation({ summary: 'Update seats' })
  @Permissions('admin.create')
  @Post('seats')
  @Permissions('admin.subscription.update')
  async updateSeats(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { seats: number },
  ) {
    return this.subscriptionService.updateSeats(req.user.tenantId, dto.seats);
  }

  @ApiOperation({ summary: 'Get billing history' })
  @Permissions('admin.read')
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
