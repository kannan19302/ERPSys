import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutboxService, type OutboxTxClient } from '@unerp/shared';
import type { WriteEventParams } from '@unerp/shared';

describe('OutboxService (shared)', () => {
  let service: OutboxService;
  let mockTx: OutboxTxClient;

  beforeEach(() => {
    service = new OutboxService();
    mockTx = {
      outboxEvent: {
        create: vi.fn().mockResolvedValue({ id: 'evt-1', eventKey: 'test-key' }),
        aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }),
      },
      outboxDelivery: {
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      outboxConsumerReceipt: {
        create: vi.fn().mockResolvedValue({ id: 'rcpt-1' }),
      },
    };
  });

  it('should generate eventKey when not provided', async () => {
    const params: WriteEventParams = {
      tenantId: 'tenant-1',
      eventName: 'order.confirmed',
      eventVersion: 1,
      aggregateType: 'SalesOrder',
      aggregateId: 'so-1',
      payload: { total: 100 },
    };

    const result = await service.writeEvent(mockTx, params);
    expect(result.eventKey).toBe('SalesOrder:so-1:order.confirmed:1');
    expect(mockTx.outboxEvent.create).toHaveBeenCalledOnce();
  });

  it('should use provided eventKey', async () => {
    const params: WriteEventParams = {
      tenantId: 'tenant-1',
      eventName: 'order.confirmed',
      eventVersion: 1,
      aggregateType: 'SalesOrder',
      aggregateId: 'so-1',
      payload: { total: 100 },
      eventKey: 'custom-key',
    };

    await service.writeEvent(mockTx, params);
    expect(mockTx.outboxEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventKey: 'custom-key' }),
      }),
    );
  });

  it('should compute next sequence from aggregate', async () => {
    mockTx.outboxEvent.aggregate = vi.fn().mockResolvedValue({ _max: { sequence: 5 } });

    const params: WriteEventParams = {
      tenantId: 'tenant-1',
      eventName: 'order.confirmed',
      eventVersion: 1,
      aggregateType: 'SalesOrder',
      aggregateId: 'so-1',
      payload: {},
    };

    await service.writeEvent(mockTx, params);
    expect(mockTx.outboxEvent.aggregate).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', aggregateType: 'SalesOrder', aggregateId: 'so-1' },
      _max: { sequence: true },
    });
    expect(mockTx.outboxEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sequence: 6, eventKey: 'SalesOrder:so-1:order.confirmed:6' }),
      }),
    );
  });

  it('should create delivery rows for registered destinations', async () => {
    service.registerDestination('order.confirmed', 'inventory');
    service.registerDestination('order.confirmed', 'finance');

    const params: WriteEventParams = {
      tenantId: 'tenant-1',
      eventName: 'order.confirmed',
      eventVersion: 1,
      aggregateType: 'SalesOrder',
      aggregateId: 'so-1',
      payload: {},
    };

    await service.writeEvent(mockTx, params);
    expect(mockTx.outboxDelivery.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ destination: 'inventory' }),
          expect.objectContaining({ destination: 'finance' }),
        ]),
      }),
    );
  });

  it('should not create deliveries when no destinations registered', async () => {
    const params: WriteEventParams = {
      tenantId: 'tenant-1',
      eventName: 'unknown.event',
      eventVersion: 1,
      aggregateType: 'Test',
      aggregateId: 'test-1',
      payload: {},
    };

    await service.writeEvent(mockTx, params);
    expect(mockTx.outboxDelivery.createMany).not.toHaveBeenCalled();
  });

  it('should register and retrieve destinations', () => {
    service.registerDestination('invoice.paid', 'email');
    service.registerDestination('invoice.paid', 'analytics');

    const destinations = service.getRegisteredDestinations('invoice.paid');
    expect(destinations).toEqual(expect.arrayContaining(['email', 'analytics']));
    expect(destinations).toHaveLength(2);
  });

  it('should return empty array for unregistered event', () => {
    expect(service.getRegisteredDestinations('nonexistent')).toEqual([]);
  });

  it('should not duplicate destinations on re-registration', () => {
    service.registerDestination('order.confirmed', 'inventory');
    service.registerDestination('order.confirmed', 'inventory');

    expect(service.getRegisteredDestinations('order.confirmed')).toEqual(['inventory']);
  });
});
