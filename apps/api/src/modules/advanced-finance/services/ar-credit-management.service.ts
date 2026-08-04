import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class ArCreditManagementService {
  async listCustomerCreditProfiles(tenantId: string, search?: string) {
    const where: Prisma.CustomerWhereInput = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search, mode: "insensitive" } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
    });
    const profiles = await Promise.all(
      customers.map(async (c) => {
        const outstanding = await prisma.invoice.aggregate({
          where: {
            tenantId,
            customerId: c.id,
            status: { notIn: ["PAID", "CANCELLED", "DRAFT"] },
          },
          _sum: { totalAmount: true },
        });
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
          outstandingAmount: Number(outstanding._sum.totalAmount ?? 0),
          creditHold: c.creditHold,
          riskRating: c.riskRating,
          status: c.status,
        };
      }),
    );
    return profiles;
  }

  async getCustomerCreditProfile(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    const [outstanding, invoices, promises, disputes] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          customerId,
          status: { notIn: ["PAID", "CANCELLED", "DRAFT"] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId, customerId },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      prisma.aRPromiseToPay.findMany({
        where: { tenantId, customerId, status: "PROMISED" },
        orderBy: { promisedDate: "asc" },
      }),
      prisma.aRDispute.findMany({
        where: { tenantId, customerId, status: { notIn: ["RESOLVED"] } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
        outstandingAmount: Number(outstanding._sum.totalAmount ?? 0),
        creditHold: customer.creditHold,
        creditHoldReason: customer.creditHoldReason,
        riskRating: customer.riskRating,
        status: customer.status,
      },
      recentInvoices: invoices.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        status: i.status,
        totalAmount: Number(i.totalAmount),
        dueDate: i.dueDate,
      })),
      activePromises: promises.map((p) => ({
        id: p.id,
        promisedDate: p.promisedDate,
        promisedAmount: Number(p.promisedAmount),
        status: p.status,
      })),
      openDisputes: disputes.map((d) => ({
        id: d.id,
        reason: d.reason,
        disputedAmount: Number(d.disputedAmount),
        status: d.status,
      })),
    };
  }

  async updateCreditLimit(
    tenantId: string,
    customerId: string,
    data: { creditLimit: number; reason: string },
    _userId: string,
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        creditLimit: new Prisma.Decimal(data.creditLimit),
        notes: data.reason,
      },
    });
  }

  async placeCreditHold(
    tenantId: string,
    customerId: string,
    reason: string,
    _userId: string,
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    if (customer.creditHold)
      throw new BadRequestException("Customer is already on credit hold");
    return prisma.customer.update({
      where: { id: customerId },
      data: { creditHold: true, creditHoldReason: reason },
    });
  }

  async releaseCreditHold(
    tenantId: string,
    customerId: string,
    _userId: string,
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    if (!customer.creditHold)
      throw new BadRequestException("Customer is not on credit hold");
    return prisma.customer.update({
      where: { id: customerId },
      data: { creditHold: false, creditHoldReason: null },
    });
  }

  async listCustomersOnHold(tenantId: string) {
    return prisma.customer.findMany({
      where: { tenantId, creditHold: true },
      orderBy: { name: "asc" },
    });
  }

  async listAgingSummary(tenantId: string, asOfDate?: string) {
    const now = asOfDate ? new Date(asOfDate) : new Date();
    const buckets = [
      { label: "0-30", min: 0, max: 30 },
      { label: "31-60", min: 31, max: 60 },
      { label: "61-90", min: 61, max: 90 },
      { label: "91-180", min: 91, max: 180 },
      { label: "181-365", min: 181, max: 365 },
      { label: "365+", min: 366, max: Infinity },
    ];
    const overdue = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ["PAID", "CANCELLED", "DRAFT"] },
        dueDate: { lt: now },
      },
      include: { customer: true },
    });
    const bucketData = buckets.map((b) => {
      const invoices = overdue.filter((inv) => {
        if (!inv.dueDate) return false;
        const days = Math.floor(
          (now.getTime() - inv.dueDate.getTime()) / 86400000,
        );
        return days >= b.min && days <= b.max;
      });
      return {
        bucket: b.label,
        totalAmount: invoices.reduce((s, i) => s + Number(i.totalAmount), 0),
        invoiceCount: invoices.length,
      };
    });
    return {
      asOfDate: now,
      buckets: bucketData,
      totalOverdue: bucketData.reduce((s, b) => s + b.totalAmount, 0),
      totalInvoices: bucketData.reduce((s, b) => s + b.invoiceCount, 0),
    };
  }

  async listCustomerStatements(tenantId: string, customerId?: string) {
    const where: Prisma.CustomerStatementWhereInput = { tenantId };
    if (customerId) where.customerId = customerId;
    return prisma.customerStatement.findMany({
      where,
      orderBy: { periodEnd: "desc" },
      take: 50,
    });
  }

  async computeBadDebtProvision(tenantId: string, asOfDate?: string) {
    const now = asOfDate ? new Date(asOfDate) : new Date();
    const period = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    const orgId = org?.id ?? "org-system-default";
    const openInvoices = await prisma.invoice.findMany({
      where: { tenantId, status: { notIn: ["PAID", "CANCELLED", "DRAFT"] } },
      include: { customer: true },
    });
    let provisionAmount = 0;
    const details: {
      invoiceId: string;
      customerName: string;
      amount: number;
      agingDays: number;
      provisionPct: number;
      provision: number;
    }[] = [];
    for (const inv of openInvoices) {
      if (!inv.dueDate) continue;
      const agingDays = Math.floor(
        (now.getTime() - inv.dueDate.getTime()) / 86400000,
      );
      let provisionPct = 0;
      if (agingDays >= 365) provisionPct = 0.5;
      else if (agingDays >= 180) provisionPct = 0.25;
      else if (agingDays >= 90) provisionPct = 0.1;
      else if (agingDays >= 61) provisionPct = 0.05;
      if (provisionPct > 0) {
        const provision = Number(inv.totalAmount) * provisionPct;
        provisionAmount += provision;
        details.push({
          invoiceId: inv.id,
          customerName: inv.customer?.name ?? "Unknown",
          amount: Number(inv.totalAmount),
          agingDays,
          provisionPct,
          provision,
        });
      }
    }
    return prisma.badDebtProvision.create({
      data: {
        tenantId,
        orgId,
        period,
        method: "AGING_BUCKET",
        provisionAmount: new Prisma.Decimal(provisionAmount),
        details: details as never,
        status: "DRAFT",
      },
    });
  }

  async getDsoTrend(tenantId: string, months: number = 12) {
    const result: { month: string; dso: number }[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const agg = await prisma.invoice.aggregate({
        where: {
          tenantId,
          issueDate: { gte: d, lte: endOfMonth },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });
      const paidAgg = await prisma.payment.aggregate({
        where: { tenantId, paidAt: { gte: d, lte: endOfMonth } },
        _sum: { amount: true },
      });
      const revenue = Number(agg._sum.totalAmount ?? 0);
      const collected = Number(paidAgg._sum?.amount ?? 0);
      const dso = revenue > 0 ? Math.round((collected / revenue) * 30) : 0;
      result.push({ month: monthStr, dso });
    }
    return result;
  }

  async getCollectorDashboard(tenantId: string) {
    const now = new Date();
    const [totalOpen, overdueCount, promises, disputes, provisions, onHold] =
      await Promise.all([
        prisma.invoice.count({
          where: {
            tenantId,
            status: { notIn: ["PAID", "CANCELLED", "DRAFT"] },
          },
        }),
        prisma.invoice.count({
          where: {
            tenantId,
            status: { notIn: ["PAID", "CANCELLED", "DRAFT"] },
            dueDate: { lt: now },
          },
        }),
        prisma.aRPromiseToPay.count({
          where: { tenantId, status: "PROMISED" },
        }),
        prisma.aRDispute.count({
          where: { tenantId, status: { notIn: ["RESOLVED"] } },
        }),
        prisma.badDebtProvision.aggregate({
          where: { tenantId, status: "POSTED" },
          _sum: { provisionAmount: true },
        }),
        prisma.customer.count({ where: { tenantId, creditHold: true } }),
      ]);
    return {
      openInvoices: totalOpen,
      overdueInvoices: overdueCount,
      activePromises: promises,
      openDisputes: disputes,
      totalProvision: Number(provisions._sum.provisionAmount ?? 0),
      customersOnHold: onHold,
    };
  }
}
