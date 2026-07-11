import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EconomicNexusService } from '../services/economic-nexus.service';
import { prisma } from '@unerp/database';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private value: number;
        constructor(val: unknown) {
          this.value = Number(val);
        }
        toNumber() {
          return this.value;
        }
        valueOf() {
          return this.value;
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    prisma: {
      economicNexusThreshold: createMockPrismaCollection(),
      nexusMonitoringSnapshot: createMockPrismaCollection(),
      nexusRegistration: createMockPrismaCollection(),
      invoice: createMockPrismaCollection(),
    },
  };
});

describe('EconomicNexusService', () => {
  let service: EconomicNexusService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EconomicNexusService();
  });

  describe('listThresholds', () => {
    it('lists only active thresholds for the tenant', async () => {
      vi.mocked(prisma.economicNexusThreshold.findMany).mockResolvedValue([{ id: 't1', state: 'CA' }] as any);
      const result = await service.listThresholds('tenant-1');
      expect(result).toHaveLength(1);
      expect(prisma.economicNexusThreshold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1', isActive: true } }),
      );
    });
  });

  describe('getThreshold', () => {
    it('throws NotFoundException when missing', async () => {
      vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue(null);
      await expect(service.getThreshold('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createThreshold', () => {
    it('rejects a duplicate state threshold', async () => {
      vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue({ id: 'existing' } as any);
      await expect(
        service.createThreshold('tenant-1', { state: 'CA', revenueThreshold: 500000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a new threshold with defaults applied', async () => {
      vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.economicNexusThreshold.create).mockResolvedValue({ id: 'new-1', state: 'TX' } as any);

      const result = await service.createThreshold('tenant-1', { state: 'TX', revenueThreshold: 500000 });
      expect(result.id).toBe('new-1');
      expect(prisma.economicNexusThreshold.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-1', state: 'TX', country: 'US', measurementPeriod: 'TRAILING_12_MONTHS' }),
        }),
      );
    });
  });

  describe('seedDefaultThresholds', () => {
    it('skips states that already have a threshold row', async () => {
      vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue({ id: 'exists' } as any);
      const result = await service.seedDefaultThresholds('tenant-1');
      expect(result.seeded).toBe(0);
      expect(prisma.economicNexusThreshold.create).not.toHaveBeenCalled();
    });

    it('creates all reference states when none exist', async () => {
      vi.mocked(prisma.economicNexusThreshold.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.economicNexusThreshold.create).mockResolvedValue({ id: 'x' } as any);
      const result = await service.seedDefaultThresholds('tenant-1');
      expect(result.seeded).toBe(result.totalStates);
      expect(result.seeded).toBeGreaterThan(15);
    });
  });

  describe('extractState (via refreshMonitoring)', () => {
    it('resolves full state names case-insensitively and does not truncate unmapped values into a wrong 2-letter code', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { totalAmount: 1000, customer: { billingAddress: { state: 'Texas' }, shippingAddress: null } },
        { totalAmount: 1000, customer: { billingAddress: { state: 'not-a-real-place' }, shippingAddress: null } },
      ] as any);
      vi.mocked(prisma.economicNexusThreshold.findMany).mockResolvedValue([]);
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([]);
      vi.mocked(prisma.nexusMonitoringSnapshot.create).mockImplementation(
        (args: any) => Promise.resolve({ id: 'snap', ...args.data }) as any,
      );

      const result = await service.refreshMonitoring('tenant-1');
      // "Texas" must resolve to TX (not be truncated to "TE"); the garbage value must be dropped entirely.
      expect(result.snapshots.map((s: any) => s.state)).toEqual(['TX']);
    });
  });

  describe('tenant isolation', () => {
    it('refreshMonitoring only reads invoices/thresholds/registrations scoped to the calling tenant', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);
      vi.mocked(prisma.economicNexusThreshold.findMany).mockResolvedValue([]);
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([]);

      await service.refreshMonitoring('tenant-A');

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-A' }) }),
      );
      expect(prisma.economicNexusThreshold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-A' }) }),
      );
      expect(prisma.nexusRegistration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-A' } }),
      );
    });

    it('getLatestMonitoring and getDashboard scope snapshot/registration reads to the calling tenant only', async () => {
      vi.mocked(prisma.nexusMonitoringSnapshot.findMany).mockResolvedValue([
        { state: 'CA', status: 'EXCEEDED', totalRevenue: 100, revenuePct: 100, computedAt: new Date() },
      ] as any);
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([]);

      await service.getLatestMonitoring('tenant-B');
      expect(prisma.nexusMonitoringSnapshot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-B' } }),
      );

      await service.getDashboard('tenant-B');
      expect(prisma.nexusRegistration.findMany).toHaveBeenLastCalledWith({ where: { tenantId: 'tenant-B' } });
    });

    it('listRegistrations and listThresholds never return rows without filtering by the given tenantId', async () => {
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([{ id: 'r1', tenantId: 'tenant-C' }] as any);
      await service.listRegistrations('tenant-C');
      expect(prisma.nexusRegistration.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-C' }, orderBy: { state: 'asc' } });

      vi.mocked(prisma.economicNexusThreshold.findMany).mockResolvedValue([{ id: 't1', tenantId: 'tenant-C' }] as any);
      await service.listThresholds('tenant-C');
      expect(prisma.economicNexusThreshold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-C', isActive: true } }),
      );
    });
  });

  describe('refreshMonitoring', () => {
    it('aggregates invoice revenue/count by customer state and flags EXCEEDED vs APPROACHING vs NOT_MET', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { totalAmount: 60000, customer: { billingAddress: { state: 'CA' }, shippingAddress: null } },
        { totalAmount: 50000, customer: { billingAddress: { state: 'CA' }, shippingAddress: null } },
        { totalAmount: 1000, customer: { billingAddress: { state: 'NV' }, shippingAddress: null } },
      ] as any);
      vi.mocked(prisma.economicNexusThreshold.findMany).mockResolvedValue([
        { state: 'CA', revenueThreshold: 100000, transactionThreshold: null },
      ] as any);
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([]);
      vi.mocked(prisma.nexusMonitoringSnapshot.create).mockImplementation(
        (args: any) => Promise.resolve({ id: 'snap', ...args.data }) as any,
      );

      const result = await service.refreshMonitoring('tenant-1');
      expect(result.computedStates).toBe(2);
      const ca = result.snapshots.find((s: any) => s.state === 'CA');
      const nv = result.snapshots.find((s: any) => s.state === 'NV');
      expect(ca.status).toBe('EXCEEDED'); // 110000 revenue >= 100000 threshold
      expect(nv.status).toBe('NOT_MET'); // 1000 revenue vs 100000 default threshold
    });

    it('marks a state REGISTERED when an active registration exists, overriding the computed threshold status', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { totalAmount: 5000, customer: { billingAddress: { state: 'NY' }, shippingAddress: null } },
      ] as any);
      vi.mocked(prisma.economicNexusThreshold.findMany).mockResolvedValue([]);
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([{ state: 'NY', status: 'REGISTERED' }] as any);
      vi.mocked(prisma.nexusMonitoringSnapshot.create).mockImplementation(
        (args: any) => Promise.resolve({ id: 'snap', ...args.data }) as any,
      );

      const result = await service.refreshMonitoring('tenant-1');
      expect(result.snapshots[0].status).toBe('REGISTERED');
    });
  });

  describe('getLatestMonitoring', () => {
    it('dedupes to the most recent snapshot per state, sorted by revenue % desc', async () => {
      vi.mocked(prisma.nexusMonitoringSnapshot.findMany).mockResolvedValue([
        { state: 'CA', revenuePct: 50, computedAt: new Date('2026-02-01') },
        { state: 'CA', revenuePct: 40, computedAt: new Date('2026-01-01') },
        { state: 'TX', revenuePct: 90, computedAt: new Date('2026-02-01') },
      ] as any);

      const result = await service.getLatestMonitoring('tenant-1');
      expect(result).toHaveLength(2);
      expect(result[0].state).toBe('TX');
      expect(result.find((s: any) => s.state === 'CA')?.revenuePct).toBe(50);
    });
  });

  describe('getDashboard', () => {
    it('summarizes counts by status', async () => {
      vi.mocked(prisma.nexusMonitoringSnapshot.findMany).mockResolvedValue([
        { state: 'CA', status: 'EXCEEDED', totalRevenue: 150000, computedAt: new Date() },
        { state: 'TX', status: 'APPROACHING', totalRevenue: 90000, computedAt: new Date() },
        { state: 'NY', status: 'REGISTERED', totalRevenue: 20000, computedAt: new Date() },
      ] as any);
      vi.mocked(prisma.nexusRegistration.findMany).mockResolvedValue([{ id: 'r1' }] as any);

      const result = await service.getDashboard('tenant-1');
      expect(result.exceededCount).toBe(1);
      expect(result.approachingCount).toBe(1);
      expect(result.registeredCount).toBe(1);
      expect(result.registrationsOnFile).toBe(1);
      expect(result.exceededStates).toEqual(['CA']);
    });
  });

  describe('registrations', () => {
    it('createRegistration rejects a duplicate state', async () => {
      vi.mocked(prisma.nexusRegistration.findFirst).mockResolvedValue({ id: 'existing' } as any);
      await expect(
        service.createRegistration('tenant-1', 'user-1', { state: 'CA' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('createRegistration creates a NOT_REGISTERED record by default', async () => {
      vi.mocked(prisma.nexusRegistration.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.nexusRegistration.create).mockResolvedValue({ id: 'reg-1', status: 'NOT_REGISTERED' } as any);
      const result = await service.createRegistration('tenant-1', 'user-1', { state: 'CA' });
      expect(result.status).toBe('NOT_REGISTERED');
    });

    it('updateRegistration stamps registeredAt when transitioning to REGISTERED', async () => {
      vi.mocked(prisma.nexusRegistration.findFirst).mockResolvedValue({ id: 'reg-1' } as any);
      vi.mocked(prisma.nexusRegistration.update).mockResolvedValue({ id: 'reg-1', status: 'REGISTERED' } as any);
      await service.updateRegistration('tenant-1', 'reg-1', { status: 'REGISTERED' });
      expect(prisma.nexusRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REGISTERED', registeredAt: expect.any(Date) }) }),
      );
    });

    it('deleteRegistration throws NotFoundException for a missing record', async () => {
      vi.mocked(prisma.nexusRegistration.findFirst).mockResolvedValue(null);
      await expect(service.deleteRegistration('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
