import { Controller, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HealthcareSmartService } from './healthcare-smart.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Smart Healthcare services (eligibility, claim scrubbing, drug interactions, CDS,
 * quality measures, FHIR read API) mounted under /api/v1/healthcare/*. Operates on the
 * Healthcare marketplace app's custom records.
 */
@ApiTags('healthcare')
@ApiBearerAuth()
@Controller('healthcare')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthcareSmartController {
  constructor(private readonly smart: HealthcareSmartService) {}

  @ApiOperation({ summary: 'Handle request' })
  @Post('eligibility/check')
  @Permissions('hr.employee.read')
  eligibility(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { patient_mrn: string }) {
    return this.smart.eligibilityCheck(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Handle request' })
  @Post('claims/scrub')
  @Permissions('hr.employee.read')
  scrub(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: any) {
    return this.smart.claimsScrub(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Handle request' })
  @Post('rx/interactions')
  @Permissions('hr.employee.read')
  interactions(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { patient_mrn?: string; meds?: string[] }) {
    return this.smart.rxInteractions(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Handle request' })
  @Post('cds/evaluate')
  @Permissions('hr.employee.read')
  cds(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { patient_mrn: string; order_drug?: string }) {
    return this.smart.cdsEvaluate(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Handle request' })
  @Get('quality/measures')
  @Permissions('hr.employee.read')
  quality(@Req() req: AuthenticatedRequest) {
    return this.smart.qualityMeasures(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Handle request' })
  @Get('fhir/Patient')
  @Permissions('hr.employee.read')
  fhirPatient(@Req() req: AuthenticatedRequest, @Query('mrn') mrn?: string) {
    return this.smart.fhirPatient(req.user.tenantId, mrn);
  }

  @ApiOperation({ summary: 'Handle request' })
  @Get('fhir/Observation')
  @Permissions('hr.employee.read')
  fhirObservation(@Req() req: AuthenticatedRequest, @Query('mrn') mrn?: string) {
    return this.smart.fhirObservation(req.user.tenantId, mrn);
  }
}
