// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class WorkingCapitalService {
  // ── Dynamic Discounting ────────────────────────────────────────────────────

  async createDiscountOffer(
    tenantId: string,
    _userId: string,
    dto: {
      invoiceId: string;
      customerId: string;
      discountPercent: number;
      discountDays: number;
      offerAmount: number;
    },
  ) {
    if (dto.discountPercent < 0 || dto.discountPercent > 100) {
      throw new BadRequestException(
        "Discount percent must be between 0 and 100",
      );
    }
    return prisma.dynamicDiscountOffer.create({
      data: {
        tenantId,
        invoiceId: dto.invoiceId,
        customerId: dto.customerId,
        discountPercent: new Prisma.Decimal(dto.discountPercent),
        discountDays: dto.discountDays,
        offerAmount: new Prisma.Decimal(dto.offerAmount),
        status: "PENDING",
      },
    });
  }

  async getDiscountOffers(
    tenantId: string,
    query: {
      status?: string;
      customerId?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.DynamicDiscountOfferWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const [items, total] = await Promise.all([
      prisma.dynamicDiscountOffer.findMany({
        where,
        orderBy: { offeredAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.dynamicDiscountOffer.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDiscountOffer(tenantId: string, id: string) {
    const offer = await prisma.dynamicDiscountOffer.findFirst({
      where: { id, tenantId },
    });
    if (!offer) throw new NotFoundException("Discount offer not found");
    return offer;
  }

  async respondToOffer(
    tenantId: string,
    id: string,
    dto: { action: "ACCEPT" | "DECLINE"; notes?: string },
  ) {
    const offer = await this.getDiscountOffer(tenantId, id);
    if (offer.status !== "PENDING") {
      throw new BadRequestException(`Offer is already ${offer.status}`);
    }
    return prisma.dynamicDiscountOffer.update({
      where: { id },
      data: {
        status: dto.action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        respondedAt: new Date(),
      },
    });
  }

  async settleDiscount(tenantId: string, id: string) {
    const offer = await this.getDiscountOffer(tenantId, id);
    if (offer.status !== "ACCEPTED") {
      throw new BadRequestException("Only accepted offers can be settled");
    }
    if (offer.settledAt) {
      throw new BadRequestException("Offer is already settled");
    }
    return prisma.dynamicDiscountOffer.update({
      where: { id },
      data: { settledAt: new Date() },
    });
  }

  async getDiscountStats(tenantId: string) {
    const [total, pending, accepted, settled, declined] = await Promise.all([
      prisma.dynamicDiscountOffer.count({ where: { tenantId } }),
      prisma.dynamicDiscountOffer.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.dynamicDiscountOffer.count({
        where: { tenantId, status: "ACCEPTED" },
      }),
      prisma.dynamicDiscountOffer.count({
        where: { tenantId, settledAt: { not: null } },
      }),
      prisma.dynamicDiscountOffer.count({
        where: { tenantId, status: "DECLINED" },
      }),
    ]);

    const acceptedOffers = await prisma.dynamicDiscountOffer.findMany({
      where: { tenantId, status: "ACCEPTED" },
      select: { offerAmount: true, discountPercent: true, discountDays: true },
    });
    const totalDiscountGiven = acceptedOffers.reduce(
      (s, o) => s + Number(o.offerAmount) * (Number(o.discountPercent) / 100),
      0,
    );

    return {
      total,
      pending,
      accepted,
      settled,
      declined,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      averageDiscountPercent:
        acceptedOffers.length > 0
          ? acceptedOffers.reduce((s, o) => s + Number(o.discountPercent), 0) /
            acceptedOffers.length
          : 0,
    };
  }

  // ── Supply Chain Finance ───────────────────────────────────────────────────

  async createProgram(
    tenantId: string,
    userId: string,
    dto: {
      name: string;
      programType: string;
      fundingLimit: number;
      interestRate: number;
      feeStructure?: Prisma.JsonValue;
      startDate: string;
      endDate?: string;
    },
  ) {
    return prisma.supplyChainFinanceProgram.create({
      data: {
        tenantId,
        name: dto.name,
        programType: dto.programType,
        fundingLimit: new Prisma.Decimal(dto.fundingLimit),
        interestRate: new Prisma.Decimal(dto.interestRate),
        feeStructure: dto.feeStructure || Prisma.JsonNull,
        status: "ACTIVE",
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        approvedBy: userId,
      },
    });
  }

  async getPrograms(
    tenantId: string,
    query: {
      status?: string;
      programType?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.SupplyChainFinanceProgramWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.programType) where.programType = query.programType;

    const [items, total] = await Promise.all([
      prisma.supplyChainFinanceProgram.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supplyChainFinanceProgram.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProgram(tenantId: string, id: string) {
    const program = await prisma.supplyChainFinanceProgram.findFirst({
      where: { id, tenantId },
    });
    if (!program) throw new NotFoundException("SCF program not found");
    return program;
  }

  async updateProgram(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      fundingLimit?: number;
      interestRate?: number;
      feeStructure?: Prisma.JsonValue;
      status?: string;
      endDate?: string;
    },
  ) {
    await this.getProgram(tenantId, id);
    const data: Prisma.SupplyChainFinanceProgramUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.fundingLimit !== undefined)
      data.fundingLimit = new Prisma.Decimal(dto.fundingLimit);
    if (dto.interestRate !== undefined)
      data.interestRate = new Prisma.Decimal(dto.interestRate);
    if (dto.feeStructure !== undefined)
      data.feeStructure = dto.feeStructure as any;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    return prisma.supplyChainFinanceProgram.update({ where: { id }, data });
  }

  async getProgramUtilization(tenantId: string, id: string) {
    const program = await this.getProgram(tenantId, id);
    const utilizationRate =
      Number(program.fundingLimit) > 0
        ? (Number(program.utilizedAmount) / Number(program.fundingLimit)) * 100
        : 0;
    const availableAmount =
      Number(program.fundingLimit) - Number(program.utilizedAmount);
    return {
      programId: id,
      programName: program.name,
      fundingLimit: Number(program.fundingLimit),
      utilizedAmount: Number(program.utilizedAmount),
      availableAmount,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      status: program.status,
      startDate: program.startDate,
      endDate: program.endDate,
    };
  }

  // ── Invoice Factoring ──────────────────────────────────────────────────────

  async createFacility(
    tenantId: string,
    dto: {
      facilityName: string;
      facilityLimit: number;
      advanceRate: number;
      discountRate: number;
      minInvoiceAmount?: number;
      maxInvoiceAmount?: number;
      recourseType: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    if (dto.advanceRate < 0 || dto.advanceRate > 100) {
      throw new BadRequestException("Advance rate must be between 0 and 100");
    }
    return prisma.invoiceFactoringFacility.create({
      data: {
        tenantId,
        facilityName: dto.facilityName,
        facilityLimit: new Prisma.Decimal(dto.facilityLimit),
        advanceRate: new Prisma.Decimal(dto.advanceRate),
        discountRate: new Prisma.Decimal(dto.discountRate),
        minInvoiceAmount: dto.minInvoiceAmount
          ? new Prisma.Decimal(dto.minInvoiceAmount)
          : null,
        maxInvoiceAmount: dto.maxInvoiceAmount
          ? new Prisma.Decimal(dto.maxInvoiceAmount)
          : null,
        recourseType: dto.recourseType,
        status: "ACTIVE",
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async getFacilities(
    tenantId: string,
    query: {
      status?: string;
      recourseType?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceFactoringFacilityWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.recourseType) where.recourseType = query.recourseType;

    const [items, total] = await Promise.all([
      prisma.invoiceFactoringFacility.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoiceFactoringFacility.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getFacility(tenantId: string, id: string) {
    const facility = await prisma.invoiceFactoringFacility.findFirst({
      where: { id, tenantId },
    });
    if (!facility) throw new NotFoundException("Factoring facility not found");
    return facility;
  }

  async advanceInvoice(
    tenantId: string,
    facilityId: string,
    dto: {
      invoiceId: string;
      invoiceAmount: number;
    },
  ) {
    const facility = await this.getFacility(tenantId, facilityId);
    if (facility.status !== "ACTIVE") {
      throw new BadRequestException("Facility is not active");
    }

    const advanceRate = Number(facility.advanceRate) / 100;
    const advanceAmount = dto.invoiceAmount * advanceRate;
    const feeAmount = dto.invoiceAmount * (Number(facility.discountRate) / 100);
    const netAdvance = advanceAmount - feeAmount;
    const newUtilized = Number(facility.utilizedAmount) + advanceAmount;

    if (newUtilized > Number(facility.facilityLimit)) {
      throw new BadRequestException("Advance would exceed facility limit");
    }

    const advance = await prisma.invoiceFactoringAdvance.create({
      data: {
        tenantId,
        facilityId,
        invoiceId: dto.invoiceId,
        invoiceAmount: new Prisma.Decimal(dto.invoiceAmount),
        advanceAmount: new Prisma.Decimal(advanceAmount),
        feeAmount: new Prisma.Decimal(feeAmount),
        netAdvance: new Prisma.Decimal(netAdvance),
        advanceRate: facility.advanceRate,
        status: "FUNDED",
        fundedAt: new Date(),
      },
    });

    await prisma.invoiceFactoringFacility.update({
      where: { id: facilityId },
      data: { utilizedAmount: new Prisma.Decimal(newUtilized) },
    });

    return advance;
  }

  async getAdvances(
    tenantId: string,
    query: {
      facilityId?: string;
      status?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceFactoringAdvanceWhereInput = { tenantId };
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.invoiceFactoringAdvance.findMany({
        where,
        orderBy: { fundedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoiceFactoringAdvance.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAdvance(tenantId: string, id: string) {
    const advance = await prisma.invoiceFactoringAdvance.findFirst({
      where: { id, tenantId },
    });
    if (!advance) throw new NotFoundException("Factoring advance not found");
    return advance;
  }

  async settleAdvance(tenantId: string, id: string) {
    const advance = await this.getAdvance(tenantId, id);
    if (advance.status !== "FUNDED") {
      throw new BadRequestException(`Advance is already ${advance.status}`);
    }

    const updated = await prisma.invoiceFactoringAdvance.update({
      where: { id },
      data: {
        status: "SETTLED",
        collectedAt: new Date(),
        settledAt: new Date(),
      },
    });

    const facility = await prisma.invoiceFactoringFacility.findFirst({
      where: { id: advance.facilityId, tenantId },
    });
    if (facility) {
      const newUtilized = Math.max(
        0,
        Number(facility.utilizedAmount) - Number(advance.advanceAmount),
      );
      await prisma.invoiceFactoringFacility.update({
        where: { id: advance.facilityId },
        data: { utilizedAmount: new Prisma.Decimal(newUtilized) },
      });
    }

    return updated;
  }

  async getFactoringStats(tenantId: string) {
    const [
      facilityCount,
      activeFacilities,
      totalAdvances,
      totalFunded,
      totalSettled,
    ] = await Promise.all([
      prisma.invoiceFactoringFacility.count({ where: { tenantId } }),
      prisma.invoiceFactoringFacility.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.invoiceFactoringAdvance.count({ where: { tenantId } }),
      prisma.invoiceFactoringAdvance.count({
        where: { tenantId, status: "FUNDED" },
      }),
      prisma.invoiceFactoringAdvance.count({
        where: { tenantId, status: "SETTLED" },
      }),
    ]);

    const sumResult = await prisma.invoiceFactoringAdvance.aggregate({
      where: { tenantId },
      _sum: { advanceAmount: true, feeAmount: true },
    });

    const facilities = await prisma.invoiceFactoringFacility.findMany({
      where: { tenantId },
      select: { facilityLimit: true, utilizedAmount: true },
    });
    const totalLimit = facilities.reduce(
      (s, f) => s + Number(f.facilityLimit),
      0,
    );
    const totalUtilized = facilities.reduce(
      (s, f) => s + Number(f.utilizedAmount),
      0,
    );

    return {
      totalFacilities: facilityCount,
      activeFacilities,
      totalAdvances,
      fundedAdvances: totalFunded,
      settledAdvances: totalSettled,
      totalAdvanceAmount: Number(sumResult._sum.advanceAmount || 0),
      totalFeeAmount: Number(sumResult._sum.feeAmount || 0),
      totalFacilityLimit: totalLimit,
      totalUtilizedAmount: totalUtilized,
      utilizationRate:
        totalLimit > 0
          ? Math.round((totalUtilized / totalLimit) * 10000) / 100
          : 0,
    };
  }
}
