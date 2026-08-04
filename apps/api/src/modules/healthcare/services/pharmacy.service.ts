import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class HealthcarePharmacyService {
  async getInventory(tenantId: string) {
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
  async getBatch(tenantId: string, batchId: string) {
    return prisma.healthcarePharmacyBatch.findFirst({
      where: { tenantId, id: batchId },
      include: { drug: true },
    });
  }
  async createBatch(tenantId: string, data: any) {
    return prisma.healthcarePharmacyBatch.create({
      data: { ...data, tenantId },
      include: { drug: true },
    });
  }
  async updateBatch(tenantId: string, id: string, data: any) {
    await prisma.healthcarePharmacyBatch.updateMany({
      where: { tenantId, id },
      data,
    });
    return this.getBatch(tenantId, id);
  }
  async adjustStock(tenantId: string, drugId: string, quantity: number) {
    return prisma.healthcareDrug.updateMany({
      where: { tenantId, id: drugId },
      data: { quantity: { increment: quantity } },
    });
  }
  async getNearExpiry(tenantId: string, days: number = 90) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return prisma.healthcarePharmacyBatch.findMany({
      where: {
        tenantId,
        expiryDate: { lte: threshold, gte: new Date() },
        status: "ACTIVE",
      },
      include: { drug: true },
      orderBy: { expiryDate: "asc" },
    });
  }
  async getExpired(tenantId: string) {
    return prisma.healthcarePharmacyBatch.findMany({
      where: { tenantId, expiryDate: { lt: new Date() }, status: "ACTIVE" },
      include: { drug: true },
      orderBy: { expiryDate: "asc" },
    });
  }
  async markExpired(tenantId: string, batchId: string) {
    return prisma.healthcarePharmacyBatch.updateMany({
      where: { tenantId, id: batchId },
      data: { status: "EXPIRED" },
    });
  }
  async logControlledSubstance(tenantId: string, data: any) {
    return prisma.healthcareControlledSubstanceLog.create({
      data: { ...data, tenantId },
      include: { drug: true },
    });
  }
  async getControlledLogs(
    tenantId: string,
    filters?: { drugId?: string; from?: string; to?: string },
  ) {
    return prisma.healthcareControlledSubstanceLog.findMany({
      where: {
        tenantId,
        drugId: filters?.drugId,
        loggedAt: {
          gte: filters?.from ? new Date(filters.from) : undefined,
          lte: filters?.to ? new Date(filters.to) : undefined,
        },
      },
      include: { drug: true },
      orderBy: { loggedAt: "desc" },
    });
  }
  async dispenseDrug(
    tenantId: string,
    drugId: string,
    quantity: number,
    patientId: string,
    administeredBy: string,
  ) {
    const drug = await prisma.healthcareDrug.findFirst({
      where: { tenantId, id: drugId },
    });
    if (!drug || drug.quantity < quantity)
      throw new Error("Insufficient stock");
    await prisma.healthcareDrug.updateMany({
      where: { tenantId, id: drugId },
      data: { quantity: { decrement: quantity } },
    });
    if (drug.isControlled) {
      await prisma.healthcareControlledSubstanceLog.create({
        data: {
          tenantId,
          drugId,
          action: "DISPENSE",
          quantity,
          patientId,
          administeredBy,
        },
      });
    }
    return prisma.healthcareDrug.findFirst({
      where: { tenantId, id: drugId },
      include: { batches: true },
    });
  }
}
