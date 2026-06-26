import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ClinicalService } from './clinical.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('healthcare/clinical')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @Get('patients/:patientId/summary')
  async getPatientSummary(@Req() req: AuthReq, @Param('patientId') patientId: string) {
    await this.clinicalService.logPhiAccess(req.user.tenantId, req.user.userId, patientId, 'VIEW_SUMMARY');
    return this.clinicalService.getPatientSummary(req.user.tenantId, patientId);
  }

  @Post('encounters')
  async createEncounter(@Req() req: AuthReq, @Body() body: any) {
    return this.clinicalService.createEncounterWithCharting(req.user.tenantId, body);
  }

  @Patch('encounters/:id/submit-claim')
  async submitClaim(@Req() req: AuthReq, @Param('id') id: string) {
    return this.clinicalService.submitClaim(req.user.tenantId, id);
  }

  @Post('prescriptions')
  async createPrescription(@Req() req: AuthReq, @Body() body: any) {
    return this.clinicalService.createPrescription(req.user.tenantId, body);
  }

  @Get('patients/:patientId/fhir')
  async exportFhir(@Req() req: AuthReq, @Param('patientId') patientId: string) {
    await this.clinicalService.logPhiAccess(req.user.tenantId, req.user.userId, patientId, 'FHIR_EXPORT');
    return this.clinicalService.exportPatientFhirBundle(req.user.tenantId, patientId);
  }
}
