import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class HealthcareLabService {
  async findAll(
    tenantId: string,
    filters?: { patientId?: string; status?: string },
  ) {
    return prisma.healthcareLabOrder.findMany({
      where: {
        tenantId,
        patientId: filters?.patientId,
        status: filters?.status,
      },
      include: { patient: true, practitioner: true, results: true },
      orderBy: { orderedAt: "desc" },
    });
  }
  async findById(tenantId: string, id: string) {
    return prisma.healthcareLabOrder.findFirst({
      where: { tenantId, id },
      include: { patient: true, practitioner: true, results: true },
    });
  }
  async create(tenantId: string, data: any) {
    return prisma.healthcareLabOrder.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
  }
  async updateStatus(tenantId: string, id: string, status: string, data?: any) {
    const update: any = { status };
    if (status === "COLLECTED") update.collectedAt = new Date();
    if (status === "COMPLETED") update.completedAt = new Date();
    await prisma.healthcareLabOrder.updateMany({
      where: { tenantId, id },
      data: { ...update, ...data },
    });
    return this.findById(tenantId, id);
  }
  async addResult(tenantId: string, orderId: string, data: any) {
    return prisma.healthcareLabResult.create({
      data: { ...data, tenantId, orderId },
    });
  }
  async getResults(tenantId: string, orderId: string) {
    return prisma.healthcareLabResult.findMany({
      where: { tenantId, orderId },
    });
  }
  async getPending(tenantId: string) {
    return prisma.healthcareLabOrder.findMany({
      where: {
        tenantId,
        status: { in: ["ORDERED", "COLLECTED", "PROCESSING"] },
      },
      include: { patient: true, results: true },
      orderBy: { orderedAt: "asc" },
    });
  }
  async getPatientLabs(tenantId: string, patientId: string) {
    return prisma.healthcareLabOrder.findMany({
      where: { tenantId, patientId },
      include: { results: true },
      orderBy: { orderedAt: "desc" },
      take: 20,
    });
  }
}
