import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  QualityComplianceService,
  createCapaSchema,
  addCapaActionSchema,
  createCalibrationSchema,
  recordCalibrationResultSchema,
  createDeviationSchema,
  createSopSchema,
} from './quality-compliance.service';

interface AuthReq extends Request { user: { tenantId: string; orgId: string; userId: string }; }

@Controller('inventory/quality-compliance')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class QualityComplianceController {
  constructor(private readonly svc: QualityComplianceService) {}

  // ─── CAPA ──────────────────────────────────────────────────────────────────

  @Permissions('inventory.quality_compliance.read')
  @Get('capas')
  listCapas(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
  ) {
    return this.svc.listCapas(req.user.tenantId, { status, type, priority });
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('capas/dashboard')
  getCapaDashboard(@Req() req: AuthReq) {
    return this.svc.getCapaDashboard(req.user.tenantId);
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('capas/:id')
  getCapa(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getCapa(req.user.tenantId, id);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('capas')
  createCapa(@Req() req: AuthReq, @ZodBody(createCapaSchema) dto: typeof createCapaSchema._type) {
    return this.svc.createCapa(req.user.tenantId, dto);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Patch('capas/:id')
  updateCapa(@Req() req: AuthReq, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateCapa(req.user.tenantId, id, body as Parameters<QualityComplianceService['updateCapa']>[2]);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('capas/:id/transition')
  transitionCapa(@Req() req: AuthReq, @Param('id') id: string, @Body('status') status: string) {
    return this.svc.transitionCapaStatus(req.user.tenantId, id, status);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('capas/:id/actions')
  addCapaAction(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(addCapaActionSchema) dto: typeof addCapaActionSchema._type) {
    return this.svc.addCapaAction(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('capas/actions/:actionId/complete')
  completeCapaAction(@Req() req: AuthReq, @Param('actionId') actionId: string, @Body('notes') notes?: string) {
    return this.svc.completeCapaAction(req.user.tenantId, actionId, notes);
  }

  // ─── Calibration ───────────────────────────────────────────────────────────

  @Permissions('inventory.quality_compliance.read')
  @Get('calibrations')
  listCalibrations(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('instrumentId') instrumentId?: string,
  ) {
    return this.svc.listCalibrations(req.user.tenantId, { status, instrumentId });
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('calibrations/dashboard')
  getCalibrationDashboard(@Req() req: AuthReq) {
    return this.svc.getCalibrationDashboard(req.user.tenantId);
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('calibrations/overdue')
  getOverdueCalibrations(@Req() req: AuthReq) {
    return this.svc.getOverdueCalibrations(req.user.tenantId);
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('calibrations/:id')
  getCalibration(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getCalibration(req.user.tenantId, id);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('calibrations')
  scheduleCalibration(@Req() req: AuthReq, @ZodBody(createCalibrationSchema) dto: typeof createCalibrationSchema._type) {
    return this.svc.scheduleCalibration(req.user.tenantId, dto);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('calibrations/:id/result')
  recordCalibrationResult(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @ZodBody(recordCalibrationResultSchema) dto: typeof recordCalibrationResultSchema._type,
  ) {
    return this.svc.recordCalibrationResult(req.user.tenantId, id, dto);
  }

  // ─── Deviations ────────────────────────────────────────────────────────────

  @Permissions('inventory.quality_compliance.read')
  @Get('deviations')
  listDeviations(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
  ) {
    return this.svc.listDeviations(req.user.tenantId, { status, severity, type });
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('deviations/dashboard')
  getDeviationDashboard(@Req() req: AuthReq) {
    return this.svc.getDeviationDashboard(req.user.tenantId);
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('deviations/:id')
  getDeviation(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getDeviation(req.user.tenantId, id);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('deviations')
  createDeviation(@Req() req: AuthReq, @ZodBody(createDeviationSchema) dto: typeof createDeviationSchema._type) {
    return this.svc.createDeviation(req.user.tenantId, dto);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('deviations/:id/review')
  reviewDeviation(@Req() req: AuthReq, @Param('id') id: string, @Body('notes') notes: string) {
    return this.svc.reviewDeviation(req.user.tenantId, id, notes);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('deviations/:id/close')
  closeDeviation(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Body('closedBy') closedBy: string,
    @Body('capaId') capaId?: string,
  ) {
    return this.svc.closeDeviation(req.user.tenantId, id, closedBy, capaId);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('deviations/:id/escalate-to-capa')
  escalateToCapaFromDeviation(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @ZodBody(createCapaSchema) dto: typeof createCapaSchema._type,
  ) {
    return this.svc.escalateDeviationToCapa(req.user.tenantId, id, dto);
  }

  // ─── SOP Document Control ──────────────────────────────────────────────────

  @Permissions('inventory.quality_compliance.read')
  @Get('sops')
  listSops(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('department') department?: string,
  ) {
    return this.svc.listSops(req.user.tenantId, { status, category, department });
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('sops/due-soon')
  getSopsDueSoon(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.svc.getSopsDueSoon(req.user.tenantId, days ? parseInt(days) : 30);
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('sops/search')
  searchSops(@Req() req: AuthReq, @Query('q') keyword: string) {
    return this.svc.searchSops(req.user.tenantId, keyword ?? '');
  }

  @Permissions('inventory.quality_compliance.read')
  @Get('sops/:id')
  getSop(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getSop(req.user.tenantId, id);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('sops')
  createSop(@Req() req: AuthReq, @ZodBody(createSopSchema) dto: typeof createSopSchema._type) {
    return this.svc.createSop(req.user.tenantId, dto);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('sops/:id/submit-review')
  submitSopForReview(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.submitSopForReview(req.user.tenantId, id);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('sops/:id/approve')
  approveSop(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Body('approverId') approverId: string,
    @Body('effectiveDate') effectiveDate?: string,
  ) {
    return this.svc.approveSop(req.user.tenantId, id, approverId, effectiveDate);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('sops/:id/obsolete')
  obsoleteSop(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Body('supersededById') supersededById?: string,
  ) {
    return this.svc.obsoleteSop(req.user.tenantId, id, supersededById);
  }

  @Permissions('inventory.quality_compliance.manage')
  @Post('sops/:id/revise')
  reviseSop(
    @Req() req: AuthReq,
    @Param('id') id: string,
    @Body('newVersion') newVersion: string,
    @Body('changeSummary') changeSummary: string,
    @Body('changedBy') changedBy?: string,
  ) {
    return this.svc.reviseSOp(req.user.tenantId, id, newVersion, changeSummary, changedBy);
  }

  // ─── Compliance Dashboard ──────────────────────────────────────────────────

  @Permissions('inventory.quality_compliance.read')
  @Get('dashboard')
  getComplianceDashboard(@Req() req: AuthReq) {
    return this.svc.getComplianceDashboard(req.user.tenantId);
  }
}
