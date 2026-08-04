import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmDealDeskService {
  constructor(@Optional() private eventEmitter?: EventEmitter2) {}

  async getDealDeskRequests(
    tenantId = "tenant-1",
    params?: { page?: number; limit?: number; status?: string },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (params?.status) where.status = params.status;

    const [data, total] = await Promise.all([
      db.dealDeskRequest.findMany({
        where,
        skip,
        take: limit,
        include: { opportunity: true },
      }),
      db.dealDeskRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createDealDeskRequest(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    const opp = await db.opportunity.findFirst({
      where: { id: dto.opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException("Opportunity not found");

    const request = await db.dealDeskRequest.create({
      data: {
        tenantId,
        orgId,
        opportunityId: dto.opportunityId,
        requestType: dto.requestType,
        description: dto.description,
        discountRequest: dto.discountRequest,
        justification: dto.justification,
        assignedById: dto.assignedById,
        status: "PENDING",
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("crm.deal-desk.request_created", {
        requestId: request.id,
      });
    }

    return request;
  }

  async approveDealDeskRequest(
    tenantId = "tenant-1",
    id = "",
    dto: { reviewedBy?: string; reviewNotes?: string } = {},
  ) {
    const req = await db.dealDeskRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException("Request not found");
    if (req.status !== "PENDING")
      throw new BadRequestException("Request is not pending");

    return db.dealDeskRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
        decisionAt: new Date(),
      },
    });
  }

  async rejectDealDeskRequest(
    tenantId = "tenant-1",
    id = "",
    dto: { reviewedBy?: string; reviewNotes?: string } = {},
  ) {
    const req = await db.dealDeskRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException("Request not found");
    if (req.status !== "PENDING")
      throw new BadRequestException("Request is not pending");

    return db.dealDeskRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
        decisionAt: new Date(),
      },
    });
  }

  async requestMoreInfo(
    tenantId = "tenant-1",
    id = "",
    dto: { reviewedBy?: string; reviewNotes?: string } = {},
  ) {
    const req = await db.dealDeskRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException("Request not found");

    return db.dealDeskRequest.update({
      where: { id },
      data: {
        status: "MORE_INFO",
        reviewedBy: dto.reviewedBy,
        reviewNotes: dto.reviewNotes,
      },
    });
  }

  async provideMoreInfo(
    tenantId = "tenant-1",
    id = "",
    dto: { justification?: string } = {},
  ) {
    const req = await db.dealDeskRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException("Request not found");

    return db.dealDeskRequest.update({
      where: { id },
      data: {
        status: "PENDING",
        justification: dto.justification,
      },
    });
  }

  async escalateDealDeskRequest(
    tenantId = "tenant-1",
    id = "",
    dto: { escalatedTo?: string } = {},
  ) {
    const req = await db.dealDeskRequest.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException("Request not found");

    return db.dealDeskRequest.update({
      where: { id },
      data: {
        escalatedTo: dto.escalatedTo,
        priority: "URGENT",
      },
    });
  }

  async getDealDeskStats(tenantId = "tenant-1") {
    const [
      total,
      pending,
      approved,
      rejected,
      moreInfo,
      urgent,
      byType,
      decideRequests,
    ] = await Promise.all([
      db.dealDeskRequest.count({ where: { tenantId } }),
      db.dealDeskRequest.count({ where: { tenantId, status: "PENDING" } }),
      db.dealDeskRequest.count({ where: { tenantId, status: "APPROVED" } }),
      db.dealDeskRequest.count({ where: { tenantId, status: "REJECTED" } }),
      db.dealDeskRequest.count({ where: { tenantId, status: "MORE_INFO" } }),
      db.dealDeskRequest.count({ where: { tenantId, priority: "URGENT" } }),
      db.dealDeskRequest.groupBy({
        by: ["requestType"],
        where: { tenantId },
        _count: { id: true },
      }),
      db.dealDeskRequest.findMany({
        where: { tenantId, decisionAt: { not: null } },
      }),
    ]);

    let avgResponseHours = 24;
    if (decideRequests.length > 0) {
      const totalHours = decideRequests.reduce((acc: number, r: any) => {
        const diffMs =
          new Date(r.decisionAt!).getTime() - new Date(r.createdAt).getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResponseHours = totalHours / decideRequests.length;
    }

    return {
      total,
      pending,
      approved,
      rejected,
      moreInfo,
      urgent,
      byType,
      avgResponseHours,
    };
  }

  async getDealAlerts(tenantId = "tenant-1") {
    return db.dealAlert.findMany({ where: { tenantId } });
  }

  async createDealAlert(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    const alert = await db.dealAlert.create({
      data: {
        tenantId,
        orgId,
        opportunityId: dto.opportunityId,
        alertType: dto.alertType,
        severity: dto.severity,
        message: dto.message,
        status: "OPEN",
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("crm.deal-desk.alert_created", {
        alertId: alert.id,
      });
    }

    return alert;
  }

  async acknowledgeDealAlert(tenantId = "tenant-1", alertId = "", userId = "") {
    const alert = await db.dealAlert.findFirst({
      where: { id: alertId, tenantId },
    });
    if (!alert) throw new NotFoundException("Alert not found");

    return db.dealAlert.update({
      where: { id: alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async getDealAutomationRules(tenantId = "tenant-1") {
    return db.dealAutomationRule.findMany({ where: { tenantId } });
  }

  async createDealAutomationRule(tenantId = "tenant-1", dto: any = {}) {
    return db.dealAutomationRule.create({
      data: {
        tenantId,
        name: dto.name,
        triggerEvent: dto.triggerEvent,
        conditions: dto.conditions,
        actions: dto.actions,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateDealAutomationRule(
    tenantId = "tenant-1",
    id = "",
    dto: any = {},
  ) {
    const rule = await db.dealAutomationRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Automation rule not found");
    return db.dealAutomationRule.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDealAutomationRule(tenantId = "tenant-1", id = "") {
    const rule = await db.dealAutomationRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Automation rule not found");
    return db.dealAutomationRule.delete({ where: { id } });
  }

  async evaluateAutomationRules(tenantId = "tenant-1", opportunityId = "") {
    const opp = await db.opportunity.findFirst({
      where: { id: opportunityId, tenantId },
    });
    if (!opp) throw new NotFoundException("Opportunity not found");

    const rules = await db.dealAutomationRule.findMany({
      where: { tenantId, isActive: true },
    });
    const triggered: any[] = [];

    for (const rule of rules) {
      triggered.push({ ruleId: rule.id, ruleName: rule.name });
    }

    return {
      rulesEvaluated: rules.length,
      rulesTriggered: triggered.length,
      triggered,
    };
  }

  async getDiscountApprovalMatrix(tenantId = "tenant-1") {
    return [
      { role: "SALES_REP", maxDiscountPct: 10 },
      { role: "SALES_MANAGER", maxDiscountPct: 20 },
      { role: "VP_SALES", maxDiscountPct: 35 },
    ];
  }

  async getDealDeskDashboard(tenantId = "tenant-1") {
    const stats = await this.getDealDeskStats(tenantId);
    const openRequests = await db.dealDeskRequest.findMany({
      where: { tenantId, status: "PENDING" },
      take: 5,
    });
    const recentActivity = await db.dealDeskRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      stats,
      openRequests,
      recentActivity,
    };
  }

  async getAutomationRules(tenantId = "tenant-1") {
    return this.getDealAutomationRules(tenantId);
  }

  async createAutomationRule(tenantId = "tenant-1", dto: any = {}) {
    return this.createDealAutomationRule(tenantId, dto);
  }

  async updateAutomationRule(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updateDealAutomationRule(tenantId, id, dto);
  }

  async deleteAutomationRule(tenantId = "tenant-1", id = "") {
    return this.deleteDealAutomationRule(tenantId, id);
  }

  async getApprovers(tenantId = "tenant-1") {
    return db.user.findMany({ where: { tenantId } });
  }
}
