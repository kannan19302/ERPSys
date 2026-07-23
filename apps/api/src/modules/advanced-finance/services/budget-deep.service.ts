import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class BudgetDeepService {
  // ── Budget Templates ────────────────────────────────────────

  async getBudgetTemplates(tenantId: string, fiscalYear?: string) {
    const where: any = { tenantId };
    if (fiscalYear) where.fiscalYear = fiscalYear;
    return prisma.budgetTemplate.findMany({ where, orderBy: { fiscalYear: "desc" } });
  }

  async getBudgetTemplateById(tenantId: string, id: string) {
    const t = await prisma.budgetTemplate.findFirst({ where: { id, tenantId } });
    if (!t) throw new NotFoundException("Budget template not found");
    return t;
  }

  async createBudgetTemplate(tenantId: string, orgId: string, dto: any) {
    return prisma.budgetTemplate.create({
      data: {
        ...dto, tenantId, orgId,
        adjustmentPct: dto.adjustmentPct ? new Prisma.Decimal(dto.adjustmentPct) : null,
      },
    });
  }

  async updateBudgetTemplate(tenantId: string, id: string, dto: any) {
    await this.getBudgetTemplateById(tenantId, id);
    const data: any = { ...dto };
    if (dto.adjustmentPct !== undefined) data.adjustmentPct = new Prisma.Decimal(dto.adjustmentPct);
    return prisma.budgetTemplate.update({ where: { id }, data });
  }

  async deleteBudgetTemplate(tenantId: string, id: string) {
    await this.getBudgetTemplateById(tenantId, id);
    return prisma.budgetTemplate.delete({ where: { id } });
  }

  async activateBudgetTemplate(tenantId: string, id: string) {
    await this.getBudgetTemplateById(tenantId, id);
    return prisma.budgetTemplate.update({ where: { id }, data: { status: "ACTIVE" } });
  }

  async archiveBudgetTemplate(tenantId: string, id: string) {
    await this.getBudgetTemplateById(tenantId, id);
    return prisma.budgetTemplate.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  async generateBudgetsFromTemplate(tenantId: string, orgId: string, templateId: string) {
    const template = await this.getBudgetTemplateById(tenantId, templateId);
    if (template.status !== "ACTIVE") throw new BadRequestException("Template must be ACTIVE");
    const lines: any[] = typeof template.lines === "string" ? JSON.parse(template.lines) : (template.lines as any[]) || [];
    const startDate = new Date(parseInt(template.fiscalYear), 0, 1);
    const endDate = new Date(parseInt(template.fiscalYear), 11, 31);
    const results: any[] = [];
    for (const line of lines) {
      const budget = await prisma.budget.create({
        data: {
          tenantId, orgId,
          accountId: line.accountId,
          costCenterId: line.costCenterId || null,
          projectId: line.projectId || null,
          amount: new Prisma.Decimal(line.amount || 0),
          startDate,
          endDate,
        },
      });
      results.push(budget);
    }
    return { templateName: template.name, fiscalYear: template.fiscalYear, budgetsCreated: results.length, budgets: results };
  }

  // ── Budget Commitments ──────────────────────────────────────

  async getBudgetCommitments(tenantId: string, budgetId?: string, status?: string) {
    const where: any = { tenantId };
    if (budgetId) where.budgetId = budgetId;
    if (status) where.status = status;
    return prisma.budgetCommitment.findMany({ where, orderBy: { commitmentDate: "desc" } });
  }

  async getBudgetCommitmentById(tenantId: string, id: string) {
    const c = await prisma.budgetCommitment.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException("Budget commitment not found");
    return c;
  }

  async createBudgetCommitment(tenantId: string, orgId: string, dto: any) {
    return prisma.budgetCommitment.create({
      data: {
        ...dto, tenantId, orgId,
        amount: new Prisma.Decimal(dto.amount),
        outstandingAmount: new Prisma.Decimal(dto.amount),
        liquidatedAmount: new Prisma.Decimal(0),
        commitmentDate: new Date(dto.commitmentDate),
        expectedLiquidationDate: dto.expectedLiquidationDate ? new Date(dto.expectedLiquidationDate) : null,
      },
    });
  }

  async updateBudgetCommitment(tenantId: string, id: string, dto: any) {
    await this.getBudgetCommitmentById(tenantId, id);
    const data: any = { ...dto };
    if (dto.amount) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.outstandingAmount !== undefined) data.outstandingAmount = new Prisma.Decimal(dto.outstandingAmount);
    if (dto.liquidatedAmount !== undefined) data.liquidatedAmount = new Prisma.Decimal(dto.liquidatedAmount);
    return prisma.budgetCommitment.update({ where: { id }, data });
  }

  async liquidateBudgetCommitment(tenantId: string, id: string, liquidatedAmount: number) {
    const commitment = await this.getBudgetCommitmentById(tenantId, id);
    const newLiquidated = Number(commitment.liquidatedAmount) + liquidatedAmount;
    const newOutstanding = Number(commitment.amount) - newLiquidated;
    if (newOutstanding < 0) throw new BadRequestException("Liquidated amount exceeds commitment amount");
    return prisma.budgetCommitment.update({
      where: { id },
      data: {
        liquidatedAmount: new Prisma.Decimal(newLiquidated),
        outstandingAmount: new Prisma.Decimal(newOutstanding),
        status: Math.abs(newOutstanding) < 0.01 ? "LIQUIDATED" : "ACTIVE",
      },
    });
  }

  async cancelBudgetCommitment(tenantId: string, id: string, cancelledBy: string) {
    await this.getBudgetCommitmentById(tenantId, id);
    return prisma.budgetCommitment.update({
      where: { id },
      data: { status: "CANCELLED", cancelledBy, cancelledAt: new Date() },
    });
  }

  async deleteBudgetCommitment(tenantId: string, id: string) {
    await this.getBudgetCommitmentById(tenantId, id);
    return prisma.budgetCommitment.delete({ where: { id } });
  }

  async getCommitmentsByBudget(tenantId: string, budgetId: string) {
    return prisma.budgetCommitment.findMany({
      where: { tenantId, budgetId },
      orderBy: { commitmentDate: "desc" },
    });
  }

  async getCommitmentSummary(tenantId: string, orgId: string, budgetId: string) {
    const commitments = await prisma.budgetCommitment.findMany({ where: { tenantId, orgId, budgetId } });
    const totalAmount = commitments.reduce((s, c) => s + Number(c.amount), 0);
    const totalOutstanding = commitments.reduce((s, c) => s + Number(c.outstandingAmount), 0);
    const totalLiquidated = commitments.reduce((s, c) => s + Number(c.liquidatedAmount), 0);
    return {
      budgetId,
      totalCommitments: commitments.length,
      totalAmount,
      totalOutstanding,
      totalLiquidated,
      activeCount: commitments.filter((c) => c.status === "ACTIVE").length,
      liquidatedCount: commitments.filter((c) => c.status === "LIQUIDATED").length,
      cancelledCount: commitments.filter((c) => c.status === "CANCELLED").length,
    };
  }

  // ── Budget Carry-Forward Rules ──────────────────────────────

  async getCarryForwardRules(tenantId: string) {
    return prisma.budgetCarryForwardRule.findMany({ where: { tenantId }, orderBy: { effectiveFrom: "desc" } });
  }

  async getCarryForwardRuleById(tenantId: string, id: string) {
    const r = await prisma.budgetCarryForwardRule.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException("Carry-forward rule not found");
    return r;
  }

  async createCarryForwardRule(tenantId: string, orgId: string, dto: any) {
    return prisma.budgetCarryForwardRule.create({
      data: {
        ...dto, tenantId, orgId,
        carryForwardPct: new Prisma.Decimal(dto.carryForwardPct),
        maxCarryAmount: dto.maxCarryAmount ? new Prisma.Decimal(dto.maxCarryAmount) : null,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async updateCarryForwardRule(tenantId: string, id: string, dto: any) {
    await this.getCarryForwardRuleById(tenantId, id);
    const data: any = { ...dto };
    if (dto.carryForwardPct !== undefined) data.carryForwardPct = new Prisma.Decimal(dto.carryForwardPct);
    if (dto.maxCarryAmount !== undefined) data.maxCarryAmount = dto.maxCarryAmount ? new Prisma.Decimal(dto.maxCarryAmount) : null;
    return prisma.budgetCarryForwardRule.update({ where: { id }, data });
  }

  async deleteCarryForwardRule(tenantId: string, id: string) {
    await this.getCarryForwardRuleById(tenantId, id);
    return prisma.budgetCarryForwardRule.delete({ where: { id } });
  }

  async computeCarryForward(tenantId: string, orgId: string, fromYear: string, toYear: string) {
    const rules = await prisma.budgetCarryForwardRule.findMany({ where: { tenantId, orgId, isActive: true } });
    if (rules.length === 0) throw new BadRequestException("No active carry-forward rules found");
    const budgets = await prisma.budget.findMany({
      where: {
        tenantId, orgId,
        startDate: { gte: new Date(parseInt(fromYear), 0, 1) },
        endDate: { lte: new Date(parseInt(fromYear), 11, 31) },
      },
    });
    const carryForwards: any[] = [];
    for (const budget of budgets) {
      const rule = rules.find((r) => !r.accountType);
      if (!rule) continue;
      const unused = Math.max(0, Number(budget.amount) - 0);
      const carryAmount = Math.min(unused * Number(rule.carryForwardPct), Number(rule.maxCarryAmount || Infinity));
      if (carryAmount > 0) {
        carryForwards.push({ budgetId: budget.id, carryAmount, ruleId: rule.id });
      }
    }
    return { fromYear, toYear, rulesApplied: rules.length, totalCarryForward: carryForwards.reduce((s, c) => s + c.carryAmount, 0), carryForwards };
  }

  // ── Budget Revisions ────────────────────────────────────────

  async getBudgetRevisions(tenantId: string, budgetId?: string) {
    const where: any = { tenantId };
    if (budgetId) where.budgetId = budgetId;
    return prisma.budgetRevision.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getBudgetRevisionById(tenantId: string, id: string) {
    const r = await prisma.budgetRevision.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException("Budget revision not found");
    return r;
  }

  async createBudgetRevision(tenantId: string, orgId: string, dto: any) {
    const budget = await prisma.budget.findFirst({ where: { id: dto.budgetId, tenantId } });
    if (!budget) throw new NotFoundException("Budget not found");
    const previousAmount = Number(budget.amount);
    const revisedAmount = Number(dto.revisedAmount);
    return prisma.budgetRevision.create({
      data: {
        ...dto, tenantId, orgId,
        previousAmount: new Prisma.Decimal(previousAmount),
        revisedAmount: new Prisma.Decimal(revisedAmount),
        changeAmount: new Prisma.Decimal(revisedAmount - previousAmount),
        revisionNumber: dto.revisionNumber || `REV-${Date.now()}`,
      },
    });
  }

  async approveBudgetRevision(tenantId: string, id: string, approvedBy: string) {
    const rev = await this.getBudgetRevisionById(tenantId, id);
    if (rev.status !== "PENDING") throw new BadRequestException("Only pending revisions can be approved");
    await prisma.budgetRevision.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
    return prisma.budget.update({
      where: { id: rev.budgetId },
      data: { amount: new Prisma.Decimal(Number(rev.revisedAmount)) },
    });
  }

  async rejectBudgetRevision(tenantId: string, id: string, rejectedBy: string, rejectionReason?: string) {
    const rev = await this.getBudgetRevisionById(tenantId, id);
    if (rev.status !== "PENDING") throw new BadRequestException("Only pending revisions can be rejected");
    return prisma.budgetRevision.update({
      where: { id },
      data: { status: "REJECTED", rejectedBy, rejectedAt: new Date(), rejectionReason },
    });
  }

  async deleteBudgetRevision(tenantId: string, id: string) {
    await this.getBudgetRevisionById(tenantId, id);
    return prisma.budgetRevision.delete({ where: { id } });
  }

  // ── Multi-Year Planning ───────────────────────────────────

  async getMultiYearPlan(tenantId: string, orgId: string, startYear: string, endYear: string) {
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    const plans: any[] = [];
    for (let year = start; year <= end; year++) {
      const budgets = await prisma.budget.findMany({
        where: {
          tenantId, orgId,
          startDate: { gte: new Date(year, 0, 1) },
          endDate: { lte: new Date(year, 11, 31) },
        },
      });
      plans.push({
        fiscalYear: String(year),
        budgetCount: budgets.length,
        totalBudget: budgets.reduce((s, b) => s + Number(b.amount), 0),
      });
    }
    return { startYear, endYear, plans };
  }

  async getBudgetDeepDashboard(tenantId: string, orgId: string) {
    const templates = await prisma.budgetTemplate.findMany({ where: { tenantId, orgId } });
    const commitments = await prisma.budgetCommitment.findMany({ where: { tenantId, orgId } });
    const revisions = await prisma.budgetRevision.findMany({ where: { tenantId, orgId } });
    const activeRules = await prisma.budgetCarryForwardRule.count({ where: { tenantId, orgId, isActive: true } });
    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter((t) => t.status === "ACTIVE").length,
      totalCommitments: commitments.length,
      totalCommitmentAmount: commitments.reduce((s, c) => s + Number(c.amount), 0),
      outstandingCommitments: commitments.filter((c) => c.status === "ACTIVE").reduce((s, c) => s + Number(c.outstandingAmount), 0),
      pendingRevisions: revisions.filter((r) => r.status === "PENDING").length,
      approvedRevisions: revisions.filter((r) => r.status === "APPROVED").length,
      activeCarryForwardRules: activeRules,
    };
  }
}
