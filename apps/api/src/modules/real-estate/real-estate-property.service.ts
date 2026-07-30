// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstatePropertyService {

  // ── PROPERTY INSPECTIONS ──
  async getInspections(tenantId: string, query: { propertyId?: string }) {
    const where: any = { tenantId };
    if (query.propertyId) where.propertyId = query.propertyId;

    return prisma.realEstatePropertyInspection.findMany({
      where,
      orderBy: { inspectedAt: "desc" },
    });
  }

  async createInspection(tenantId: string, data: any) {
    return prisma.realEstatePropertyInspection.create({
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

    return prisma.realEstateRentCollectionLog.findMany({
      where,
      orderBy: { paidAt: "desc" },
    });
  }

  async createRentCollectionLog(tenantId: string, data: any) {
    return prisma.realEstateRentCollectionLog.create({
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

    return prisma.realEstateListingSyndicate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createListingSyndicate(tenantId: string, data: any) {
    return prisma.realEstateListingSyndicate.create({
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
