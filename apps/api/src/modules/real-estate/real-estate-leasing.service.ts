import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class RealEstateLeasingService {
  // ── Leases ──
  async getLeases(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.search)
      where.tenantName = { contains: query.search, mode: "insensitive" };
    if (query.autoRenewal !== undefined)
      where.autoRenewal = query.autoRenewal === "true";
    if (query.fromDate) where.startDate = { gte: new Date(query.fromDate) };
    if (query.toDate) where.endDate = { lte: new Date(query.toDate) };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.realEstateLease.findMany({
        where,
        include: {
          property: { select: { id: true, name: true } },
          payments: { orderBy: { dueDate: "desc" }, take: 12 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateLease.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getLeaseById(tenantId: string, id: string) {
    const lease = await prisma.realEstateLease.findFirst({
      where: { tenantId, id },
      include: {
        property: true,
        unit: true,
        payments: { orderBy: { dueDate: "asc" } },
      },
    });
    if (!lease) throw new NotFoundException("Lease not found");
    return lease;
  }
  async createLease(tenantId: string, data: any) {
    if (data.unitId) {
      const unit = await prisma.realEstatePropertyUnit.findFirst({
        where: { tenantId, id: data.unitId },
      });
      if (unit && unit.status !== "VACANT")
        throw new BadRequestException("Unit is not vacant");
      if (unit)
        await prisma.realEstatePropertyUnit.update({
          where: { id: data.unitId },
          data: { status: "OCCUPIED" },
        });
    }
    const lease = await prisma.realEstateLease.create({
      data: { ...data, tenantId },
      include: { property: true, payments: true },
    });
    await this.autoGeneratePaymentSchedule(tenantId, lease);
    return lease;
  }
  async updateLease(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateLease.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease not found");
    return prisma.realEstateLease.update({
      where: { id },
      data,
      include: { property: true, payments: true },
    });
  }
  async deleteLease(tenantId: string, id: string) {
    const existing = await prisma.realEstateLease.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease not found");
    if (existing.unitId)
      await prisma.realEstatePropertyUnit.update({
        where: { id: existing.unitId },
        data: { status: "VACANT" },
      });
    return prisma.realEstateLease.update({
      where: { id },
      data: { isActive: false, status: "TERMINATED" },
    });
  }
  async renewLease(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateLease.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease not found");
    await prisma.realEstateLease.update({
      where: { id },
      data: { status: "RENEWED", isActive: false },
    });
    const newLease = await prisma.realEstateLease.create({
      data: {
        tenantId,
        propertyId: existing.propertyId,
        unitId: existing.unitId,
        tenantName: existing.tenantName,
        tenantEmail: existing.tenantEmail,
        tenantPhone: existing.tenantPhone,
        startDate: data.startDate || existing.endDate,
        endDate: data.endDate,
        rentAmount: data.rentAmount || existing.rentAmount,
        securityDeposit: data.securityDeposit || existing.securityDeposit,
        billingFrequency: data.billingFrequency || existing.billingFrequency,
        paymentDueDay: data.paymentDueDay || existing.paymentDueDay,
        terms: data.terms || existing.terms,
        autoRenewal:
          data.autoRenewal !== undefined
            ? data.autoRenewal
            : existing.autoRenewal,
        renewalTerms: data.renewalTerms,
      },
      include: { property: true },
    });
    await this.autoGeneratePaymentSchedule(tenantId, newLease);
    return newLease;
  }
  async terminateLease(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateLease.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Lease not found");
    if (existing.unitId)
      await prisma.realEstatePropertyUnit.update({
        where: { id: existing.unitId },
        data: { status: "VACANT" },
      });
    await prisma.realEstateLeasePayment.updateMany({
      where: { leaseId: id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    return prisma.realEstateLease.update({
      where: { id },
      data: {
        status: "TERMINATED",
        endDate: data.endDate || new Date(),
        isActive: false,
      },
    });
  }
  async getLeaseStats(tenantId: string) {
    const [active, expired, pending, byProperty] = await Promise.all([
      prisma.realEstateLease.count({
        where: { tenantId, status: "ACTIVE", isActive: true },
      }),
      prisma.realEstateLease.count({
        where: { tenantId, status: "EXPIRED", isActive: true },
      }),
      prisma.realEstateLease.count({
        where: { tenantId, status: "PENDING", isActive: true },
      }),
      prisma.realEstateLease.groupBy({
        by: ["propertyId"],
        where: { tenantId, status: "ACTIVE", isActive: true },
        _sum: { rentAmount: true },
        _count: true,
      }),
    ]);
    return { active, expired, pending, byProperty };
  }
  async getExpiringLeases(tenantId: string, days: number = 30) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return prisma.realEstateLease.findMany({
      where: { tenantId, status: "ACTIVE", endDate: { lte: threshold } },
      include: { property: true },
      orderBy: { endDate: "asc" },
    });
  }
  async getUpcomingRenewals(tenantId: string, days: number = 60) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return prisma.realEstateLease.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        autoRenewal: true,
        endDate: { lte: threshold },
      },
      include: { property: true },
      orderBy: { endDate: "asc" },
    });
  }
  async generateInvoice(
    tenantId: string,
    leaseId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const lease = await prisma.realEstateLease.findFirst({
      where: { tenantId, id: leaseId },
    });
    if (!lease) throw new NotFoundException("Lease not found");
    let amount = Number(lease.rentAmount);
    if (lease.billingFrequency === "QUARTERLY") amount *= 3;
    else if (lease.billingFrequency === "YEARLY") amount *= 12;
    return prisma.realEstateLeasePayment.create({
      data: {
        tenantId,
        leaseId,
        amount,
        dueDate: new Date(periodStart),
        periodStart,
        periodEnd,
        status: "PENDING",
      },
      include: { lease: true },
    });
  }
  async autoGeneratePaymentSchedule(tenantId: string, lease: any) {
    if (!lease.startDate || !lease.endDate) return;
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);
    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (months <= 0) months = 1;
    const frequency = lease.billingFrequency || "MONTHLY";
    const interval =
      frequency === "YEARLY" ? 12 : frequency === "QUARTERLY" ? 3 : 1;
    const payments: any[] = [];
    for (let i = 0; i < months; i += interval) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);
      dueDate.setDate(lease.paymentDueDay || 1);
      const periodStart = new Date(dueDate);
      const periodEnd = new Date(dueDate);
      periodEnd.setMonth(periodEnd.getMonth() + interval);
      let amount = Number(lease.rentAmount) * interval;
      const existing = await prisma.realEstateLeasePayment.findFirst({
        where: { leaseId: lease.id, dueDate },
      });
      if (!existing) {
        payments.push({
          tenantId,
          leaseId: lease.id,
          amount,
          dueDate,
          periodStart,
          periodEnd,
          status: "PENDING",
        });
      }
    }
    if (payments.length > 0) {
      await prisma.realEstateLeasePayment.createMany({ data: payments });
    }
  }

  // ── Payments ──
  async getPayments(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.leaseId) where.leaseId = query.leaseId;
    if (query.status) where.status = query.status;
    if (query.fromDate) where.dueDate = { gte: new Date(query.fromDate) };
    if (query.toDate)
      where.dueDate = { ...where.dueDate, lte: new Date(query.toDate) };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.realEstateLeasePayment.findMany({
        where,
        include: {
          lease: {
            include: { property: { select: { id: true, name: true } } },
          },
        },
        orderBy: { dueDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateLeasePayment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getPaymentById(tenantId: string, id: string) {
    const payment = await prisma.realEstateLeasePayment.findFirst({
      where: { tenantId, id },
      include: { lease: { include: { property: true } } },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }
  async recordPayment(tenantId: string, id: string, data: any) {
    const payment = await prisma.realEstateLeasePayment.findFirst({
      where: { tenantId, id },
    });
    if (!payment) throw new NotFoundException("Payment record not found");
    if (payment.status === "PAID")
      throw new BadRequestException("Payment already recorded");
    const paidAmount = data.paidAmount || payment.amount;
    const status =
      paidAmount >= Number(payment.amount) - Number(payment.discount)
        ? "PAID"
        : "PARTIAL";
    return prisma.realEstateLeasePayment.update({
      where: { id },
      data: {
        paidAmount: data.paidAmount || payment.amount,
        paidDate: data.paidDate || new Date(),
        method: data.method || payment.method,
        reference: data.reference,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        status,
      },
    });
  }
  async getPaymentStats(tenantId: string) {
    const [pending, paid, overdue, totalCollected, totalExpected] =
      await Promise.all([
        prisma.realEstateLeasePayment.count({
          where: { tenantId, status: "PENDING" },
        }),
        prisma.realEstateLeasePayment.count({
          where: { tenantId, status: "PAID" },
        }),
        prisma.realEstateLeasePayment.count({
          where: { tenantId, status: "OVERDUE" },
        }),
        prisma.realEstateLeasePayment.aggregate({
          where: { tenantId, status: "PAID", paidAmount: { not: null } },
          _sum: { paidAmount: true },
        }),
        prisma.realEstateLeasePayment.aggregate({
          where: { tenantId, status: { in: ["PENDING", "OVERDUE"] } },
          _sum: { amount: true },
        }),
      ]);
    return {
      pending,
      paid,
      overdue,
      totalCollected: totalCollected._sum.paidAmount || 0,
      totalExpected: totalExpected._sum.amount || 0,
    };
  }

  // ── Tenants ──
  async getTenants(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.search)
      where.name = { contains: query.search, mode: "insensitive" };
    return prisma.realEstateTenant.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
  async getTenantById(tenantId: string, id: string) {
    const tenant = await prisma.realEstateTenant.findFirst({
      where: { tenantId, id },
      include: { property: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }
  async createTenant(tenantId: string, data: any) {
    return prisma.realEstateTenant.create({
      data: { ...data, tenantId },
      include: { property: true },
    });
  }
  async updateTenant(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateTenant.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Tenant not found");
    return prisma.realEstateTenant.update({ where: { id }, data });
  }
  async deleteTenant(tenantId: string, id: string) {
    const existing = await prisma.realEstateTenant.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Tenant not found");
    return prisma.realEstateTenant.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
