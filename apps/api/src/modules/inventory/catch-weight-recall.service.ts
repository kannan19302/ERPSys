import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class CatchWeightRecallService {
  // ── Catch-Weight Config ───────────────────────────────────────

  async listConfigs(tenantId: string) {
    return prisma.catchWeightConfig.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getConfig(tenantId: string, id: string) {
    const cfg = await prisma.catchWeightConfig.findFirst({ where: { tenantId, id } });
    if (!cfg) throw new NotFoundException(`CatchWeightConfig ${id} not found`);
    return cfg;
  }

  async upsertConfig(tenantId: string, data: {
    productId: string;
    nominalWeightKg: number;
    tolerancePctPlus?: number;
    tolerancePctMinus?: number;
    pricingBasis?: string;
    tareWeightKg?: number;
    uomNominal?: string;
    uomWeight?: string;
  }) {
    const { productId, nominalWeightKg, tolerancePctPlus = 5, tolerancePctMinus = 5,
      pricingBasis = 'ACTUAL_WEIGHT', tareWeightKg = 0,
      uomNominal = 'UNIT', uomWeight = 'KG' } = data;
    return prisma.catchWeightConfig.upsert({
      where: { tenantId_productId: { tenantId, productId } },
      create: {
        tenantId, productId,
        nominalWeightKg: new Prisma.Decimal(nominalWeightKg),
        tolerancePctPlus: new Prisma.Decimal(tolerancePctPlus),
        tolerancePctMinus: new Prisma.Decimal(tolerancePctMinus),
        pricingBasis, tareWeightKg: new Prisma.Decimal(tareWeightKg),
        uomNominal, uomWeight,
      },
      update: {
        nominalWeightKg: new Prisma.Decimal(nominalWeightKg),
        tolerancePctPlus: new Prisma.Decimal(tolerancePctPlus),
        tolerancePctMinus: new Prisma.Decimal(tolerancePctMinus),
        pricingBasis, tareWeightKg: new Prisma.Decimal(tareWeightKg),
        uomNominal, uomWeight,
      },
    });
  }

  async deactivateConfig(tenantId: string, id: string) {
    await this.getConfig(tenantId, id);
    return prisma.catchWeightConfig.update({ where: { id }, data: { active: false } });
  }

  // ── Catch-Weight Readings ─────────────────────────────────────

  async captureReading(tenantId: string, capturedBy: string, data: {
    productId: string;
    referenceType: string;
    referenceId: string;
    nominalQty: number;
    actualWeightKg: number;
    lotNumber?: string;
    serialNumber?: string;
    scaleId?: string;
  }) {
    const cfg = await prisma.catchWeightConfig.findFirst({ where: { tenantId, productId: data.productId, active: true } });
    if (!cfg) throw new NotFoundException(`No active catch-weight config for product ${data.productId}`);

    const netWeightKg = data.actualWeightKg - Number(cfg.tareWeightKg);
    const nominalExpected = data.nominalQty * Number(cfg.nominalWeightKg);
    const varianceKg = netWeightKg - nominalExpected;
    const variancePct = nominalExpected > 0 ? (varianceKg / nominalExpected) * 100 : 0;

    let varianceStatus: string;
    if (variancePct > Number(cfg.tolerancePctPlus)) varianceStatus = 'OVER_TOLERANCE';
    else if (variancePct < -Number(cfg.tolerancePctMinus)) varianceStatus = 'UNDER_TOLERANCE';
    else varianceStatus = 'WITHIN_TOLERANCE';

    return prisma.catchWeightReading.create({
      data: {
        tenantId,
        configId: cfg.id,
        capturedBy,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        nominalQty: new Prisma.Decimal(data.nominalQty),
        actualWeightKg: new Prisma.Decimal(data.actualWeightKg),
        varianceKg: new Prisma.Decimal(varianceKg),
        variancePct: new Prisma.Decimal(variancePct),
        varianceStatus: varianceStatus as any,
        lotNumber: data.lotNumber,
        serialNumber: data.serialNumber,
        scaleId: data.scaleId,
      },
    });
  }

  async listReadings(tenantId: string, configId?: string, varianceStatus?: string) {
    return prisma.catchWeightReading.findMany({
      where: {
        tenantId,
        ...(configId ? { configId } : {}),
        ...(varianceStatus ? { varianceStatus: varianceStatus as any } : {}),
      },
      orderBy: { capturedAt: 'desc' },
      take: 200,
    });
  }

  async getVarianceSummary(tenantId: string, configId: string) {
    const readings = await prisma.catchWeightReading.groupBy({
      by: ['varianceStatus'],
      where: { tenantId, configId },
      _count: true,
      _avg: { variancePct: true },
    });
    const total = readings.reduce((s, r) => s + r._count, 0);
    return { configId, total, breakdown: readings.map(r => ({
      status: r.varianceStatus,
      count: r._count,
      avgVariancePct: r._avg.variancePct,
    })) };
  }

  // ── Tare Library ──────────────────────────────────────────────

  async listTares(tenantId: string) {
    return prisma.catchWeightTare.findMany({ where: { tenantId }, orderBy: { containerLabel: 'asc' } });
  }

  async upsertTare(tenantId: string, data: { containerLabel: string; tareWeightKg: number; description?: string }) {
    return prisma.catchWeightTare.upsert({
      where: { tenantId_containerLabel: { tenantId, containerLabel: data.containerLabel } },
      create: { tenantId, ...data, tareWeightKg: new Prisma.Decimal(data.tareWeightKg) },
      update: { tareWeightKg: new Prisma.Decimal(data.tareWeightKg), description: data.description },
    });
  }

  // ── Product Recalls ───────────────────────────────────────────

  async listRecalls(tenantId: string, status?: string) {
    return prisma.productRecall.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: {
        affectedStock: { select: { id: true, qtyAffected: true, qtyRecovered: true } },
        customerNotices: { select: { id: true, acknowledgedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getRecall(tenantId: string, id: string) {
    const recall = await prisma.productRecall.findFirst({
      where: { tenantId, id },
      include: {
        affectedStock: true,
        customerNotices: true,
        disposalRecords: true,
      },
    });
    if (!recall) throw new NotFoundException(`ProductRecall ${id} not found`);
    return recall;
  }

  async createRecall(tenantId: string, createdBy: string, data: {
    recallNumber: string;
    productId: string;
    recallClass: string;
    title: string;
    reason: string;
    actionRequired: string;
    regulatoryRef?: string;
    affectedLotNumbers?: string[];
    affectedSerials?: string[];
    affectedDateFrom?: string;
    affectedDateTo?: string;
    deadlineAt?: string;
  }) {
    return prisma.productRecall.create({
      data: {
        tenantId, createdBy,
        status: 'DRAFT',
        totalUnitsAffected: 0,
        totalUnitsRecovered: 0,
        affectedLotNumbers: data.affectedLotNumbers ?? [],
        affectedSerials: data.affectedSerials ?? [],
        recallNumber: data.recallNumber,
        productId: data.productId,
        recallClass: data.recallClass as any,
        title: data.title,
        reason: data.reason,
        actionRequired: data.actionRequired as any,
        regulatoryRef: data.regulatoryRef,
        affectedDateFrom: data.affectedDateFrom ? new Date(data.affectedDateFrom) : null,
        affectedDateTo: data.affectedDateTo ? new Date(data.affectedDateTo) : null,
        deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : null,
      },
    });
  }

  async issueRecall(tenantId: string, id: string) {
    await this.requireRecall(tenantId, id, ['DRAFT']);
    return prisma.productRecall.update({
      where: { id },
      data: { status: 'ISSUED', issuedAt: new Date() },
    });
  }

  async addAffectedStock(tenantId: string, recallId: string, data: {
    warehouseId: string;
    qtyAffected: number;
    lotNumber?: string;
    serialNumber?: string;
    locationBin?: string;
  }) {
    await this.requireRecall(tenantId, recallId, ['ISSUED', 'IN_PROGRESS']);
    await prisma.productRecall.update({
      where: { id: recallId },
      data: {
        status: 'IN_PROGRESS',
        totalUnitsAffected: { increment: Math.ceil(data.qtyAffected) },
      },
    });
    return prisma.recallAffectedStock.create({
      data: {
        tenantId, recallId,
        warehouseId: data.warehouseId,
        qtyAffected: new Prisma.Decimal(data.qtyAffected),
        qtyQuarantined: new Prisma.Decimal(0),
        qtyRecovered: new Prisma.Decimal(0),
        lotNumber: data.lotNumber,
        serialNumber: data.serialNumber,
        locationBin: data.locationBin,
      },
    });
  }

  async quarantineStock(tenantId: string, recallId: string, stockId: string, qty: number) {
    await this.requireRecall(tenantId, recallId, ['IN_PROGRESS']);
    const stock = await prisma.recallAffectedStock.findFirst({ where: { id: stockId, recallId } });
    if (!stock) throw new NotFoundException(`RecallAffectedStock ${stockId} not found`);
    return prisma.recallAffectedStock.update({
      where: { id: stockId },
      data: { qtyQuarantined: new Prisma.Decimal(qty), quarantinedAt: new Date() },
    });
  }

  async addCustomerNotice(tenantId: string, recallId: string, data: {
    customerId: string;
    customerName: string;
    qtyShipped: number;
    contactEmail?: string;
    notes?: string;
  }) {
    await this.requireRecall(tenantId, recallId, ['ISSUED', 'IN_PROGRESS']);
    return prisma.recallCustomerNotice.create({
      data: {
        tenantId, recallId,
        customerId: data.customerId,
        customerName: data.customerName,
        qtyShipped: new Prisma.Decimal(data.qtyShipped),
        qtyReturned: new Prisma.Decimal(0),
        contactEmail: data.contactEmail,
        notes: data.notes,
      },
    });
  }

  async sendNotices(tenantId: string, recallId: string) {
    await this.requireRecall(tenantId, recallId, ['ISSUED', 'IN_PROGRESS']);
    const now = new Date();
    await prisma.recallCustomerNotice.updateMany({
      where: { recallId, noticeSentAt: null },
      data: { noticeSentAt: now },
    });
    await prisma.productRecall.update({
      where: { id: recallId },
      data: { notifiedAt: now, status: 'IN_PROGRESS' },
    });
    return { sent: true, sentAt: now };
  }

  async acknowledgeCustomerNotice(_tenantId: string, recallId: string, noticeId: string, qtyReturned?: number) {
    const notice = await prisma.recallCustomerNotice.findFirst({ where: { id: noticeId, recallId } });
    if (!notice) throw new NotFoundException(`RecallCustomerNotice ${noticeId} not found`);
    return prisma.recallCustomerNotice.update({
      where: { id: noticeId },
      data: {
        acknowledgedAt: new Date(),
        ...(qtyReturned !== undefined ? { qtyReturned: new Prisma.Decimal(qtyReturned) } : {}),
      },
    });
  }

  async addDisposalRecord(tenantId: string, recallId: string, authorizedBy: string, data: {
    actionType: string;
    qtyProcessed: number;
    disposalMethod?: string;
    certificateRef?: string;
    notes?: string;
  }) {
    await this.requireRecall(tenantId, recallId, ['IN_PROGRESS']);
    const record = await prisma.recallDisposalRecord.create({
      data: {
        tenantId, recallId, authorizedBy,
        actionType: data.actionType as any,
        qtyProcessed: new Prisma.Decimal(data.qtyProcessed),
        disposalMethod: data.disposalMethod,
        certificateRef: data.certificateRef,
        notes: data.notes,
      },
    });
    await prisma.productRecall.update({
      where: { id: recallId },
      data: { totalUnitsRecovered: { increment: Math.ceil(data.qtyProcessed) } },
    });
    return record;
  }

  async completeRecall(tenantId: string, id: string) {
    await this.requireRecall(tenantId, id, ['IN_PROGRESS']);
    return prisma.productRecall.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async cancelRecall(tenantId: string, id: string) {
    await this.requireRecall(tenantId, id, ['DRAFT', 'ISSUED', 'IN_PROGRESS']);
    return prisma.productRecall.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getRecallImpactReport(tenantId: string, id: string) {
    const recall = await this.getRecall(tenantId, id);
    const totalAffected = recall.affectedStock.reduce((s, r) => s + Number(r.qtyAffected), 0);
    const totalQuarantined = recall.affectedStock.reduce((s, r) => s + Number((r as any).qtyQuarantined), 0);
    const totalRecovered = Number(recall.totalUnitsRecovered);
    const noticesTotal = recall.customerNotices.length;
    const noticesSent = recall.customerNotices.filter((n: any) => n.noticeSentAt).length;
    const noticesAcknowledged = recall.customerNotices.filter((n: any) => n.acknowledgedAt).length;

    return {
      recallId: id,
      recallNumber: recall.recallNumber,
      status: recall.status,
      recallClass: recall.recallClass,
      totalUnitsAffected: totalAffected,
      totalUnitsQuarantined: totalQuarantined,
      totalUnitsRecovered: totalRecovered,
      recoveryRate: totalAffected > 0 ? ((totalRecovered / totalAffected) * 100).toFixed(1) : '0.0',
      affectedStockLocations: recall.affectedStock.length,
      customerNotices: { total: noticesTotal, sent: noticesSent, acknowledged: noticesAcknowledged },
      disposalActions: recall.disposalRecords.length,
    };
  }

  async getDashboard(tenantId: string) {
    const [recallByStatus, configs, outOfTolerance] = await Promise.all([
      prisma.productRecall.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      prisma.catchWeightConfig.count({ where: { tenantId, active: true } }),
      prisma.catchWeightReading.count({
        where: { tenantId, varianceStatus: { in: ['OVER_TOLERANCE', 'UNDER_TOLERANCE'] as any[] } },
      }),
    ]);
    const recallMap = Object.fromEntries(recallByStatus.map(r => [r.status, r._count]));
    return {
      catchWeightConfigs: configs,
      outOfToleranceReadings: outOfTolerance,
      recalls: {
        draft: recallMap['DRAFT'] ?? 0,
        issued: recallMap['ISSUED'] ?? 0,
        inProgress: recallMap['IN_PROGRESS'] ?? 0,
        completed: recallMap['COMPLETED'] ?? 0,
      },
    };
  }

  // ── Private helpers ───────────────────────────────────────────

  private async requireRecall(tenantId: string, id: string, allowedStatuses: string[]) {
    const recall = await prisma.productRecall.findFirst({ where: { tenantId, id } });
    if (!recall) throw new NotFoundException(`ProductRecall ${id} not found`);
    if (!allowedStatuses.includes(recall.status)) {
      throw new BadRequestException(`Recall is in status ${recall.status}; expected one of ${allowedStatuses.join(', ')}`);
    }
    return recall;
  }
}
