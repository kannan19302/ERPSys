import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class RealEstateOperationsService {
  // ── Maintenance Work Orders ──
  async getWorkOrders(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.vendorId) where.vendorId = query.vendorId;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.realEstateMaintenanceWorkOrder.findMany({
        where,
        include: {
          property: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateMaintenanceWorkOrder.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getWorkOrderById(tenantId: string, id: string) {
    const wo = await prisma.realEstateMaintenanceWorkOrder.findFirst({
      where: { tenantId, id },
      include: { property: true, vendor: true },
    });
    if (!wo) throw new NotFoundException("Work order not found");
    return wo;
  }
  async createWorkOrder(tenantId: string, data: any) {
    return prisma.realEstateMaintenanceWorkOrder.create({
      data: { ...data, tenantId },
      include: { property: true },
    });
  }
  async updateWorkOrder(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateMaintenanceWorkOrder.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Work order not found");
    const updated = await prisma.realEstateMaintenanceWorkOrder.update({
      where: { id },
      data,
      include: { property: true, vendor: true },
    });
    if (data.status === "COMPLETED" && !existing.completedDate) {
      await prisma.realEstateMaintenanceWorkOrder.update({
        where: { id },
        data: { completedDate: new Date() },
      });
    }
    return updated;
  }
  async deleteWorkOrder(tenantId: string, id: string) {
    const existing = await prisma.realEstateMaintenanceWorkOrder.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Work order not found");
    return prisma.realEstateMaintenanceWorkOrder.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async assignWorkOrder(tenantId: string, id: string, vendorId: string) {
    const existing = await prisma.realEstateMaintenanceWorkOrder.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Work order not found");
    return prisma.realEstateMaintenanceWorkOrder.update({
      where: { id },
      data: { vendorId, status: "ASSIGNED", scheduledDate: new Date() },
      include: { vendor: true, property: true },
    });
  }
  async getMaintenanceStats(tenantId: string) {
    const [open, inProgress, completed, byCategory, urgentCount] =
      await Promise.all([
        prisma.realEstateMaintenanceWorkOrder.count({
          where: { tenantId, status: { in: ["OPEN", "ASSIGNED"] } },
        }),
        prisma.realEstateMaintenanceWorkOrder.count({
          where: { tenantId, status: "IN_PROGRESS" },
        }),
        prisma.realEstateMaintenanceWorkOrder.count({
          where: { tenantId, status: "COMPLETED" },
        }),
        prisma.realEstateMaintenanceWorkOrder.groupBy({
          by: ["category"],
          where: { tenantId },
          _count: true,
        }),
        prisma.realEstateMaintenanceWorkOrder.count({
          where: {
            tenantId,
            priority: { in: ["URGENT", "EMERGENCY"] },
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        }),
      ]);
    return { open, inProgress, completed, byCategory, urgentCount };
  }
  async batchUpdateWorkOrders(tenantId: string, ids: string[], data: any) {
    return prisma.realEstateMaintenanceWorkOrder.updateMany({
      where: { tenantId, id: { in: ids } },
      data,
    });
  }

  // ── Maintenance Vendors ──
  async getVendors(tenantId: string) {
    return prisma.realEstateMaintenanceVendor.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }
  async getVendorById(tenantId: string, id: string) {
    const vendor = await prisma.realEstateMaintenanceVendor.findFirst({
      where: { tenantId, id },
      include: { workOrders: { take: 10, orderBy: { createdAt: "desc" } } },
    });
    if (!vendor) throw new NotFoundException("Vendor not found");
    return vendor;
  }
  async createVendor(tenantId: string, data: any) {
    return prisma.realEstateMaintenanceVendor.create({
      data: { ...data, tenantId },
    });
  }
  async updateVendor(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateMaintenanceVendor.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Vendor not found");
    return prisma.realEstateMaintenanceVendor.update({ where: { id }, data });
  }
  async deleteVendor(tenantId: string, id: string) {
    const existing = await prisma.realEstateMaintenanceVendor.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Vendor not found");
    return prisma.realEstateMaintenanceVendor.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Commission Plans ──
  async getCommissionPlans(tenantId: string) {
    return prisma.realEstateCommissionPlan.findMany({
      where: { tenantId, isActive: true },
      include: {
        property: { select: { id: true, name: true } },
        _count: { select: { payouts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async getCommissionPlanById(tenantId: string, id: string) {
    const plan = await prisma.realEstateCommissionPlan.findFirst({
      where: { tenantId, id },
      include: { property: true, payouts: { orderBy: { createdAt: "desc" } } },
    });
    if (!plan) throw new NotFoundException("Commission plan not found");
    return plan;
  }
  async createCommissionPlan(tenantId: string, data: any) {
    return prisma.realEstateCommissionPlan.create({
      data: { ...data, tenantId },
      include: { property: true },
    });
  }
  async updateCommissionPlan(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateCommissionPlan.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Commission plan not found");
    return prisma.realEstateCommissionPlan.update({ where: { id }, data });
  }
  async deleteCommissionPlan(tenantId: string, id: string) {
    const existing = await prisma.realEstateCommissionPlan.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Commission plan not found");
    return prisma.realEstateCommissionPlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── Commission Payouts ──
  async getCommissionPayouts(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.planId) where.planId = query.planId;
    if (query.agentName)
      where.agentName = { contains: query.agentName, mode: "insensitive" };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.realEstateCommissionPayout.findMany({
        where,
        include: {
          plan: { include: { property: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstateCommissionPayout.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getCommissionPayoutById(tenantId: string, id: string) {
    const payout = await prisma.realEstateCommissionPayout.findFirst({
      where: { tenantId, id },
      include: { plan: { include: { property: true } } },
    });
    if (!payout) throw new NotFoundException("Commission payout not found");
    return payout;
  }
  async createCommissionPayout(tenantId: string, data: any) {
    if (data.planId) {
      const plan = await prisma.realEstateCommissionPlan.findFirst({
        where: { tenantId, id: data.planId },
      });
      if (!plan) throw new NotFoundException("Commission plan not found");
      const rate = data.commissionRate || plan.commissionRate;
      const dealValue = data.dealValue || 0;
      data.commissionRate = rate;
      data.splitAmount = data.amount;
      const splits = plan.splits as any[] | null;
      if (plan.splitType === "PERCENTAGE" && splits?.length) {
        const split = splits.find((s: any) => s.agent === data.agentName);
        if (split)
          data.splitAmount = Number(data.amount) * (split.percentage / 100);
      }
    }
    return prisma.realEstateCommissionPayout.create({
      data: { ...data, tenantId },
      include: { plan: true },
    });
  }
  async updateCommissionPayout(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateCommissionPayout.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Commission payout not found");
    return prisma.realEstateCommissionPayout.update({ where: { id }, data });
  }
  async approveCommissionPayout(tenantId: string, id: string) {
    const existing = await prisma.realEstateCommissionPayout.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Commission payout not found");
    return prisma.realEstateCommissionPayout.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  }
  async processCommissionPayment(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstateCommissionPayout.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Commission payout not found");
    return prisma.realEstateCommissionPayout.update({
      where: { id },
      data: {
        status: "PAID",
        paymentDate: data.paymentDate || new Date(),
        paymentMethod: data.paymentMethod,
        paidTo: data.paidTo,
        invoiceRef: data.invoiceRef,
      },
    });
  }
  async getCommissionStats(tenantId: string) {
    const [pending, paid, totalPaid, byAgent] = await Promise.all([
      prisma.realEstateCommissionPayout.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.realEstateCommissionPayout.count({
        where: { tenantId, status: "PAID" },
      }),
      prisma.realEstateCommissionPayout.aggregate({
        where: { tenantId, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.realEstateCommissionPayout.groupBy({
        by: ["agentName"],
        where: { tenantId, status: "PAID" },
        _sum: { amount: true },
      }),
    ]);
    return { pending, paid, totalPaid: totalPaid._sum.amount || 0, byAgent };
  }

  // ── Valuations ──
  async getValuations(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.method) where.method = query.method;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.realEstatePropertyValuation.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, address: true } },
        },
        orderBy: { valuationDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.realEstatePropertyValuation.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getValuationById(tenantId: string, id: string) {
    const val = await prisma.realEstatePropertyValuation.findFirst({
      where: { tenantId, id },
      include: { property: true },
    });
    if (!val) throw new NotFoundException("Valuation not found");
    return val;
  }
  async createValuation(tenantId: string, data: any) {
    return prisma.realEstatePropertyValuation.create({
      data: { ...data, tenantId },
      include: { property: true },
    });
  }
  async updateValuation(tenantId: string, id: string, data: any) {
    const existing = await prisma.realEstatePropertyValuation.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Valuation not found");
    return prisma.realEstatePropertyValuation.update({ where: { id }, data });
  }
  async deleteValuation(tenantId: string, id: string) {
    const existing = await prisma.realEstatePropertyValuation.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Valuation not found");
    return prisma.realEstatePropertyValuation.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async getLatestValuation(tenantId: string, propertyId: string) {
    return prisma.realEstatePropertyValuation.findFirst({
      where: { tenantId, propertyId, status: "FINAL", isActive: true },
      orderBy: { valuationDate: "desc" },
      include: { property: true },
    });
  }
  async compareValuations(tenantId: string, propertyId: string) {
    const valuations = await prisma.realEstatePropertyValuation.findMany({
      where: { tenantId, propertyId, isActive: true, status: "FINAL" },
      orderBy: { valuationDate: "asc" },
    });
    if (valuations.length < 2)
      return {
        message: "Need at least 2 valuations for comparison",
        valuations,
      };
    const first = valuations[0]!;
    const last = valuations[valuations.length - 1]!;
    const change = Number(last.appraisedValue) - Number(first.appraisedValue);
    const percentChange = (change / Number(first.appraisedValue)) * 100;
    return {
      valuations,
      first,
      last,
      change,
      percentChange: Math.round(percentChange * 100) / 100,
      annualizedRate:
        valuations.length > 1
          ? Math.round(
              (Math.pow(
                Number(last.appraisedValue) / Number(first.appraisedValue),
                1 / (valuations.length - 1),
              ) -
                1) *
                10000,
            ) / 100
          : 0,
    };
  }
  async getMarketAnalytics(tenantId: string) {
    const props = await prisma.realEstateProperty.findMany({
      where: { tenantId, isActive: true },
      include: {
        valuations: {
          where: { status: "FINAL" },
          orderBy: { valuationDate: "desc" },
          take: 1,
        },
      },
    });
    const totalValue = props.reduce(
      (s, p) => s + Number(p.valuations[0]?.appraisedValue || 0),
      0,
    );
    const avgPrice = props.length > 0 ? totalValue / props.length : 0;
    return {
      totalProperties: props.length,
      totalMarketValue: totalValue,
      averagePrice: Math.round(avgPrice * 100) / 100,
      byType: props.reduce((acc: any, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}
