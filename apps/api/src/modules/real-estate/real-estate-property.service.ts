// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstatePropertyService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}

  // ── PROPERTY INSPECTIONS ──
  async getInspections(tenantId: string, query: { propertyId?: string }) {
    const where: any = { tenantId };
    if (query.propertyId) where.propertyId = query.propertyId;

    return this.prismaClient.realEstatePropertyInspection.findMany({
      where,
      orderBy: { inspectedAt: "desc" },
    });
  }

  async createInspection(tenantId: string, data: any) {
    return this.prismaClient.realEstatePropertyInspection.create({
      data: {
        tenantId,
        propertyId: data.propertyId,
        inspectorId: data.inspectorId,
        type: data.type || "MOVE_IN",
        checklist: data.checklist || [],
        passed: data.passed !== false,
        notes: data.notes,
      },
    });
  }

  // ── RENT COLLECTION LOGS ──
  async getRentCollectionLogs(tenantId: string, query: { leaseId?: string }) {
    const where: any = { tenantId };
    if (query.leaseId) where.leaseId = query.leaseId;

    return this.prismaClient.realEstateRentCollectionLog.findMany({
      where,
      orderBy: { paidAt: "desc" },
    });
  }

  async createRentCollectionLog(tenantId: string, data: any) {
    return this.prismaClient.realEstateRentCollectionLog.create({
      data: {
        tenantId,
        leaseId: data.leaseId,
        tenantUser: data.tenantUser,
        amountPaid: data.amountPaid,
        paymentMethod: data.paymentMethod || "BANK_TRANSFER",
        transactionRef: data.transactionRef,
        lateFee: data.lateFee || 0,
      },
    });
  }

  // ── LISTING SYNDICATION ──
  async getListingSyndicates(tenantId: string, query: { propertyId?: string }) {
    const where: any = { tenantId };
    if (query.propertyId) where.propertyId = query.propertyId;

    return this.prismaClient.realEstateListingSyndicate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createListingSyndicate(tenantId: string, data: any) {
    return this.prismaClient.realEstateListingSyndicate.create({
      data: {
        tenantId,
        propertyId: data.propertyId,
        platform: data.platform,
        externalId: data.externalId,
        status: "ACTIVE",
      },
    });
  }
}
