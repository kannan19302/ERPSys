import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryWarehousesService } from '../inventory-warehouses.service';
import { Warehouse } from '@prisma/client';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      warehouse: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('InventoryWarehousesService', () => {
  let service: InventoryWarehousesService;

  beforeEach(() => {
    service = new InventoryWarehousesService();
    vi.clearAllMocks();
  });

  describe('getWarehouses', () => {
    it('should return paginated warehouses', async () => {
      const { prisma } = await import('@unerp/database');
      const mockWarehouses = [
        {
          id: 'w-1',
          name: 'Main Warehouse',
          code: 'MW1',
          address: '123 Main St',
          isActive: true,
        },
      ];

      vi.mocked(prisma.warehouse.findMany).mockResolvedValue(mockWarehouses as unknown as Warehouse[]);
      vi.mocked(prisma.warehouse.count).mockResolvedValue(1);

      const result = await service.getWarehouses('tenant-123');

      expect(result).toBeDefined();
      expect(result.data[0].code).toBe('MW1');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getWarehouseById', () => {
    it('should return a warehouse by id', async () => {
      const { prisma } = await import('@unerp/database');
      const mockWarehouse = {
        id: 'w-1',
        name: 'Main Warehouse',
        code: 'MW1',
      };

      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(mockWarehouse as unknown as Warehouse);

      const result = await service.getWarehouseById('tenant-123', 'w-1');

      expect(result).toBeDefined();
      expect(result.code).toBe('MW1');
    });

    it('should throw NotFoundException if warehouse does not exist', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null);

      await expect(service.getWarehouseById('tenant-123', 'w-2')).rejects.toThrow();
    });
  });

  describe('createWarehouse', () => {
    it('should create a new warehouse', async () => {
      const { prisma } = await import('@unerp/database');
      const dto = {
        name: 'New Warehouse',
        code: 'NW1',
        isActive: true,
      };

      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as any);
      vi.mocked(prisma.warehouse.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.warehouse.create).mockResolvedValue({ id: 'w-2', ...dto } as unknown as Warehouse);

      const result = await service.createWarehouse('tenant-123', 'org-1', dto);

      expect(result).toBeDefined();
      expect(result.code).toBe('NW1');
    });
  });
});
