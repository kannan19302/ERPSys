import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class LaneRateService {
  async list(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      carrierId?: string;
      origin?: string;
      destination?: string;
      transportMode?: string;
    },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.LaneRateWhereInput = {
      tenantId,
      isActive: true,
      ...(opts.carrierId ? { carrierId: opts.carrierId } : {}),
      ...(opts.origin
        ? { origin: { contains: opts.origin, mode: "insensitive" } }
        : {}),
      ...(opts.destination
        ? { destination: { contains: opts.destination, mode: "insensitive" } }
        : {}),
      ...(opts.transportMode ? { transportMode: opts.transportMode } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.laneRate.findMany({
        where,
        orderBy: { baseRate: "asc" },
        skip,
        take: limit,
        include: { carrier: { select: { id: true, name: true } } },
      }),
      prisma.laneRate.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const rate = await prisma.laneRate.findFirst({
      where: { id, tenantId },
      include: { carrier: { select: { id: true, name: true } } },
    });
    if (!rate) throw new NotFoundException(`Lane rate not found: ${id}`);
    return rate;
  }

  async create(tenantId: string, dto: Prisma.LaneRateCreateInput) {
    return prisma.laneRate.create({ data: { ...dto, tenantId } });
  }

  async update(tenantId: string, id: string, dto: Prisma.LaneRateUpdateInput) {
    await this.getById(tenantId, id);
    return prisma.laneRate.update({ where: { id }, data: dto });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.laneRate.update({ where: { id }, data: { isActive: false } });
  }

  async findBestRate(
    tenantId: string,
    origin: string,
    destination: string,
    transportMode: string,
    weight?: number,
  ) {
    const rates = await prisma.laneRate.findMany({
      where: {
        tenantId,
        isActive: true,
        origin,
        destination,
        transportMode,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      include: { carrier: { select: { id: true, name: true } } },
      orderBy: { baseRate: "asc" },
    });
    if (rates.length === 0)
      throw new NotFoundException(
        "No active rates found for the specified lane",
      );
    const evaluated = rates.map((r) => {
      let totalCost = Number(r.baseRate);
      if (weight && r.ratePerKg) totalCost += weight * Number(r.ratePerKg);
      if (r.minCharge && totalCost < Number(r.minCharge))
        totalCost = Number(r.minCharge);
      return {
        ...r,
        totalCost,
        costBreakdown: {
          baseRate: Number(r.baseRate),
          ...(weight && r.ratePerKg
            ? { weightCharge: weight * Number(r.ratePerKg) }
            : {}),
          minChargeApplied: Boolean(
            r.minCharge && totalCost < Number(r.minCharge),
          ),
        },
      };
    });
    evaluated.sort((a, b) => a.totalCost - b.totalCost);
    return evaluated[0];
  }

  async getLaneAnalytics(tenantId: string) {
    const rates = await prisma.laneRate.findMany({
      where: { tenantId, isActive: true },
      include: { carrier: { select: { id: true, name: true } } },
    });
    const origins = [...new Set(rates.map((r) => r.origin))];
    const destinations = [...new Set(rates.map((r) => r.destination))];
    const uniqueLanes = [
      ...new Set(rates.map((r) => `${r.origin}->${r.destination}`)),
    ];
    const byMode = rates.reduce(
      (
        acc: Record<
          string,
          { count: number; avgBaseRate: number; carriers: Set<string> }
        >,
        r,
      ) => {
        if (!acc[r.transportMode])
          acc[r.transportMode] = {
            count: 0,
            avgBaseRate: 0,
            carriers: new Set(),
          };
        const mode = acc[r.transportMode]!;
        mode.count++;
        mode.avgBaseRate += Number(r.baseRate);
        mode.carriers.add(r.carrierId);
        return acc;
      },
      {},
    );
    Object.values(byMode).forEach((m) => {
      m.avgBaseRate =
        m.count > 0 ? Math.round((m.avgBaseRate / m.count) * 100) / 100 : 0;
      m.carriers = [...m.carriers] as any;
    });
    return {
      totalRates: rates.length,
      uniqueOrigins: origins.length,
      uniqueDestinations: destinations.length,
      uniqueLanes: uniqueLanes.length,
      carriers: [...new Set(rates.map((r) => r.carrierId))].length,
      byMode,
    };
  }
}
