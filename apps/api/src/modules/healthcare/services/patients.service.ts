import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HealthcarePatientsService {
  async findAll(tenantId: string) {
    return prisma.healthcarePatient.findMany({
      where: { tenantId },
      include: {
        allergies: true,
        vitals: { take: 5, orderBy: { recordedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.healthcarePatient.findFirst({
      where: { tenantId, id },
      include: {
        allergies: true,
        appointments: {
          include: { practitioner: true },
          orderBy: { startTime: "desc" },
          take: 10,
        },
        prescriptions: { include: { items: true }, take: 10 },
        vitals: { orderBy: { recordedAt: "desc" }, take: 20 },
        medicalRecords: { orderBy: { createdAt: "desc" }, take: 20 },
        insurancePolicies: true,
        labOrders: {
          include: { results: true },
          orderBy: { orderedAt: "desc" },
          take: 10,
        },
      },
    });
  }
  async create(tenantId: string, data: any) {
    return prisma.healthcarePatient.create({
      data: { ...data, tenantId },
      include: { allergies: true },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    await prisma.healthcarePatient.updateMany({
      where: { tenantId, id },
      data,
    });
    return this.findById(tenantId, id);
  }
  async delete(tenantId: string, id: string) {
    return prisma.healthcarePatient.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async search(tenantId: string, q: string) {
    return prisma.healthcarePatient.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
    });
  }
  async getAllergies(tenantId: string, patientId: string) {
    return prisma.healthcarePatientAllergy.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: "desc" },
    });
  }
  async addAllergy(tenantId: string, patientId: string, data: any) {
    return prisma.healthcarePatientAllergy.create({
      data: { ...data, tenantId, patientId },
    });
  }
  async removeAllergy(tenantId: string, id: string) {
    return prisma.healthcarePatientAllergy.updateMany({
      where: { tenantId, id },
      data: { isActive: false },
    });
  }
  async getVitals(tenantId: string, patientId: string) {
    return prisma.healthcareVital.findMany({
      where: { tenantId, patientId },
      orderBy: { recordedAt: "desc" },
      take: 50,
    });
  }
  async recordVital(tenantId: string, patientId: string, data: any) {
    return prisma.healthcareVital.create({
      data: { ...data, tenantId, patientId },
    });
  }
  async getMedicalRecords(tenantId: string, patientId: string) {
    return prisma.healthcareMedicalRecord.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createMedicalRecord(tenantId: string, patientId: string, data: any) {
    return prisma.healthcareMedicalRecord.create({
      data: { ...data, tenantId, patientId },
      include: { patient: true },
    });
  }
  async getEncounters(tenantId: string, patientId: string) {
    return prisma.healthcareEncounter.findMany({
      where: { tenantId, patientId },
      include: { practitioner: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async createEncounter(tenantId: string, patientId: string, data: any) {
    return prisma.healthcareEncounter.create({
      data: { ...data, tenantId, patientId },
      include: { patient: true, practitioner: true },
    });
  }
  async getPractitioners(tenantId: string) {
    return prisma.healthcarePractitioner.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createPractitioner(tenantId: string, data: any) {
    return prisma.healthcarePractitioner.create({
      data: { ...data, tenantId },
    });
  }
  async updatePractitioner(tenantId: string, id: string, data: any) {
    await prisma.healthcarePractitioner.updateMany({
      where: { tenantId, id },
      data,
    });
    return prisma.healthcarePractitioner.findFirst({ where: { tenantId, id } });
  }
}
