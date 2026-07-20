import { Controller, Get, Post, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../../common/guards/tenant.interceptor';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { SaasPortalGdprComplianceService } from '../services/gdpr-compliance.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; firstName: string; lastName: string; roles: string[] };
}

const generateReportSchema = z.object({ type: z.enum(['soc2', 'hipaa', 'gdpr', 'custom']), dateFrom: z.string().optional(), dateTo: z.string().optional() });
const requestCertificationSchema = z.object({ standard: z.enum(['soc2', 'hipaa', 'gdpr', 'iso27001']), notes: z.string().optional() });
const signDpaSchema = z.object({ accepted: z.literal(true), acceptedBy: z.string().min(1) });

const upsertRetentionPolicySchema = z.object({
  entityType: z.string().min(1).max(100),
  retentionDays: z.number().int().min(1),
  action: z.enum(['DELETE', 'ANONYMIZE', 'ARCHIVE']),
  isActive: z.boolean(),
});

const createErasureRequestSchema = z.object({
  subjectEmail: z.string().email(),
  subjectName: z.string().max(255).optional(),
  entityTypes: z.array(z.string().min(1)).min(1),
});

/**
 * SaaS Portal home for GDPR + platform compliance. Consolidates
 * `/admin/gdpr` (retention policies, erasure requests, right-of-access) and
 * `/saas/compliance` (reports, certifications, DPA, standards) under one
 * `/saas-portal/gdpr-compliance` surface. Independent implementation, not a
 * cross-module delegate (see gdpr-compliance.service.ts header).
 */
@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal/gdpr-compliance')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SaasPortalGdprComplianceController {
  constructor(private readonly gdprComplianceService: SaasPortalGdprComplianceService) {}

  /* ── GDPR: Retention Policies ─────────────────────── */

  @ApiOperation({ summary: 'Get retention policies' })
  @Get('retention-policies')
  @Permissions('saas.gdpr.read')
  async getRetentionPolicies(@Req() req: AuthenticatedRequest) {
    return this.gdprComplianceService.getRetentionPolicies(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Upsert retention policy' })
  @Post('retention-policies')
  @Permissions('saas.gdpr.manage')
  async upsertRetentionPolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(upsertRetentionPolicySchema) body: z.infer<typeof upsertRetentionPolicySchema>,
  ) {
    return this.gdprComplianceService.upsertRetentionPolicy(req.user.tenantId, body);
  }

  /* ── GDPR: Erasure Requests ──────────────────────── */

  @ApiOperation({ summary: 'Get erasure requests' })
  @Get('erasure-requests')
  @Permissions('saas.gdpr.read')
  async getErasureRequests(@Req() req: AuthenticatedRequest) {
    return this.gdprComplianceService.getErasureRequests(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create erasure request' })
  @Post('erasure-requests')
  @Permissions('saas.gdpr.manage')
  async createErasureRequest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createErasureRequestSchema) body: z.infer<typeof createErasureRequestSchema>,
  ) {
    return this.gdprComplianceService.createErasureRequest(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Execute erasure' })
  @Post('erasure-requests/:id/execute')
  @Permissions('saas.gdpr.manage')
  async executeErasure(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.gdprComplianceService.executeErasure(req.user.tenantId, id);
  }

  /* ── GDPR: Data Export (Right of Access) ───────────── */

  @ApiOperation({ summary: 'Export subject data' })
  @Post('data-export/:email')
  @Permissions('saas.gdpr.read')
  async exportSubjectData(@Req() req: AuthenticatedRequest, @Param('email') email: string) {
    return this.gdprComplianceService.exportSubjectData(req.user.tenantId, email);
  }

  /* ── Compliance: Reports / Certifications / DPA / Standards ── */

  @ApiOperation({ summary: 'List compliance reports' })
  @Permissions('saas.compliance.read')
  @Get('reports')
  async listComplianceReports() {
    return this.gdprComplianceService.listComplianceReports();
  }

  @ApiOperation({ summary: 'Generate compliance report' })
  @Permissions('saas.compliance.create')
  @Post('reports/generate')
  async generateComplianceReport(@ZodBody(generateReportSchema) body: z.infer<typeof generateReportSchema>) {
    return this.gdprComplianceService.generateComplianceReport(body.type);
  }

  @ApiOperation({ summary: 'Get compliance report' })
  @Permissions('saas.compliance.read')
  @Get('reports/:id')
  async getComplianceReport(@Param('id') id: string) {
    return this.gdprComplianceService.getComplianceReport(id);
  }

  @ApiOperation({ summary: 'List certifications' })
  @Permissions('saas.compliance.read')
  @Get('certifications')
  async listCertifications() {
    return this.gdprComplianceService.listCertifications();
  }

  @ApiOperation({ summary: 'Request certification' })
  @Permissions('saas.compliance.create')
  @Post('certifications')
  async requestCertification(@ZodBody(requestCertificationSchema) body: z.infer<typeof requestCertificationSchema>) {
    return this.gdprComplianceService.requestCertification(body.standard);
  }

  @ApiOperation({ summary: 'Get data processing agreement' })
  @Permissions('saas.compliance.read')
  @Get('data-processing')
  async getDataProcessingAgreement() {
    return this.gdprComplianceService.getDataProcessingAgreement();
  }

  @ApiOperation({ summary: 'Sign data processing agreement' })
  @Permissions('saas.compliance.create')
  @Post('data-processing/sign')
  async signDataProcessingAgreement(@ZodBody(signDpaSchema) body: z.infer<typeof signDpaSchema>) {
    return this.gdprComplianceService.signDataProcessingAgreement(body.acceptedBy);
  }

  @ApiOperation({ summary: 'Get HIPAA status' })
  @Permissions('saas.compliance.read')
  @Get('hipaa')
  async getHipaaStatus() {
    return this.gdprComplianceService.getHipaaStatus();
  }

  @ApiOperation({ summary: 'Get GDPR status' })
  @Permissions('saas.compliance.read')
  @Get('gdpr-status')
  async getGdprStatus(@Req() req: AuthenticatedRequest) {
    return this.gdprComplianceService.getGdprStatus(req.user.tenantId);
  }

  @ApiOperation({ summary: 'List compliance standards' })
  @Permissions('saas.compliance.read')
  @Get('standards')
  async listComplianceStandards() {
    return this.gdprComplianceService.listComplianceStandards();
  }

  @ApiOperation({ summary: 'Run compliance scan' })
  @Permissions('saas.compliance.create')
  @Post('scan')
  async runComplianceScan() {
    return this.gdprComplianceService.runComplianceScan();
  }
}
