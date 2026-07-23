import { Controller, Get, Post, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HealthcareService } from "./healthcare.service";
import { Request } from "express";

interface AuthRequest extends Request { user: { tenantId: string; userId: string }; }

@Controller("ext/healthcare")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthcareController {
  constructor(private readonly svc: HealthcareService) {}

  // ── Patients ──
  @Get("patients")
  @Permissions("healthcare.patient.read")
  async getPatients(@Req() req: AuthRequest) { return this.svc.getPatients(req.user.tenantId); }

  @Get("patients/:id")
  @Permissions("healthcare.patient.read")
  async getPatient(@Req() req: AuthRequest, @Param("id") id: string) { return this.svc.getPatientById(req.user.tenantId, id); }

  @Post("patients")
  @Permissions("healthcare.patient.create")
  async createPatient(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createPatient(req.user.tenantId, body); }

  // ── Practitioners ──
  @Get("practitioners")
  @Permissions("healthcare.practitioner.read")
  async getPractitioners(@Req() req: AuthRequest) { return this.svc.getPractitioners(req.user.tenantId); }

  @Post("practitioners")
  @Permissions("healthcare.practitioner.create")
  async createPractitioner(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createPractitioner(req.user.tenantId, body); }

  // ── Appointments ──
  @Get("appointments")
  @Permissions("healthcare.appointments.read")
  async getAppointments(@Req() req: AuthRequest) { return this.svc.getAppointments(req.user.tenantId); }

  @Post("appointments")
  @Permissions("healthcare.appointments.create")
  async createAppointment(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createAppointment(req.user.tenantId, body); }

  // ── Prescriptions ──
  @Get("prescriptions")
  @Permissions("healthcare.prescription.read")
  async getPrescriptions(@Req() req: AuthRequest) { return this.svc.getPrescriptions(req.user.tenantId); }

  @Post("prescriptions")
  @Permissions("healthcare.prescription.create")
  async createPrescription(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createPrescription(req.user.tenantId, body); }

  // ── Encounters ──
  @Get("encounters")
  @Permissions("healthcare.encounter.read")
  async getEncounters(@Req() req: AuthRequest) { return this.svc.getEncounters(req.user.tenantId); }

  @Post("encounters")
  @Permissions("healthcare.encounter.create")
  async createEncounter(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createEncounter(req.user.tenantId, body); }

  // ── Drugs (Pharmacy) ──
  @Get("drugs")
  @Permissions("healthcare.pharmacy.read")
  async getDrugs(@Req() req: AuthRequest) { return this.svc.getDrugs(req.user.tenantId); }

  // ── Vitals ──
  @Get("vitals")
  @Permissions("healthcare.patient.read")
  async getVitals(@Req() req: AuthRequest, @Query("patientId") patientId?: string) {
    return this.svc.getVitals(req.user.tenantId, patientId);
  }
}
