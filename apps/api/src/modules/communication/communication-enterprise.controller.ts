import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunicationEnterpriseService } from './communication-enterprise.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('communication-enterprise')
@ApiBearerAuth()
@Controller('communication/enterprise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CommunicationEnterpriseController {
  constructor(private readonly service: CommunicationEnterpriseService) {}

  @ApiOperation({ summary: 'Unified inbox for messages, mentions, tasks, notifications' })
  @Get('unified-inbox')
  @Permissions('communication.message.read')
  async getUnifiedInbox(@Req() req: AuthenticatedRequest) {
    return this.service.getUnifiedInbox(
      req.user.tenantId,
      req.user.userId,
      { limit: 50, offset: 0 },
    );
  }

  @ApiOperation({ summary: 'Message volume, response times, busiest channels, active users' })
  @Get('message-analytics')
  @Permissions('communication.message.read')
  async getMessageAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.service.getMessageAnalytics(req.user.tenantId, dateRange || 'MONTHLY');
  }

  @ApiOperation({ summary: 'File uploads by type, size, storage usage, most shared files' })
  @Get('file-analytics')
  @Permissions('communication.file.read')
  async getFileSharingAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.service.getFileSharingAnalytics(req.user.tenantId, dateRange || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Cross-team collaboration, network analysis, silo detection' })
  @Get('collaboration-insights')
  @Permissions('communication.message.read')
  async getCollaborationInsights(
    @Req() req: AuthenticatedRequest,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.service.getCollaborationInsights(req.user.tenantId, dateRange || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Meeting frequency, duration, attendance, decision tracking' })
  @Get('meeting-effectiveness')
  @Permissions('communication.meeting.read')
  async getMeetingEffectiveness(
    @Req() req: AuthenticatedRequest,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.service.getMeetingEffectiveness(req.user.tenantId, dateRange || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Unified search across messages, files, channels, meetings' })
  @Get('search')
  @Permissions('communication.message.read')
  async getSearchAcrossCommunication(
    @Req() req: AuthenticatedRequest,
    @Query('q') q: string,
  ) {
    return this.service.getSearchAcrossCommunication(req.user.tenantId, q);
  }

  @ApiOperation({ summary: 'Bot usage, command frequency, automation savings' })
  @Get('bot-analytics')
  @Permissions('communication.settings.read')
  async getBotAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.service.getBotAnalytics(req.user.tenantId, dateRange || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Message retention, e-discovery, compliance rule violations' })
  @Get('compliance')
  @Permissions('communication.settings.read')
  async getComplianceMonitoring(
    @Req() req: AuthenticatedRequest,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.service.getComplianceMonitoring(req.user.tenantId, dateRange || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Communication executive dashboard KPIs' })
  @Get('dashboard-kpis')
  @Permissions('communication.message.read')
  async getCollaborationDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getCollaborationDashboardKpis(req.user.tenantId);
  }
}
