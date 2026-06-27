import { Controller, Get, Post, Patch, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ClinicalService } from './clinical.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('healthcare')
@ApiBearerAuth()
@Controller('healthcare/clinical')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @ApiOperation({ summary: 'Get patient summary' })
  @Permissions('healthcare.read')
  @Get('patients/:patientId/summary')
  async getPatientSummary(@Req() req: AuthReq, @Param('patientId') patientId: string) {
    await this.clinicalService.logPhiAccess(req.user.tenantId, req.user.userId, patientId, 'VIEW_SUMMARY');
    return this.clinicalService.getPatientSummary(req.user.tenantId, patientId);
  }

  @ApiOperation({ summary: 'Create encounter' })
  @Permissions('healthcare.create')
  @Post('encounters')
  async createEncounter(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.clinicalService.createEncounterWithCharting(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Submit claim' })
  @Permissions('healthcare.update')
  @Patch('encounters/:id/submit-claim')
  async submitClaim(@Req() req: AuthReq, @Param('id') id: string) {
    return this.clinicalService.submitClaim(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create prescription' })
  @Permissions('healthcare.create')
  @Post('prescriptions')
  async createPrescription(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.clinicalService.createPrescription(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Export fhir' })
  @Permissions('healthcare.read')
  @Get('patients/:patientId/fhir')
  async exportFhir(@Req() req: AuthReq, @Param('patientId') patientId: string) {
    await this.clinicalService.logPhiAccess(req.user.tenantId, req.user.userId, patientId, 'FHIR_EXPORT');
    return this.clinicalService.exportPatientFhirBundle(req.user.tenantId, patientId);
  }
}
