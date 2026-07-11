import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CrmConversionAnalyticsService } from './crm-conversion-analytics.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Lead-to-Opportunity Conversion Analytics API (Up Next item 43).
 */
@ApiTags('crm-conversion-analytics')
@ApiBearerAuth()
@Controller('crm/conversion-analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmConversionAnalyticsController {
  constructor(private readonly svc: CrmConversionAnalyticsService) {}

  @ApiOperation({ summary: 'Overall lead-to-opportunity-to-won funnel summary, with average cycle time' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @Get('summary')
  @Permissions('crm.lead.read')
  async getSummary(@Req() req: AuthenticatedRequest, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.svc.getFunnelSummary(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Funnel conversion rates broken down by lead source' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @Get('by-source')
  @Permissions('crm.lead.read')
  async getBySource(@Req() req: AuthenticatedRequest, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.svc.getFunnelBySource(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Funnel conversion rates broken down by campaign' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @Get('by-campaign')
  @Permissions('crm.lead.read')
  async getByCampaign(@Req() req: AuthenticatedRequest, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.svc.getFunnelByCampaign(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Funnel conversion-rate leaderboard broken down by assigned rep' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @Get('by-rep')
  @Permissions('crm.lead.read')
  async getByRep(@Req() req: AuthenticatedRequest, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.svc.getFunnelByRep(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Trailing weekly time-series of leads created vs. converted vs. opportunities won' })
  @ApiQuery({ name: 'weeks', required: false, description: 'Number of trailing weeks (default 12)' })
  @Get('trend')
  @Permissions('crm.lead.read')
  async getTrend(@Req() req: AuthenticatedRequest, @Query('weeks') weeks?: string) {
    return this.svc.getConversionTrend(req.user.tenantId, weeks ? Number(weeks) : 12);
  }
}
