import { Controller, Get, Post, Patch, Delete, Req, Param, Query, Body, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { SubscriptionsService } from './subscriptions.service';

interface AuthenticatedRequest extends Request {
    user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly service: SubscriptionsService) { }

    @Get()
    @ApiOperation({ summary: 'List subscriptions (paginated, sortable, filterable)' })
    @Permissions('finance.subscription.read')
    async findAll(@Req() req: AuthenticatedRequest, @Query() query: Record<string, string>) {
        return this.service.findAll(req.user.tenantId, query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get subscription stats by status' })
    @Permissions('finance.subscription.read')
    async getStats(@Req() req: AuthenticatedRequest) {
        return this.service.getStats(req.user.tenantId);
    }

    @Get('metrics')
    @ApiOperation({ summary: 'Get MRR/ARR/churn metrics' })
    @Permissions('finance.subscription.read')
    async getMetrics(@Req() req: AuthenticatedRequest) {
        return this.service.getMetrics(req.user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get subscription by ID' })
    @Permissions('finance.subscription.read')
    async findById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.service.findById(req.user.tenantId, id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new subscription' })
    @Permissions('finance.subscription.create')
    @UseInterceptors(ChangeHistoryInterceptor)
    @TrackChanges('Subscription')
    async create(@Req() req: AuthenticatedRequest, @Body() dto: Record<string, unknown>) {
        return this.service.create(req.user.tenantId, dto.orgId as string, {
            name: dto.name as string,
            description: dto.description as string | undefined,
            customerId: dto.customerId as string | undefined,
            productId: dto.productId as string | undefined,
            currency: dto.currency as string | undefined,
            unitAmount: dto.unitAmount as number,
            quantity: dto.quantity as number | undefined,
            billingPeriod: dto.billingPeriod as string | undefined,
            billingCycles: dto.billingCycles as number | undefined,
            startDate: dto.startDate as string,
            trialEndDate: dto.trialEndDate as string | undefined,
            lines: dto.lines as any[] | undefined,
        });
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update subscription' })
    @Permissions('finance.subscription.update')
    @UseInterceptors(ChangeHistoryInterceptor)
    @TrackChanges('Subscription')
    async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Record<string, unknown>) {
        return this.service.update(req.user.tenantId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Cancel a subscription' })
    @Permissions('finance.subscription.delete')
    @UseInterceptors(ChangeHistoryInterceptor)
    @TrackChanges('Subscription')
    async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.service.delete(req.user.tenantId, id);
    }

    // ── Lifecycle ──

    @Post(':id/pause')
    @ApiOperation({ summary: 'Pause a subscription' })
    @Permissions('finance.subscription.update')
    async pause(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.service.pause(req.user.tenantId, id);
    }

    @Post(':id/resume')
    @ApiOperation({ summary: 'Resume a paused subscription' })
    @Permissions('finance.subscription.update')
    async resume(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.service.resume(req.user.tenantId, id);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel a subscription (at period end by default)' })
    @Permissions('finance.subscription.update')
    async cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('immediate') immediate?: string) {
        return this.service.cancel(req.user.tenantId, id, immediate === 'true');
    }

    // ── Billing ──

    @Post('billing/run')
    @ApiOperation({ summary: 'Run billing for all due subscriptions' })
    @Permissions('finance.subscription.manage')
    async runBilling(@Req() req: AuthenticatedRequest) {
        return this.service.runBilling(req.user.tenantId);
    }

    // ── Usage ──

    @Post(':id/usage')
    @ApiOperation({ summary: 'Record usage for a subscription' })
    @Permissions('finance.subscription.update')
    async recordUsage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Record<string, unknown>) {
        return this.service.recordUsage(req.user.tenantId, id, {
            usageDate: dto.usageDate as string,
            metricName: dto.metricName as string,
            quantity: dto.quantity as number,
            unitAmount: dto.unitAmount as number,
        });
    }

    @Get(':id/usage')
    @ApiOperation({ summary: 'Get usage records for a subscription' })
    @Permissions('finance.subscription.read')
    async getUsage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('metricName') metricName?: string) {
        return this.service.getUsage(req.user.tenantId, id, metricName);
    }

    @Get(':id/usage/summary')
    @ApiOperation({ summary: 'Get usage summary grouped by metric' })
    @Permissions('finance.subscription.read')
    async getUsageSummary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.service.getUsageSummary(req.user.tenantId, id);
    }
}
