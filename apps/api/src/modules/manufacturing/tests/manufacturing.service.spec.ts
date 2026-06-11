import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManufacturingService } from '../manufacturing.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    bOM: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    bOMItem: {
      create: vi.fn(),
    },
    workOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    warehouse: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      bOM: {
        create: vi.fn().mockResolvedValue({ id: 'bom-1', name: 'Laptop Assy', code: 'BOM-1' }),
      },
      bOMItem: { create: vi.fn() },
    })),
  },
}));

import { prisma } from '@unerp/database';

describe('ManufacturingService', () => {
  let service: ManufacturingService;

  beforeEach(() => {
    service = new ManufacturingService();
    vi.clearAllMocks();
  });

  describe('getBOMs', () => {
    it('should return all BOMs', async () => {
      const mockBOMs = [{ id: 'bom-1', name: 'Laptop Assembly', code: 'BOM-LAP' }];
      vi.mocked(prisma.bOM.findMany).mockResolvedValue(mockBOMs as any);

      const result = await service.getBOMs('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('BOM-LAP');
    });
  });
});
