import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class RiskManagementService {
  // ── Credit Scorecards ──────────────────────────────────────────────────────

  async createScorecard(
    tenantId: string,
    dto: {
      name: string;
      scoreRangeMin: number;
      scoreRangeMax: number;
      weightPaymentHistory: number;
      weightCreditUtilization: number;
      weightInvoiceAging: number;
      weightOrderFrequency: number;
      weightCompanyHealth: number;
      riskRatingLow: string;
      riskRatingMedium: string;
      riskRatingHigh: string;
      riskRatingCritical: string;
    },
  ) {
    const totalWeight =
      dto.weightPaymentHistory +
      dto.weightCreditUtilization +
      dto.weightInvoiceAging +
      dto.weightOrderFrequency +
      dto.weightCompanyHealth;
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException(
        `Weights must sum to 100 (got ${totalWeight})`,
      );
    }
    return prisma.customerCreditScorecard.create({
      data: {
        tenantId,
        name: dto.name,
        scoreRangeMin: dto.scoreRangeMin,
        scoreRangeMax: dto.scoreRangeMax,
        weightPaymentHistory: new Prisma.Decimal(dto.weightPaymentHistory),
        weightCreditUtilization: new Prisma.Decimal(
          dto.weightCreditUtilization,
        ),
        weightInvoiceAging: new Prisma.Decimal(dto.weightInvoiceAging),
        weightOrderFrequency: new Prisma.Decimal(dto.weightOrderFrequency),
        weightCompanyHealth: new Prisma.Decimal(dto.weightCompanyHealth),
        riskRatingLow: dto.riskRatingLow,
        riskRatingMedium: dto.riskRatingMedium,
        riskRatingHigh: dto.riskRatingHigh,
        riskRatingCritical: dto.riskRatingCritical,
        isActive: true,
      },
    });
  }

  async listScorecards(tenantId: string, isActive?: boolean) {
    const where: Prisma.CustomerCreditScorecardWhereInput = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.customerCreditScorecard.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getScorecard(tenantId: string, id: string) {
    const card = await prisma.customerCreditScorecard.findFirst({
      where: { id, tenantId },
    });
    if (!card) throw new NotFoundException("Credit scorecard not found");
    return card;
  }

  async updateScorecard(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      scoreRangeMin?: number;
      scoreRangeMax?: number;
      weightPaymentHistory?: number;
      weightCreditUtilization?: number;
      weightInvoiceAging?: number;
      weightOrderFrequency?: number;
      weightCompanyHealth?: number;
      riskRatingLow?: string;
      riskRatingMedium?: string;
      riskRatingHigh?: string;
      riskRatingCritical?: string;
      isActive?: boolean;
    },
  ) {
    await this.getScorecard(tenantId, id);
    const data: Prisma.CustomerCreditScorecardUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.scoreRangeMin !== undefined) data.scoreRangeMin = dto.scoreRangeMin;
    if (dto.scoreRangeMax !== undefined) data.scoreRangeMax = dto.scoreRangeMax;
    if (dto.weightPaymentHistory !== undefined)
      data.weightPaymentHistory = new Prisma.Decimal(dto.weightPaymentHistory);
    if (dto.weightCreditUtilization !== undefined)
      data.weightCreditUtilization = new Prisma.Decimal(
        dto.weightCreditUtilization,
      );
    if (dto.weightInvoiceAging !== undefined)
      data.weightInvoiceAging = new Prisma.Decimal(dto.weightInvoiceAging);
    if (dto.weightOrderFrequency !== undefined)
      data.weightOrderFrequency = new Prisma.Decimal(dto.weightOrderFrequency);
    if (dto.weightCompanyHealth !== undefined)
      data.weightCompanyHealth = new Prisma.Decimal(dto.weightCompanyHealth);
    if (dto.riskRatingLow !== undefined) data.riskRatingLow = dto.riskRatingLow;
    if (dto.riskRatingMedium !== undefined)
      data.riskRatingMedium = dto.riskRatingMedium;
    if (dto.riskRatingHigh !== undefined)
      data.riskRatingHigh = dto.riskRatingHigh;
    if (dto.riskRatingCritical !== undefined)
      data.riskRatingCritical = dto.riskRatingCritical;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.customerCreditScorecard.update({ where: { id }, data });
  }

  async deleteScorecard(tenantId: string, id: string) {
    await this.getScorecard(tenantId, id);
    await prisma.customerCreditScorecard.delete({ where: { id } });
    return { success: true };
  }

  async setDefaultScorecard(tenantId: string, id: string) {
    await this.getScorecard(tenantId, id);
    await prisma.customerCreditScorecard.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
    return prisma.customerCreditScorecard.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async computeScore(tenantId: string, scorecardId: string) {
    const card = await this.getScorecard(tenantId, scorecardId);
    if (!card.isActive)
      throw new BadRequestException("Scorecard is not active");

    const customers = await prisma.customer.findMany({ where: { tenantId } });
    const scores: Array<{
      customerId: string;
      overallScore: number;
      riskRating: string;
      paymentScore: number;
      utilizationScore: number;
      agingScore: number;
      frequencyScore: number;
      healthScore: number;
    }> = [];

    for (const customer of customers) {
      const invoices = await prisma.invoice.findMany({
        where: { tenantId, customerId: customer.id },
        select: {
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          createdAt: true,
          status: true,
        },
      });

      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter((i) => i.status === "PAID").length;
      const paymentScore =
        totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 50;

      const totalBilled = invoices.reduce(
        (s, i) => s + Number(i.totalAmount),
        0,
      );
      const totalPaid = invoices.reduce(
        (s, i) => s + Number(i.paidAmount || 0),
        0,
      );
      const utilizationScore =
        totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 50;

      const overdueInvoices = invoices.filter(
        (i) =>
          i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "PAID",
      ).length;
      const agingScore =
        totalInvoices > 0
          ? ((totalInvoices - overdueInvoices) / totalInvoices) * 100
          : 50;

      const orderFrequency = totalInvoices;
      const frequencyScore = Math.min(orderFrequency * 10, 100);

      const healthScore =
        (paymentScore + utilizationScore + agingScore + frequencyScore) / 4;

      const overallScore =
        Number(card.weightPaymentHistory) * (paymentScore / 100) +
        Number(card.weightCreditUtilization) * (utilizationScore / 100) +
        Number(card.weightInvoiceAging) * (agingScore / 100) +
        Number(card.weightOrderFrequency) * (frequencyScore / 100) +
        Number(card.weightCompanyHealth) * (healthScore / 100);

      const normalizedScore = Math.round(
        card.scoreRangeMin +
          (overallScore / 100) * (card.scoreRangeMax - card.scoreRangeMin),
      );

      let riskRating: string;
      const range = card.scoreRangeMax - card.scoreRangeMin;
      const quartile =
        range > 0 ? (normalizedScore - card.scoreRangeMin) / range : 0;
      if (quartile >= 0.75) riskRating = card.riskRatingLow;
      else if (quartile >= 0.5) riskRating = card.riskRatingMedium;
      else if (quartile >= 0.25) riskRating = card.riskRatingHigh;
      else riskRating = card.riskRatingCritical;

      await prisma.customerCreditScore.create({
        data: {
          tenantId,
          customerId: customer.id,
          scorecardId,
          overallScore: normalizedScore,
          riskRating,
          paymentScore: new Prisma.Decimal(paymentScore),
          utilizationScore: new Prisma.Decimal(utilizationScore),
          agingScore: new Prisma.Decimal(agingScore),
          frequencyScore: new Prisma.Decimal(frequencyScore),
          healthScore: new Prisma.Decimal(healthScore),
          scoredAt: new Date(),
        },
      });

      scores.push({
        customerId: customer.id,
        overallScore: normalizedScore,
        riskRating,
        paymentScore,
        utilizationScore,
        agingScore,
        frequencyScore,
        healthScore,
      });
    }

    return {
      scorecardId,
      scorecardName: card.name,
      customersScored: scores.length,
      scores,
    };
  }

  // ── Customer Credit Scores ─────────────────────────────────────────────────

  async computeScoreForCustomer(
    tenantId: string,
    customerId: string,
    scorecardId?: string,
  ) {
    const cardId =
      scorecardId ||
      (
        await prisma.customerCreditScorecard.findFirst({
          where: { tenantId, isDefault: true, isActive: true },
        })
      )?.id;
    if (!cardId) throw new NotFoundException("No active scorecard found");

    const card = await this.getScorecard(tenantId, cardId);
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, customerId },
      select: {
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        status: true,
      },
    });

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === "PAID").length;
    const paymentScore =
      totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 50;

    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = invoices.reduce(
      (s, i) => s + Number(i.paidAmount || 0),
      0,
    );
    const utilizationScore =
      totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 50;

    const overdueInvoices = invoices.filter(
      (i) =>
        i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "PAID",
    ).length;
    const agingScore =
      totalInvoices > 0
        ? ((totalInvoices - overdueInvoices) / totalInvoices) * 100
        : 50;

    const frequencyScore = Math.min(totalInvoices * 10, 100);
    const healthScore =
      (paymentScore + utilizationScore + agingScore + frequencyScore) / 4;

    const overallScore =
      Number(card.weightPaymentHistory) * (paymentScore / 100) +
      Number(card.weightCreditUtilization) * (utilizationScore / 100) +
      Number(card.weightInvoiceAging) * (agingScore / 100) +
      Number(card.weightOrderFrequency) * (frequencyScore / 100) +
      Number(card.weightCompanyHealth) * (healthScore / 100);

    const normalizedScore = Math.round(
      card.scoreRangeMin +
        (overallScore / 100) * (card.scoreRangeMax - card.scoreRangeMin),
    );

    const range = card.scoreRangeMax - card.scoreRangeMin;
    const quartile =
      range > 0 ? (normalizedScore - card.scoreRangeMin) / range : 0;
    let riskRating: string;
    if (quartile >= 0.75) riskRating = card.riskRatingLow;
    else if (quartile >= 0.5) riskRating = card.riskRatingMedium;
    else if (quartile >= 0.25) riskRating = card.riskRatingHigh;
    else riskRating = card.riskRatingCritical;

    return prisma.customerCreditScore.create({
      data: {
        tenantId,
        customerId,
        scorecardId: cardId,
        overallScore: normalizedScore,
        riskRating,
        paymentScore: new Prisma.Decimal(paymentScore),
        utilizationScore: new Prisma.Decimal(utilizationScore),
        agingScore: new Prisma.Decimal(agingScore),
        frequencyScore: new Prisma.Decimal(frequencyScore),
        healthScore: new Prisma.Decimal(healthScore),
        scoredAt: new Date(),
      },
    });
  }

  async listCustomerScores(
    tenantId: string,
    query: {
      customerId?: string;
      riskRating?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerCreditScoreWhereInput = { tenantId };
    if (query.customerId) where.customerId = query.customerId;
    if (query.riskRating) where.riskRating = query.riskRating;

    const [items, total] = await Promise.all([
      prisma.customerCreditScore.findMany({
        where,
        orderBy: { scoredAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customerCreditScore.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCustomerScore(tenantId: string, id: string) {
    const score = await prisma.customerCreditScore.findFirst({
      where: { id, tenantId },
    });
    if (!score) throw new NotFoundException("Customer credit score not found");
    return score;
  }

  // ── Vendor Risk Assessments ────────────────────────────────────────────────

  async createVendorAssessment(
    tenantId: string,
    dto: {
      vendorId: string;
      assessmentType: string;
      riskScore: number;
      riskRating: string;
      assessmentData?: Prisma.JsonValue;
      assessorId?: string;
      nextReviewAt?: string;
    },
  ) {
    return prisma.vendorRiskAssessment.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        assessmentType: dto.assessmentType,
        riskScore: new Prisma.Decimal(dto.riskScore),
        riskRating: dto.riskRating,
        assessmentData: dto.assessmentData || Prisma.JsonNull,
        assessorId: dto.assessorId || null,
        nextReviewAt: dto.nextReviewAt ? new Date(dto.nextReviewAt) : null,
      },
    });
  }

  async listVendorAssessments(
    tenantId: string,
    query: {
      vendorId?: string;
      riskRating?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.VendorRiskAssessmentWhereInput = { tenantId };
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.riskRating) where.riskRating = query.riskRating;

    const [items, total] = await Promise.all([
      prisma.vendorRiskAssessment.findMany({
        where,
        orderBy: { assessedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.vendorRiskAssessment.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getVendorAssessmentsByVendor(tenantId: string, vendorId: string) {
    return prisma.vendorRiskAssessment.findMany({
      where: { tenantId, vendorId },
      orderBy: { assessedAt: "desc" },
    });
  }

  // ── Market Risk Exposures ──────────────────────────────────────────────────

  async createMarketExposure(
    tenantId: string,
    dto: {
      riskType: string;
      exposureAmount: number;
      currency: string;
      instrumentType?: string;
      counterparty?: string;
      maturityDate?: string;
      hedgingStrategy?: string;
      fairValue?: number;
    },
  ) {
    return prisma.marketRiskExposure.create({
      data: {
        tenantId,
        riskType: dto.riskType,
        exposureAmount: new Prisma.Decimal(dto.exposureAmount),
        currency: dto.currency,
        instrumentType: dto.instrumentType || null,
        counterparty: dto.counterparty || null,
        maturityDate: dto.maturityDate ? new Date(dto.maturityDate) : null,
        hedgingStrategy: dto.hedgingStrategy || null,
        fairValue:
          dto.fairValue !== undefined
            ? new Prisma.Decimal(dto.fairValue)
            : null,
        valuationDate: new Date(),
        status: "ACTIVE",
      },
    });
  }

  async listMarketExposures(
    tenantId: string,
    query: {
      riskType?: string;
      status?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.MarketRiskExposureWhereInput = { tenantId };
    if (query.riskType) where.riskType = query.riskType;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.marketRiskExposure.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.marketRiskExposure.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMarketExposure(tenantId: string, id: string) {
    const exposure = await prisma.marketRiskExposure.findFirst({
      where: { id, tenantId },
    });
    if (!exposure)
      throw new NotFoundException("Market risk exposure not found");
    return exposure;
  }

  async updateMarketExposure(
    tenantId: string,
    id: string,
    dto: {
      exposureAmount?: number;
      fairValue?: number;
      hedgingStrategy?: string;
      status?: string;
    },
  ) {
    await this.getMarketExposure(tenantId, id);
    const data: Prisma.MarketRiskExposureUpdateInput = {};
    if (dto.exposureAmount !== undefined)
      data.exposureAmount = new Prisma.Decimal(dto.exposureAmount);
    if (dto.fairValue !== undefined)
      data.fairValue = new Prisma.Decimal(dto.fairValue);
    if (dto.hedgingStrategy !== undefined)
      data.hedgingStrategy = dto.hedgingStrategy;
    if (dto.status !== undefined) data.status = dto.status;
    return prisma.marketRiskExposure.update({ where: { id }, data });
  }

  async hedgeExposure(
    tenantId: string,
    id: string,
    dto: { hedgingStrategy: string },
  ) {
    const exposure = await this.getMarketExposure(tenantId, id);
    if (exposure.status !== "ACTIVE") {
      throw new BadRequestException("Only active exposures can be hedged");
    }
    return prisma.marketRiskExposure.update({
      where: { id },
      data: { hedgingStrategy: dto.hedgingStrategy },
    });
  }

  async closeExposure(tenantId: string, id: string) {
    const exposure = await this.getMarketExposure(tenantId, id);
    if (exposure.status === "CLOSED") {
      throw new BadRequestException("Exposure is already closed");
    }
    return prisma.marketRiskExposure.update({
      where: { id },
      data: { status: "CLOSED", valuationDate: new Date() },
    });
  }

  // ── Operational Risk Events ────────────────────────────────────────────────

  async createRiskEvent(
    tenantId: string,
    dto: {
      eventType: string;
      severity?: string;
      description: string;
      lossAmount?: number;
      rootCause?: string;
      controlId?: string;
      occurredAt: string;
    },
  ) {
    return prisma.operationalRiskEvent.create({
      data: {
        tenantId,
        eventType: dto.eventType,
        severity: dto.severity || "MEDIUM",
        description: dto.description,
        lossAmount: dto.lossAmount ? new Prisma.Decimal(dto.lossAmount) : null,
        rootCause: dto.rootCause || null,
        controlId: dto.controlId || null,
        status: "OPEN",
        occurredAt: new Date(dto.occurredAt),
      },
    });
  }

  async listRiskEvents(
    tenantId: string,
    query: {
      eventType?: string;
      severity?: string;
      status?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.OperationalRiskEventWhereInput = { tenantId };
    if (query.eventType) where.eventType = query.eventType;
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.operationalRiskEvent.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.operationalRiskEvent.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRiskEvent(tenantId: string, id: string) {
    const event = await prisma.operationalRiskEvent.findFirst({
      where: { id, tenantId },
    });
    if (!event) throw new NotFoundException("Operational risk event not found");
    return event;
  }

  async updateRiskEvent(
    tenantId: string,
    id: string,
    dto: {
      eventType?: string;
      severity?: string;
      description?: string;
      lossAmount?: number;
      recoveryAmount?: number;
      rootCause?: string;
      controlId?: string;
    },
  ) {
    await this.getRiskEvent(tenantId, id);
    const data: Prisma.OperationalRiskEventUpdateInput = {};
    if (dto.eventType !== undefined) data.eventType = dto.eventType;
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.lossAmount !== undefined)
      data.lossAmount = new Prisma.Decimal(dto.lossAmount);
    if (dto.recoveryAmount !== undefined)
      data.recoveryAmount = new Prisma.Decimal(dto.recoveryAmount);
    if (dto.rootCause !== undefined) data.rootCause = dto.rootCause;
    if (dto.controlId !== undefined) data.controlId = dto.controlId;
    return prisma.operationalRiskEvent.update({ where: { id }, data });
  }

  async resolveRiskEvent(
    tenantId: string,
    id: string,
    dto: { resolutionNotes?: string },
  ) {
    const event = await this.getRiskEvent(tenantId, id);
    if (event.status !== "OPEN") {
      throw new BadRequestException("Event is not open");
    }
    return prisma.operationalRiskEvent.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        rootCause: dto.resolutionNotes || event.rootCause,
      },
    });
  }

  // ── Control Measures ──────────────────────────────────────────────────────

  async createControlMeasure(
    tenantId: string,
    dto: {
      name: string;
      controlType: string;
      riskCategory: string;
      description?: string;
      controlOwner?: string;
      testFrequency?: string;
    },
  ) {
    return prisma.riskControlMeasure.create({
      data: {
        tenantId,
        name: dto.name,
        controlType: dto.controlType,
        riskCategory: dto.riskCategory,
        description: dto.description || null,
        controlOwner: dto.controlOwner || null,
        testFrequency: dto.testFrequency || "QUARTERLY",
        isActive: true,
      },
    });
  }

  async listControlMeasures(
    tenantId: string,
    riskCategory?: string,
    isActive?: boolean,
  ) {
    const where: Prisma.RiskControlMeasureWhereInput = { tenantId };
    if (riskCategory) where.riskCategory = riskCategory;
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.riskControlMeasure.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getControlMeasure(tenantId: string, id: string) {
    const measure = await prisma.riskControlMeasure.findFirst({
      where: { id, tenantId },
    });
    if (!measure) throw new NotFoundException("Control measure not found");
    return measure;
  }

  async updateControlMeasure(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      controlType?: string;
      description?: string;
      controlOwner?: string;
      testFrequency?: string;
      effectiveness?: string;
      isActive?: boolean;
    },
  ) {
    await this.getControlMeasure(tenantId, id);
    const data: Prisma.RiskControlMeasureUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.controlType !== undefined) data.controlType = dto.controlType;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.controlOwner !== undefined) data.controlOwner = dto.controlOwner;
    if (dto.testFrequency !== undefined) data.testFrequency = dto.testFrequency;
    if (dto.effectiveness !== undefined) data.effectiveness = dto.effectiveness;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.riskControlMeasure.update({ where: { id }, data });
  }

  async deleteControlMeasure(tenantId: string, id: string) {
    await this.getControlMeasure(tenantId, id);
    await prisma.riskControlMeasure.delete({ where: { id } });
    return { success: true };
  }

  async testControl(
    tenantId: string,
    id: string,
    dto: { effectiveness: string },
  ) {
    await this.getControlMeasure(tenantId, id);
    return prisma.riskControlMeasure.update({
      where: { id },
      data: {
        effectiveness: dto.effectiveness,
        lastTestedAt: new Date(),
      },
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getRiskSummary(tenantId: string) {
    const [
      totalScorecards,
      activeScorecards,
      totalScores,
      totalAssessments,
      totalExposures,
      totalEvents,
      totalControls,
    ] = await Promise.all([
      prisma.customerCreditScorecard.count({ where: { tenantId } }),
      prisma.customerCreditScorecard.count({
        where: { tenantId, isActive: true },
      }),
      prisma.customerCreditScore.count({ where: { tenantId } }),
      prisma.vendorRiskAssessment.count({ where: { tenantId } }),
      prisma.marketRiskExposure.count({ where: { tenantId } }),
      prisma.operationalRiskEvent.count({ where: { tenantId } }),
      prisma.riskControlMeasure.count({ where: { tenantId, isActive: true } }),
    ]);

    const openEvents = await prisma.operationalRiskEvent.count({
      where: { tenantId, status: "OPEN" },
    });
    const activeExposures = await prisma.marketRiskExposure.count({
      where: { tenantId, status: "ACTIVE" },
    });

    const exposureSum = await prisma.marketRiskExposure.aggregate({
      where: { tenantId, status: "ACTIVE" },
      _sum: { exposureAmount: true },
    });

    const lossSum = await prisma.operationalRiskEvent.aggregate({
      where: { tenantId, status: { not: "RESOLVED" } },
      _sum: { lossAmount: true },
    });

    return {
      totalScorecards,
      activeScorecards,
      totalCreditScores: totalScores,
      totalVendorAssessments: totalAssessments,
      totalMarketExposures: totalExposures,
      activeMarketExposures: activeExposures,
      totalRiskEvents: totalEvents,
      openRiskEvents: openEvents,
      activeControlMeasures: totalControls,
      totalExposureAmount: Number(exposureSum._sum.exposureAmount || 0),
      totalUnresolvedLossAmount: Number(lossSum._sum.lossAmount || 0),
    };
  }

  async getHeatMapData(tenantId: string) {
    const events = await prisma.operationalRiskEvent.groupBy({
      by: ["eventType", "severity"],
      where: { tenantId, status: "OPEN" },
      _count: true,
    });

    const riskMatrix = events.map((e) => ({
      eventType: e.eventType,
      severity: e.severity,
      count: e._count,
    }));

    const creditDistribution = await prisma.customerCreditScore.groupBy({
      by: ["riskRating"],
      where: { tenantId },
      _count: true,
      _avg: { overallScore: true },
    });

    const vendorDistribution = await prisma.vendorRiskAssessment.groupBy({
      by: ["riskRating"],
      where: { tenantId },
      _count: true,
      _avg: { riskScore: true },
    });

    return {
      riskMatrix,
      creditDistribution: creditDistribution.map((c) => ({
        riskRating: c.riskRating,
        count: c._count,
        averageScore: Math.round(Number(c._avg.overallScore || 0)),
      })),
      vendorDistribution: vendorDistribution.map((v) => ({
        riskRating: v.riskRating,
        count: v._count,
        averageRiskScore: Math.round(Number(v._avg.riskScore || 0) * 100) / 100,
      })),
    };
  }
}
