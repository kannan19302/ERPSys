import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HealthcareSmartService } from './healthcare-smart.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Smart Healthcare services (eligibility, claim scrubbing, drug interactions, CDS,
 * quality measures, FHIR read API) mounted under /api/v1/healthcare/*. Operates on the
 * Healthcare marketplace app's custom records.
 */
@Controller('healthcare')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthcareSmartController {
  constructor(private readonly smart: HealthcareSmartService) {}

  @Post('eligibility/check')
  @Permissions('hr.employee.read')
  eligibility(@Req() req: AuthenticatedRequest, @Body() body: { patient_mrn: string }) {
    return this.smart.eligibilityCheck(req.user.tenantId, body);
  }

  @Post('claims/scrub')
  @Permissions('hr.employee.read')
  scrub(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.smart.claimsScrub(req.user.tenantId, body);
  }

  @Post('rx/interactions')
  @Permissions('hr.employee.read')
  interactions(@Req() req: AuthenticatedRequest, @Body() body: { patient_mrn?: string; meds?: string[] }) {
    return this.smart.rxInteractions(req.user.tenantId, body);
  }

  @Post('cds/evaluate')
  @Permissions('hr.employee.read')
  cds(@Req() req: AuthenticatedRequest, @Body() body: { patient_mrn: string; order_drug?: string }) {
    return this.smart.cdsEvaluate(req.user.tenantId, body);
  }

  @Get('quality/measures')
  @Permissions('hr.employee.read')
  quality(@Req() req: AuthenticatedRequest) {
    return this.smart.qualityMeasures(req.user.tenantId);
  }

  @Get('fhir/Patient')
  @Permissions('hr.employee.read')
  fhirPatient(@Req() req: AuthenticatedRequest, @Query('mrn') mrn?: string) {
    return this.smart.fhirPatient(req.user.tenantId, mrn);
  }

  @Get('fhir/Observation')
  @Permissions('hr.employee.read')
  fhirObservation(@Req() req: AuthenticatedRequest, @Query('mrn') mrn?: string) {
    return this.smart.fhirObservation(req.user.tenantId, mrn);
  }
}
