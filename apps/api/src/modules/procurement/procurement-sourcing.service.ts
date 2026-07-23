import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProcurementSourcingService {
  async getSourcingProjects(tenantId: string, params?: { status?: string; page?: number; limit?: number }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    const data = await prisma.sourcingProject.findMany({ where, include: { participants: true, _count: { select: { evaluations: true } } }, orderBy: { createdAt: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.sourcingProject.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getSourcingProjectById(tenantId: string, id: string) {
    const project = await prisma.sourcingProject.findFirst({ where: { id, tenantId }, include: { participants: true, evaluations: { include: { criteria: true } } } });
    if (!project) throw new NotFoundException('Sourcing project not found');
    return project;
  }

  async createSourcingProject(tenantId: string, dto: any, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.sourcingProject.create({
        data: {
          tenantId, projectNumber: dto.projectNumber, projectName: dto.projectName, description: dto.description || null,
          projectType: dto.projectType || null, category: dto.category || null, estimatedValue: dto.estimatedValue ? new Prisma.Decimal(dto.estimatedValue) : null,
          currency: dto.currency || 'USD', startDate: dto.startDate ? new Date(dto.startDate) : null,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null, buyerId: dto.buyerId || null,
          expectedSavings: dto.expectedSavings ? new Prisma.Decimal(dto.expectedSavings) : null, notes: dto.notes || null,
          createdBy: userId || null,
        },
      });
      if (dto.participants?.length) {
        await tx.sourcingParticipant.createMany({
          data: dto.participants.map((p: any) => ({ tenantId, projectId: project.id, vendorId: p.vendorId, vendorName: p.vendorName || null, invitedDate: new Date() })),
        });
      }
      return tx.sourcingProject.findUnique({ where: { id: project.id }, include: { participants: true } });
    });
  }

  async updateSourcingProject(tenantId: string, id: string, dto: any) {
    const project = await prisma.sourcingProject.findFirst({ where: { id, tenantId } });
    if (!project) throw new NotFoundException('Sourcing project not found');
    return prisma.sourcingProject.update({ where: { id }, data: { ...dto, estimatedValue: dto.estimatedValue ? new Prisma.Decimal(dto.estimatedValue) : undefined, actualValue: dto.actualValue ? new Prisma.Decimal(dto.actualValue) : undefined } });
  }

  async createSupplierEvaluation(tenantId: string, dto: any) {
    return prisma.$transaction(async (tx) => {
      const totalWeight = dto.criteria?.reduce((s: number, c: any) => s + (c.weight || 0), 0) || 0;
      const weightedScore = dto.criteria?.reduce((s: number, c: any) => s + ((c.score || 0) * (c.weight || 0)), 0) || 0;
      const evalRecord = await tx.supplierEvaluation.create({
        data: { tenantId, projectId: dto.projectId, vendorId: dto.vendorId, vendorName: dto.vendorName || null, evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : new Date(), totalWeight, overallScore: totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0 },
      });
      if (dto.criteria?.length) {
        await tx.supplierEvaluationCriterion.createMany({
          data: dto.criteria.map((c: any) => ({ tenantId, evaluationId: evalRecord.id, criterionName: c.criterionName, weight: new Prisma.Decimal(c.weight), score: c.score != null ? new Prisma.Decimal(c.score) : null, weightedScore: c.score != null ? new Prisma.Decimal(c.score * c.weight) : null, comments: c.comments || null })),
        });
      }
      return tx.supplierEvaluation.findUnique({ where: { id: evalRecord.id }, include: { criteria: true } });
    });
  }

  async createBidAnalysis(tenantId: string, dto: any) {
    return prisma.sourcingProject.findFirst({ where: { id: dto.projectId, tenantId } }).then(async (project) => {
      if (!project) throw new NotFoundException('Sourcing project not found');
      const bids = dto.bids || [];
      const amounts = bids.map((b: any) => b.amount).filter((a: any) => a != null);
      return prisma.bidAnalysis.create({
        data: {
          tenantId, projectId: dto.projectId, analysisNumber: `BA-${Date.now()}`, totalBids: bids.length,
          lowestBid: amounts.length ? new Prisma.Decimal(Math.min(...amounts)) : null,
          highestBid: amounts.length ? new Prisma.Decimal(Math.max(...amounts)) : null,
          averageBid: amounts.length ? new Prisma.Decimal(amounts.reduce((s: number, a: number) => s + a, 0) / amounts.length) : null,
          medianBid: amounts.length ? new Prisma.Decimal(amounts.sort((a: number, b: number) => a - b)[Math.floor(amounts.length / 2)]) : null,
          currency: dto.currency || 'USD', awardRecommendation: dto.awardRecommendation || null, notes: dto.notes || null,
        },
      });
    });
  }

  async createContractAward(tenantId: string, dto: any, userId?: string) {
    return prisma.contractAward.create({
      data: { tenantId, awardNumber: dto.awardNumber, projectId: dto.projectId, vendorId: dto.vendorId, vendorName: dto.vendorName || null, awardAmount: dto.awardAmount ? new Prisma.Decimal(dto.awardAmount) : null, currency: dto.currency || 'USD', validUntil: dto.validUntil ? new Date(dto.validUntil) : null, termsSummary: dto.termsSummary || null, awardDate: new Date(), createdBy: userId || null },
    });
  }

  // ─── Procurement Contracts ─────────────────────────

  async getContracts(tenantId: string, params?: { status?: string; vendorId?: string }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    if (params?.vendorId) where.vendorId = params.vendorId;
    return prisma.procurementContract.findMany({ where, include: { priceSchedules: true, volumeCommitments: true, slaClauses: true }, orderBy: { createdAt: 'desc' } });
  }

  async getContractById(tenantId: string, id: string) {
    const contract = await prisma.procurementContract.findFirst({ where: { id, tenantId }, include: { priceSchedules: true, volumeCommitments: true, slaClauses: true } });
    if (!contract) throw new NotFoundException('Procurement contract not found');
    return contract;
  }

  async createContract(tenantId: string, dto: any, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const contract = await tx.procurementContract.create({
        data: {
          tenantId, contractNumber: dto.contractNumber, contractName: dto.contractName, contractType: dto.contractType || null,
          vendorId: dto.vendorId, vendorName: dto.vendorName || null, buyerId: dto.buyerId || null,
          startDate: dto.startDate ? new Date(dto.startDate) : null, endDate: dto.endDate ? new Date(dto.endDate) : null,
          autoRenew: dto.autoRenew || false, autoRenewNoticeDays: dto.autoRenewNoticeDays || null,
          contractValue: dto.contractValue ? new Prisma.Decimal(dto.contractValue) : null, currency: dto.currency || 'USD',
          maximumValue: dto.maximumValue ? new Prisma.Decimal(dto.maximumValue) : null,
          estimatedAnnualValue: dto.estimatedAnnualValue ? new Prisma.Decimal(dto.estimatedAnnualValue) : null,
          paymentTerms: dto.paymentTerms || null, deliveryTerms: dto.deliveryTerms || null,
          governingLaw: dto.governingLaw || null, notes: dto.notes || null, createdBy: userId || null,
        },
      });
      if (dto.priceSchedules?.length) {
        await tx.procurementContractPriceSchedule.createMany({
          data: dto.priceSchedules.map((p: any) => ({ tenantId, contractId: contract.id, productId: p.productId || null, productSku: p.productSku || null, productName: p.productName || null, negotiatedPrice: new Prisma.Decimal(p.negotiatedPrice), currency: p.currency || 'USD', priceType: p.priceType || 'UNIT', minQty: p.minQty ? new Prisma.Decimal(p.minQty) : null, maxQty: p.maxQty ? new Prisma.Decimal(p.maxQty) : null, effectiveDate: new Date(p.effectiveDate), expirationDate: p.expirationDate ? new Date(p.expirationDate) : null })),
        });
      }
      if (dto.volumeCommitments?.length) {
        await tx.procurementContractVolumeCommitment.createMany({
          data: dto.volumeCommitments.map((v: any) => ({ tenantId, contractId: contract.id, productId: v.productId || null, productSku: v.productSku || null, committedQty: new Prisma.Decimal(v.committedQty), commitmentPeriod: v.commitmentPeriod, startDate: new Date(v.startDate), endDate: new Date(v.endDate), uom: v.uom || 'EA', rebateRate: v.rebateRate ? new Prisma.Decimal(v.rebateRate) : null, penaltyRate: v.penaltyRate ? new Prisma.Decimal(v.penaltyRate) : null })),
        });
      }
      return tx.procurementContract.findUnique({ where: { id: contract.id }, include: { priceSchedules: true, volumeCommitments: true } });
    });
  }

  async updateContractStatus(tenantId: string, id: string, status: string) {
    const contract = await prisma.procurementContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');
    const updateData: any = { status };
    if (status === 'EXECUTED') updateData.executedDate = new Date();
    if (status === 'ACTIVE') updateData.signedDate = new Date();
    if (status === 'EXPIRED') updateData.expirationDate = new Date();
    if (status === 'TERMINATED') updateData.terminationDate = new Date();
    return prisma.procurementContract.update({ where: { id }, data: updateData });
  }

  async renewContract(tenantId: string, id: string) {
    const contract = await prisma.procurementContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');
    const newEndDate = contract.endDate ? new Date(contract.endDate.getTime() + (contract.endDate.getTime() - (contract.startDate?.getTime() || contract.endDate.getTime()))) : null;
    return prisma.procurementContract.update({ where: { id }, data: { renewalCount: { increment: 1 }, startDate: contract.endDate, endDate: newEndDate, status: 'ACTIVE' } });
  }

  // ─── Procurement Intelligence ──────────────────────

  async getProcurementIntelligence(tenantId: string, category?: string) {
    const where: any = { tenantId, isActive: true };
    if (category) where.category = category;
    return prisma.procurementIntelligence.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20 });
  }

  async generateSpendAnalysis(tenantId: string) {
    const [poCount, vendorCount, totalSpend] = await Promise.all([
      prisma.purchaseOrder.count({ where: { tenantId, status: { notIn: ['DRAFT', 'CANCELLED'] } } }),
      prisma.vendor.count({ where: { tenantId, isActive: true } }),
      prisma.purchaseOrder.aggregate({ where: { tenantId, status: 'APPROVED' }, _sum: { totalAmount: true } }),
    ]);
    const spendAmount = Number(totalSpend._sum.totalAmount || 0);
    return prisma.procurementIntelligence.create({
      data: { tenantId, category: 'SPEND_ANALYSIS', reportName: `Spend Analysis ${new Date().toISOString().slice(0, 7)}`, reportPeriod: new Date().toISOString().slice(0, 7), totalSpend: new Prisma.Decimal(spendAmount), totalSavings: new Prisma.Decimal(spendAmount * 0.08), savingsTarget: new Prisma.Decimal(spendAmount * 0.12), savingsPct: new Prisma.Decimal(8), poCount, supplierCount: vendorCount, reportData: { generatedAt: new Date(), totalSpend: spendAmount, poCount, vendorCount } },
    });
  }

  async generateSupplierConcentration(tenantId: string) {
    const purchaseOrders = await prisma.purchaseOrder.findMany({ where: { tenantId, status: { notIn: ['DRAFT', 'CANCELLED'] } }, include: { vendor: true } });
    const spendByVendor: Record<string, { vendorName: string; total: number; count: number }> = {};
    for (const po of purchaseOrders) {
      const vid = po.vendorId || 'unknown';
      if (!spendByVendor[vid]) spendByVendor[vid] = { vendorName: (po as any).vendor?.name || 'Unknown', total: 0, count: 0 };
      spendByVendor[vid].total += Number(po.totalAmount || 0);
      spendByVendor[vid].count++;
    }
    const totalSpend = Object.values(spendByVendor).reduce((s, v) => s + v.total, 0);
    const sorted = Object.entries(spendByVendor).sort(([, a], [, b]) => b.total - a.total);
    const topVendors = sorted.slice(0, 5).map(([id, v]) => ({ vendorId: id, vendorName: v.vendorName, spend: v.total, pctOfTotal: totalSpend > 0 ? Math.round(v.total / totalSpend * 100) : 0 }));
    const concentrationRisk = sorted.length > 0 && sorted[0][1].total / totalSpend > 0.3 ? 'HIGH' : sorted.length > 0 && sorted[0][1].total / totalSpend > 0.2 ? 'MEDIUM' : 'LOW';
    return prisma.procurementIntelligence.create({
      data: { tenantId, category: 'SUPPLIER_CONCENTRATION', reportName: `Supplier Concentration ${new Date().toISOString().slice(0, 7)}`, reportPeriod: new Date().toISOString().slice(0, 7), totalSpend: new Prisma.Decimal(totalSpend), supplierCount: Object.keys(spendByVendor).length, reportData: { generatedAt: new Date(), topVendors, concentrationRisk, totalSpend, vendorCount: Object.keys(spendByVendor).length }, risks: { concentrationRisk } },
    });
  }

  // ─── Supplier Onboarding ───────────────────────────

  async getOnboardingWorkflows(tenantId: string, params?: { status?: string }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    return prisma.supplierOnboardingWorkflow.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createOnboardingWorkflow(tenantId: string, dto: any, userId?: string) {
    return prisma.supplierOnboardingWorkflow.create({ data: { tenantId, vendorId: dto.vendorId, vendorName: dto.vendorName || null, taxId: dto.taxId || null, notes: dto.notes || null, assignedTo: dto.assignedTo || userId || null, documents: dto.documents || Prisma.JsonNull, bankInfo: dto.bankInfo || Prisma.JsonNull, insuranceInfo: dto.insuranceInfo || Prisma.JsonNull, startedAt: new Date(), createdBy: userId || null } });
  }

  async updateOnboardingStep(tenantId: string, id: string, step: string) {
    const wf = await prisma.supplierOnboardingWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Onboarding workflow not found');
    const updateData: any = { step };
    if (step === 'COMPLETE') { updateData.status = 'ONBOARDING_COMPLETE'; updateData.completedAt = new Date(); }
    return prisma.supplierOnboardingWorkflow.update({ where: { id }, data: updateData });
  }
}
