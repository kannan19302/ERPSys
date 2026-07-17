import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmGamificationService, createBadgeSchema, CreateBadgeInput, updateBadgeSchema, UpdateBadgeInput,
} from './crm-gamification.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Sales Gamification & Real-Time Leaderboards admin/rep API (Up Next item 44,
 * benchmark: SalesScreen, Ambition, Spinify).
 */
@ApiTags('crm-gamification')
@ApiBearerAuth()
@Controller('crm/gamification')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmGamificationController {
  constructor(private readonly svc: CrmGamificationService) {}

  @ApiOperation({ summary: 'Recompute + persist the leaderboard snapshot for a period' })
  @Post('leaderboard/recompute')
  @Permissions('crm.commission.update')
  @TrackChanges('LeaderboardSnapshot')
  async recomputeLeaderboard(@Req() req: AuthenticatedRequest, @Query('period') period?: string) {
    return this.svc.computeLeaderboard(req.user.tenantId, req.user.orgId ?? '', period);
  }

  @ApiOperation({ summary: 'Get the leaderboard for a period' })
  @Get('leaderboard')
  @Permissions('crm.commission.read')
  async getLeaderboard(@Req() req: AuthenticatedRequest, @Query('period') period?: string) {
    return this.svc.getLeaderboard(req.user.tenantId, period);
  }

  @ApiOperation({ summary: 'List periods that have a computed leaderboard' })
  @Get('leaderboard/periods')
  @Permissions('crm.commission.read')
  async listPeriods(@Req() req: AuthenticatedRequest) {
    return this.svc.listAvailablePeriods(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Recompute activity/deals-won streaks for every rep' })
  @Post('streaks/recompute')
  @Permissions('crm.commission.update')
  @TrackChanges('SalesStreak')
  async recomputeStreaks(@Req() req: AuthenticatedRequest) {
    return this.svc.computeStreaks(req.user.tenantId, req.user.orgId ?? '');
  }

  @ApiOperation({ summary: 'List current rep streaks' })
  @Get('streaks')
  @Permissions('crm.commission.read')
  async listStreaks(@Req() req: AuthenticatedRequest) {
    return this.svc.listStreaks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'List badge definitions' })
  @Get('badges')
  @Permissions('crm.commission.read')
  async listBadges(@Req() req: AuthenticatedRequest) {
    return this.svc.listBadges(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create a badge definition' })
  @Post('badges')
  @Permissions('crm.commission.manage')
  @TrackChanges('GamificationBadge')
  async createBadge(@Req() req: AuthenticatedRequest, @ZodBody(createBadgeSchema) dto: CreateBadgeInput) {
    return this.svc.createBadge(req.user.tenantId, req.user.orgId ?? '', dto);
  }

  @ApiOperation({ summary: 'Update a badge definition' })
  @Patch('badges/:id')
  @Permissions('crm.commission.manage')
  @TrackChanges('GamificationBadge')
  async updateBadge(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateBadgeSchema) dto: UpdateBadgeInput) {
    return this.svc.updateBadge(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a badge definition' })
  @Delete('badges/:id')
  @Permissions('crm.commission.manage')
  @TrackChanges('GamificationBadge')
  async deleteBadge(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteBadge(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Evaluate every active badge against current deal/activity data and award new ones' })
  @Post('badges/evaluate')
  @Permissions('crm.commission.update')
  @TrackChanges('GamificationBadgeAward')
  async evaluateBadges(@Req() req: AuthenticatedRequest) {
    return this.svc.evaluateBadges(req.user.tenantId, req.user.orgId ?? '');
  }

  @ApiOperation({ summary: 'List badge awards (optionally for one user)' })
  @Get('badges/awards')
  @Permissions('crm.commission.read')
  async listBadgeAwards(@Req() req: AuthenticatedRequest, @Query('userId') userId?: string) {
    return this.svc.listBadgeAwards(req.user.tenantId, userId);
  }

  @ApiOperation({ summary: 'Get my own gamification summary (rank, badges, streaks)' })
  @Get('me')
  @Permissions('crm.commission.read')
  async mySummary(@Req() req: AuthenticatedRequest, @Query('period') period?: string) {
    return this.svc.getMySummary(req.user.tenantId, req.user.userId, period);
  }
}
