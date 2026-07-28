import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HealthcareClinicalService {
  private readonly prisma = prisma;

  // ── CLINICAL NOTES ──
  async getClinicalNotes(tenantId: string, query: { patientId?: string; doctorId?: string }) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.doctorId) where.doctorId = query.doctorId;

    return this.prisma.healthcareClinicalNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createClinicalNote(tenantId: string, data: any) {
    return this.prisma.healthcareClinicalNote.create({
      data: {
        tenantId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        icd10Codes: data.icd10Codes || [],
        cptCodes: data.cptCodes || [],
        status: data.status || "DRAFT",
      },
    });
  }

  // ── TELEMEDICINE SESSIONS ──
  async getTelehealthSessions(tenantId: string, query: { patientId?: string; status?: string }) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.status) where.status = query.status;

    return this.prisma.healthcareTelemedicineSession.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
    });
  }

  async createTelehealthSession(tenantId: string, data: any) {
    return this.prisma.healthcareTelemedicineSession.create({
      data: {
        tenantId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        meetingId: data.meetingId || `MEET-${Date.now()}`,
        joinUrl: data.joinUrl || `https://telehealth.unerp.io/room/${Date.now()}`,
        scheduledAt: new Date(data.scheduledAt),
        durationMins: data.durationMins || 30,
        status: "SCHEDULED",
        notes: data.notes,
      },
    });
  }

  // ── MEDICAL BILLS ──
  async getMedicalBills(tenantId: string, query: { patientId?: string; status?: string }) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.status) where.status = query.status;

    return this.prisma.healthcareMedicalBill.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createMedicalBill(tenantId: string, data: any) {
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`;
    return this.prisma.healthcareMedicalBill.create({
      data: {
        tenantId,
        patientId: data.patientId,
        billNumber,
        totalAmount: data.totalAmount,
        insurancePay: data.insurancePay || 0,
        patientPay: data.patientPay || data.totalAmount,
        dueDate: new Date(data.dueDate),
        status: "UNPAID",
        lineItems: data.lineItems || [],
      },
    });
  }
}
