import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryQaService } from '../inventory-qa.service';

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
  const db: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    qualityInspection: {
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    qAInspectionCheckpoint: {
      update: vi.fn(),
    },
    batch: {
      findFirst: vi.fn(),
      update: vi.fn(),
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
    $transaction: vi.fn(),
  };

  db.$transaction.mockImplementation((cb) => cb(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));
vi.mock('../../../common/utils/pagination.util', async () => {
  const actual = await vi.importActual<any>('../../../common/utils/pagination.util');
  return { ...actual, resolveOrgId: vi.fn().mockResolvedValue('org-1') };
});

describe('InventoryQaService', () => {
  let service: InventoryQaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryQaService();
  });

  describe('getQAInspections', () => {
    it('returns paginated inspections', async () => {
      db.qualityInspection.findMany.mockResolvedValue([{ id: 'qa1' }]);
      db.qualityInspection.count.mockResolvedValue(1);

      const result = await service.getQAInspections('t1');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getQAInspectionById', () => {
    it('throws NotFound if inspection does not exist', async () => {
      db.qualityInspection.findFirst.mockResolvedValue(null);
      await expect(service.getQAInspectionById('t1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createQAInspectionTemplate', () => {
    it('creates template successfully', async () => {
      db.qAInspectionTemplate.create.mockResolvedValue({ id: 'tpl1', name: 'Tpl' });
      const result = await service.createQAInspectionTemplate('t1', { name: 'Tpl', productId: 'p1', checklist: [], isActive: true });
      expect(result.name).toBe('Tpl');
    });
  });
});
