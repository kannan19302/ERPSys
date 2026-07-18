import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory.service';

vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      value: number;
      constructor(v: unknown) { this.value = Number(v); }
      toString() { return String(this.value); }
    },
  },
}));

const { db } = vi.hoisted(() => {
  const db: any = {
    $transaction: vi.fn().mockImplementation((cb) => cb(db)),
    qualityInspection: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    qAInspectionCheckpoint: {
      update: vi.fn(),
    },
    batch: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    batchQuarantineLog: {
      create: vi.fn(),
    },
    qAInspectionTemplate: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    reorderRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
    },
    purchaseRequisition: {
      count: vi.fn(),
      create: vi.fn(),
    },
  };
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));
vi.mock('../../../common/utils/pagination.util', async () => {
  const actual = await vi.importActual<any>('../../../common/utils/pagination.util');
  return { ...actual, resolveOrgId: vi.fn().mockResolvedValue('org-1') };
});

describe('InventoryService — QA disposition routing/templates, reorder automation', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('QA disposition routing', () => {
    it('throws BadRequest routing an inspection with no disposition yet', async () => {
      db.qualityInspection.findFirst.mockResolvedValue({ id: 'qa1', disposition: null });
      await expect(service.routeQAInspectionDisposition('t1', 'qa1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('quarantines the linked batch when disposition is QUARANTINE', async () => {
      db.qualityInspection.findFirst.mockResolvedValue({ id: 'qa1', disposition: 'QUARANTINE', referenceType: 'STOCK_ENTRY', referenceId: 'se1', inspectionNumber: 'QA-1' });
      db.batch.findFirst.mockResolvedValue({ id: 'b1', status: 'ACTIVE' });

      const result = await service.routeQAInspectionDisposition('t1', 'qa1', 'u1');

      expect(db.batch.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'b1' },
        data: { status: 'QUARANTINE' },
      }));
      expect(db.batchQuarantineLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 't1',
          batchId: 'b1',
          action: 'QUARANTINED',
        }),
      }));
      expect(result.action).toBe('BATCH_QUARANTINED');
    });

    it('returns NONE when there is no matching batch for the disposition', async () => {
      db.qualityInspection.findFirst.mockResolvedValue({ id: 'qa2', disposition: 'ACCEPT', referenceType: 'STOCK_ENTRY', referenceId: 'se1' });
      const result = await service.routeQAInspectionDisposition('t1', 'qa2', 'u1');
      expect(result.action).toBe('NONE');
    });
  });

  describe('QA inspection templates', () => {
    it('creates an inspection pre-populated from a template checklist', async () => {
      db.qAInspectionTemplate.findFirst.mockResolvedValue({ id: 'tpl1', checklist: [{ parameter: 'Weight', criteria: '±5%' }] });
      db.qualityInspection.count.mockResolvedValue(0);
      db.qualityInspection.create.mockResolvedValue({ id: 'qa3' });

      await service.createQAInspectionFromTemplate('t1', 'org-1', 'u1', 'tpl1', {
        referenceType: 'STOCK_ENTRY', referenceId: 'se1', productId: 'p1', inspectedQty: 10, checkpoints: []
      } as any);

      expect(db.qualityInspection.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 't1',
          orgId: 'org-1',
          productId: 'p1',
          checkpoints: {
            create: [{ tenantId: 't1', parameter: 'Weight', criteria: '±5%', sortOrder: undefined }],
          },
        }),
      }));
    });

    it('throws NotFound creating from an unknown template', async () => {
      db.qAInspectionTemplate.findFirst.mockResolvedValue(null);
      await expect(service.createQAInspectionFromTemplate('t1', 'org-1', 'u1', 'missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder dashboard', () => {
    it('flags a rule as triggered when on-hand is at or below minQty', async () => {
      db.reorderRule.findMany.mockResolvedValue([
        { id: 'r1', productId: 'p1', warehouseId: 'w1', minQty: { toString: () => '10' }, reorderQty: { toString: () => '50' }, leadTimeDays: 7, autoCreatePO: false, product: { name: 'Widget' } },
      ]);
      db.inventoryItem.findMany.mockResolvedValue([{ quantity: { toString: () => '5' } }]);

      const result = await service.getReorderDashboard('t1');

      expect(result.triggeredCount).toBe(1);
      expect(result.rules[0].isTriggered).toBe(true);
      expect(result.rules[0].suggestedOrderDate).not.toBeNull();
    });

    it('does not flag a rule when on-hand is above minQty', async () => {
      db.reorderRule.findMany.mockResolvedValue([
        { id: 'r1', productId: 'p1', warehouseId: 'w1', minQty: { toString: () => '10' }, reorderQty: { toString: () => '50' }, leadTimeDays: 7, autoCreatePO: false, product: { name: 'Widget' } },
      ]);
      db.inventoryItem.findMany.mockResolvedValue([{ quantity: { toString: () => '100' } }]);

      const result = await service.getReorderDashboard('t1');

      expect(result.triggeredCount).toBe(0);
      expect(result.rules[0].suggestedOrderDate).toBeNull();
    });
  });

  describe('createRequisitionFromReorderRule', () => {
    it('creates a requisition and stamps lastTriggeredAt', async () => {
      db.reorderRule.findFirst.mockResolvedValue({ id: 'r1', productId: 'p1', reorderQty: { toString: () => '50' }, minQty: { toString: () => '10' }, leadTimeDays: 7, product: { name: 'Widget', costPrice: { toString: () => '3' } } });
      db.purchaseRequisition.count.mockResolvedValue(0);
      db.purchaseRequisition.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'req1', ...data }));
      db.reorderRule.update.mockResolvedValue({});

      const result = await service.createRequisitionFromReorderRule('t1', 'org-1', 'u1', 'r1', {});

      expect(result.requisitionNumber).toBe('REQ-2026-00001');
      expect(db.reorderRule.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'r1' } }));
    });

    it('throws NotFound for an unknown reorder rule', async () => {
      db.reorderRule.findFirst.mockResolvedValue(null);
      await expect(service.createRequisitionFromReorderRule('t1', 'org-1', 'u1', 'missing', {})).rejects.toThrow(NotFoundException);
    });
  });
});
