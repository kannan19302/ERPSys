import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HealthcarePatientsService } from "./services/patients.service";
import { HealthcareAppointmentsService } from "./services/appointments.service";
import { HealthcarePrescriptionsService } from "./services/prescriptions.service";
import { HealthcareLabService } from "./services/lab.service";
import { HealthcareInsuranceService } from "./services/insurance.service";
import { HealthcarePharmacyService } from "./services/pharmacy.service";
import { HealthcareSchedulesService } from "./services/schedules.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string };
}

@Controller("ext/healthcare/deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthcareDeepController {
  constructor(
    private readonly patientsSvc: HealthcarePatientsService,
    private readonly appointmentsSvc: HealthcareAppointmentsService,
    private readonly prescriptionsSvc: HealthcarePrescriptionsService,
    private readonly labSvc: HealthcareLabService,
    private readonly insuranceSvc: HealthcareInsuranceService,
    private readonly pharmacySvc: HealthcarePharmacyService,
    private readonly schedulesSvc: HealthcareSchedulesService,
  ) {}

  // ── Patients ──
  @Get("patients")
  @Permissions("healthcare.patients.read")
  async getPatients(@Req() req: AuthRequest) {
    return this.patientsSvc.findAll(req.user.tenantId);
  }

  @Get("patients/search")
  @Permissions("healthcare.patients.read")
  async searchPatients(@Req() req: AuthRequest, @Query("q") q: string) {
    return this.patientsSvc.search(req.user.tenantId, q);
  }

  @Get("patients/:id")
  @Permissions("healthcare.patients.read")
  async getPatient(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.patientsSvc.findById(req.user.tenantId, id);
  }

  @Post("patients")
  @Permissions("healthcare.patients.create")
  async createPatient(@Req() req: AuthRequest, @Body() body: any) {
    return this.patientsSvc.create(req.user.tenantId, body);
  }

  @Put("patients/:id")
  @Permissions("healthcare.patients.update")
  async updatePatient(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.patientsSvc.update(req.user.tenantId, id, body);
  }

  @Delete("patients/:id")
  @Permissions("healthcare.patients.delete")
  async deletePatient(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.patientsSvc.delete(req.user.tenantId, id);
  }

  // ── Patient Allergies ──
  @Get("patients/:patientId/allergies")
  @Permissions("healthcare.patients.read")
  async getAllergies(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.patientsSvc.getAllergies(req.user.tenantId, patientId);
  }

  @Post("patients/:patientId/allergies")
  @Permissions("healthcare.patients.update")
  async addAllergy(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
    @Body() body: any,
  ) {
    return this.patientsSvc.addAllergy(req.user.tenantId, patientId, body);
  }

  @Delete("allergies/:id")
  @Permissions("healthcare.patients.update")
  async removeAllergy(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.patientsSvc.removeAllergy(req.user.tenantId, id);
  }

  // ── Patient Vitals ──
  @Get("patients/:patientId/vitals")
  @Permissions("healthcare.patients.read")
  async getVitals(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.patientsSvc.getVitals(req.user.tenantId, patientId);
  }

  @Post("patients/:patientId/vitals")
  @Permissions("healthcare.patients.update")
  async recordVital(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
    @Body() body: any,
  ) {
    return this.patientsSvc.recordVital(req.user.tenantId, patientId, body);
  }

  // ── Medical Records (EHR) ──
  @Get("patients/:patientId/medical-records")
  @Permissions("healthcare.patients.read")
  async getMedicalRecords(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.patientsSvc.getMedicalRecords(req.user.tenantId, patientId);
  }

  @Post("patients/:patientId/medical-records")
  @Permissions("healthcare.patients.update")
  async createMedicalRecord(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
    @Body() body: any,
  ) {
    return this.patientsSvc.createMedicalRecord(
      req.user.tenantId,
      patientId,
      body,
    );
  }

  // ── Patient Encounters ──
  @Get("patients/:patientId/encounters")
  @Permissions("healthcare.patients.read")
  async getEncounters(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.patientsSvc.getEncounters(req.user.tenantId, patientId);
  }

  @Post("patients/:patientId/encounters")
  @Permissions("healthcare.patients.create")
  async createEncounter(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
    @Body() body: any,
  ) {
    return this.patientsSvc.createEncounter(req.user.tenantId, patientId, body);
  }

  // ── Practitioners ──
  @Get("practitioners")
  @Permissions("healthcare.patients.read")
  async getPractitioners(@Req() req: AuthRequest) {
    return this.patientsSvc.getPractitioners(req.user.tenantId);
  }

  @Post("practitioners")
  @Permissions("healthcare.patients.create")
  async createPractitioner(@Req() req: AuthRequest, @Body() body: any) {
    return this.patientsSvc.createPractitioner(req.user.tenantId, body);
  }

  @Put("practitioners/:id")
  @Permissions("healthcare.patients.update")
  async updatePractitioner(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.patientsSvc.updatePractitioner(req.user.tenantId, id, body);
  }

  // ── Appointments ──
  @Get("appointments")
  @Permissions("healthcare.appointments.read")
  async getAppointments(
    @Req() req: AuthRequest,
    @Query("patientId") patientId?: string,
    @Query("practitionerId") practitionerId?: string,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.appointmentsSvc.findAll(req.user.tenantId, {
      patientId,
      practitionerId,
      status,
      from,
      to,
    });
  }

  @Get("appointments/upcoming")
  @Permissions("healthcare.appointments.read")
  async getUpcomingAppointments(
    @Req() req: AuthRequest,
    @Query("days") days?: string,
  ) {
    return this.appointmentsSvc.getUpcoming(
      req.user.tenantId,
      days ? parseInt(days) : 7,
    );
  }

  @Get("appointments/:id")
  @Permissions("healthcare.appointments.read")
  async getAppointment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.appointmentsSvc.findById(req.user.tenantId, id);
  }

  @Post("appointments")
  @Permissions("healthcare.appointments.create")
  async createAppointment(@Req() req: AuthRequest, @Body() body: any) {
    return this.appointmentsSvc.create(req.user.tenantId, body);
  }

  @Put("appointments/:id")
  @Permissions("healthcare.appointments.update")
  async updateAppointment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.appointmentsSvc.update(req.user.tenantId, id, body);
  }

  @Patch("appointments/:id/cancel")
  @Permissions("healthcare.appointments.update")
  async cancelAppointment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("reason") reason?: string,
  ) {
    return this.appointmentsSvc.cancel(req.user.tenantId, id, reason);
  }

  @Patch("appointments/:id/complete")
  @Permissions("healthcare.appointments.update")
  async completeAppointment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.appointmentsSvc.complete(req.user.tenantId, id);
  }

  @Get("schedule/:practitionerId/:date")
  @Permissions("healthcare.appointments.read")
  async getSchedule(
    @Req() req: AuthRequest,
    @Param("practitionerId") practitionerId: string,
    @Param("date") date: string,
  ) {
    return this.appointmentsSvc.getSchedule(
      req.user.tenantId,
      practitionerId,
      date,
    );
  }

  @Get("schedule-templates")
  @Permissions("healthcare.appointments.read")
  async getScheduleTemplates(@Req() req: AuthRequest) {
    return this.appointmentsSvc.getScheduleTemplates(req.user.tenantId);
  }

  @Post("schedule-templates")
  @Permissions("healthcare.appointments.create")
  async createScheduleTemplate(@Req() req: AuthRequest, @Body() body: any) {
    return this.appointmentsSvc.createScheduleTemplate(req.user.tenantId, body);
  }

  // ── Doctor Schedules ──
  @Get("doctor-schedules")
  @Permissions("healthcare.appointments.read")
  async getDoctorSchedules(
    @Req() req: AuthRequest,
    @Query("practitionerId") practitionerId?: string,
  ) {
    return this.schedulesSvc.getDoctorSchedules(
      req.user.tenantId,
      practitionerId,
    );
  }

  @Post("doctor-schedules")
  @Permissions("healthcare.appointments.create")
  async createDoctorSchedule(@Req() req: AuthRequest, @Body() body: any) {
    return this.schedulesSvc.createDoctorSchedule(req.user.tenantId, body);
  }

  @Put("doctor-schedules/:id")
  @Permissions("healthcare.appointments.update")
  async updateDoctorSchedule(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.schedulesSvc.updateDoctorSchedule(req.user.tenantId, id, body);
  }

  @Get("doctor-schedules/available/:practitionerId/:date")
  @Permissions("healthcare.appointments.read")
  async getAvailableSlots(
    @Req() req: AuthRequest,
    @Param("practitionerId") practitionerId: string,
    @Param("date") date: string,
  ) {
    return this.schedulesSvc.getAvailableSlots(
      req.user.tenantId,
      practitionerId,
      date,
    );
  }

  // ── Prescriptions ──
  @Get("prescriptions")
  @Permissions("healthcare.prescriptions.read")
  async getPrescriptions(
    @Req() req: AuthRequest,
    @Query("patientId") patientId?: string,
    @Query("practitionerId") practitionerId?: string,
    @Query("status") status?: string,
  ) {
    return this.prescriptionsSvc.findAll(req.user.tenantId, {
      patientId,
      practitionerId,
      status,
    });
  }

  @Get("prescriptions/:id")
  @Permissions("healthcare.prescriptions.read")
  async getPrescription(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.prescriptionsSvc.findById(req.user.tenantId, id);
  }

  @Post("prescriptions")
  @Permissions("healthcare.prescriptions.create")
  async createPrescription(@Req() req: AuthRequest, @Body() body: any) {
    return this.prescriptionsSvc.create(req.user.tenantId, body);
  }

  @Put("prescriptions/:id")
  @Permissions("healthcare.prescriptions.update")
  async updatePrescription(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.prescriptionsSvc.update(req.user.tenantId, id, body);
  }

  @Patch("prescriptions/:id/void")
  @Permissions("healthcare.prescriptions.update")
  async voidPrescription(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.prescriptionsSvc.voidPrescription(req.user.tenantId, id);
  }

  @Patch("prescriptions/:id/fill")
  @Permissions("healthcare.prescriptions.update")
  async fillPrescription(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.prescriptionsSvc.fillPrescription(req.user.tenantId, id);
  }

  @Get("patients/:patientId/prescriptions/active")
  @Permissions("healthcare.prescriptions.read")
  async getActivePrescriptions(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.prescriptionsSvc.getActiveByPatient(
      req.user.tenantId,
      patientId,
    );
  }

  // ── Drugs / Pharmacy Inventory ──
  @Get("drugs")
  @Permissions("healthcare.pharmacy.read")
  async getDrugs(@Req() req: AuthRequest) {
    return this.prescriptionsSvc.getDrugs(req.user.tenantId);
  }

  @Post("drugs")
  @Permissions("healthcare.pharmacy.create")
  async createDrug(@Req() req: AuthRequest, @Body() body: any) {
    return this.prescriptionsSvc.createDrug(req.user.tenantId, body);
  }

  @Put("drugs/:id")
  @Permissions("healthcare.pharmacy.update")
  async updateDrug(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.prescriptionsSvc.updateDrug(req.user.tenantId, id, body);
  }

  // ── Lab Orders ──
  @Get("lab-orders")
  @Permissions("healthcare.labs.read")
  async getLabOrders(
    @Req() req: AuthRequest,
    @Query("patientId") patientId?: string,
    @Query("status") status?: string,
  ) {
    return this.labSvc.findAll(req.user.tenantId, { patientId, status });
  }

  @Get("lab-orders/pending")
  @Permissions("healthcare.labs.read")
  async getPendingLabs(@Req() req: AuthRequest) {
    return this.labSvc.getPending(req.user.tenantId);
  }

  @Get("lab-orders/:id")
  @Permissions("healthcare.labs.read")
  async getLabOrder(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.labSvc.findById(req.user.tenantId, id);
  }

  @Post("lab-orders")
  @Permissions("healthcare.labs.create")
  async createLabOrder(@Req() req: AuthRequest, @Body() body: any) {
    return this.labSvc.create(req.user.tenantId, body);
  }

  @Patch("lab-orders/:id/status")
  @Permissions("healthcare.labs.update")
  async updateLabStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.labSvc.updateStatus(req.user.tenantId, id, status);
  }

  @Post("lab-orders/:id/results")
  @Permissions("healthcare.labs.create")
  async addLabResult(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.labSvc.addResult(req.user.tenantId, id, body);
  }

  @Get("lab-orders/:id/results")
  @Permissions("healthcare.labs.read")
  async getLabResults(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.labSvc.getResults(req.user.tenantId, id);
  }

  @Get("patients/:patientId/labs")
  @Permissions("healthcare.labs.read")
  async getPatientLabs(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.labSvc.getPatientLabs(req.user.tenantId, patientId);
  }

  // ── Insurance Policies ──
  @Get("insurance/policies")
  @Permissions("healthcare.insurance.read")
  async getPolicies(
    @Req() req: AuthRequest,
    @Query("patientId") patientId?: string,
    @Query("status") status?: string,
  ) {
    return this.insuranceSvc.findAllPolicies(req.user.tenantId, {
      patientId,
      status,
    });
  }

  @Get("insurance/policies/:id")
  @Permissions("healthcare.insurance.read")
  async getPolicy(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.insuranceSvc.findPolicyById(req.user.tenantId, id);
  }

  @Post("insurance/policies")
  @Permissions("healthcare.insurance.create")
  async createPolicy(@Req() req: AuthRequest, @Body() body: any) {
    return this.insuranceSvc.createPolicy(req.user.tenantId, body);
  }

  @Put("insurance/policies/:id")
  @Permissions("healthcare.insurance.update")
  async updatePolicy(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.insuranceSvc.updatePolicy(req.user.tenantId, id, body);
  }

  @Get("patients/:patientId/insurance")
  @Permissions("healthcare.insurance.read")
  async getPatientPolicies(
    @Req() req: AuthRequest,
    @Param("patientId") patientId: string,
  ) {
    return this.insuranceSvc.getPatientPolicies(req.user.tenantId, patientId);
  }

  // ── Insurance Claims ──
  @Get("insurance/claims")
  @Permissions("healthcare.insurance.read")
  async getClaims(
    @Req() req: AuthRequest,
    @Query("policyId") policyId?: string,
    @Query("status") status?: string,
  ) {
    return this.insuranceSvc.findAllClaims(req.user.tenantId, {
      policyId,
      status,
    });
  }

  @Get("insurance/claims/:id")
  @Permissions("healthcare.insurance.read")
  async getClaim(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.insuranceSvc.findClaimById(req.user.tenantId, id);
  }

  @Post("insurance/claims")
  @Permissions("healthcare.insurance.create")
  async createClaim(@Req() req: AuthRequest, @Body() body: any) {
    return this.insuranceSvc.createClaim(req.user.tenantId, body);
  }

  @Patch("insurance/claims/:id/status")
  @Permissions("healthcare.insurance.update")
  async updateClaimStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.insuranceSvc.updateClaimStatus(req.user.tenantId, id, status);
  }

  @Post("insurance/claims/:id/validate")
  @Permissions("healthcare.insurance.read")
  async validateClaim(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.insuranceSvc.validateClaim(req.user.tenantId, id);
  }

  // ── Pharmacy Inventory ──
  @Get("pharmacy/inventory")
  @Permissions("healthcare.pharmacy.read")
  async getPharmacyInventory(@Req() req: AuthRequest) {
    return this.pharmacySvc.getInventory(req.user.tenantId);
  }

  @Post("pharmacy/batches")
  @Permissions("healthcare.pharmacy.create")
  async createBatch(@Req() req: AuthRequest, @Body() body: any) {
    return this.pharmacySvc.createBatch(req.user.tenantId, body);
  }

  @Get("pharmacy/batches/:id")
  @Permissions("healthcare.pharmacy.read")
  async getBatch(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.pharmacySvc.getBatch(req.user.tenantId, id);
  }

  @Put("pharmacy/batches/:id")
  @Permissions("healthcare.pharmacy.update")
  async updateBatch(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.pharmacySvc.updateBatch(req.user.tenantId, id, body);
  }

  @Patch("pharmacy/batches/:id/expire")
  @Permissions("healthcare.pharmacy.update")
  async markExpired(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.pharmacySvc.markExpired(req.user.tenantId, id);
  }

  @Get("pharmacy/near-expiry")
  @Permissions("healthcare.pharmacy.read")
  async getNearExpiry(@Req() req: AuthRequest, @Query("days") days?: string) {
    return this.pharmacySvc.getNearExpiry(
      req.user.tenantId,
      days ? parseInt(days) : 90,
    );
  }

  @Get("pharmacy/expired")
  @Permissions("healthcare.pharmacy.read")
  async getExpired(@Req() req: AuthRequest) {
    return this.pharmacySvc.getExpired(req.user.tenantId);
  }

  @Post("pharmacy/dispense")
  @Permissions("healthcare.pharmacy.create")
  async dispenseDrug(@Req() req: AuthRequest, @Body() body: any) {
    return this.pharmacySvc.dispenseDrug(
      req.user.tenantId,
      body.drugId,
      body.quantity,
      body.patientId,
      body.administeredBy,
    );
  }

  // ── Controlled Substances ──
  @Get("pharmacy/controlled-logs")
  @Permissions("healthcare.pharmacy.read")
  async getControlledLogs(
    @Req() req: AuthRequest,
    @Query("drugId") drugId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.pharmacySvc.getControlledLogs(req.user.tenantId, {
      drugId,
      from,
      to,
    });
  }

  @Post("pharmacy/controlled-logs")
  @Permissions("healthcare.pharmacy.create")
  async logControlledSubstance(@Req() req: AuthRequest, @Body() body: any) {
    return this.pharmacySvc.logControlledSubstance(req.user.tenantId, body);
  }

  @Post("pharmacy/adjust-stock")
  @Permissions("healthcare.pharmacy.update")
  async adjustStock(@Req() req: AuthRequest, @Body() body: any) {
    return this.pharmacySvc.adjustStock(
      req.user.tenantId,
      body.drugId,
      body.quantity,
    );
  }
}
