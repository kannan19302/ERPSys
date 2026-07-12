import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryLaborService } from '../inventory-labor.service';
import { SupplierQualityService } from '../supplier-quality.service';
import { InventoryAutomationService } from '../inventory-automation.service';
import { InventoryAnalyticsService } from '../inventory-analytics.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

vi.mock('@unerp/database', () => ({
  prisma: {
    laborStandard: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    workerTaskLog: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    warehouseShiftTemplate: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    supplierScorecard: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    supplierNcr: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    supplierCarRequest: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    binReplenishmentRule: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    inventoryHold: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    inventoryItemBin: { findFirst: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    stockLedgerEntry: { groupBy: vi.fn(), findMany: vi.fn() },
    product: { count: vi.fn() },
    pickWave: { findMany: vi.fn() },
    warehouse: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const TENANT = 'tenant-1';

// ─── Labor Service ────────────────────────────────────────────────────────────

describe('InventoryLaborService', () => {
  let svc: InventoryLaborService;

  beforeEach(() => {
    svc = new InventoryLaborService();
    vi.clearAllMocks();
  });

  it('listLaborStandards: returns active standards', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.laborStandard.findMany).mockResolvedValue([{ id: 's1', taskType: 'PICK' }] as never);
    const res = await svc.listLaborStandards(TENANT);
    expect(prisma.laborStandard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, isActive: true }) })
    );
    expect(res).toHaveLength(1);
  });

  it('createLaborStandard: throws on duplicate taskType', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.laborStandard.findFirst).mockResolvedValue({ id: 'existing' } as never);
    await expect(svc.createLaborStandard(TENANT, { taskType: 'PICK', standardMins: 5 }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('createLaborStandard: creates when no duplicate', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.laborStandard.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.laborStandard.create).mockResolvedValue({ id: 'new', taskType: 'PICK' } as never);
    const res = await svc.createLaborStandard(TENANT, { taskType: 'PICK', standardMins: 5 });
    expect(res).toHaveProperty('id', 'new');
  });

  it('deleteLaborStandard: throws when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.laborStandard.findFirst).mockResolvedValue(null);
    await expect(svc.deleteLaborStandard(TENANT, 'x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteLaborStandard: soft-deletes when found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.laborStandard.findFirst).mockResolvedValue({ id: 's1' } as never);
    vi.mocked(prisma.laborStandard.update).mockResolvedValue({ id: 's1', isActive: false } as never);
    await svc.deleteLaborStandard(TENANT, 's1');
    expect(prisma.laborStandard.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
  });

  it('logTask: creates task log record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.laborStandard.findFirst).mockResolvedValue({ standardMins: new Prisma.Decimal(10) } as never);
    vi.mocked(prisma.workerTaskLog.create).mockResolvedValue({ id: 'log1' } as never);
    const res = await svc.logTask(TENANT, {
      workerId: 'w1', workerName: 'Alice', warehouseId: 'wh1', taskType: 'PICK',
      startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    });
    expect(res).toHaveProperty('id', 'log1');
  });

  it('listShiftTemplates: queries warehouseShiftTemplate', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.warehouseShiftTemplate.findMany).mockResolvedValue([] as never);
    await svc.listShiftTemplates(TENANT);
    expect(prisma.warehouseShiftTemplate.findMany).toHaveBeenCalled();
  });

  it('createShiftTemplate: creates correctly', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.warehouseShiftTemplate.create).mockResolvedValue({ id: 'st1' } as never);
    const res = await svc.createShiftTemplate(TENANT, {
      warehouseId: 'wh1', shiftName: 'Morning', dayOfWeek: 1, startTime: '06:00', endTime: '14:00', headcount: 5,
    });
    expect(res).toHaveProperty('id', 'st1');
  });

  it('getLaborDashboard: returns period and stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.workerTaskLog.count).mockResolvedValue(20 as never);
    vi.mocked(prisma.workerTaskLog.groupBy)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);
    const res = await svc.getLaborDashboard(TENANT);
    expect(res).toHaveProperty('period');
    expect(res).toHaveProperty('totalTasks');
  });
});

// ─── Supplier Quality Service ─────────────────────────────────────────────────

describe('SupplierQualityService', () => {
  let svc: SupplierQualityService;

  beforeEach(() => {
    svc = new SupplierQualityService();
    vi.clearAllMocks();
  });

  it('createNcr: generates ncrNumber and creates record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.create).mockResolvedValue({ id: 'ncr1', ncrNumber: 'NCR-001' } as never);
    const res = await svc.createNcr(TENANT, {
      vendorId: 'v1', defectType: 'DIMENSIONAL', severity: 'MINOR', description: 'test', defectQty: 1, totalQty: 10,
    });
    expect(prisma.supplierNcr.create).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'ncr1');
  });

  it('closeNcr: throws when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.findFirst).mockResolvedValue(null);
    await expect(svc.closeNcr(TENANT, 'x', 'resolved')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('closeNcr: throws when already CLOSED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.findFirst).mockResolvedValue({ id: 'n1', status: 'CLOSED' } as never);
    await expect(svc.closeNcr(TENANT, 'n1', 'notes')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closeNcr: marks CLOSED when open', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.findFirst).mockResolvedValue({ id: 'n1', status: 'OPEN' } as never);
    vi.mocked(prisma.supplierNcr.update).mockResolvedValue({ id: 'n1', status: 'CLOSED' } as never);
    await svc.closeNcr(TENANT, 'n1', 'notes');
    expect(prisma.supplierNcr.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED' }) })
    );
  });

  it('createCar: throws if NCR not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.findFirst).mockResolvedValue(null);
    await expect(svc.createCar(TENANT, { ncrId: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createCar: uses $transaction and returns car', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.findFirst).mockResolvedValue({ id: 'n1', status: 'OPEN' } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: 'car1' }, {}] as any);
    vi.mocked(prisma.supplierCarRequest.create).mockResolvedValue({ id: 'car1' } as never);
    vi.mocked(prisma.supplierNcr.update).mockResolvedValue({} as never);
    const res = await svc.createCar(TENANT, { ncrId: 'n1' });
    expect(res).toHaveProperty('id', 'car1');
  });

  it('createScorecard: calls create with overallScore', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierScorecard.create).mockResolvedValue({ id: 'sc1' } as never);
    const res = await svc.createScorecard(TENANT, {
      vendorId: 'v1',
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      qualityScore: 90,
      deliveryScore: 80,
    });
    expect(prisma.supplierScorecard.create).toHaveBeenCalled();
  });

  it('getQualityDashboard: returns totalNcrs and recentScorecards', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.supplierNcr.count).mockResolvedValue(5 as never);
    vi.mocked(prisma.supplierCarRequest.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.supplierScorecard.findMany).mockResolvedValue([] as never);
    const res = await svc.getQualityDashboard(TENANT);
    expect(res).toHaveProperty('totalNcrs');
    expect(res).toHaveProperty('recentScorecards');
  });
});

// ─── Automation Service ───────────────────────────────────────────────────────

describe('InventoryAutomationService', () => {
  let svc: InventoryAutomationService;

  beforeEach(() => {
    svc = new InventoryAutomationService();
    vi.clearAllMocks();
  });

  it('createReplenishmentRule: throws on duplicate', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.findFirst).mockResolvedValue({ id: 'existing' } as never);
    await expect(svc.createReplenishmentRule(TENANT, {
      warehouseId: 'wh1', productId: 'p1', activeBinCode: 'A1', reserveBinCode: 'R1', triggerQty: 10, replenishQty: 50,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createReplenishmentRule: creates when no duplicate', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.binReplenishmentRule.create).mockResolvedValue({ id: 'r1' } as never);
    const res = await svc.createReplenishmentRule(TENANT, {
      warehouseId: 'wh1', productId: 'p1', activeBinCode: 'A1', reserveBinCode: 'R1', triggerQty: 10, replenishQty: 50,
    });
    expect(res).toHaveProperty('id', 'r1');
  });

  it('deleteReplenishmentRule: throws when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.findFirst).mockResolvedValue(null);
    await expect(svc.deleteReplenishmentRule(TENANT, 'x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteReplenishmentRule: soft-deletes', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.findFirst).mockResolvedValue({ id: 'r1' } as never);
    vi.mocked(prisma.binReplenishmentRule.update).mockResolvedValue({ id: 'r1', isActive: false } as never);
    await svc.deleteReplenishmentRule(TENANT, 'r1');
    expect(prisma.binReplenishmentRule.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
  });

  it('evaluateReplenishmentRules: triggers when qty below threshold', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.findMany).mockResolvedValue([
      { id: 'r1', productId: 'p1', activeBinCode: 'A1', triggerQty: new Prisma.Decimal(10) },
    ] as never);
    vi.mocked(prisma.inventoryItemBin.findFirst).mockResolvedValue({ quantity: new Prisma.Decimal(5), binLocation: { code: 'A1' } } as never);
    vi.mocked(prisma.binReplenishmentRule.update).mockResolvedValue({} as never);
    const res = await svc.evaluateReplenishmentRules(TENANT, 'wh1');
    expect(res.triggered).toBe(1);
    expect(res.evaluated).toBe(1);
  });

  it('evaluateReplenishmentRules: no trigger when qty above threshold', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.findMany).mockResolvedValue([
      { id: 'r1', productId: 'p1', activeBinCode: 'A1', triggerQty: new Prisma.Decimal(10) },
    ] as never);
    vi.mocked(prisma.inventoryItemBin.findFirst).mockResolvedValue({ quantity: new Prisma.Decimal(50), binLocation: { code: 'A1' } } as never);
    const res = await svc.evaluateReplenishmentRules(TENANT, 'wh1');
    expect(res.triggered).toBe(0);
  });

  it('createHold: generates holdNumber and creates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryHold.create).mockResolvedValue({ id: 'h1', holdNumber: 'HOLD-xxx' } as never);
    const res = await svc.createHold(TENANT, {
      warehouseId: 'wh1', holdType: 'QUALITY', reason: 'QC fail', heldQty: 10,
    });
    expect(res).toHaveProperty('id', 'h1');
  });

  it('releaseHold: throws when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryHold.findFirst).mockResolvedValue(null);
    await expect(svc.releaseHold(TENANT, 'x', { releasedBy: 'user1' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('releaseHold: throws when not ACTIVE', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryHold.findFirst).mockResolvedValue({ id: 'h1', status: 'RELEASED' } as never);
    await expect(svc.releaseHold(TENANT, 'h1', { releasedBy: 'user1' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('releaseHold: updates to RELEASED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryHold.findFirst).mockResolvedValue({ id: 'h1', status: 'ACTIVE' } as never);
    vi.mocked(prisma.inventoryHold.update).mockResolvedValue({ id: 'h1', status: 'RELEASED' } as never);
    await svc.releaseHold(TENANT, 'h1', { releasedBy: 'user1' });
    expect(prisma.inventoryHold.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'RELEASED' }) })
    );
  });

  it('getAutomationDashboard: returns all dashboard fields', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.binReplenishmentRule.count).mockResolvedValue(5 as never);
    vi.mocked(prisma.inventoryHold.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.inventoryHold.groupBy).mockResolvedValue([
      { holdType: 'QUALITY', _count: { _all: 2 } },
    ] as never);
    const res = await svc.getAutomationDashboard(TENANT);
    expect(res).toHaveProperty('totalRules');
    expect(res).toHaveProperty('activeHolds');
    expect(res.holdsByType).toHaveProperty('QUALITY');
  });
});

// ─── Analytics Service ────────────────────────────────────────────────────────

describe('InventoryAnalyticsService', () => {
  let svc: InventoryAnalyticsService;

  beforeEach(() => {
    svc = new InventoryAnalyticsService();
    vi.clearAllMocks();
  });

  it('getInventoryHealthScore: returns healthScore between 0 and 100', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.product.count).mockResolvedValue(100 as never);
    vi.mocked(prisma.stockLedgerEntry.groupBy).mockResolvedValue([{ productId: 'p1', _count: { _all: 5 } }] as never);
    vi.mocked(prisma.inventoryItemBin.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.inventoryHold.count).mockResolvedValue(0 as never);
    const res = await svc.getInventoryHealthScore(TENANT);
    expect(res.healthScore).toBeGreaterThanOrEqual(0);
    expect(res.healthScore).toBeLessThanOrEqual(100);
    expect(res).toHaveProperty('totalProducts', 100);
  });

  it('getSlowMovingInventory: identifies products with no outbound movement', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockLedgerEntry.groupBy).mockResolvedValue([
      { productId: 'p1', _sum: { qtyOut: new Prisma.Decimal(5) } },
    ] as never);
    vi.mocked(prisma.inventoryItemBin.groupBy).mockResolvedValue([
      { productId: 'p1', warehouseId: 'wh1', _sum: { quantity: new Prisma.Decimal(10) } },
      { productId: 'p2', warehouseId: 'wh1', _sum: { quantity: new Prisma.Decimal(20) } },
    ] as never);
    const res = await svc.getSlowMovingInventory(TENANT);
    expect(res.slowMoverCount).toBe(1);
    expect(res.items[0].productId).toBe('p2');
  });

  it('getDaysInventoryOutstanding: computes averageDio correctly', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockLedgerEntry.groupBy).mockResolvedValue([
      { productId: 'p1', _sum: { qtyOut: new Prisma.Decimal(90) } },
    ] as never);
    vi.mocked(prisma.inventoryItemBin.groupBy).mockResolvedValue([
      { productId: 'p1', _sum: { quantity: new Prisma.Decimal(30) } },
    ] as never);
    const res = await svc.getDaysInventoryOutstanding(TENANT);
    expect(res.averageDio).toBe(30);
  });

  it('getFillRateReport: returns 100% with no waves', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findMany).mockResolvedValue([] as never);
    const res = await svc.getFillRateReport(TENANT);
    expect(res.fillRate).toBe(100);
  });

  it('getVolumeTrends: groups ledger entries by date', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockLedgerEntry.findMany).mockResolvedValue([
      { qtyIn: new Prisma.Decimal(10), qtyOut: new Prisma.Decimal(5), createdAt: new Date('2026-01-01') },
      { qtyIn: new Prisma.Decimal(0), qtyOut: new Prisma.Decimal(8), createdAt: new Date('2026-01-02') },
    ] as never);
    const res = await svc.getVolumeTrends(TENANT);
    expect(res.totalInbound).toBe(10);
    expect(res.totalOutbound).toBe(13);
    expect(res.daily).toHaveLength(2);
  });

  it('getShrinkageReport: counts only negative adjustments', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.stockLedgerEntry.findMany).mockResolvedValue([
      { productId: 'p1', qtyIn: new Prisma.Decimal(0), qtyOut: new Prisma.Decimal(5), remarks: null },
      { productId: 'p2', qtyIn: new Prisma.Decimal(10), qtyOut: new Prisma.Decimal(2), remarks: null },
    ] as never);
    const res = await svc.getShrinkageReport(TENANT);
    expect(res.negativeAdjustments).toBe(1);
    expect(res.totalShrinkage).toBe(5);
    expect(res.byProduct[0].productId).toBe('p1');
  });

  it('getCapacityUtilization: maps warehouse info', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryItemBin.groupBy).mockResolvedValue([
      { warehouseId: 'wh1', _count: { _all: 10 }, _sum: { quantity: new Prisma.Decimal(500) } },
    ] as never);
    vi.mocked(prisma.warehouse.findMany).mockResolvedValue([{ id: 'wh1', name: 'Main', code: 'MN' }] as never);
    const res = await svc.getCapacityUtilization(TENANT);
    expect(res[0].warehouse?.name).toBe('Main');
    expect(res[0].totalQuantity).toBe(500);
  });

  it('getAnalyticsDashboard: returns aggregate summary', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.product.count).mockResolvedValue(50 as never);
    vi.mocked(prisma.stockLedgerEntry.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.inventoryItemBin.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.inventoryItemBin.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.inventoryHold.count).mockResolvedValue(0 as never);
    vi.mocked(prisma.stockLedgerEntry.findMany).mockResolvedValue([] as never);
    const res = await svc.getAnalyticsDashboard(TENANT);
    expect(res).toHaveProperty('healthScore');
    expect(res).toHaveProperty('slowMoverCount');
    expect(res).toHaveProperty('netMovement30d');
  });
});
