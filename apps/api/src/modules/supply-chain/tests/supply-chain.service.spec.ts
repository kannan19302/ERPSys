import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplyChainService } from '../supply-chain.service';

// Mock @unerp/database
vi.mock('@unerp/database', () => {
  const prismaMock = {
    shipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
    shippingCarrier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    carrierServiceLevel: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    advanceShippingNotice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    aSNLineItem: {
      createMany: vi.fn(),
      update: vi.fn(),
    },
    asnDiscrepancy: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    inboundShipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    outboundShipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    shipmentTrackingEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    shipmentException: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    product: { findMany: vi.fn() },
    salesOrderItem: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };

  prismaMock.$transaction.mockImplementation((cb) => cb(prismaMock));
  return { prisma: prismaMock };
});

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

  describe('Carriers', () => {
    it('should fetch carriers', async () => {
      vi.mocked(prisma.shippingCarrier.findMany).mockResolvedValue([{ id: 'c-1', name: 'UPS' }] as never);
      const result = await service.getCarriers('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('UPS');
    });

    it('should create carrier', async () => {
      vi.mocked(prisma.shippingCarrier.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.shippingCarrier.create).mockResolvedValue({ id: 'c-1', code: 'UPS', name: 'UPS' } as never);
      const result = await service.createCarrier('tenant-1', { code: 'UPS', name: 'UPS' });
      expect(result.code).toBe('UPS');
    });
  });

  describe('ASN Operations', () => {
    it('should create an ASN and its items', async () => {
      vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.advanceShippingNotice.create).mockResolvedValue({ id: 'asn-1', asnNumber: 'ASN-001' } as never);
      vi.mocked(prisma.advanceShippingNotice.findUnique).mockResolvedValue({ id: 'asn-1', asnNumber: 'ASN-001', lineItems: [] } as never);

      const result = await service.createAsn('tenant-1', {
        asnNumber: 'ASN-001',
        vendorId: 'vendor-1',
        warehouseId: 'wh-1',
        lineItems: [{ productId: 'p-1', expectedQty: 100 }],
      });

      expect(result.asnNumber).toBe('ASN-001');
      expect(prisma.aSNLineItem.createMany).toHaveBeenCalled();
    });

    it('should process ASN receipt and log shortage discrepancy', async () => {
      const mockAsn = {
        id: 'asn-1',
        status: 'PENDING',
        lineItems: [
          { id: 'li-1', productId: 'p-1', expectedQty: { toString: () => '100' }, receivedQty: { toString: () => '0' } },
        ],
      };

      vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue(mockAsn as never);
      vi.mocked(prisma.advanceShippingNotice.update).mockResolvedValue({ ...mockAsn, status: 'RECEIVED' } as never);

      const result = await service.receiveAsn('tenant-1', 'asn-1', {
        lineItems: [{ id: 'li-1', actualQty: 90 }],
      }, 'user-1');

      expect(result.status).toBe('RECEIVED');
      expect(prisma.asnDiscrepancy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discrepancyType: 'SHORTAGE',
            actualQty: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('Tracking and Exceptions', () => {
    it('should transition outbound status to DELIVERED on milestone', async () => {
      vi.mocked(prisma.shipmentTrackingEvent.create).mockResolvedValue({ id: 'e-1' } as never);
      vi.mocked(prisma.outboundShipment.findFirst).mockResolvedValue({ id: 'shp-1', status: 'IN_TRANSIT' } as never);

      await service.addTrackingEvent('tenant-1', 'outbound', 'shp-1', {
        eventCode: 'DELIVERED',
        description: 'Delivered to front door',
        source: 'MANUAL',
      });

      expect(prisma.outboundShipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'shp-1' },
          data: expect.objectContaining({ status: 'DELIVERED' }),
        }),
      );
    });

    it('should report and resolve exception', async () => {
      vi.mocked(prisma.shipmentException.create).mockResolvedValue({ id: 'ex-1' } as never);
      vi.mocked(prisma.shipmentException.findFirst).mockResolvedValue({ id: 'ex-1', status: 'OPEN' } as never);

      const report = await service.reportException('tenant-1', 'shp-1', {
        direction: 'OUTBOUND',
        exceptionCode: 'LATE',
        description: 'Delayed due to weather',
      }, 'user-1');

      await service.resolveException('tenant-1', 'ex-1', {
        resolutionNote: 'Weather cleared',
      }, 'user-1');

      expect(prisma.shipmentException.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ex-1' },
          data: expect.objectContaining({ status: 'RESOLVED', resolutionNote: 'Weather cleared' }),
        }),
      );
    });
  });
});
