import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplyChainService } from '../supply-chain.service';

// Mock @unerp/database
vi.mock('@unerp/database', () => ({
  prisma: {
    shipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

describe('SupplyChainService', () => {
  let service: SupplyChainService;

  beforeEach(() => {
    service = new SupplyChainService();
    vi.clearAllMocks();
  });

  describe('getShipments', () => {
    it('should return mapped shipments', async () => {
      const mockShipments = [
        {
          id: 's-1',
          shipmentNumber: 'SHP-001',
          type: 'OUTBOUND',
          status: 'PENDING',
          carrierName: 'FedEx',
          trackingNumber: 'TRK-123',
          trackingUrl: null,
          weight: { toString: () => '10' },
          weightUnit: 'KG',
          shippingCost: { toString: () => '25' },
          currency: 'USD',
          estimatedDelivery: new Date(),
          actualDelivery: null,
          shippedAt: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.shipment.findMany).mockResolvedValue(mockShipments as never);

      const result = await service.getShipments('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.shipmentNumber).toBe('SHP-001');
      expect(result[0]?.carrierName).toBe('FedEx');
    });
  });

  describe('createShipment', () => {
    it('should create a shipment', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.shipment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.shipment.create).mockResolvedValue({
        id: 's-1',
        shipmentNumber: 'SHP-001',
        status: 'PENDING',
      } as never);

      const dto = {
        shipmentNumber: 'SHP-001',
        type: 'OUTBOUND' as const,
        carrierName: 'FedEx',
        trackingNumber: 'TRK-123',
        weightUnit: 'KG' as const,
      };

      const result = await service.createShipment('tenant-1', 'org-system-default', dto, 'user-1');

      expect(result.shipmentNumber).toBe('SHP-001');
      expect(prisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shipmentNumber: 'SHP-001', status: 'PENDING' }),
        }),
      );
    });

    it('should throw when shipment number already exists', async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);
      vi.mocked(prisma.shipment.findFirst).mockResolvedValue({ id: 'existing' } as never);

      const dto = {
        shipmentNumber: 'SHP-001',
        type: 'OUTBOUND' as const,
        weightUnit: 'KG' as const,
      };

      await expect(
        service.createShipment('tenant-1', 'org-1', dto, 'user-1'),
      ).rejects.toThrow('Shipment number SHP-001 already exists');
    });
  });

  describe('updateShipmentStatus', () => {
    it('should update status and set shippedAt when IN_TRANSIT', async () => {
      vi.mocked(prisma.shipment.findFirst).mockResolvedValue({ id: 's-1' } as never);
      vi.mocked(prisma.shipment.update).mockResolvedValue({ id: 's-1', status: 'IN_TRANSIT' } as never);

      await service.updateShipmentStatus('tenant-1', 's-1', 'IN_TRANSIT');

      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: expect.objectContaining({ status: 'IN_TRANSIT', shippedAt: expect.any(Date) }),
      });
    });

    it('should set actualDelivery when DELIVERED', async () => {
      vi.mocked(prisma.shipment.findFirst).mockResolvedValue({ id: 's-1' } as never);
      vi.mocked(prisma.shipment.update).mockResolvedValue({ id: 's-1', status: 'DELIVERED' } as never);

      await service.updateShipmentStatus('tenant-1', 's-1', 'DELIVERED');

      expect(prisma.shipment.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: expect.objectContaining({ status: 'DELIVERED', actualDelivery: expect.any(Date) }),
      });
    });

    it('should throw NotFoundException when shipment not found', async () => {
      vi.mocked(prisma.shipment.findFirst).mockResolvedValue(null);

      await expect(
        service.updateShipmentStatus('tenant-1', 'nonexistent', 'DELIVERED'),
      ).rejects.toThrow('Shipment not found');
    });
  });
});
