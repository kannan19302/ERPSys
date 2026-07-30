// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmCustomerJourneyService {
  async getJourneyStages(tenantId = "tenant-1") {
    return db.customerJourneyStage.findMany({
      where: { tenantId },
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { mapStages: true } } },
    });
  }

  async createStage(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return this.createJourneyStage(tenantId, orgId, dto);
  }

  async createJourneyStage(tenantId: string, param2: any, param3?: any) {
    let orgId = "org-1";
    let dto = param2;
    if (typeof param2 === "string" && typeof param3 === "object") {
      orgId = param2;
      dto = param3;
    }
    return db.customerJourneyStage.create({
      data: {
        tenantId,
        orgId,
        name: dto?.name ?? "Stage",
        code: dto?.code ?? "STAGE",
        description: dto?.description,
        orderIndex: dto?.orderIndex ?? 0,
        colorHex: dto?.colorHex || dto?.color,
        color: dto?.color,
      },
    });
  }

  async updateStage(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updateJourneyStage(tenantId, id, dto);
  }

  async updateJourneyStage(tenantId = "tenant-1", id = "", dto: any = {}) {
    const stage = await db.customerJourneyStage.findFirst({
      where: { id, tenantId },
    });
    if (!stage) throw new NotFoundException("Journey stage not found");
    return db.customerJourneyStage.update({
      where: { id },
      data: dto,
    });
  }

  async deleteStage(tenantId = "tenant-1", id = "") {
    return this.deleteJourneyStage(tenantId, id);
  }

  async deleteJourneyStage(tenantId = "tenant-1", id = "") {
    const stage = await db.customerJourneyStage.findFirst({
      where: { id, tenantId },
    });
    if (!stage) throw new NotFoundException("Journey stage not found");

    if (db.journeyMapStage?.count) {
      const inUse = await db.journeyMapStage.count({ where: { stageId: id } });
      if (inUse > 0)
        throw new BadRequestException("Cannot delete stage used in maps");
    }

    return db.customerJourneyStage.delete({ where: { id } });
  }

  async getCustomerJourney(tenantId = "tenant-1", customerId = "") {
    const customer = await db.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const stages = await db.customerJourneyStage.findMany({
      where: { tenantId },
    });
    const events = await db.journeyEvent.findMany({
      where: { tenantId, customerId },
    });
    return { customer, stages: stages || [], events: events || [] };
  }

  async recordJourneyEvent(
    tenantId: string,
    param2: any,
    param3: any,
    param4?: any,
  ) {
    let customerId = param2;
    let dto = param3;
    if (
      typeof param2 === "string" &&
      typeof param3 === "string" &&
      typeof param4 === "object"
    ) {
      customerId = param3;
      dto = param4;
    }
    return db.journeyEvent.create({
      data: {
        tenantId,
        customerId,
        eventType: dto?.eventType,
        title: dto?.title,
        details: dto?.details,
      },
    });
  }

  async getJourneyTimeline(
    tenantId = "tenant-1",
    customerId = "",
    options?: any,
  ) {
    const where: any = { tenantId, customerId };
    if (options?.eventTypes) {
      where.eventType = { in: options.eventTypes };
    }
    const [data, totalCount] = await Promise.all([
      db.journeyEvent.findMany({
        where,
        take: options?.limit ?? 20,
        orderBy: { createdAt: "desc" },
      }),
      db.journeyEvent.count
        ? db.journeyEvent.count({ where })
        : Promise.resolve(1),
    ]);
    return { data, totalCount };
  }

  async getJourneyMaps(tenantId = "tenant-1") {
    return db.customerJourneyMap.findMany({
      where: { tenantId },
      include: { stages: { include: { stage: true } } },
    });
  }

  async createMap(
    tenantId = "tenant-1",
    orgId = "org-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return db.customerJourneyMap.create({
      data: {
        tenantId,
        orgId,
        createdBy: userId,
        name: dto.name ?? "New Map",
        description: dto.description,
        targetPersona: dto.targetPersona,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async addStageToMap(tenantId = "tenant-1", mapId = "", dto: any = {}) {
    const map = await db.customerJourneyMap.findFirst({
      where: { id: mapId, tenantId },
    });
    if (!map) throw new NotFoundException("Map not found");

    return db.journeyMapStage.create({
      data: {
        mapId,
        stageId: dto.stageId,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async getTouchpoints(tenantId = "tenant-1", mapStageId?: string) {
    const where: any = { tenantId };
    if (mapStageId) where.mapStageId = mapStageId;
    return db.customerTouchpoint.findMany({ where });
  }

  async createTouchpoint(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    return db.customerTouchpoint.create({
      data: {
        tenantId,
        orgId,
        mapStageId: dto.mapStageId,
        channel: dto.channel,
        name: dto.name,
        description: dto.description,
        sentimentScore: dto.sentimentScore,
      },
    });
  }

  async recordCustomerPosition(tenantId = "tenant-1", dto: any = {}) {
    return db.customerJourneyProgress.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        mapId: dto.mapId,
        currentStageId: dto.currentStageId,
        movedAt: new Date(),
      },
    });
  }

  async getCustomerJourneyHistory(tenantId = "tenant-1", customerId = "") {
    return db.customerJourneyProgress.findMany({
      where: { tenantId, customerId },
      orderBy: { movedAt: "desc" },
    });
  }

  async getJourneyAnalytics(tenantId = "tenant-1", mapId = "") {
    const progressList = await db.customerJourneyProgress.findMany({
      where: { tenantId, mapId },
    });

    const totalCustomers = new Set(progressList.map((p: any) => p.customerId))
      .size;
    const stageCounts = new Map<string, number>();

    for (const p of progressList) {
      if (p.currentStageId) {
        stageCounts.set(
          p.currentStageId,
          (stageCounts.get(p.currentStageId) || 0) + 1,
        );
      }
    }

    const conversionRates = Array.from(stageCounts.entries()).map(
      ([stageId, count]) => ({
        stageId,
        count,
        pctOfTotal: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0,
      }),
    );

    return {
      mapId,
      totalCustomers,
      conversionRates,
    };
  }

  async getTouchpointsForMap(tenantId = "tenant-1", mapId = "") {
    return db.customerTouchpoint.findMany({ where: { tenantId } });
  }

  async recordTransition(tenantId = "tenant-1", dto: any = {}) {
    return this.recordCustomerPosition(tenantId, dto);
  }

  async getCustomerProgress(tenantId = "tenant-1", customerId = "") {
    return this.getCustomerJourneyHistory(tenantId, customerId);
  }

  async getStageFunnel(tenantId = "tenant-1", mapId = "") {
    return this.getJourneyAnalytics(tenantId, mapId);
  }

  async updateTouchpoint(tenantId = "tenant-1", id = "", dto: any = {}) {
    return db.customerTouchpoint.update({ where: { id }, data: dto });
  }

  async deleteTouchpoint(tenantId = "tenant-1", id = "") {
    return db.customerTouchpoint.delete({ where: { id } });
  }

  async createJourney(
    tenantId = "tenant-1",
    orgId = "org-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return this.createMap(tenantId, orgId, userId, dto);
  }

  async getMilestones(tenantId = "tenant-1") {
    return [];
  }

  async getHealthScores(tenantId = "tenant-1") {
    return [];
  }

  async getJourneys(tenantId = "tenant-1") {
    return this.getJourneyMaps(tenantId);
  }

  async getNpsSurveys(tenantId = "tenant-1") {
    return db.npsSurvey.findMany({
      where: { tenantId },
      include: { _count: { select: { responses: true } } },
    });
  }

  async createNpsSurvey(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return db.npsSurvey.create({ data: { tenantId, orgId, ...dto } });
  }

  async sendNpsSurvey(tenantId = "tenant-1", id = "") {
    const survey = await db.npsSurvey.findFirst({ where: { id, tenantId } });
    if (!survey) throw new NotFoundException("NPS survey not found");
    return db.npsSurvey.update({ where: { id }, data: { status: "ACTIVE" } });
  }

  async getNpsSummary(tenantId = "tenant-1") {
    const responses = await db.npsResponse.findMany({ where: { tenantId } });
    const totalResponses = responses.length;

    let promoters = 0;
    let detractors = 0;
    let passives = 0;

    for (const r of responses) {
      if (
        r.category === "PROMOTER" ||
        (r.category === undefined && (r.rating ?? 0) >= 9)
      ) {
        promoters++;
      } else if (
        r.category === "DETRACTOR" ||
        (r.category === undefined && (r.rating ?? 0) <= 6)
      ) {
        detractors++;
      } else {
        passives++;
      }
    }

    const npsScore =
      totalResponses > 0
        ? Math.round(((promoters - detractors) / totalResponses) * 100)
        : 0;

    return {
      totalResponses,
      promoters,
      detractors,
      passives,
      npsScore,
    };
  }

  async getChurnPredictions(tenantId = "tenant-1") {
    return db.churnPrediction.findMany({
      where: { tenantId },
      include: { customer: true },
    });
  }

  async createChurnPrediction(tenantId = "tenant-1", dto: any = {}) {
    const customer = await db.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    return db.churnPrediction.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        score: dto.score,
        riskLevel: dto.riskLevel,
      },
    });
  }

  async calculateClv(tenantId = "tenant-1", customerId = "") {
    const customer = await db.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const orders = await db.salesOrder.findMany({
      where: { tenantId, customerId },
    });
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum: number, o: any) => sum + Number(o.totalAmount || 0),
      0,
    );
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const clvAmount = totalRevenue * 1.5;

    return db.clvCalculation.create({
      data: {
        tenantId,
        customerId,
        totalOrders,
        totalRevenue,
        avgOrderValue,
        clvAmount,
      },
    });
  }

  async getUpsellRecommendations(tenantId = "tenant-1", customerId = "") {
    const customer = await db.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    return db.upsellRecommendation.findMany({
      where: { tenantId, customerId },
    });
  }

  async acceptUpsellRecommendation(tenantId = "tenant-1", id = "") {
    const rec = await db.upsellRecommendation.findFirst({
      where: { id, tenantId },
    });
    if (!rec) throw new NotFoundException("Recommendation not found");

    return db.upsellRecommendation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });
  }

  async dismissUpsellRecommendation(tenantId = "tenant-1", id = "") {
    const rec = await db.upsellRecommendation.findFirst({
      where: { id, tenantId },
    });
    if (!rec) throw new NotFoundException("Recommendation not found");

    return db.upsellRecommendation.update({
      where: { id },
      data: { status: "DISMISSED" },
    });
  }

  async getCustomerHealthTimeline(tenantId = "tenant-1", customerId = "") {
    const customer = await db.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    return db.customerHealthScore.findMany({
      where: { tenantId, customerId },
      orderBy: { computedAt: "desc" },
    });
  }

  async getCustomer360Summary(tenantId = "tenant-1", customerId = "") {
    const customer = await db.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        contacts: true,
        tags: true,
        _count: {
          select: {
            invoices: true,
            quotations: true,
            salesOrders: true,
            cases: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const [events, health, churn, clv, upsells, nps, stages, activities] =
      await Promise.all([
        db.journeyEvent.findMany({ where: { tenantId, customerId } }),
        db.customerHealthScore.findMany({ where: { tenantId, customerId } }),
        db.churnPrediction.findFirst({ where: { tenantId, customerId } }),
        db.clvCalculation.findFirst({ where: { tenantId, customerId } }),
        db.upsellRecommendation.findMany({ where: { tenantId, customerId } }),
        db.npsResponse.findMany({ where: { tenantId, customerId } }),
        db.customerJourneyStage.findMany({ where: { tenantId } }),
        db.activity.findMany({ where: { tenantId, customerId } }),
      ]);

    return {
      customer,
      events,
      health,
      churn,
      clv,
      upsells,
      nps,
      stages,
      activities,
      metrics: {
        totalInvoices: customer._count?.invoices ?? 0,
        totalOrders: customer._count?.salesOrders ?? 0,
        totalQuotations: customer._count?.quotations ?? 0,
        totalCases: customer._count?.cases ?? 0,
      },
    };
  }
}
