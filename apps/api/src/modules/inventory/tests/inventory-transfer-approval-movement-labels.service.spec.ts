import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
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
  const db: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    transferApprovalRule: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    stockEntry: {
      findFirst: vi.fn(),
    },
    stockTransferApproval: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    stockLedgerEntry: {
      findMany: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    batch: {
      findFirst: vi.fn(),
    },
    licensePlate: {
      findFirst: vi.fn(),
    },
    binLocation: {
      findFirst: vi.fn(),
    },
  };
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — transfer approval workflow, movement history, barcode labels', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('transfer approval workflow', () => {
    it('auto-submits a transfer below the configured threshold', async () => {
      db.stockEntry.findFirst.mockResolvedValue({ id: 'se1', totalValue: { toString: () => '500' }, fromWarehouseId: 'w1', toWarehouseId: null, status: 'DRAFT' });
      db.transferApprovalRule.findMany.mockResolvedValue([{ warehouseId: 'w1', thresholdValue: { toString: () => '1000' }, isActive: true }]);
      const submitSpy = vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se1', status: 'SUBMITTED' } as any);

      const result = await service.requestTransferApproval('t1', 'se1', 'u1');

      expect(submitSpy).toHaveBeenCalledWith('t1', 'se1', 'u1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('creates a PENDING approval and does not submit when above threshold', async () => {
      db.stockEntry.findFirst.mockResolvedValue({ id: 'se2', totalValue: { toString: () => '5000' }, fromWarehouseId: 'w1', toWarehouseId: null, status: 'DRAFT' });
      db.transferApprovalRule.findMany.mockResolvedValue([{ warehouseId: 'w1', thresholdValue: { toString: () => '1000' }, isActive: true }]);
      db.stockTransferApproval.findFirst.mockResolvedValue(null);
      db.stockTransferApproval.create.mockResolvedValue({ id: 'appr1', status: 'PENDING' });
      const submitSpy = vi.spyOn(service, 'submitStockEntry');

      const result = await service.requestTransferApproval('t1', 'se2', 'u1');

      expect(submitSpy).not.toHaveBeenCalled();
      expect(result.status).toBe('PENDING');
    });

    it('prefers a warehouse-specific rule over the tenant-wide rule', async () => {
      db.stockEntry.findFirst.mockResolvedValue({ id: 'se3', totalValue: { toString: () => '2000' }, fromWarehouseId: 'w1', toWarehouseId: null, status: 'DRAFT' });
      db.transferApprovalRule.findMany.mockResolvedValue([
        { warehouseId: null, thresholdValue: { toString: () => '500' }, isActive: true },
        { warehouseId: 'w1', thresholdValue: { toString: () => '10000' }, isActive: true },
      ]);
      const submitSpy = vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se3', status: 'SUBMITTED' } as any);

      await service.requestTransferApproval('t1', 'se3', 'u1');

      // 2000 < warehouse-specific 10000, so it should auto-submit rather than use the stricter global 500 rule
      expect(submitSpy).toHaveBeenCalled();
    });

    it('approves a pending transfer and submits the underlying stock entry', async () => {
      db.stockTransferApproval.findFirst.mockResolvedValue({ id: 'appr1', stockEntryId: 'se2', status: 'PENDING' });
      db.stockTransferApproval.update.mockResolvedValue({ id: 'appr1', status: 'APPROVED' });
      const submitSpy = vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se2', status: 'SUBMITTED' } as any);

      const result = await service.approveTransfer('t1', 'appr1', 'u1');

      expect(submitSpy).toHaveBeenCalledWith('t1', 'se2', 'u1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('rejects a pending transfer without submitting', async () => {
      db.stockTransferApproval.findFirst.mockResolvedValue({ id: 'appr1', stockEntryId: 'se2', status: 'PENDING' });
      db.stockTransferApproval.update.mockResolvedValue({ id: 'appr1', status: 'REJECTED' });
      const submitSpy = vi.spyOn(service, 'submitStockEntry');

      const result = await service.rejectTransfer('t1', 'appr1', 'u1', { reason: 'Budget exceeded' });

      expect(submitSpy).not.toHaveBeenCalled();
      expect(result.status).toBe('REJECTED');
    });

    it('throws NotFound approving an already-resolved approval', async () => {
      db.stockTransferApproval.findFirst.mockResolvedValue(null);
      await expect(service.approveTransfer('t1', 'missing', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('movement history', () => {
    it('maps ledger entries into a consolidated movement timeline', async () => {
      db.stockLedgerEntry.findMany.mockResolvedValue([
        { productId: 'p1', product: { name: 'Widget' }, warehouseId: 'w1', voucherType: 'STOCK_ENTRY', voucherNumber: 'STE-1', qtyIn: 10, qtyOut: 0, balanceQty: 10, createdAt: new Date() },
      ]);
      const result = await service.getMovementHistory('t1', { productId: 'p1' });
      expect(result.movements).toHaveLength(1);
      expect(result.movements[0].productName).toBe('Widget');
    });
  });

  describe('barcode labels', () => {
    it('throws NotFound for an unknown product label', async () => {
      db.product.findFirst.mockResolvedValue(null);
      await expect(service.getProductLabel('t1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('returns product label data', async () => {
      db.product.findFirst.mockResolvedValue({ barcode: null, sku: 'SKU-1', name: 'Widget' });
      const result = await service.getProductLabel('t1', 'p1');
      expect(result.barcodeValue).toBe('SKU-1');
    });

    it('returns batch label data', async () => {
      db.batch.findFirst.mockResolvedValue({ batchNo: 'B-1', lotNo: 'L-1', expiryDate: null, product: { name: 'Widget' } });
      const result = await service.getBatchLabel('t1', 'b1');
      expect(result.barcodeValue).toBe('B-1');
    });

    it('returns license plate label data', async () => {
      db.licensePlate.findFirst.mockResolvedValue({ code: 'LP-1', warehouseId: 'w1', status: 'OPEN' });
      const result = await service.getLicensePlateLabel('t1', 'lp1');
      expect(result.barcodeValue).toBe('LP-1');
    });

    it('returns bin label data', async () => {
      db.binLocation.findFirst.mockResolvedValue({ code: 'A-01-03', zone: 'A', aisle: '01', rack: '03' });
      const result = await service.getBinLabel('t1', 'bin1');
      expect(result.barcodeValue).toBe('A-01-03');
    });
  });
});
