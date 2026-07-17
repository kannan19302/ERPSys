import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmCoachingService,
  createRubricSchema,
  CreateRubricInput,
  updateRubricSchema,
  UpdateRubricInput,
  createScorecardSchema,
  CreateScorecardInput,
  createLibraryItemSchema,
  CreateLibraryItemInput,
} from './crm-coaching.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Sales coaching / call-scoring API (Up Next item 47, benchmark: Gong,
 * Chorus.ai, Salesloft).
 */
@ApiTags('crm-coaching')
@ApiBearerAuth()
@Controller('crm/coaching')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCoachingController {
  constructor(private readonly svc: CrmCoachingService) {}

  @ApiOperation({ summary: 'Create a coaching scorecard rubric' })
  @Post('rubrics')
  @Permissions('crm.coaching.manage')
  @TrackChanges('CoachingRubric')
  async createRubric(@Req() req: AuthenticatedRequest, @ZodBody(createRubricSchema) dto: CreateRubricInput) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.createRubric(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'List coaching rubrics' })
  @Get('rubrics')
  @Permissions('crm.coaching.read')
  async listRubrics(@Req() req: AuthenticatedRequest, @Query('activeOnly') activeOnly?: string) {
    return this.svc.listRubrics(req.user.tenantId, activeOnly === 'true');
  }

  @ApiOperation({ summary: 'Get one coaching rubric' })
  @Get('rubrics/:id')
  @Permissions('crm.coaching.read')
  async getRubric(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getRubric(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Update a coaching rubric' })
  @Put('rubrics/:id')
  @Permissions('crm.coaching.manage')
  @TrackChanges('CoachingRubric')
  async updateRubric(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateRubricSchema) dto: UpdateRubricInput) {
    return this.svc.updateRubric(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Score a logged call against a rubric (manager review)' })
  @Post('scorecards')
  @Permissions('crm.coaching.create')
  @TrackChanges('CallScorecard')
  async createScorecard(@Req() req: AuthenticatedRequest, @ZodBody(createScorecardSchema) dto: CreateScorecardInput) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.createScorecard(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'List scorecards for a given call activity' })
  @Get('calls/:activityId/scorecards')
  @Permissions('crm.coaching.read')
  async listScorecardsForCall(@Req() req: AuthenticatedRequest, @Param('activityId') activityId: string) {
    return this.svc.listScorecardsForCall(req.user.tenantId, activityId);
  }

  @ApiOperation({ summary: 'Get one scorecard' })
  @Get('scorecards/:id')
  @Permissions('crm.coaching.read')
  async getScorecard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getScorecard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Rep acknowledges a coaching scorecard (closes the review loop)' })
  @Put('scorecards/:id/acknowledge')
  @Permissions('crm.coaching.update')
  @TrackChanges('CallScorecard')
  async acknowledgeScorecard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.acknowledgeScorecard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Per-rep coaching summary: average score, talk ratio, trend' })
  @Get('reps/:repUserId/summary')
  @Permissions('crm.coaching.read')
  async getRepSummary(@Req() req: AuthenticatedRequest, @Param('repUserId') repUserId: string) {
    return this.svc.getRepCoachingSummary(req.user.tenantId, repUserId);
  }

  @ApiOperation({ summary: 'Team-wide coaching dashboard: per-rep averages' })
  @Get('dashboard')
  @Permissions('crm.coaching.read')
  async getTeamDashboard(@Req() req: AuthenticatedRequest) {
    return this.svc.getTeamCoachingDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Add an exemplar call/note to the coaching library' })
  @Post('library')
  @Permissions('crm.coaching.manage')
  @TrackChanges('CoachingLibraryItem')
  async createLibraryItem(@Req() req: AuthenticatedRequest, @ZodBody(createLibraryItemSchema) dto: CreateLibraryItemInput) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.createLibraryItem(req.user.tenantId, orgId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'List coaching library items' })
  @Get('library')
  @Permissions('crm.coaching.read')
  async listLibraryItems(@Req() req: AuthenticatedRequest, @Query('category') category?: string) {
    return this.svc.listLibraryItems(req.user.tenantId, category);
  }

  @ApiOperation({ summary: 'Remove a coaching library item' })
  @Delete('library/:id')
  @Permissions('crm.coaching.manage')
  @TrackChanges('CoachingLibraryItem')
  async deleteLibraryItem(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteLibraryItem(req.user.tenantId, id);
  }
}
