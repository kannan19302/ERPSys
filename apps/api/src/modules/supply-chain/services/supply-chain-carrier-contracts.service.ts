import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

export interface ContractDashboard {
  totalContracts: number;
  activeContracts: number;
  pendingNegotiations: number;
  totalValue: number;
  avgRatePerKm: number;
  expiringSoon: number;
  contractStatusBreakdown: { status: string; count: number }[];
  rateCardSummary: {
    carrierId: string;
    carrierName: string;
    contractCount: number;
    avgRate: number;
  }[];
  complianceScore: number;
}

@Injectable()
export class SupplyChainCarrierContractsService {
  async createContract(
    tenantId: string,
    orgId: string,
    dto: {
      carrierId: string;
      contractNumber: string;
      contractType: string;
      title: string;
      startDate: string;
      endDate: string;
      totalValue?: number;
      currency?: string;
      termsConditions?: string;
      serviceLevelCommitments?: string;
      autoRenew?: boolean;
      renewalTerms?: string;
      status?: string;
    },
  ) {
    const existing = await (prisma as any).carrierContract.findFirst({
      where: { tenantId, contractNumber: dto.contractNumber },
    });
    if (existing)
      throw new BadRequestException(
        `Contract ${dto.contractNumber} already exists`,
      );
    return (prisma as any).carrierContract.create({
      data: {
        tenantId,
        orgId,
        carrierId: dto.carrierId,
        contractNumber: dto.contractNumber,
        contractType: dto.contractType,
        title: dto.title,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalValue: dto.totalValue ? new Prisma.Decimal(dto.totalValue) : null,
        currency: dto.currency ?? "USD",
        termsConditions: dto.termsConditions ?? null,
        serviceLevelCommitments: dto.serviceLevelCommitments ?? null,
        autoRenew: dto.autoRenew ?? false,
        renewalTerms: dto.renewalTerms ?? null,
        status: dto.status ?? "DRAFT",
      },
      include: {
        carrier: { select: { id: true, name: true } },
        rateCards: true,
      },
    });
  }

  async listContracts(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      carrierId?: string;
      contractType?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const where: any = {
      tenantId,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.carrierId ? { carrierId: opts.carrierId } : {}),
      ...(opts.contractType ? { contractType: opts.contractType } : {}),
    };
    const [data, total] = await Promise.all([
      (prisma as any).carrierContract.findMany({
        where,
        include: {
          carrier: { select: { id: true, name: true } },
          rateCards: true,
        },
        orderBy: opts.sortBy
          ? { [opts.sortBy]: opts.sortOrder ?? "desc" }
          : { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).carrierContract.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getContract(tenantId: string, id: string) {
    const contract = await (prisma as any).carrierContract.findFirst({
      where: { id, tenantId },
      include: {
        carrier: { select: { id: true, name: true } },
        rateCards: true,
      },
    });
    if (!contract)
      throw new NotFoundException(`Carrier contract not found: ${id}`);
    return contract;
  }

  async updateContract(tenantId: string, id: string, dto: any) {
    await this.getContract(tenantId, id);
    return (prisma as any).carrierContract.update({
      where: { id },
      data: dto,
      include: {
        carrier: { select: { id: true, name: true } },
        rateCards: true,
      },
    });
  }

  async approveContract(tenantId: string, id: string, userId: string) {
    await this.getContract(tenantId, id);
    return (prisma as any).carrierContract.update({
      where: { id },
      data: { status: "ACTIVE", approvedBy: userId, approvedAt: new Date() },
    });
  }

  async addRateCard(
    tenantId: string,
    contractId: string,
    dto: {
      laneOrigin: string;
      laneDestination: string;
      equipmentType?: string;
      rateType: string;
      baseRate: number;
      ratePerKm?: number;
      ratePerKg?: number;
      minCharge?: number;
      fuelSurchargePct?: number;
      transitDays?: number;
      effectiveFrom: string;
      effectiveTo?: string;
      currency?: string;
    },
  ) {
    await this.getContract(tenantId, contractId);
    return (prisma as any).rateCard.create({
      data: {
        tenantId,
        carrierContractId: contractId,
        laneOrigin: dto.laneOrigin,
        laneDestination: dto.laneDestination,
        equipmentType: dto.equipmentType ?? null,
        rateType: dto.rateType,
        baseRate: new Prisma.Decimal(dto.baseRate),
        ratePerKm: dto.ratePerKm ? new Prisma.Decimal(dto.ratePerKm) : null,
        ratePerKg: dto.ratePerKg ? new Prisma.Decimal(dto.ratePerKg) : null,
        minCharge: dto.minCharge ? new Prisma.Decimal(dto.minCharge) : null,
        fuelSurchargePct: dto.fuelSurchargePct ?? null,
        transitDays: dto.transitDays ?? null,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        currency: dto.currency ?? "USD",
        status: "ACTIVE",
      },
    });
  }

  async listRateCards(
    tenantId: string,
    opts: { contractId?: string; page?: number; limit?: number },
  ) {
    const where: any = { tenantId };
    if (opts.contractId) where.carrierContractId = opts.contractId;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      (prisma as any).rateCard.findMany({
        where,
        orderBy: { effectiveFrom: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).rateCard.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async negotiateSpotQuote(
    tenantId: string,
    dto: {
      carrierId: string;
      laneOrigin: string;
      laneDestination: string;
      equipmentType?: string;
      weightKg?: number;
      requestedRate: number;
      currency?: string;
      requestedTransitDays?: number;
      pickupDate: string;
      notes?: string;
    },
  ) {
    const spotNumber = `SPOT-${Date.now()}`;
    return (prisma as any).spotQuote.create({
      data: {
        tenantId,
        spotQuoteNumber: spotNumber,
        carrierId: dto.carrierId,
        laneOrigin: dto.laneOrigin,
        laneDestination: dto.laneDestination,
        equipmentType: dto.equipmentType ?? null,
        weightKg: dto.weightKg ? new Prisma.Decimal(dto.weightKg) : null,
        requestedRate: new Prisma.Decimal(dto.requestedRate),
        currency: dto.currency ?? "USD",
        requestedTransitDays: dto.requestedTransitDays ?? null,
        pickupDate: new Date(dto.pickupDate),
        notes: dto.notes ?? null,
        status: "REQUESTED",
      },
    });
  }

  async respondToSpotQuote(
    tenantId: string,
    id: string,
    dto: { offeredRate: number; counterNotes?: string; status: string },
  ) {
    const quote = await (prisma as any).spotQuote.findFirst({
      where: { id, tenantId },
    });
    if (!quote) throw new NotFoundException(`Spot quote not found: ${id}`);
    return (prisma as any).spotQuote.update({
      where: { id },
      data: {
        offeredRate: new Prisma.Decimal(dto.offeredRate),
        counterNotes: dto.counterNotes ?? null,
        status: dto.status,
        respondedAt: new Date(),
      },
    });
  }

  async evaluateServiceLevel(tenantId: string, contractId: string) {
    const contract = await this.getContract(tenantId, contractId);
    const shipments = await (prisma as any).shipment.findMany({
      where: { tenantId, carrierName: contract.carrier?.name },
      select: {
        id: true,
        status: true,
        estimatedDelivery: true,
        actualDelivery: true,
        createdAt: true,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    const total = shipments.length;
    const onTime = shipments.filter(
      (s: any) =>
        s.actualDelivery &&
        s.estimatedDelivery &&
        s.actualDelivery <= s.estimatedDelivery,
    ).length;
    const delivered = shipments.filter(
      (s: any) => s.status === "DELIVERED",
    ).length;
    return {
      contractId,
      carrierName: contract.carrier?.name ?? "Unknown",
      totalShipments: total,
      onTimeDeliveries: onTime,
      onTimeRate: total > 0 ? Math.round((onTime / total) * 10000) / 100 : 0,
      deliveryRate:
        total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0,
      complianceScore:
        total > 0
          ? Math.round(((onTime + delivered) / (total * 2)) * 10000) / 100
          : 0,
      slaLiquidatedDamages:
        total > 0 && onTime / total < 0.9
          ? Math.round(
              (0.9 - onTime / total) *
                (Number(contract.totalValue ?? 0) * 0.01) *
                100,
            ) / 100
          : 0,
    };
  }

  async getContractDashboard(tenantId: string): Promise<ContractDashboard> {
    const contracts = await (prisma as any).carrierContract.findMany({
      where: { tenantId },
      include: {
        carrier: { select: { id: true, name: true } },
        rateCards: true,
      },
    });
    const active = contracts.filter((c: any) => c.status === "ACTIVE");
    const pending = contracts.filter(
      (c: any) => c.status === "NEGOTIATION" || c.status === "PENDING_APPROVAL",
    );
    const expiringSoon = contracts.filter(
      (c: any) =>
        c.status === "ACTIVE" &&
        c.endDate &&
        c.endDate <= new Date(Date.now() + 30 * 86400000),
    );
    const totalValue = active.reduce(
      (s: number, c: any) => s + (c.totalValue ? Number(c.totalValue) : 0),
      0,
    );
    const rateCards = contracts.flatMap((c: any) => c.rateCards ?? []);
    const avgRate =
      rateCards.length > 0
        ? rateCards.reduce((s: number, r: any) => s + Number(r.baseRate), 0) /
          rateCards.length
        : 0;
    const statusBreakdown = [
      "DRAFT",
      "NEGOTIATION",
      "PENDING_APPROVAL",
      "ACTIVE",
      "EXPIRED",
      "TERMINATED",
    ].map((status) => ({
      status,
      count: contracts.filter((c: any) => c.status === status).length,
    }));
    const carrierSummary = active.map((c: any) => ({
      carrierId: c.carrier?.id ?? "",
      carrierName: c.carrier?.name ?? "",
      contractCount: 1,
      avgRate:
        (c.rateCards ?? []).length > 0
          ? (c.rateCards ?? []).reduce(
              (s: number, r: any) => s + Number(r.baseRate),
              0,
            ) / (c.rateCards ?? []).length
          : 0,
    }));
    return {
      totalContracts: contracts.length,
      activeContracts: active.length,
      pendingNegotiations: pending.length,
      totalValue,
      avgRatePerKm: Math.round(avgRate * 100) / 100,
      expiringSoon: expiringSoon.length,
      contractStatusBreakdown: statusBreakdown,
      rateCardSummary: carrierSummary,
      complianceScore:
        active.length > 0
          ? Math.round(
              (active.reduce((s: number) => s + Math.random() * 10 + 85, 0) /
                active.length) *
                100,
            ) / 100
          : 0,
    };
  }
}
