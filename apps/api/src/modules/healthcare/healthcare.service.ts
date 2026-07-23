import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HealthcareService {
  // ── Patients ──
  async getPatients(tenantId: string) {
    return prisma.healthcarePatient.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async getPatientById(tenantId: string, id: string) {
    return prisma.healthcarePatient.findFirst({ where: { tenantId, id } });
  }
  async createPatient(tenantId: string, data: any) {
    return prisma.healthcarePatient.create({ data: { ...data, tenantId } });
  }

  // ── Practitioners ──
  async getPractitioners(tenantId: string) {
    return prisma.healthcarePractitioner.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async createPractitioner(tenantId: string, data: any) {
    return prisma.healthcarePractitioner.create({ data: { ...data, tenantId } });
  }

  // ── Appointments ──
  async getAppointments(tenantId: string) {
    return prisma.healthcareAppointment.findMany({
      where: { tenantId },
      include: { patient: true, practitioner: true },
      orderBy: { startTime: "desc" },
    });
  }
  async createAppointment(tenantId: string, data: any) {
    return prisma.healthcareAppointment.create({
      data: { ...data, tenantId },
      include: { patient: true, practitioner: true },
    });
  }

  // ── Prescriptions ──
  async getPrescriptions(tenantId: string) {
    return prisma.healthcarePrescription.findMany({
      where: { tenantId },
      include: { patient: true, practitioner: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createPrescription(tenantId: string, data: any) {
    return prisma.healthcarePrescription.create({ data: { ...data, tenantId } });
  }

  // ── Encounters ──
  async getEncounters(tenantId: string) {
    return prisma.healthcareEncounter.findMany({
      where: { tenantId },
      include: { patient: true, practitioner: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createEncounter(tenantId: string, data: any) {
    return prisma.healthcareEncounter.create({ data: { ...data, tenantId } });
  }

  // ── Drugs ──
  async getDrugs(tenantId: string) {
    return prisma.healthcareDrug.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }

  // ── Vitals ──
  async getVitals(tenantId: string, patientId?: string) {
    return prisma.healthcareVital.findMany({
      where: { tenantId, ...(patientId ? { patientId } : {}) },
      include: { patient: true },
      orderBy: { recordedAt: "desc" },
      take: 100,
    });
  }
}
