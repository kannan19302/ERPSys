import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class HealthcarePrescriptionsService {
  async findAll(
    tenantId: string,
    filters?: { patientId?: string; practitionerId?: string; status?: string },
  ) {
    return prisma.healthcarePrescription.findMany({
      where: {
        tenantId,
        patientId: filters?.patientId,
        practitionerId: filters?.practitionerId,
        status: filters?.status,
      },
      include: { patient: true, practitioner: true, items: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.healthcarePrescription.findFirst({
      where: { tenantId, id },
      include: { patient: true, practitioner: true, items: true },
    });
  }
  async create(tenantId: string, data: any) {
    const { items, ...prescription } = data;
    return prisma.healthcarePrescription.create({
      data: {
        ...prescription,
        tenantId,
        items: items
          ? { create: items.map((i: any) => ({ ...i, tenantId })) }
          : undefined,
      },
      include: { patient: true, practitioner: true, items: true },
    });
  }
  async update(tenantId: string, id: string, data: any) {
    const { items, ...prescription } = data;
    if (items) {
      await prisma.healthcarePrescriptionItem.deleteMany({
        where: { prescriptionId: id, tenantId },
      });
      await prisma.healthcarePrescriptionItem.createMany({
        data: items.map((i: any) => ({ ...i, tenantId, prescriptionId: id })),
      });
    }
    await prisma.healthcarePrescription.updateMany({
      where: { tenantId, id },
      data: prescription,
    });
    return this.findById(tenantId, id);
  }
  async voidPrescription(tenantId: string, id: string) {
    return prisma.healthcarePrescription.updateMany({
      where: { tenantId, id },
      data: { status: "VOIDED" },
    });
  }
  async fillPrescription(tenantId: string, id: string) {
    return prisma.healthcarePrescription.updateMany({
      where: { tenantId, id },
      data: { status: "FILLED" },
    });
  }
  async getActiveByPatient(tenantId: string, patientId: string) {
    return prisma.healthcarePrescription.findMany({
      where: { tenantId, patientId, status: "ACTIVE" },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async getDrugs(tenantId: string) {
    return prisma.healthcareDrug.findMany({
      where: { tenantId },
      include: {
        batches: {
          where: { status: "ACTIVE" },
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  }
  async createDrug(tenantId: string, data: any) {
    return prisma.healthcareDrug.create({ data: { ...data, tenantId } });
  }
  async updateDrug(tenantId: string, id: string, data: any) {
    await prisma.healthcareDrug.updateMany({ where: { tenantId, id }, data });
    return prisma.healthcareDrug.findFirst({ where: { tenantId, id } });
  }
}
