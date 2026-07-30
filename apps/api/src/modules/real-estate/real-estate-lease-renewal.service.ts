// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstateLeaseRenewalService {
  // RealEstateLeaseRenewal/RealEstateRentEscalation only store `leaseId`/
  // `propertyId` scalars — there are no `lease`/`property` relations in the
  // schema to `include`, so related summaries are batched in manually.
  private async attachLease<T extends { leaseId: string }>(
    tenantId: string,
    rows: T[],
  ) {
    const leases = await prisma.realEstateLease.findMany({
      where: { tenantId, id: { in: rows.map((r) => r.leaseId) } },
      select: { id: true, tenantName: true, rentAmount: true, status: true },
    });
    const byId = new Map(leases.map((l) => [l.id, l]));
    return rows.map((r) => ({ ...r, lease: byId.get(r.leaseId) || null }));
  }

  private async attachProperty<T extends { propertyId: string }>(
    tenantId: string,
    rows: T[],
  ) {
    const properties = await prisma.realEstateProperty.findMany({
      where: { tenantId, id: { in: rows.map((r) => r.propertyId) } },
      select: { id: true, name: true },
    });
    const byId = new Map(properties.map((p) => [p.id, p]));
    return rows.map((r) => ({
      ...r,
      property: byId.get(r.propertyId) || null,
    }));
  }

  async getRenewals(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.leaseId) where.leaseId = query.leaseId;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.realEstateLeaseRenewal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateLeaseRenewal.count({ where }),
    ]);
    const withLease = await this.attachLease(tenantId, rows);
    const data = await this.attachProperty(tenantId, withLease);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRenewalById(tenantId: string, id: string) {
    const r = await prisma.realEstateLeaseRenewal.findFirst({
      where: { tenantId, id },
    });
    if (!r) throw new NotFoundException("Lease renewal not found");
    const [withLease] = await this.attachLease(tenantId, [r]);
    const [result] = await this.attachProperty(tenantId, [withLease!]);
    return result;
  }

  async createRenewal(tenantId: string, data: any) {
    const created = await prisma.realEstateLeaseRenewal.create({
      data: {
        ...data,
        tenantId,
        currentEndDate: new Date(data.currentEndDate),
        proposedStartDate: new Date(data.proposedStartDate),
        proposedEndDate: new Date(data.proposedEndDate),
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        executedAt: data.executedAt ? new Date(data.executedAt) : null,
      },
    });
    const [withLease] = await this.attachLease(tenantId, [created]);
    const [result] = await this.attachProperty(tenantId, [withLease!]);
    return result;
  }

  async updateRenewal(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateLeaseRenewal.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease renewal not found");
    const updateData: any = { ...data };
    if (data.currentEndDate)
      updateData.currentEndDate = new Date(data.currentEndDate);
    if (data.proposedStartDate)
      updateData.proposedStartDate = new Date(data.proposedStartDate);
    if (data.proposedEndDate)
      updateData.proposedEndDate = new Date(data.proposedEndDate);
    if (data.approvedAt) updateData.approvedAt = new Date(data.approvedAt);
    if (data.executedAt) updateData.executedAt = new Date(data.executedAt);
    return prisma.realEstateLeaseRenewal.update({
      where: { id },
      data: updateData,
    });
  }

  async approveRenewal(tenantId: string, id: string, approvedBy: string) {
    const existing = await prisma.realEstateLeaseRenewal.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease renewal not found");
    if (existing.status !== "DRAFT" && existing.status !== "NEGOTIATING")
      throw new BadRequestException(
        "Renewal cannot be approved in current status",
      );
    return prisma.realEstateLeaseRenewal.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async executeRenewal(tenantId: string, id: string) {
    const existing = await prisma.realEstateLeaseRenewal.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease renewal not found");
    if (existing.status !== "APPROVED")
      throw new BadRequestException(
        "Renewal must be approved before execution",
      );
    await prisma.$transaction(async (tx) => {
      await tx.realEstateLeaseRenewal.update({
        where: { id },
        data: { status: "EXECUTED", executedAt: new Date() },
      });
      await tx.realEstateLease.update({
        where: { id: existing.leaseId },
        data: {
          endDate: existing.proposedEndDate,
          rentAmount: existing.proposedRent,
          nextRenewalDate: existing.proposedEndDate,
          status: "ACTIVE",
          autoRenewal: true,
        },
      });
    });
    return this.getRenewalById(tenantId, id);
  }

  async getRentEscalations(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.leaseId) where.leaseId = query.leaseId;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    const rows = await prisma.realEstateRentEscalation.findMany({
      where,
      orderBy: { nextEscalationDate: "asc" },
    });
    const withLease = await this.attachLease(tenantId, rows);
    return this.attachProperty(tenantId, withLease);
  }

  async createRentEscalation(tenantId: string, data: any) {
    const created = await prisma.realEstateRentEscalation.create({
      data: {
        ...data,
        tenantId,
        nextEscalationDate: data.nextEscalationDate
          ? new Date(data.nextEscalationDate)
          : null,
        lastEscalationDate: data.lastEscalationDate
          ? new Date(data.lastEscalationDate)
          : null,
      },
    });
    const [result] = await this.attachLease(tenantId, [created]);
    return result;
  }

  async updateRentEscalation(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateRentEscalation.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Rent escalation not found");
    const updateData: any = { ...data };
    if (data.nextEscalationDate)
      updateData.nextEscalationDate = new Date(data.nextEscalationDate);
    if (data.lastEscalationDate)
      updateData.lastEscalationDate = new Date(data.lastEscalationDate);
    return prisma.realEstateRentEscalation.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRentEscalation(tenantId: string, id: string) {
    const existing = await prisma.realEstateRentEscalation.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Rent escalation not found");
    return prisma.realEstateRentEscalation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async applyEscalation(tenantId: string, id: string) {
    const escalation = await prisma.realEstateRentEscalation.findFirst({
      where: { tenantId, id },
    });
    if (!escalation) throw new NotFoundException("Rent escalation not found");
    if (escalation.status !== "ACTIVE")
      throw new BadRequestException("Escalation schedule is not active");
    let newRent = Number(escalation.currentRent);
    if (escalation.escalationType === "PERCENTAGE") {
      newRent = newRent * (1 + Number(escalation.escalationRate) / 100);
    } else if (escalation.escalationType === "FIXED_AMOUNT") {
      newRent = newRent + Number(escalation.escalationRate);
    }
    if (escalation.capRate) {
      const maxRent =
        Number(escalation.baseRent) * (1 + Number(escalation.capRate) / 100);
      newRent = Math.min(newRent, maxRent);
    }
    if (escalation.floorRate) {
      const minRent =
        Number(escalation.baseRent) * (1 + Number(escalation.floorRate) / 100);
      newRent = Math.max(newRent, minRent);
    }
    await prisma.$transaction(async (tx) => {
      await tx.realEstateRentEscalation.update({
        where: { id },
        data: { lastEscalationDate: new Date(), currentRent: newRent },
      });
      const nextDate = new Date();
      nextDate.setMonth(
        nextDate.getMonth() + Number(escalation.frequencyMonths),
      );
      await tx.realEstateRentEscalation.update({
        where: { id },
        data: { nextEscalationDate: nextDate },
      });
      await tx.realEstateLease.update({
        where: { id: escalation.leaseId },
        data: { rentAmount: newRent },
      });
    });
    return this.getRentEscalations(tenantId, { leaseId: escalation.leaseId });
  }
}
