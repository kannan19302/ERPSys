import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    shippingCarrier: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    carrierServiceLevel: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    advanceShippingNotice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    aSNLineItem: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    inboundShipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    outboundShipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    shipmentTrackingEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('InventoryLogisticsService', () => {
  const TENANT = 'tenant-abc';

  beforeEach(() => vi.clearAllMocks());

  // ─── Carrier management ───────────────────────────────────────────────────

  it('listCarriers — returns active carriers for tenant', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const carriers = [{ id: 'c1', code: 'FEDEX', name: 'FedEx' }];
    vi.mocked(prisma.shippingCarrier.findMany).mockResolvedValue(carriers as any);
    const result = await svc.listCarriers(TENANT);
    expect(result).toEqual(carriers);
    expect(vi.mocked(prisma.shippingCarrier.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT, isActive: true } }),
    );
  });

  it('createCarrier — creates and returns new carrier', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const dto = { code: 'UPS', name: 'United Parcel Service' };
    const created = { id: 'c2', tenantId: TENANT, ...dto };
    vi.mocked(prisma.shippingCarrier.create).mockResolvedValue(created as any);
    const result = await svc.createCarrier(TENANT, dto);
    expect(result).toEqual(created);
    expect(vi.mocked(prisma.shippingCarrier.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: TENANT, code: 'UPS' }) }),
    );
  });

  it('updateCarrier — throws NotFoundException for unknown carrier', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.shippingCarrier.findFirst).mockResolvedValue(null);
    await expect(svc.updateCarrier(TENANT, 'no-id', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateCarrier — updates carrier name', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const existing = { id: 'c1', tenantId: TENANT, code: 'FEDEX', name: 'FedEx' };
    vi.mocked(prisma.shippingCarrier.findFirst).mockResolvedValue(existing as any);
    const updated = { ...existing, name: 'FedEx Corp' };
    vi.mocked(prisma.shippingCarrier.update).mockResolvedValue(updated as any);
    const result = await svc.updateCarrier(TENANT, 'c1', { name: 'FedEx Corp' });
    expect(result.name).toBe('FedEx Corp');
  });

  it('deactivateCarrier — sets isActive false', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const existing = { id: 'c1', tenantId: TENANT, isActive: true };
    vi.mocked(prisma.shippingCarrier.findFirst).mockResolvedValue(existing as any);
    vi.mocked(prisma.shippingCarrier.update).mockResolvedValue({ ...existing, isActive: false } as any);
    await svc.deactivateCarrier(TENANT, 'c1');
    expect(vi.mocked(prisma.shippingCarrier.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it('addServiceLevel — creates service level for carrier', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const dto = { carrierId: 'c1', code: '2DAY', name: '2-Day Air', transitDays: 2 };
    vi.mocked(prisma.shippingCarrier.findFirst).mockResolvedValue({ id: 'c1' } as any);
    vi.mocked(prisma.carrierServiceLevel.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.carrierServiceLevel.create).mockResolvedValue({ id: 'sl1', ...dto } as any);
    const result = await svc.addServiceLevel(TENANT, dto);
    expect(result).toMatchObject({ code: '2DAY' });
  });

  it('listServiceLevels — filters by carrierId', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.shippingCarrier.findFirst).mockResolvedValue({ id: 'c1' } as any);
    vi.mocked(prisma.carrierServiceLevel.findMany).mockResolvedValue([{ id: 'sl1' }] as any);
    await svc.listServiceLevels(TENANT, 'c1');
    expect(vi.mocked(prisma.carrierServiceLevel.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, carrierId: 'c1' }) }),
    );
  });

  // ─── ASN ─────────────────────────────────────────────────────────────────

  it('listAsns — queries with optional filters', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.advanceShippingNotice.findMany).mockResolvedValue([]);
    await svc.listAsns(TENANT, { vendorId: 'v1', status: 'PENDING' });
    expect(vi.mocked(prisma.advanceShippingNotice.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, vendorId: 'v1', status: 'PENDING' }) }),
    );
  });

  it('getAsn — throws NotFoundException if not found', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue(null);
    await expect(svc.getAsn(TENANT, 'no-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createAsn — generates ASN number and creates with line items', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const dto = {
      vendorId: 'v1',
      warehouseId: 'wh1',
      lineItems: [{ productId: 'p1', expectedQty: 10, uom: 'EA' }],
    };
    const created = { id: 'asn1', asnNumber: 'ASN-111', ...dto };
    vi.mocked(prisma.advanceShippingNotice.create).mockResolvedValue(created as any);
    const result = await svc.createAsn(TENANT, dto);
    expect(result).toMatchObject({ id: 'asn1' });
    expect(vi.mocked(prisma.advanceShippingNotice.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: TENANT, vendorId: 'v1' }) }),
    );
  });

  it('markAsnInTransit — rejects non-PENDING ASN', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: 'asn1', status: 'RECEIVED' } as any);
    await expect(svc.markAsnInTransit(TENANT, 'asn1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancelAsn — transitions PENDING to CANCELLED', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.advanceShippingNotice.findFirst).mockResolvedValue({ id: 'asn1', status: 'PENDING' } as any);
    vi.mocked(prisma.advanceShippingNotice.update).mockResolvedValue({ id: 'asn1', status: 'CANCELLED' } as any);
    const result = await svc.cancelAsn(TENANT, 'asn1');
    expect(result).toMatchObject({ status: 'CANCELLED' });
  });

  // ─── Inbound shipments ────────────────────────────────────────────────────

  it('createInboundShipment — generates shipment number', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    const dto = { warehouseId: 'wh1', shipmentNumber: undefined as any };
    const created = { id: 'is1', shipmentNumber: 'IS-9999', warehouseId: 'wh1', status: 'EXPECTED' };
    vi.mocked(prisma.inboundShipment.create).mockResolvedValue(created as any);
    const result = await svc.createInboundShipment(TENANT, { warehouseId: 'wh1' } as any);
    expect(result).toMatchObject({ id: 'is1' });
  });

  it('updateInboundShipmentStatus — rejects invalid transition', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue({ id: 'is1', status: 'COMPLETE' } as any);
    await expect(svc.updateInboundShipmentStatus(TENANT, 'is1', 'EXPECTED', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('addInboundTrackingEvent — creates tracking event', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue({ id: 'is1', status: 'IN_TRANSIT' } as any);
    vi.mocked(prisma.shipmentTrackingEvent.create).mockResolvedValue({ id: 'te1' } as any);
    const dto = { eventCode: 'PICKUP', description: 'Picked up', occurredAt: new Date().toISOString() };
    await svc.addInboundTrackingEvent(TENANT, 'is1', dto);
    expect(vi.mocked(prisma.shipmentTrackingEvent.create)).toHaveBeenCalled();
  });

  // ─── Outbound shipments ───────────────────────────────────────────────────

  it('listOutboundShipments — filters by status', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.outboundShipment.findMany).mockResolvedValue([]);
    await svc.listOutboundShipments(TENANT, { status: 'SHIPPED' });
    expect(vi.mocked(prisma.outboundShipment.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'SHIPPED' }) }),
    );
  });

  it('shipOutbound — transitions PACKED to SHIPPED', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.outboundShipment.findFirst).mockResolvedValue({ id: 'os1', status: 'PACKED' } as any);
    vi.mocked(prisma.outboundShipment.update).mockResolvedValue({ id: 'os1', status: 'SHIPPED' } as any);
    const result = await svc.shipOutbound(TENANT, 'os1', 'TRK-001');
    expect(result).toMatchObject({ status: 'SHIPPED' });
    expect(vi.mocked(prisma.outboundShipment.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SHIPPED', trackingNumber: 'TRK-001' }) }),
    );
  });

  it('shipOutbound — rejects when status is not PACKED or PENDING', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.outboundShipment.findFirst).mockResolvedValue({ id: 'os1', status: 'DELIVERED' } as any);
    await expect(svc.shipOutbound(TENANT, 'os1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recordDelivery — transitions SHIPPED to DELIVERED', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.outboundShipment.findFirst).mockResolvedValue({ id: 'os1', status: 'IN_TRANSIT' } as any);
    vi.mocked(prisma.outboundShipment.update).mockResolvedValue({ id: 'os1', status: 'DELIVERED' } as any);
    const result = await svc.recordDelivery(TENANT, 'os1', 'pod.pdf', 'John Doe');
    expect(result).toMatchObject({ status: 'DELIVERED' });
  });

  it('flagOutboundException — sets status to EXCEPTION', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.outboundShipment.findFirst).mockResolvedValue({ id: 'os1', status: 'SHIPPED' } as any);
    vi.mocked(prisma.outboundShipment.update).mockResolvedValue({ id: 'os1', status: 'EXCEPTION' } as any);
    await svc.flagOutboundException(TENANT, 'os1', 'Lost in transit');
    expect(vi.mocked(prisma.outboundShipment.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXCEPTION' }) }),
    );
  });

  it('getShipmentExceptions — queries for EXCEPTION status', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.inboundShipment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.outboundShipment.findMany).mockResolvedValue([{ id: 'os1', status: 'EXCEPTION' }] as any);
    const result = await svc.getShipmentExceptions(TENANT);
    expect(result.outboundExceptions).toHaveLength(1);
    expect(vi.mocked(prisma.outboundShipment.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'EXCEPTION' }) }),
    );
  });

  it('getLogisticsDashboard — returns aggregate counts', async () => {
    const { prisma } = await import('@unerp/database');
    const { InventoryLogisticsService } = await import('../inventory-logistics.service');
    const svc = new InventoryLogisticsService();
    vi.mocked(prisma.advanceShippingNotice.count).mockResolvedValue(5 as any);
    vi.mocked(prisma.inboundShipment.count).mockResolvedValue(3 as any);
    vi.mocked(prisma.outboundShipment.count).mockResolvedValue(7 as any);
    vi.mocked(prisma.shippingCarrier.count).mockResolvedValue(2 as any);
    const dashboard = await svc.getLogisticsDashboard(TENANT);
    expect(dashboard).toHaveProperty('carrierCount', 2);
    expect(dashboard.asns).toHaveProperty('total', 5);
  });
});
