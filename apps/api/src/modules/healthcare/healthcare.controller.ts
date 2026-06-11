import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { AppInstalledGuard } from '../../common/guards/app-installed.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HealthcareService } from './healthcare.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('healthcare')
@UseGuards(JwtAuthGuard, RbacGuard, AppInstalledGuard)
export class HealthcareController {
  constructor(private readonly service: HealthcareService) {}

  @Get('patients')
  @Permissions('hr.employee.read')
  async getPatients(@Req() req: AuthenticatedRequest) {
    return this.service.getPatients(req.user.tenantId);
  }

  @Post('patients')
  @Permissions('hr.employee.read')
  async createPatient(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { firstName: string; lastName: string; dateOfBirth: string; gender: string; email?: string; phone?: string; medicalHistory?: string; vitalsHistory?: string; allergies?: string }
  ) {
    return this.service.createPatient(req.user.tenantId, dto);
  }

  @Get('practitioners')
  @Permissions('hr.employee.read')
  async getPractitioners(@Req() req: AuthenticatedRequest) {
    return this.service.getPractitioners(req.user.tenantId);
  }

  @Post('practitioners')
  @Permissions('hr.employee.read')
  async createPractitioner(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { employeeId: string; specialty: string; licenseNumber: string }
  ) {
    return this.service.createPractitioner(req.user.tenantId, dto);
  }

  @Get('appointments')
  @Permissions('hr.employee.read')
  async getAppointments(@Req() req: AuthenticatedRequest) {
    return this.service.getAppointments(req.user.tenantId);
  }

  @Post('appointments')
  @Permissions('hr.employee.read')
  async createAppointment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { patientId: string; practitionerId: string; startTime: string; endTime: string; notes?: string }
  ) {
    return this.service.createAppointment(req.user.tenantId, dto);
  }

  @Get('prescriptions')
  @Permissions('hr.employee.read')
  async getPrescriptions(@Req() req: AuthenticatedRequest) {
    return this.service.getPrescriptions(req.user.tenantId);
  }

  @Post('prescriptions')
  @Permissions('hr.employee.read')
  async createPrescription(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { patientId: string; practitionerId: string; details: string }
  ) {
    return this.service.createPrescription(req.user.tenantId, dto);
  }

  @Get('drugs')
  @Permissions('hr.employee.read')
  async getDrugRegister(@Req() req: AuthenticatedRequest) {
    return this.service.getDrugRegister(req.user.tenantId);
  }

  @Post('drugs')
  @Permissions('hr.employee.read')
  async logDrugRegister(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; batchNumber: string; expiryDate: string; isControlled?: boolean; quantity: number }
  ) {
    return this.service.logDrugRegister(req.user.tenantId, dto);
  }

  @Get('encounters')
  @Permissions('hr.employee.read')
  async getMedicalEncounters(@Req() req: AuthenticatedRequest) {
    return this.service.getMedicalEncounters(req.user.tenantId);
  }

  @Post('encounters')
  @Permissions('hr.employee.read')
  async createMedicalEncounter(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { patientId: string; practitionerId: string; diagnosis: string; treatmentCode: string; billingAmount: number }
  ) {
    return this.service.createMedicalEncounter(req.user.tenantId, dto);
  }
}
