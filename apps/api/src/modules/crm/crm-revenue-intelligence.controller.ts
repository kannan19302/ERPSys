import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { CrmRevenueIntelligenceService } from './crm-revenue-intelligence.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Revenue Intelligence / deal-risk digest API (Up Next item 42, benchmark:
 * Gong Deal Intelligence, Clari Risk Signals daily digest).
 */
@ApiTags('crm-revenue-intelligence')
@ApiBearerAuth()
@Controller('crm/revenue-intelligence')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmRevenueIntelligenceController {
  constructor(private readonly svc: CrmRevenueIntelligenceService) {}

  @ApiOperation({ summary: 'Generate and send the deal-risk digest to reps + managers (admin/scheduler-triggered)' })
  @ApiQuery({ name: 'windowHours', required: false, description: 'Digest cadence window in hours (24=daily, 168=weekly)' })
  @Post('digest/generate')
  @Permissions('crm.opportunity.update')
  @TrackChanges('DealRiskDigestRun')
  async generateDigest(@Req() req: AuthenticatedRequest, @Query('windowHours') windowHours?: string) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.generateAndSendDigests(req.user.tenantId, orgId, windowHours ? Number(windowHours) : 24);
  }

  @ApiOperation({ summary: 'List past digest runs (audit history), optionally scoped to one recipient' })
  @Get('digest/runs')
  @Permissions('crm.opportunity.read')
  async listDigestRuns(@Req() req: AuthenticatedRequest, @Query('recipientUserId') recipientUserId?: string) {
    return this.svc.listDigestRuns(req.user.tenantId, recipientUserId);
  }
}
