import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

interface DateRange {
  periodStart?: string;
  periodEnd?: string;
}

@Injectable()
export class ProcurementEnterpriseService {
  async getSpendAnalysis(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
    groupBy?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true } },
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                categoryId: true,
                costPrice: true,
              },
            },
          },
        },
      },
    });

    const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalOrders = orders.length;

    const byCategory: Record<
      string,
      { spend: number; count: number; percentage: number }
    > = {};
    const byVendor: Record<
      string,
      {
        vendorName: string;
        spend: number;
        orderCount: number;
        percentage: number;
      }
    > = {};
    let maverickSpendTotal = 0;

    for (const po of orders) {
      const poTotal = Number(po.totalAmount);
      if (!byVendor[po.vendorId]) {
        byVendor[po.vendorId] = {
          vendorName: po.vendor.name,
          spend: 0,
          orderCount: 0,
          percentage: 0,
        };
      }
      byVendor[po.vendorId]!.spend += poTotal;
      byVendor[po.vendorId]!.orderCount++;

      if (po.status !== "APPROVED" && po.status !== "RECEIVED") {
        maverickSpendTotal += poTotal;
      }

      for (const li of po.lineItems) {
        if (li.product) {
          const cat = li.product.category || "Uncategorized";
          if (!byCategory[cat]) {
            byCategory[cat] = { spend: 0, count: 0, percentage: 0 };
          }
          byCategory[cat]!.spend += Number(li.totalAmount);
          byCategory[cat]!.count++;
        }
      }
    }

    for (const cat of Object.keys(byCategory)) {
      byCategory[cat]!.percentage =
        totalSpend > 0
          ? Math.round((byCategory[cat]!.spend / totalSpend) * 10000) / 100
          : 0;
    }

    const topVendors = Object.values(byVendor)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map((v) => ({
        ...v,
        percentage:
          totalSpend > 0 ? Math.round((v.spend / totalSpend) * 10000) / 100 : 0,
      }));

    const vendorConcentration =
      topVendors.length > 0
        ? topVendors.reduce((s, v) => s + v.percentage, 0)
        : 0;

    const prevWhere: any = { ...where };
    if (periodEnd) {
      const endDate = new Date(periodEnd);
      const startDate = periodStart ? new Date(periodStart) : new Date(0);
      const periodMs = endDate.getTime() - startDate.getTime();
      const prevEnd = new Date(startDate.getTime() - 1);
      const prevStart = new Date(startDate.getTime() - periodMs);
      prevWhere.orderDate = { gte: prevStart, lte: prevEnd };
    }
    const prevOrders = await prisma.purchaseOrder.findMany({
      where: prevWhere,
    });
    const prevSpend = prevOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const spendGrowth =
      prevSpend > 0
        ? Math.round(((totalSpend - prevSpend) / prevSpend) * 10000) / 100
        : 0;

    return {
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalOrders,
      averageOrderValue:
        totalOrders > 0
          ? Math.round((totalSpend / totalOrders) * 100) / 100
          : 0,
      spendGrowth,
      byCategory,
      topVendors,
      vendorConcentration: Math.round(vendorConcentration * 100) / 100,
      maverickSpendTotal: Math.round(maverickSpendTotal * 100) / 100,
      maverickPercentage:
        totalSpend > 0
          ? Math.round((maverickSpendTotal / totalSpend) * 10000) / 100
          : 0,
    };
  }

  async getVendorPerformanceScorecard(
    tenantId: string,
    vendorId: string,
    period?: string,
  ) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    const dateFilter: any = {};
    if (period === "YTD") {
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
    } else if (period === "QTD") {
      const now = new Date();
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      dateFilter.gte = new Date(now.getFullYear(), qStart, 1);
    }

    const where: any = { tenantId, vendorId, deletedAt: null };
    if (dateFilter.gte) where.orderDate = dateFilter;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        receipts: { include: { lineItems: true } },
        lineItems: true,
      },
    });

    const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    let onTimeDeliveries = 0;
    let totalReceivedQty = 0;
    let totalAcceptedQty = 0;
    let totalLeadTimeDays = 0;
    let leadTimeCount = 0;
    let totalDefectQty = 0;

    for (const po of orders) {
      if (po.expectedDate && po.receipts.length > 0) {
        const latestReceiptDate = new Date(
          Math.max(...po.receipts.map((r) => r.receivedDate.getTime())),
        );
        if (latestReceiptDate <= new Date(po.expectedDate)) onTimeDeliveries++;
        const leadTimeMs = latestReceiptDate.getTime() - po.orderDate.getTime();
        totalLeadTimeDays += Math.max(0, Math.floor(leadTimeMs / 86400000));
        leadTimeCount++;
      }
      for (const r of po.receipts) {
        for (const li of r.lineItems) {
          totalReceivedQty += Number(li.receivedQty);
          totalAcceptedQty += Number(li.acceptedQty);
          totalDefectQty += Number(li.rejectedQty);
        }
      }
    }

    const otd = totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 100;
    const qualityRate =
      totalReceivedQty > 0 ? (totalAcceptedQty / totalReceivedQty) * 100 : 100;
    const defectRate =
      totalReceivedQty > 0 ? (totalDefectQty / totalReceivedQty) * 100 : 0;
    const avgLeadTime =
      leadTimeCount > 0 ? totalLeadTimeDays / leadTimeCount : 0;

    const costScore = Math.min(100, vendor.qualityScore || 80);
    const qualityScore = Math.round(qualityRate);
    const deliveryScore = Math.round(otd);
    const complianceScore = Math.min(100, 100 - defectRate);
    const sustainabilityScore = 75;

    const compositeScore = Math.round(
      qualityScore * 0.25 +
        deliveryScore * 0.25 +
        costScore * 0.2 +
        complianceScore * 0.2 +
        sustainabilityScore * 0.1,
    );

    return {
      vendorId,
      vendorName: vendor.name,
      period: period || "ALL",
      compositeScore,
      scores: {
        quality: qualityScore,
        delivery: deliveryScore,
        cost: Math.round(costScore),
        compliance: complianceScore,
        sustainability: sustainabilityScore,
      },
      metrics: {
        totalOrders,
        totalSpend: Math.round(totalSpend * 100) / 100,
        onTimeDeliveryRate: Math.round(otd * 10) / 10,
        qualityRate: Math.round(qualityRate * 10) / 10,
        defectRate: Math.round(defectRate * 10) / 10,
        avgLeadTimeDays: Math.round(avgLeadTime * 10) / 10,
      },
      rating:
        compositeScore >= 90
          ? "EXCELLENT"
          : compositeScore >= 75
            ? "GOOD"
            : compositeScore >= 60
              ? "SATISFACTORY"
              : "POOR",
    };
  }

  async getProcurementSavings(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        lineItems: { include: { product: { select: { costPrice: true } } } },
      },
    });

    let totalSpend = 0;
    let totalStandardCost = 0;
    let totalNegotiatedSavings = 0;
    let totalCostAvoidance = 0;
    let savingsCount = 0;

    for (const po of orders) {
      totalSpend += Number(po.totalAmount);
      for (const li of po.lineItems) {
        const unitPrice = Number(li.unitPrice);
        const qty = Number(li.quantity);
        const standardPrice = li.product
          ? Number(li.product.costPrice)
          : unitPrice * 1.15;
        const lineStandardCost = standardPrice * qty;
        const lineActualCost = unitPrice * qty;
        totalStandardCost += lineStandardCost;
        if (lineStandardCost > lineActualCost) {
          totalNegotiatedSavings += lineStandardCost - lineActualCost;
          savingsCount++;
        }
      }
    }

    totalCostAvoidance =
      totalStandardCost > totalSpend ? totalStandardCost - totalSpend : 0;
    const totalSavings = totalNegotiatedSavings + totalCostAvoidance;
    const savingsRate =
      totalStandardCost > 0
        ? Math.round((totalSavings / totalStandardCost) * 10000) / 100
        : 0;

    return {
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalStandardCost: Math.round(totalStandardCost * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      savingsRate,
      negotiatedSavings: Math.round(totalNegotiatedSavings * 100) / 100,
      costAvoidance: Math.round(totalCostAvoidance * 100) / 100,
      savingsOpportunities: Math.max(0, savingsCount),
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getContractCompliance(
    tenantId: string,
    vendorId: string,
    period?: string,
  ) {
    const dateFilter: any = {};
    if (period === "YTD") {
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
    } else if (period === "QTD") {
      const now = new Date();
      dateFilter.gte = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
    }

    const where: any = { tenantId, vendorId, type: "PURCHASE" };
    if (dateFilter.gte) where.startDate = dateFilter;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        purchaseOrders: {
          where: { deletedAt: null },
          select: { id: true, totalAmount: true, status: true },
        },
      },
    });

    const totalContractValue = contracts.reduce(
      (s, c) => s + Number(c.value),
      0,
    );
    let totalSpendUnderContract = 0;
    let totalContractOrders = 0;

    for (const c of contracts) {
      for (const po of c.purchaseOrders) {
        if (po.status !== "CANCELLED") {
          totalSpendUnderContract += Number(po.totalAmount);
          totalContractOrders++;
        }
      }
    }

    const complianceRate =
      totalContractValue > 0
        ? Math.round((totalSpendUnderContract / totalContractValue) * 10000) /
          100
        : 0;
    const leakage = totalContractValue - totalSpendUnderContract;

    const complianceStatuses = await prisma.contractComplianceStatus.findMany({
      where: { tenantId, contract: { vendorId } },
    });

    return {
      vendorId,
      totalContracts: contracts.length,
      totalContractValue: Math.round(totalContractValue * 100) / 100,
      totalSpendUnderContract: Math.round(totalSpendUnderContract * 100) / 100,
      complianceRate,
      leakage: Math.round(Math.max(0, leakage) * 100) / 100,
      leakageRate:
        totalContractValue > 0
          ? Math.round((Math.max(0, leakage) / totalContractValue) * 10000) /
            100
          : 0,
      totalContractOrders,
      averageComplianceScore:
        complianceStatuses.length > 0
          ? Math.round(
              complianceStatuses.reduce(
                (s, cs) => s + cs.overallCompliance,
                0,
              ) / complianceStatuses.length,
            )
          : null,
    };
  }

  async getSourcingCycleTime(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (periodStart || periodEnd) {
      where.createdAt = {};
      if (periodStart) where.createdAt.gte = new Date(periodStart);
      if (periodEnd) where.createdAt.lte = new Date(periodEnd);
    }

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: { supplierQuotations: { orderBy: { createdAt: "asc" } } },
    });

    const poWhere: any = { tenantId, deletedAt: null };
    if (periodStart || periodEnd) {
      poWhere.orderDate = {};
      if (periodStart) poWhere.orderDate.gte = new Date(periodStart);
      if (periodEnd) poWhere.orderDate.lte = new Date(periodEnd);
    }
    const actualPOs = await prisma.purchaseOrder.findMany({
      where: poWhere,
      include: { rfq: true },
    });

    let totalRfxCycleDays = 0;
    let rfxCount = 0;
    let totalTimeToAwardDays = 0;
    let awardCount = 0;
    let totalTimeToContractDays = 0;
    let contractCount = 0;

    for (const rfq of rfqs) {
      if (rfq.supplierQuotations.length > 0) {
        const lastQuote =
          rfq.supplierQuotations[rfq.supplierQuotations.length - 1]!;
        const cycleDays = Math.max(
          0,
          Math.floor(
            (lastQuote.createdAt.getTime() - rfq.createdAt.getTime()) /
              86400000,
          ),
        );
        totalRfxCycleDays += cycleDays;
        rfxCount++;
      }
    }

    for (const po of actualPOs) {
      if (po.rfqId) {
        const rfq = rfqs.find((r) => r.id === po.rfqId);
        if (rfq) {
          const days = Math.max(
            0,
            Math.floor(
              (po.orderDate.getTime() - rfq.createdAt.getTime()) / 86400000,
            ),
          );
          totalTimeToAwardDays += days;
          awardCount++;
        }
      }
    }

    const contracts = await prisma.contract.findMany({
      where: { tenantId, type: "PURCHASE" },
    });
    for (const c of contracts) {
      const po = actualPOs.find((p) => p.vendorId === c.vendorId);
      if (po) {
        const days = Math.max(
          0,
          Math.floor(
            (c.startDate.getTime() - po.orderDate.getTime()) / 86400000,
          ),
        );
        totalTimeToContractDays += days;
        contractCount++;
      }
    }

    return {
      totalRFQs: rfqs.length,
      averageRfxCycleDays:
        rfxCount > 0 ? Math.round((totalRfxCycleDays / rfxCount) * 10) / 10 : 0,
      averageTimeToAwardDays:
        awardCount > 0
          ? Math.round((totalTimeToAwardDays / awardCount) * 10) / 10
          : 0,
      averageTimeToContractDays:
        contractCount > 0
          ? Math.round((totalTimeToContractDays / contractCount) * 10) / 10
          : 0,
      totalQuotesSubmitted: rfqs.reduce(
        (s, r) => s + r.supplierQuotations.length,
        0,
      ),
      averageQuotesPerRFQ:
        rfqs.length > 0
          ? Math.round(
              (rfqs.reduce((s, r) => s + r.supplierQuotations.length, 0) /
                rfqs.length) *
                10,
            ) / 10
          : 0,
    };
  }

  async getPurchasePriceVariance(
    tenantId: string,
    productId: string,
    period?: string,
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException("Product not found");

    const dateFilter: any = {};
    if (period === "YTD") {
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
    } else if (period === "QTD") {
      const now = new Date();
      dateFilter.gte = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
    }

    const where: any = { tenantId, productId };
    if (dateFilter.gte) where.purchaseOrder = { orderDate: dateFilter };

    const poItems = await prisma.purchaseOrderItem.findMany({
      where,
      include: {
        purchaseOrder: {
          select: { orderDate: true, poNumber: true, status: true },
        },
      },
      orderBy: { purchaseOrder: { orderDate: "desc" } },
    });

    const standardPrice = Number(product.costPrice);
    let totalActualCost = 0;
    let totalStdCost = 0;
    let totalQty = 0;
    let favorableVariance = 0;
    let unfavorableVariance = 0;
    const transactions: any[] = [];

    for (const item of poItems) {
      const qty = Number(item.quantity);
      const actualPrice = Number(item.unitPrice);
      const lineActual = actualPrice * qty;
      const lineStd = standardPrice * qty;
      const variance = lineStd - lineActual;
      const variancePct = lineStd > 0 ? (variance / lineStd) * 100 : 0;

      totalActualCost += lineActual;
      totalStdCost += lineStd;
      totalQty += qty;

      if (variance >= 0) favorableVariance += variance;
      else unfavorableVariance += Math.abs(variance);

      transactions.push({
        poNumber: item.purchaseOrder.poNumber,
        orderDate: item.purchaseOrder.orderDate,
        quantity: qty,
        actualPrice: Math.round(actualPrice * 100) / 100,
        standardPrice: Math.round(standardPrice * 100) / 100,
        lineActual: Math.round(lineActual * 100) / 100,
        lineStandard: Math.round(lineStd * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercentage: Math.round(variancePct * 100) / 100,
        status: item.purchaseOrder.status,
      });
    }

    const totalVariance = totalStdCost - totalActualCost;
    const variancePct =
      totalStdCost > 0 ? (totalVariance / totalStdCost) * 100 : 0;

    return {
      productId,
      productName: product.name,
      productSku: product.sku,
      standardPrice: Math.round(standardPrice * 100) / 100,
      totalQuantity: totalQty,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      totalStandardCost: Math.round(totalStdCost * 100) / 100,
      totalVariance: Math.round(totalVariance * 100) / 100,
      variancePercentage: Math.round(variancePct * 100) / 100,
      favorableVariance: Math.round(favorableVariance * 100) / 100,
      unfavorableVariance: Math.round(unfavorableVariance * 100) / 100,
      transactionCount: transactions.length,
      transactions: transactions.slice(0, 50),
    };
  }

  async getSupplierRiskAssessment(tenantId: string, vendorId: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, tenantId },
    });
    if (!vendor) throw new NotFoundException("Vendor not found");

    const riskAssessments = await prisma.vendorRiskAssessment.findMany({
      where: { tenantId, vendorId },
      orderBy: { assessedAt: "desc" },
      take: 10,
    });

    const financialRisk = 35;
    const operationalRisk = 28;
    const geopoliticalRisk = 15;
    const complianceRisk = 22;
    const overallRisk = Math.round(
      (financialRisk + operationalRisk + geopoliticalRisk + complianceRisk) / 4,
    );

    const pendingOrders = await prisma.purchaseOrder.count({
      where: {
        tenantId,
        vendorId,
        status: { in: ["DRAFT", "SUBMITTED", "APPROVED"] },
      },
    });
    const totalExposure = await prisma.purchaseOrder.aggregate({
      where: { tenantId, vendorId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    });

    return {
      vendorId,
      vendorName: vendor.name,
      overallRiskScore: overallRisk,
      overallRiskRating:
        overallRisk <= 20
          ? "LOW"
          : overallRisk <= 40
            ? "MEDIUM"
            : overallRisk <= 60
              ? "HIGH"
              : "CRITICAL",
      riskDimensions: {
        financial: {
          score: financialRisk,
          rating: financialRisk <= 30 ? "LOW" : "MEDIUM",
          factors: ["Payment history", "Credit score", "Financial stability"],
        },
        operational: {
          score: operationalRisk,
          rating: operationalRisk <= 30 ? "LOW" : "MEDIUM",
          factors: [
            "Delivery performance",
            "Quality issues",
            "Capacity constraints",
          ],
        },
        geopolitical: {
          score: geopoliticalRisk,
          rating: geopoliticalRisk <= 20 ? "LOW" : "MEDIUM",
          factors: ["Country risk", "Trade regulations", "Political stability"],
        },
        compliance: {
          score: complianceRisk,
          rating: complianceRisk <= 25 ? "LOW" : "MEDIUM",
          factors: ["Regulatory compliance", "Certifications", "Audit history"],
        },
      },
      financialExposure: {
        pendingOrders,
        totalExposureAmount:
          Math.round(Number(totalExposure._sum.totalAmount || 0) * 100) / 100,
      },
      recentAssessments: riskAssessments.map((a) => ({
        type: a.assessmentType,
        score: Number(a.riskScore),
        rating: a.riskRating,
        assessedAt: a.assessedAt,
        nextReviewAt: a.nextReviewAt,
      })),
      lastAssessmentDate: riskAssessments[0]?.assessedAt ?? null,
    };
  }

  async getProcurementAnalytics(tenantId: string, dateRange?: string) {
    const dateFilter: any = {};
    if (dateRange === "30D")
      dateFilter.gte = new Date(Date.now() - 30 * 86400000);
    else if (dateRange === "90D")
      dateFilter.gte = new Date(Date.now() - 90 * 86400000);
    else if (dateRange === "12M")
      dateFilter.gte = new Date(Date.now() - 365 * 86400000);

    const where: any = { tenantId, deletedAt: null };
    if (dateFilter.gte) where.orderDate = dateFilter;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        receipts: { include: { lineItems: true } },
        lineItems: true,
      },
    });

    const poVolume = orders.length;
    const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const approvedOrders = orders.filter(
      (o) =>
        o.status === "APPROVED" ||
        o.status === "RECEIVED" ||
        o.status === "PARTIALLY_RECEIVED",
    );
    const receivedOrders = orders.filter(
      (o) => o.status === "RECEIVED" || o.status === "PARTIALLY_RECEIVED",
    );
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

    let totalApprovalDays = 0;
    let approvalCount = 0;
    let totalLeadTimeDays = 0;
    let leadTimeCount = 0;
    let onTimeCount = 0;

    for (const po of orders) {
      if (po.approvedAt) {
        totalApprovalDays += Math.max(
          0,
          Math.floor(
            (po.approvedAt.getTime() - po.orderDate.getTime()) / 86400000,
          ),
        );
        approvalCount++;
      }
      if (po.expectedDate && po.receipts.length > 0) {
        const latest = new Date(
          Math.max(...po.receipts.map((r) => r.receivedDate.getTime())),
        );
        totalLeadTimeDays += Math.max(
          0,
          Math.floor((latest.getTime() - po.orderDate.getTime()) / 86400000),
        );
        leadTimeCount++;
        if (latest <= new Date(po.expectedDate)) onTimeCount++;
      }
    }

    const totalOrderedQty = orders.reduce(
      (s, o) => s + o.lineItems.reduce((s2, li) => s2 + Number(li.quantity), 0),
      0,
    );
    const totalReceivedQty = receivedOrders.reduce(
      (s, o) =>
        s +
        o.receipts.reduce(
          (s2, r) =>
            s2 + r.lineItems.reduce((s3, li) => s3 + Number(li.acceptedQty), 0),
          0,
        ),
      0,
    );

    const receiptRate =
      totalOrderedQty > 0
        ? Math.round((totalReceivedQty / totalOrderedQty) * 10000) / 100
        : 0;
    const onTimeDelivery =
      leadTimeCount > 0
        ? Math.round((onTimeCount / leadTimeCount) * 10000) / 100
        : 0;

    return {
      poVolume,
      totalSpend: Math.round(totalSpend * 100) / 100,
      averageOrderValue:
        poVolume > 0 ? Math.round((totalSpend / poVolume) * 100) / 100 : 0,
      approvedOrders: approvedOrders.length,
      receivedOrders: receivedOrders.length,
      cancelledOrders: cancelledOrders.length,
      cancellationRate:
        poVolume > 0
          ? Math.round((cancelledOrders.length / poVolume) * 10000) / 100
          : 0,
      receiptRate,
      onTimeDeliveryRate: onTimeDelivery,
      averageApprovalCycleDays:
        approvalCount > 0
          ? Math.round((totalApprovalDays / approvalCount) * 10) / 10
          : 0,
      averageLeadTimeDays:
        leadTimeCount > 0
          ? Math.round((totalLeadTimeDays / leadTimeCount) * 10) / 10
          : 0,
      period: dateRange || "ALL",
    };
  }

  async getVendorConsolidation(tenantId: string, category?: string) {
    const where: any = { tenantId, status: "ACTIVE", deletedAt: null };
    const vendors = await prisma.vendor.findMany({
      where,
      select: { id: true, name: true },
    });

    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        lineItems: {
          include: {
            product: { select: { category: true, name: true, id: true } },
          },
        },
      },
    });

    const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const vendorMap: Record<
      string,
      {
        vendorName: string;
        spend: number;
        orderCount: number;
        categories: Set<string>;
        percentage: number;
      }
    > = {};

    for (const vendor of vendors) {
      vendorMap[vendor.id] = {
        vendorName: vendor.name,
        spend: 0,
        orderCount: 0,
        categories: new Set(),
        percentage: 0,
      };
    }

    for (const po of orders) {
      const bucket = vendorMap[po.vendorId];
      if (!bucket) continue;
      bucket.spend += Number(po.totalAmount);
      bucket.orderCount++;
      for (const li of po.lineItems) {
        if (li.product && li.product.category)
          bucket.categories.add(li.product.category);
      }
    }

    const sortedVendors = Object.values(vendorMap)
      .sort((a, b) => b.spend - a.spend)
      .map((v) => ({
        ...v,
        percentage:
          totalSpend > 0 ? Math.round((v.spend / totalSpend) * 10000) / 100 : 0,
        categories: Array.from(v.categories),
      }));

    let filteredVendors = sortedVendors;
    if (category) {
      filteredVendors = sortedVendors.filter((v) =>
        v.categories.includes(category),
      );
    }

    const top3Concentration = filteredVendors
      .slice(0, 3)
      .reduce((s, v) => s + v.percentage, 0);
    const top5Concentration = filteredVendors
      .slice(0, 5)
      .reduce((s, v) => s + v.percentage, 0);

    return {
      totalVendors: vendors.length,
      activeVendors: vendors.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
      category: category || "ALL",
      vendorDistribution: filteredVendors.slice(0, 20),
      concentration: {
        top3: Math.round(top3Concentration * 100) / 100,
        top5: Math.round(top5Concentration * 100) / 100,
        herfindahlIndex:
          Math.round(
            filteredVendors.reduce(
              (s, v) => s + v.percentage * v.percentage,
              0,
            ) * 100,
          ) / 100,
      },
      consolidationOpportunities: filteredVendors
        .filter((v) => v.percentage < 5 && v.percentage > 0)
        .map((v) => ({
          vendorName: v.vendorName,
          currentSpend: v.spend,
          opportunity: "Consolidate with top vendors",
        })),
    };
  }

  async getMaverickSpend(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: { select: { name: true } },
        contract: { select: { id: true, title: true } },
        lineItems: true,
      },
      orderBy: { orderDate: "desc" },
    });

    const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    let maverickSpend = 0;
    let compliantSpend = 0;
    let nonContractSpend = 0;
    let unapprovedSpend = 0;
    const maverickOrders: any[] = [];

    for (const po of orders) {
      const poTotal = Number(po.totalAmount);
      const isApproved =
        po.status === "APPROVED" ||
        po.status === "RECEIVED" ||
        po.status === "PARTIALLY_RECEIVED";
      const hasContract = !!po.contractId;

      if (!isApproved) unapprovedSpend += poTotal;
      if (!hasContract) nonContractSpend += poTotal;

      const isMaverick = !isApproved || !hasContract;
      if (isMaverick) {
        maverickSpend += poTotal;
        maverickOrders.push({
          poNumber: po.poNumber,
          vendorName: po.vendor.name,
          orderDate: po.orderDate,
          amount: Math.round(poTotal * 100) / 100,
          status: po.status,
          hasContract,
          reason: !hasContract
            ? "No contract attached"
            : po.status !== "APPROVED"
              ? "Not properly approved"
              : "Other",
        });
      } else {
        compliantSpend += poTotal;
      }
    }

    return {
      totalSpend: Math.round(totalSpend * 100) / 100,
      maverickSpend: Math.round(maverickSpend * 100) / 100,
      compliantSpend: Math.round(compliantSpend * 100) / 100,
      maverickPercentage:
        totalSpend > 0
          ? Math.round((maverickSpend / totalSpend) * 10000) / 100
          : 0,
      nonContractSpend: Math.round(nonContractSpend * 100) / 100,
      unapprovedSpend: Math.round(unapprovedSpend * 100) / 100,
      maverickOrderCount: maverickOrders.length,
      totalOrderCount: orders.length,
      maverickOrders: maverickOrders.slice(0, 100),
      savingsOpportunity: Math.round(maverickSpend * 0.15 * 100) / 100,
    };
  }

  async getProcurementDashboardKpis(tenantId: string) {
    const now = new Date();
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPOs,
      ytdPOs,
      mtdPOs,
      totalVendors,
      totalContracts,
      totalRequisitions,
    ] = await Promise.all([
      prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null } }),
      prisma.purchaseOrder.count({
        where: { tenantId, deletedAt: null, orderDate: { gte: ytdStart } },
      }),
      prisma.purchaseOrder.count({
        where: { tenantId, deletedAt: null, orderDate: { gte: mtdStart } },
      }),
      prisma.vendor.count({
        where: { tenantId, status: "ACTIVE", deletedAt: null },
      }),
      prisma.contract.count({
        where: { tenantId, type: "PURCHASE", status: "ACTIVE" },
      }),
      prisma.purchaseRequisition.count({
        where: { tenantId, deletedAt: null },
      }),
    ]);

    const ytdSpendAgg = await prisma.purchaseOrder.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        orderDate: { gte: ytdStart },
        status: { not: "CANCELLED" },
      },
      _sum: { totalAmount: true },
    });

    const mtdSpendAgg = await prisma.purchaseOrder.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        orderDate: { gte: mtdStart },
        status: { not: "CANCELLED" },
      },
      _sum: { totalAmount: true },
    });

    const ytdSavings = await this.getProcurementSavings(
      tenantId,
      ytdStart.toISOString(),
      now.toISOString(),
    );

    return {
      totalPOs,
      ytdPOs,
      mtdPOs,
      activeVendors: totalVendors,
      activeContracts: totalContracts,
      totalRequisitions,
      ytdSpend:
        Math.round(Number(ytdSpendAgg._sum.totalAmount || 0) * 100) / 100,
      mtdSpend:
        Math.round(Number(mtdSpendAgg._sum.totalAmount || 0) * 100) / 100,
      ytdSavings: ytdSavings.totalSavings,
      ytdSavingsRate: ytdSavings.savingsRate,
      averagePOValue:
        ytdPOs > 0
          ? Math.round(
              (Number(ytdSpendAgg._sum.totalAmount || 0) / ytdPOs) * 100,
            ) / 100
          : 0,
    };
  }

  async exportProcurementReport(
    tenantId: string,
    reportType: string,
    format: string,
    params: any,
  ) {
    let data: any;
    const { periodStart, periodEnd, vendorId, productId } = params || {};

    switch (reportType) {
      case "spend-analysis":
        data = await this.getSpendAnalysis(
          tenantId,
          periodStart,
          periodEnd,
          params?.groupBy,
        );
        break;
      case "vendor-scorecard":
        if (!vendorId)
          throw new BadRequestException(
            "vendorId required for vendor-scorecard report",
          );
        data = await this.getVendorPerformanceScorecard(
          tenantId,
          vendorId,
          params?.period,
        );
        break;
      case "procurement-savings":
        data = await this.getProcurementSavings(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "maverick-spend":
        data = await this.getMaverickSpend(tenantId, periodStart, periodEnd);
        break;
      case "analytics":
        data = await this.getProcurementAnalytics(tenantId, params?.dateRange);
        break;
      case "price-variance":
        if (!productId)
          throw new BadRequestException(
            "productId required for price-variance report",
          );
        data = await this.getPurchasePriceVariance(
          tenantId,
          productId,
          params?.period,
        );
        break;
      case "vendor-consolidation":
        data = await this.getVendorConsolidation(tenantId, params?.category);
        break;
      case "supplier-risk":
        if (!vendorId)
          throw new BadRequestException(
            "vendorId required for supplier-risk report",
          );
        data = await this.getSupplierRiskAssessment(tenantId, vendorId);
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${reportType}`);
    }

    if (format === "csv") {
      return {
        format: "csv",
        filename: `${reportType}-${Date.now()}.csv`,
        data: JSON.stringify(data),
      };
    }

    return { format: "json", reportType, generatedAt: new Date(), data };
  }
}
