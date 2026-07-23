import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const amendmentSchema = z.object({
  contractId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  amendmentType: z.enum(["SCOPE_CHANGE", "PRICE_CHANGE", "TERM_EXTENSION", "TERM_RENEWAL", "TERMINATION", "OTHER"]),
  changeSummary: z.record(z.unknown()).optional().default({}),
  previousValue: z.number().min(0).optional().nullable(),
  newValue: z.number().min(0).optional().nullable(),
  effectiveDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
});

export const priceEscalationRuleSchema = z.object({
  contractId: z.string().optional().nullable(),
  name: z.string().min(1),
  escalationType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "CPI_INDEX"]),
  escalationValue: z.number().min(0),
  frequency: z.enum(["ANNUAL", "SEMI_ANNUAL", "QUARTERLY"]),
  startDate: z.coerce.date(),
  nextEscalationDate: z.coerce.date().optional().nullable(),
  maxCap: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const contractTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  contractType: z.enum(["SALES", "PURCHASE", "SERVICE", "NDA", "SUBSCRIPTION"]),
  template: z.record(z.unknown()).optional().default({}),
  clauses: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const contractClauseSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(["GENERAL", "PAYMENT", "TERMINATION", "CONFIDENTIALITY", "INTELLECTUAL_PROPERTY", "LIABILITY", "COMPLIANCE"]),
  isStandard: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
});

@Injectable()
export class CrmContractLifecycleService {
  // ── Amendments ──

  async listAmendments(tenantId: string, contractId?: string, status?: string) {
    const where: Prisma.ContractAmendmentWhereInput = { tenantId, deletedAt: null };
    if (contractId) where.contractId = contractId;
    if (status) where.status = status;
    return prisma.contractAmendment.findMany({ where, orderBy: { createdAt: "desc" }, include: { contract: { select: { id: true, contractNumber: true, title: true } } } });
  }

  async getAmendment(tenantId: string, id: string) {
    const a = await prisma.contractAmendment.findFirst({ where: { id, tenantId, deletedAt: null }, include: { contract: { select: { id: true, contractNumber: true, title: true, value: true, currency: true } } } });
    if (!a) throw new NotFoundException("Amendment not found");
    return a;
  }

  async createAmendment(tenantId: string, dto: z.infer<typeof amendmentSchema>, createdBy: string) {
    const contract = await prisma.contract.findFirst({ where: { id: dto.contractId, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");

    const count = await prisma.contractAmendment.count({ where: { tenantId, contractId: dto.contractId } });
    const { changeSummary, ...rest } = dto;
    return prisma.contractAmendment.create({
      data: { ...rest, changeSummary: changeSummary as Prisma.InputJsonValue, tenantId, amendmentNumber: `AMD-${contract.contractNumber}-${count + 1}`, createdBy },
    });
  }

  async updateAmendment(tenantId: string, id: string, dto: Partial<z.infer<typeof amendmentSchema>>) {
    await this.getAmendment(tenantId, id);
    const { changeSummary, contractId, ...rest } = dto;
    return prisma.contractAmendment.update({ where: { id }, data: { ...rest, ...(changeSummary !== undefined ? { changeSummary: changeSummary as Prisma.InputJsonValue } : {}) } });
  }

  async deleteAmendment(tenantId: string, id: string) {
    await this.getAmendment(tenantId, id);
    return prisma.contractAmendment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async submitAmendmentForApproval(tenantId: string, id: string) {
    const a = await this.getAmendment(tenantId, id);
    if (a.status !== "DRAFT") throw new BadRequestException("Only DRAFT amendments can be submitted");
    return prisma.contractAmendment.update({ where: { id }, data: { status: "PENDING_APPROVAL" } });
  }

  async approveAmendment(tenantId: string, id: string, approvedBy: string) {
    const a = await this.getAmendment(tenantId, id);
    if (a.status !== "PENDING_APPROVAL") throw new BadRequestException("Only PENDING_APPROVAL amendments can be approved");
    return prisma.contractAmendment.update({ where: { id }, data: { status: "APPROVED", approvedBy, approvedAt: new Date() } });
  }

  async rejectAmendment(tenantId: string, id: string) {
    const a = await this.getAmendment(tenantId, id);
    if (a.status !== "PENDING_APPROVAL") throw new BadRequestException("Only PENDING_APPROVAL amendments can be rejected");
    return prisma.contractAmendment.update({ where: { id }, data: { status: "REJECTED" } });
  }

  async executeAmendment(tenantId: string, id: string) {
    const a = await this.getAmendment(tenantId, id);
    if (a.status !== "APPROVED") throw new BadRequestException("Only APPROVED amendments can be executed");
    if (a.amendmentType === "PRICE_CHANGE" && a.newValue) {
      await prisma.contract.update({ where: { id: a.contractId }, data: { value: a.newValue } });
    }
    if (a.amendmentType === "TERM_EXTENSION" && a.newValue) {
      const contract = await prisma.contract.findFirst({ where: { id: a.contractId } });
      if (contract) {
        const newEnd = new Date(contract.endDate);
        newEnd.setMonth(newEnd.getMonth() + Number(a.newValue));
        await prisma.contract.update({ where: { id: a.contractId }, data: { endDate: newEnd } });
      }
    }
    return prisma.contractAmendment.update({ where: { id }, data: { status: "EXECUTED", executedAt: new Date() } });
  }

  // ── Price Escalation Rules ──

  async listPriceEscalationRules(tenantId: string, contractId?: string) {
    const where: Prisma.ContractPriceEscalationRuleWhereInput = { tenantId };
    if (contractId) where.contractId = contractId;
    return prisma.contractPriceEscalationRule.findMany({ where, orderBy: { createdAt: "desc" }, include: { contract: { select: { id: true, contractNumber: true, title: true, value: true } } } });
  }

  async getPriceEscalationRule(tenantId: string, id: string) {
    const r = await prisma.contractPriceEscalationRule.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException("Price escalation rule not found");
    return r;
  }

  async createPriceEscalationRule(tenantId: string, dto: z.infer<typeof priceEscalationRuleSchema>) {
    if (dto.contractId) await prisma.contract.findFirstOrThrow({ where: { id: dto.contractId, tenantId } }).catch(() => { throw new NotFoundException("Contract not found"); });
    return prisma.contractPriceEscalationRule.create({ data: { ...dto, tenantId, escalationValue: dto.escalationValue } });
  }

  async updatePriceEscalationRule(tenantId: string, id: string, dto: Partial<z.infer<typeof priceEscalationRuleSchema>>) {
    await this.getPriceEscalationRule(tenantId, id);
    return prisma.contractPriceEscalationRule.update({ where: { id }, data: dto });
  }

  async deletePriceEscalationRule(tenantId: string, id: string) {
    await this.getPriceEscalationRule(tenantId, id);
    return prisma.contractPriceEscalationRule.delete({ where: { id } });
  }

  async togglePriceEscalationRule(tenantId: string, id: string) {
    const r = await this.getPriceEscalationRule(tenantId, id);
    return prisma.contractPriceEscalationRule.update({ where: { id }, data: { isActive: !r.isActive } });
  }

  async applyEscalation(tenantId: string, ruleId: string, contractId: string) {
    const rule = await this.getPriceEscalationRule(tenantId, ruleId);
    const contract = await prisma.contract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");

    let newValue = Number(contract.value);
    if (rule.escalationType === "PERCENTAGE") newValue += newValue * (Number(rule.escalationValue) / 100);
    else if (rule.escalationType === "FIXED_AMOUNT") newValue += Number(rule.escalationValue);

    if (rule.maxCap) newValue = Math.min(newValue, Number(rule.maxCap));

    await prisma.contract.update({ where: { id: contractId }, data: { value: newValue } });
    return prisma.contractPriceEscalationRule.update({
      where: { id: ruleId },
      data: { lastAppliedAt: new Date(), appliedCount: { increment: 1 }, nextEscalationDate: null },
    });
  }

  // ── Auto-Renewals ──

  async processAutoRenewal(tenantId: string, contractId: string) {
    const contract = await prisma.contract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");
    if (contract.status === "EXPIRED" || contract.status === "TERMINATED") throw new BadRequestException("Cannot renew expired/terminated contract");

    const renewalMonths = contract.renewalTermMonths || 12;
    const newEnd = new Date(contract.endDate);
    newEnd.setMonth(newEnd.getMonth() + renewalMonths);

    let newValue = Number(contract.value);
    const escalationRule = await prisma.contractPriceEscalationRule.findFirst({ where: { tenantId, contractId, isActive: true } });
    let escalationApplied = 0;
    if (escalationRule && escalationRule.nextEscalationDate && new Date(escalationRule.nextEscalationDate) <= new Date()) {
      if (escalationRule.escalationType === "PERCENTAGE") newValue += newValue * (Number(escalationRule.escalationValue) / 100);
      else if (escalationRule.escalationType === "FIXED_AMOUNT") newValue += Number(escalationRule.escalationValue);
      if (escalationRule.maxCap) newValue = Math.min(newValue, Number(escalationRule.maxCap));
      escalationApplied = newValue - Number(contract.value);
    }

    await prisma.contract.update({
      where: { id: contractId },
      data: { endDate: newEnd, renewalDate: newEnd, value: newValue, status: "ACTIVE", renewedFromId: contract.renewedFromId || contract.id },
    });

    const count = await prisma.contractAutoRenewalLog.count({ where: { tenantId, contractId } });
    return prisma.contractAutoRenewalLog.create({
      data: { tenantId, contractId, renewalNumber: count + 1, previousEndDate: contract.endDate, newEndDate: newEnd, previousValue: contract.value, newValue, escalationApplied, status: "PROCESSED", notes: "Auto-renewal processed" },
    });
  }

  async listAutoRenewals(tenantId: string, contractId?: string) {
    const where: Prisma.ContractAutoRenewalLogWhereInput = { tenantId };
    if (contractId) where.contractId = contractId;
    return prisma.contractAutoRenewalLog.findMany({ where, orderBy: { processedAt: "desc" }, include: { contract: { select: { id: true, contractNumber: true, title: true } } } });
  }

  async getAutoRenewal(tenantId: string, id: string) {
    const r = await prisma.contractAutoRenewalLog.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException("Auto-renewal log not found");
    return r;
  }

  async cancelUpcomingRenewal(tenantId: string, contractId: string) {
    const contract = await prisma.contract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");
    return prisma.contract.update({ where: { id: contractId }, data: { autoRenew: false } });
  }

  async updateRenewalPreferences(tenantId: string, contractId: string, autoRenew: boolean, renewalTermMonths?: number) {
    const contract = await prisma.contract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");
    return prisma.contract.update({ where: { id: contractId }, data: { autoRenew, renewalTermMonths: renewalTermMonths ?? contract.renewalTermMonths } });
  }

  // ── Expiration Pipeline ──

  async scanExpirationPipeline(tenantId: string) {
    const contracts = await prisma.contract.findMany({
      where: { tenantId, status: { notIn: ["EXPIRED", "TERMINATED"] }, deletedAt: null },
      select: { id: true, endDate: true, contractNumber: true, title: true },
    });

    const results = [];
    for (const c of contracts) {
      const daysToExpiry = Math.ceil((c.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry > 365) continue;

      const existing = await prisma.contractExpirationPipelineItem.findFirst({
        where: { tenantId, contractId: c.id, status: { notIn: ["RENEWED", "DISMISSED", "EXPIRED"] } },
      });
      if (existing) {
        await prisma.contractExpirationPipelineItem.update({
          where: { id: existing.id },
          data: { daysToExpiry, stage: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "AT_RISK" : daysToExpiry <= 90 ? "ACTION_REQUIRED" : "UPCOMING", riskLevel: daysToExpiry <= 30 ? "HIGH" : daysToExpiry <= 90 ? "MEDIUM" : "LOW", actionRequired: daysToExpiry <= 30 ? "Immediate renewal action needed" : daysToExpiry <= 90 ? "Prepare renewal terms" : "Monitor" },
        });
        results.push({ contractId: c.id, updated: true });
      } else {
        await prisma.contractExpirationPipelineItem.create({
          data: { tenantId, contractId: c.id, daysToExpiry, stage: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "AT_RISK" : daysToExpiry <= 90 ? "ACTION_REQUIRED" : "UPCOMING", riskLevel: daysToExpiry <= 30 ? "HIGH" : daysToExpiry <= 90 ? "MEDIUM" : "LOW", actionRequired: daysToExpiry <= 30 ? "Immediate renewal action needed" : daysToExpiry <= 90 ? "Prepare renewal terms" : "Monitor" },
        });
        results.push({ contractId: c.id, created: true });
      }
    }
    return { scanned: contracts.length, results };
  }

  async listExpirationPipeline(tenantId: string, stage?: string, riskLevel?: string) {
    const where: Prisma.ContractExpirationPipelineItemWhereInput = { tenantId };
    if (stage) where.stage = stage;
    if (riskLevel) where.riskLevel = riskLevel;
    return prisma.contractExpirationPipelineItem.findMany({
      where, orderBy: { daysToExpiry: "asc" }, include: { contract: { select: { id: true, contractNumber: true, title: true, endDate: true, value: true, currency: true, status: true, autoRenew: true } } },
    });
  }

  async getExpirationPipelineItem(tenantId: string, id: string) {
    const p = await prisma.contractExpirationPipelineItem.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException("Pipeline item not found");
    return p;
  }

  async startRenewalFromPipeline(tenantId: string, id: string, userId: string) {
    const item = await this.getExpirationPipelineItem(tenantId, id);
    await prisma.contractExpirationPipelineItem.update({ where: { id }, data: { status: "IN_PROGRESS", assignedTo: userId } });
    return this.processAutoRenewal(tenantId, item.contractId);
  }

  async dismissPipelineItem(tenantId: string, id: string, userId: string) {
    await this.getExpirationPipelineItem(tenantId, id);
    return prisma.contractExpirationPipelineItem.update({ where: { id }, data: { status: "DISMISSED", dismissedAt: new Date(), dismissedBy: userId } });
  }

  async assignPipelineItem(tenantId: string, id: string, assignedTo: string) {
    await this.getExpirationPipelineItem(tenantId, id);
    return prisma.contractExpirationPipelineItem.update({ where: { id }, data: { assignedTo } });
  }

  // ── Templates ──

  async listTemplates(tenantId: string, contractType?: string) {
    const where: Prisma.ContractTemplateWhereInput = { tenantId, deletedAt: null };
    if (contractType) where.contractType = contractType;
    return prisma.contractTemplate.findMany({ where, orderBy: { name: "asc" } });
  }

  async getTemplate(tenantId: string, id: string) {
    const t = await prisma.contractTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!t) throw new NotFoundException("Template not found");
    return t;
  }

  async createTemplate(tenantId: string, dto: z.infer<typeof contractTemplateSchema>) {
    const { template, clauses, ...rest } = dto;
    return prisma.contractTemplate.create({ data: { ...rest, template: template as Prisma.InputJsonValue, clauses: clauses as Prisma.InputJsonValue, tenantId } });
  }

  async updateTemplate(tenantId: string, id: string, dto: Partial<z.infer<typeof contractTemplateSchema>>) {
    await this.getTemplate(tenantId, id);
    const { template, clauses, ...rest } = dto;
    return prisma.contractTemplate.update({ where: { id }, data: { ...rest, ...(template !== undefined ? { template: template as Prisma.InputJsonValue } : {}), ...(clauses !== undefined ? { clauses: clauses as Prisma.InputJsonValue } : {}), version: { increment: 1 } } });
  }

  async deleteTemplate(tenantId: string, id: string) {
    await this.getTemplate(tenantId, id);
    return prisma.contractTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async generateFromTemplate(tenantId: string, templateId: string, overrides: Record<string, unknown>) {
    const template = await this.getTemplate(tenantId, templateId);
    const templateData = typeof template.template === "object" && template.template !== null ? (template.template as Record<string, unknown>) : {};
    return { template, generatedData: { ...templateData, ...overrides }, message: "Contract data prepared from template" };
  }

  // ── Clauses ──

  async listClauses(tenantId: string, category?: string) {
    const where: Prisma.ContractClauseWhereInput = { tenantId, deletedAt: null };
    if (category) where.category = category;
    return prisma.contractClause.findMany({ where, orderBy: { title: "asc" } });
  }

  async getClause(tenantId: string, id: string) {
    const c = await prisma.contractClause.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!c) throw new NotFoundException("Clause not found");
    return c;
  }

  async createClause(tenantId: string, dto: z.infer<typeof contractClauseSchema>) {
    return prisma.contractClause.create({ data: { ...dto, tenantId } });
  }

  async updateClause(tenantId: string, id: string, dto: Partial<z.infer<typeof contractClauseSchema>>) {
    await this.getClause(tenantId, id);
    return prisma.contractClause.update({ where: { id }, data: dto });
  }

  async deleteClause(tenantId: string, id: string) {
    await this.getClause(tenantId, id);
    return prisma.contractClause.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Analytics ──

  async getAnalytics(tenantId: string) {
    const [totalContracts, activeContracts, expiringSoon, expiringCount, amendments, escalations, templates] = await Promise.all([
      prisma.contract.count({ where: { tenantId, deletedAt: null } }),
      prisma.contract.count({ where: { tenantId, status: "ACTIVE", deletedAt: null } }),
      prisma.contract.count({ where: { tenantId, status: "EXPIRING_SOON", deletedAt: null } }),
      prisma.contractExpirationPipelineItem.count({ where: { tenantId, status: "OPEN" } }),
      prisma.contractAmendment.count({ where: { tenantId, deletedAt: null } }),
      prisma.contractPriceEscalationRule.count({ where: { tenantId, isActive: true } }),
      prisma.contractTemplate.count({ where: { tenantId, isActive: true, deletedAt: null } }),
    ]);
    const totalValue = await prisma.contract.aggregate({ where: { tenantId, deletedAt: null }, _sum: { value: true } });
    return { totalContracts, activeContracts, expiringSoon, expiringPipelineCount: expiringCount, amendments, activeEscalations: escalations, templates, totalContractValue: totalValue._sum.value || 0 };
  }

  async getDashboard(tenantId: string) {
    const [expiringByStage, renewalsByMonth] = await Promise.all([
      prisma.contractExpirationPipelineItem.groupBy({ by: ["stage"], where: { tenantId }, _count: true }),
      prisma.contractAutoRenewalLog.groupBy({ by: ["status"], where: { tenantId }, _count: true }),
    ]);
    return { expiringByStage, renewalsByMonth };
  }
}
