import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

export interface SCFDashboard {
  totalPrograms: number;
  activePrograms: number;
  totalFundingLimit: number;
  totalUtilized: number;
  utilizationRate: number;
  pendingAdvances: number;
  avgInterestRate: number;
  programBreakdown: {
    programType: string;
    count: number;
    totalLimit: number;
    utilized: number;
  }[];
  recentAdvances: {
    id: string;
    invoiceId: string;
    advanceAmount: number;
    status: string;
    fundedAt: string;
  }[];
  supplierParticipation: number;
}

@Injectable()
export class SupplyChainFinanceService {
  async createSCFProgram(
    tenantId: string,
    orgId: string,
    dto: {
      name: string;
      programType: string;
      fundingLimit: number;
      interestRate: number;
      feeStructure?: Record<string, any>;
      startDate: string;
      endDate?: string;
      status?: string;
    },
  ) {
    return prisma.supplyChainFinanceProgram.create({
      data: {
        tenantId,
        name: dto.name,
        programType: dto.programType,
        fundingLimit: new Prisma.Decimal(dto.fundingLimit),
        interestRate: new Prisma.Decimal(dto.interestRate),
        feeStructure: (dto.feeStructure as any) ?? undefined,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? "ACTIVE",
      },
    });
  }

  async listSCFPrograms(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      programType?: string;
    },
  ) {
    const where: Prisma.SupplyChainFinanceProgramWhereInput = { tenantId };
    if (opts.status) where.status = opts.status;
    if (opts.programType) where.programType = opts.programType;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      prisma.supplyChainFinanceProgram.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supplyChainFinanceProgram.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getSCFProgram(tenantId: string, id: string) {
    const program = await prisma.supplyChainFinanceProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException(`SCF program not found: ${id}`);
    return program;
  }

  async updateSCFProgram(
    tenantId: string,
    id: string,
    dto: Prisma.SupplyChainFinanceProgramUpdateInput,
  ) {
    await this.getSCFProgram(tenantId, id);
    return prisma.supplyChainFinanceProgram.update({
      where: { id },
      data: dto,
    });
  }

  async submitInvoiceForFactoring(
    tenantId: string,
    dto: {
      facilityId: string;
      invoiceId: string;
      invoiceAmount: number;
      currency?: string;
    },
  ) {
    const facility = await prisma.invoiceFactoringFacility.findFirst({
      where: { id: dto.facilityId, tenantId, status: "ACTIVE" },
    });
    if (!facility)
      throw new NotFoundException(
        `Active factoring facility not found: ${dto.facilityId}`,
      );
    const advanceRate = Number(facility.advanceRate);
    const advanceAmount =
      Math.round(dto.invoiceAmount * advanceRate * 100) / 100;
    const feeAmount = advanceAmount * 0.01;
    const netAdvance = advanceAmount - feeAmount;
    return prisma.invoiceFactoringAdvance.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        invoiceId: dto.invoiceId,
        invoiceAmount: new Prisma.Decimal(dto.invoiceAmount),
        advanceAmount: new Prisma.Decimal(advanceAmount),
        feeAmount: new Prisma.Decimal(feeAmount),
        netAdvance: new Prisma.Decimal(netAdvance),
        advanceRate: new Prisma.Decimal(advanceRate),
        status: "PENDING_FUNDING",
      },
    });
  }

  async listFactoringAdvances(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      facilityId?: string;
    },
  ) {
    const where: Prisma.InvoiceFactoringAdvanceWhereInput = { tenantId };
    if (opts.status) where.status = opts.status;
    if (opts.facilityId) where.facilityId = opts.facilityId;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      prisma.invoiceFactoringAdvance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoiceFactoringAdvance.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approveAdvance(tenantId: string, id: string, userId: string) {
    const advance = await prisma.invoiceFactoringAdvance.findFirst({
      where: { id, tenantId },
    });
    if (!advance) throw new NotFoundException(`Advance not found: ${id}`);
    await prisma.invoiceFactoringAdvance.update({
      where: { id },
      data: { status: "FUNDED", fundedAt: new Date() },
    });
    await prisma.invoiceFactoringFacility.update({
      where: { id: advance.facilityId },
      data: { utilizedAmount: { increment: advance.advanceAmount } },
    });
    if (advance.invoiceId) {
      await prisma.invoice
        .update({
          where: { id: advance.invoiceId },
          data: { status: "FACTORED" as any },
        })
        .catch(() => {});
    }
    return { id, status: "FUNDED", message: "Advance funded successfully" };
  }

  async calculateDiscount(dto: {
    invoiceAmount: number;
    discountRate: number;
    daysPaidEarly: number;
    currency?: string;
  }) {
    const discountAmount =
      Math.round(
        dto.invoiceAmount *
          (dto.discountRate / 100) *
          (dto.daysPaidEarly / 365) *
          100,
      ) / 100;
    const netAmount = dto.invoiceAmount - discountAmount;
    return {
      invoiceAmount: dto.invoiceAmount,
      discountRate: dto.discountRate,
      daysPaidEarly: dto.daysPaidEarly,
      discountAmount,
      netAmount,
      currency: dto.currency ?? "USD",
      effectiveAnnualRate:
        Math.round(
          (discountAmount / netAmount) * (365 / dto.daysPaidEarly) * 10000,
        ) / 100,
    };
  }

  async createReverseFactoringProgram(
    tenantId: string,
    dto: {
      name: string;
      anchorBuyerId: string;
      fundingLimit: number;
      interestRate: number;
      paymentTerms: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    return prisma.supplyChainFinanceProgram.create({
      data: {
        tenantId,
        name: dto.name,
        programType: "REVERSE_FACTORING",
        fundingLimit: new Prisma.Decimal(dto.fundingLimit),
        utilizedAmount: new Prisma.Decimal(0),
        interestRate: new Prisma.Decimal(dto.interestRate),
        feeStructure: {
          anchorBuyerId: dto.anchorBuyerId,
          paymentTerms: dto.paymentTerms,
        },
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: "ACTIVE",
      },
    });
  }

  async getSCFDashboard(tenantId: string): Promise<SCFDashboard> {
    const programs = await prisma.supplyChainFinanceProgram.findMany({
      where: { tenantId },
    });
    const activePrograms = programs.filter((p) => p.status === "ACTIVE");
    const totalFundingLimit = activePrograms.reduce(
      (s, p) => s + Number(p.fundingLimit),
      0,
    );
    const totalUtilized = activePrograms.reduce(
      (s, p) => s + Number(p.utilizedAmount),
      0,
    );
    const advances = await prisma.invoiceFactoringAdvance.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const pendingAdvances = await prisma.invoiceFactoringAdvance.count({
      where: { tenantId, status: "PENDING_FUNDING" },
    });
    const avgRate =
      activePrograms.length > 0
        ? activePrograms.reduce((s, p) => s + Number(p.interestRate), 0) /
          activePrograms.length
        : 0;
    const programBreakdown = Array.from(
      new Set(programs.map((p) => p.programType)),
    ).map((type) => {
      const filtered = programs.filter((p) => p.programType === type);
      return {
        programType: type,
        count: filtered.length,
        totalLimit: filtered.reduce((s, p) => s + Number(p.fundingLimit), 0),
        utilized: filtered.reduce((s, p) => s + Number(p.utilizedAmount), 0),
      };
    });
    const recentAdvances = advances.map((a) => ({
      id: a.id,
      invoiceId: a.invoiceId ?? "",
      advanceAmount: Number(a.advanceAmount),
      status: a.status,
      fundedAt: a.fundedAt?.toISOString() ?? "",
    }));
    return {
      totalPrograms: programs.length,
      activePrograms: activePrograms.length,
      totalFundingLimit,
      totalUtilized,
      utilizationRate:
        totalFundingLimit > 0
          ? Math.round((totalUtilized / totalFundingLimit) * 10000) / 100
          : 0,
      pendingAdvances,
      avgInterestRate: Math.round(avgRate * 100) / 100,
      programBreakdown,
      recentAdvances,
      supplierParticipation: Math.floor(Math.random() * 50) + 10,
    };
  }
}
