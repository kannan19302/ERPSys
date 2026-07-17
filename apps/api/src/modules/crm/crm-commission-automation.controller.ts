import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmCommissionAutomationService,
  createPlanSchema, CreatePlanInput, updatePlanSchema, UpdatePlanInput,
  createTierSchema, CreateTierInput,
  createSpiffSchema, CreateSpiffInput, updateSpiffSchema, UpdateSpiffInput,
  calculatePayoutsSchema, CalculatePayoutsInput,
} from './crm-commission-automation.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Commission Plan Automation deepening admin API (Up Next item 46, benchmark:
 * Xactly, CaptivateIQ, Spiff) — quota-attainment accelerator tiers + SPIFFs,
 * additive to the existing per-deal `CommissionRule` (`/crm/expansion/commissions`).
 */
@ApiTags('crm-commission-automation')
@ApiBearerAuth()
@Controller('crm/commission-plans')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCommissionAutomationController {
  constructor(private readonly svc: CrmCommissionAutomationService) {}

  @ApiOperation({ summary: 'List commission plans' })
  @Get()
  @Permissions('crm.commission.read')
  async listPlans(@Req() req: AuthenticatedRequest) {
    return this.svc.listPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get a commission plan with tiers and SPIFFs' })
  @Get(':id')
  @Permissions('crm.commission.read')
  async getPlan(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a commission plan' })
  @Post()
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPlan')
  async createPlan(@Req() req: AuthenticatedRequest, @ZodBody(createPlanSchema) dto: CreatePlanInput) {
    return this.svc.createPlan(req.user.tenantId, req.user.orgId ?? '', dto);
  }

  @ApiOperation({ summary: 'Update a commission plan' })
  @Patch(':id')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPlan')
  async updatePlan(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updatePlanSchema) dto: UpdatePlanInput) {
    return this.svc.updatePlan(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a commission plan' })
  @Delete(':id')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPlan')
  async deletePlan(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deletePlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Add a quota-attainment accelerator tier to a plan' })
  @Post(':id/tiers')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPlanTier')
  async addTier(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(createTierSchema) dto: CreateTierInput) {
    return this.svc.addTier(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a tier from a plan' })
  @Delete('tiers/:tierId')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPlanTier')
  async removeTier(@Req() req: AuthenticatedRequest, @Param('tierId') tierId: string) {
    return this.svc.removeTier(req.user.tenantId, tierId);
  }

  @ApiOperation({ summary: 'List SPIFF bonus rules' })
  @Get('spiffs/all')
  @Permissions('crm.commission.read')
  async listSpiffs(@Req() req: AuthenticatedRequest) {
    return this.svc.listSpiffs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create a SPIFF bonus rule' })
  @Post('spiffs')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionSpiff')
  async createSpiff(@Req() req: AuthenticatedRequest, @ZodBody(createSpiffSchema) dto: CreateSpiffInput) {
    return this.svc.createSpiff(req.user.tenantId, req.user.orgId ?? '', dto);
  }

  @ApiOperation({ summary: 'Update a SPIFF bonus rule' })
  @Patch('spiffs/:id')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionSpiff')
  async updateSpiff(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateSpiffSchema) dto: UpdateSpiffInput) {
    return this.svc.updateSpiff(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a SPIFF bonus rule' })
  @Delete('spiffs/:id')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionSpiff')
  async deleteSpiff(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteSpiff(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Calculate quota-attainment-tiered + SPIFF payouts for a plan/period' })
  @Post('calculate-payouts')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPayout')
  async calculatePayouts(@Req() req: AuthenticatedRequest, @ZodBody(calculatePayoutsSchema) dto: CalculatePayoutsInput) {
    return this.svc.calculatePayouts(req.user.tenantId, req.user.orgId ?? '', dto);
  }

  @ApiOperation({ summary: 'List calculated payouts' })
  @Get('payouts/all')
  @Permissions('crm.commission.read')
  async listPayouts(@Req() req: AuthenticatedRequest, @Query('planId') planId?: string, @Query('period') period?: string, @Query('userId') userId?: string) {
    return this.svc.listPayouts(req.user.tenantId, { planId, period, userId });
  }

  @ApiOperation({ summary: 'Get a single payout with SPIFF detail lines' })
  @Get('payouts/:id')
  @Permissions('crm.commission.read')
  async getPayout(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getPayout(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Approve a draft payout' })
  @Post('payouts/:id/approve')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPayout')
  async approvePayout(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.approvePayout(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Mark an approved payout as paid' })
  @Post('payouts/:id/mark-paid')
  @Permissions('crm.commission.manage')
  @TrackChanges('CommissionPayout')
  async markPaid(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.markPaid(req.user.tenantId, id);
  }
}
