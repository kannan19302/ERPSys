import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { AppInstalledGuard } from '../../common/guards/app-installed.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HealthcareService } from './healthcare.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('healthcare')
@ApiBearerAuth()
@Controller('healthcare')
@UseGuards(JwtAuthGuard, RbacGuard, AppInstalledGuard)
export class HealthcareController {
  constructor(private readonly service: HealthcareService) {}

  @ApiOperation({ summary: 'Get patients' })
  @Permissions('healthcare.read')
  @Get('patients')
  @Permissions('hr.employee.read')
  async getPatients(@Req() req: AuthenticatedRequest) {
    return this.service.getPatients(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create patient' })
  @Permissions('healthcare.create')
  @Post('patients')
  @Permissions('hr.employee.read')
  async createPatient(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { firstName: string; lastName: string; dateOfBirth: string; gender: string; email?: string; phone?: string; medicalHistory?: string; vitalsHistory?: string; allergies?: string }
  ) {
    return this.service.createPatient(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get practitioners' })
  @Permissions('healthcare.read')
  @Get('practitioners')
  @Permissions('hr.employee.read')
  async getPractitioners(@Req() req: AuthenticatedRequest) {
    return this.service.getPractitioners(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create practitioner' })
  @Permissions('healthcare.create')
  @Post('practitioners')
  @Permissions('hr.employee.read')
  async createPractitioner(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { employeeId: string; specialty: string; licenseNumber: string }
  ) {
    return this.service.createPractitioner(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get appointments' })
  @Permissions('healthcare.read')
  @Get('appointments')
  @Permissions('hr.employee.read')
  async getAppointments(@Req() req: AuthenticatedRequest) {
    return this.service.getAppointments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create appointment' })
  @Permissions('healthcare.create')
  @Post('appointments')
  @Permissions('hr.employee.read')
  async createAppointment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { patientId: string; practitionerId: string; startTime: string; endTime: string; notes?: string }
  ) {
    return this.service.createAppointment(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get prescriptions' })
  @Permissions('healthcare.read')
  @Get('prescriptions')
  @Permissions('hr.employee.read')
  async getPrescriptions(@Req() req: AuthenticatedRequest) {
    return this.service.getPrescriptions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create prescription' })
  @Permissions('healthcare.create')
  @Post('prescriptions')
  @Permissions('hr.employee.read')
  async createPrescription(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { patientId: string; practitionerId: string; details: string }
  ) {
    return this.service.createPrescription(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get drug register' })
  @Permissions('healthcare.read')
  @Get('drugs')
  @Permissions('hr.employee.read')
  async getDrugRegister(@Req() req: AuthenticatedRequest) {
    return this.service.getDrugRegister(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Log drug register' })
  @Permissions('healthcare.create')
  @Post('drugs')
  @Permissions('hr.employee.read')
  async logDrugRegister(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; batchNumber: string; expiryDate: string; isControlled?: boolean; quantity: number }
  ) {
    return this.service.logDrugRegister(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get medical encounters' })
  @Permissions('healthcare.read')
  @Get('encounters')
  @Permissions('hr.employee.read')
  async getMedicalEncounters(@Req() req: AuthenticatedRequest) {
    return this.service.getMedicalEncounters(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create medical encounter' })
  @Permissions('healthcare.create')
  @Post('encounters')
  @Permissions('hr.employee.read')
  async createMedicalEncounter(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { patientId: string; practitionerId: string; diagnosis: string; treatmentCode: string; billingAmount: number }
  ) {
    return this.service.createMedicalEncounter(req.user.tenantId, dto);
  }
}
