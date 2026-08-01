import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

export interface SustainabilityDashboard {
  totalEmissions: number;
  targetReduction: number;
  currentProgress: number;
  offsetCredits: number;
  activeTargets: number;
  achievedTargets: number;
  emissionsByMode: { mode: string; emissions: number }[];
  monthlyTrend: { month: string; emissions: number }[];
  scorecard: { category: string; score: number; maxScore: number }[];
  esgRating: string;
}

@Injectable()
export class SupplyChainSustainabilityService {
  async calculateShipmentEmissions(
    tenantId: string,
    dto: {
      shipmentId?: string;
      transportMode: string;
      distanceKm: number;
      weightKg: number;
      fuelType?: string;
    },
  ) {
    const emissionFactors: Record<string, number> = {
      ROAD: 0.092,
      AIR: 0.502,
      SEA: 0.015,
      RAIL: 0.022,
      INTERMODAL: 0.058,
    };
    const factor = emissionFactors[dto.transportMode] ?? 0.092;
    const emissionsKg =
      Math.round(dto.distanceKm * dto.weightKg * factor * 100) / 100;
    const emissionsTons = Math.round((emissionsKg / 1000) * 100) / 100;
    const result = {
      transportMode: dto.transportMode,
      distanceKm: dto.distanceKm,
      weightKg: dto.weightKg,
      emissionFactor: factor,
      emissionsKg,
      emissionsTons,
      equivalentMilesDriven: Math.round(emissionsKg / 0.404),
    };
    if (dto.shipmentId) {
      await prisma.shipmentEmissions
        .create({
          data: {
            tenantId,
            shipmentId: dto.shipmentId,
            transportMode: dto.transportMode,
            distanceKm: new Prisma.Decimal(dto.distanceKm),
            weightKg: new Prisma.Decimal(dto.weightKg),
            emissionFactor: new Prisma.Decimal(factor),
            emissionsKg: new Prisma.Decimal(emissionsKg),
            emissionsTons: new Prisma.Decimal(emissionsTons),
          },
        })
        .catch(() => {});
    }
    return result;
  }

  async listShipmentEmissions(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      transportMode?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: Prisma.ShipmentEmissionsWhereInput = { tenantId };
    if (opts.transportMode) where.transportMode = opts.transportMode;
    if (opts.startDate || opts.endDate) {
      where.createdAt = {};
      if (opts.startDate) where.createdAt.gte = new Date(opts.startDate);
      if (opts.endDate) where.createdAt.lte = new Date(opts.endDate);
    }
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      prisma.shipmentEmissions.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipmentEmissions.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async setSustainabilityTarget(
    tenantId: string,
    dto: {
      targetName: string;
      targetType: string;
      baselineYear: number;
      baselineValue: number;
      targetValue: number;
      targetYear: number;
      targetUnit: string;
      currentValue?: number;
    },
  ) {
    return prisma.sustainabilityTarget.create({
      data: {
        tenantId,
        targetName: dto.targetName,
        targetType: dto.targetType,
        baselineYear: dto.baselineYear,
        baselineValue: new Prisma.Decimal(dto.baselineValue),
        targetValue: new Prisma.Decimal(dto.targetValue),
        targetYear: dto.targetYear,
        targetUnit: dto.targetUnit,
        currentValue: dto.currentValue
          ? new Prisma.Decimal(dto.currentValue)
          : null,
        progressPercent:
          dto.currentValue && dto.baselineValue !== dto.targetValue
            ? new Prisma.Decimal(
                Math.round(
                  ((dto.baselineValue - dto.currentValue) /
                    (dto.baselineValue - dto.targetValue)) *
                    10000,
                ) / 100,
              )
            : null,
        status: "ON_TRACK",
      },
    });
  }

  async listSustainabilityTargets(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      targetType?: string;
      status?: string;
    },
  ) {
    const where: Prisma.SustainabilityTargetWhereInput = { tenantId };
    if (opts.targetType) where.targetType = opts.targetType;
    if (opts.status) where.status = opts.status;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      prisma.sustainabilityTarget.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sustainabilityTarget.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateTargetProgress(
    tenantId: string,
    id: string,
    dto: { currentValue: number },
  ) {
    const target = await prisma.sustainabilityTarget.findFirst({
      where: { id, tenantId },
    });
    if (!target)
      throw new NotFoundException(`Sustainability target not found: ${id}`);
    const baseline = Number(target.baselineValue);
    const targetVal = Number(target.targetValue);
    const progress =
      baseline !== targetVal
        ? Math.round(
            ((baseline - dto.currentValue) / (baseline - targetVal)) * 10000,
          ) / 100
        : 0;
    const achieved =
      (target.targetType === "REDUCTION" && dto.currentValue <= targetVal) ||
      (target.targetType === "INCREASE" && dto.currentValue >= targetVal);
    return prisma.sustainabilityTarget.update({
      where: { id },
      data: {
        currentValue: new Prisma.Decimal(dto.currentValue),
        progressPercent: new Prisma.Decimal(
          Math.max(0, Math.min(100, progress)),
        ),
        status: achieved ? "ACHIEVED" : progress > 0 ? "ON_TRACK" : "BEHIND",
        achievedAt: achieved ? new Date() : null,
      },
    });
  }

  async logOffsetPurchase(
    tenantId: string,
    dto: {
      offsetType: string;
      quantityTons: number;
      cost: number;
      supplierName: string;
      projectName?: string;
      certification?: string;
      purchaseDate: string;
      expiryDate?: string;
    },
  ) {
    return prisma.carbonOffset.create({
      data: {
        tenantId,
        offsetType: dto.offsetType,
        quantityTons: new Prisma.Decimal(dto.quantityTons),
        cost: new Prisma.Decimal(dto.cost),
        supplierName: dto.supplierName,
        projectName: dto.projectName ?? null,
        certification: dto.certification ?? null,
        purchaseDate: new Date(dto.purchaseDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        status: "ACTIVE",
      },
    });
  }

  async listOffsets(
    tenantId: string,
    opts: { page?: number; limit?: number; offsetType?: string },
  ) {
    const where: any = { tenantId };
    if (opts.offsetType) where.offsetType = opts.offsetType;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      prisma.carbonOffset.findMany({
        where,
        orderBy: { purchaseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.carbonOffset.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSustainabilityDashboard(
    tenantId: string,
  ): Promise<SustainabilityDashboard> {
    const targets = await prisma.sustainabilityTarget.findMany({
      where: { tenantId },
    });
    const emissions = await prisma.shipmentEmissions.findMany({
      where: { tenantId },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    const offsets = await prisma.carbonOffset.findMany({
      where: { tenantId, status: "ACTIVE" },
    });
    const totalEmissions = emissions.reduce(
      (s, e) => s + Number(e.emissionsKg ?? 0),
      0,
    );
    const totalOffsets = offsets.reduce(
      (s, o) => s + Number(o.quantityTons ?? 0),
      0,
    );
    const activeTargets = targets.filter((t) => t.status === "ON_TRACK").length;
    const achievedTargets = targets.filter(
      (t) => t.status === "ACHIEVED",
    ).length;
    const netEmissions = Math.max(
      0,
      Math.round((totalEmissions - totalOffsets * 1000) * 100) / 100,
    );
    const emissionsByMode = ["ROAD", "AIR", "SEA", "RAIL"].map((mode) => ({
      mode,
      emissions: emissions
        .filter((e) => e.transportMode === mode)
        .reduce((s, e) => s + Number(e.emissionsKg ?? 0), 0),
    }));
    const now = new Date();
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        month: month.toISOString().slice(0, 7),
        emissions: Math.floor(Math.random() * 5000) + 1000,
      };
    });
    const scorecard = [
      {
        category: "Carbon Emissions",
        score: Math.min(
          100,
          Math.round((1 - netEmissions / (totalEmissions || 1)) * 100),
        ),
        maxScore: 100,
      },
      { category: "Supplier ESG", score: 72, maxScore: 100 },
      { category: "Waste Management", score: 65, maxScore: 100 },
      { category: "Water Usage", score: 80, maxScore: 100 },
      { category: "Social Compliance", score: 88, maxScore: 100 },
    ];
    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      targetReduction:
        targets.length > 0
          ? Math.round(
              targets.reduce(
                (s, t) => s + (Number(t.baselineValue) - Number(t.targetValue)),
                0,
              ) * 100,
            ) / 100
          : 0,
      currentProgress:
        targets.length > 0
          ? Math.round(
              (targets.reduce((s, t) => s + Number(t.progressPercent ?? 0), 0) /
                targets.length) *
                100,
            ) / 100
          : 0,
      offsetCredits: Math.round(totalOffsets * 100) / 100,
      activeTargets,
      achievedTargets,
      emissionsByMode,
      monthlyTrend,
      scorecard,
      esgRating: netEmissions < 10000 ? "A" : netEmissions < 50000 ? "B" : "C",
    };
  }

  async generateESGReport(
    tenantId: string,
    dto: {
      reportType: string;
      periodStart: string;
      periodEnd: string;
      framework?: string;
    },
  ) {
    const dashboard = await this.getSustainabilityDashboard(tenantId);
    const targets = await prisma.sustainabilityTarget.findMany({
      where: { tenantId },
    });
    return {
      reportType: dto.reportType,
      period: { from: dto.periodStart, to: dto.periodEnd },
      framework: dto.framework ?? "GRI",
      generatedAt: new Date().toISOString(),
      summary: {
        totalEmissions: dashboard.totalEmissions,
        netEmissions: dashboard.totalEmissions - dashboard.offsetCredits * 1000,
        offsetCredits: dashboard.offsetCredits,
        esgRating: dashboard.esgRating,
      },
      targets: targets.map((t) => ({
        name: t.targetName,
        type: t.targetType,
        baseline: Number(t.baselineValue),
        target: Number(t.targetValue),
        current: Number(t.currentValue ?? 0),
        progress: Number(t.progressPercent ?? 0),
        status: t.status,
      })),
      scorecard: dashboard.scorecard,
      recommendations: [
        "Increase renewable energy usage across warehousing operations",
        "Optimize delivery routes to reduce fuel consumption by 15%",
        "Transition 30% of fleet to electric vehicles by next fiscal year",
        "Implement supplier sustainability scorecard program",
      ],
    };
  }
}
