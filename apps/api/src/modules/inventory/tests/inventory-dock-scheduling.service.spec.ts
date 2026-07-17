import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory.service';

const { db } = vi.hoisted(() => {
  const db: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    dockAppointment: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));
vi.mock('../../../common/utils/pagination.util', async () => {
  const actual = await vi.importActual<any>('../../../common/utils/pagination.util');
  return { ...actual, resolveOrgId: vi.fn().mockResolvedValue('org-1') };
});

describe('InventoryService — yard/dock appointment scheduling', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('createDockAppointment', () => {
    it('rejects an overlapping booking on the same dock door', async () => {
      db.dockAppointment.findMany.mockResolvedValue([
        { scheduledAt: new Date('2026-08-01T10:00:00Z'), durationMinutes: 60 },
      ]);

      await expect(
        service.createDockAppointment('t1', 'org-1', {
          warehouseId: 'w1', dockDoor: 'D1', type: 'INBOUND', carrierName: 'Acme Freight',
          scheduledAt: '2026-08-01T10:30:00Z', durationMinutes: 60,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows a non-overlapping booking on the same dock door', async () => {
      db.dockAppointment.findMany.mockResolvedValue([
        { scheduledAt: new Date('2026-08-01T10:00:00Z'), durationMinutes: 60 },
      ]);
      db.dockAppointment.create.mockResolvedValue({ id: 'appt1', status: 'SCHEDULED' });

      const result = await service.createDockAppointment('t1', 'org-1', {
        warehouseId: 'w1', dockDoor: 'D1', type: 'INBOUND', carrierName: 'Acme Freight',
        scheduledAt: '2026-08-01T11:00:00Z', durationMinutes: 60,
      } as any);

      expect(result.status).toBe('SCHEDULED');
    });

    it('allows overlapping requests on different dock doors', async () => {
      db.dockAppointment.findMany.mockResolvedValue([]);
      db.dockAppointment.create.mockResolvedValue({ id: 'appt2', status: 'SCHEDULED' });

      const result = await service.createDockAppointment('t1', 'org-1', {
        warehouseId: 'w1', dockDoor: 'D2', type: 'OUTBOUND', carrierName: 'Beta Logistics',
        scheduledAt: '2026-08-01T10:30:00Z', durationMinutes: 60,
      } as any);

      expect(result.id).toBe('appt2');
    });
  });

  describe('lifecycle', () => {
    it('checks in a scheduled appointment', async () => {
      db.dockAppointment.findFirst.mockResolvedValue({ id: 'appt1', status: 'SCHEDULED' });
      db.dockAppointment.update.mockResolvedValue({ id: 'appt1', status: 'CHECKED_IN' });
      const result = await service.checkInDockAppointment('t1', 'appt1');
      expect(result.status).toBe('CHECKED_IN');
    });

    it('throws NotFound checking in a non-scheduled appointment', async () => {
      db.dockAppointment.findFirst.mockResolvedValue(null);
      await expect(service.checkInDockAppointment('t1', 'appt1')).rejects.toThrow(NotFoundException);
    });

    it('rejects completing an already-completed appointment', async () => {
      db.dockAppointment.findFirst.mockResolvedValue({ id: 'appt1', status: 'COMPLETED' });
      await expect(service.completeDockAppointment('t1', 'appt1')).rejects.toThrow(BadRequestException);
    });

    it('cancels an appointment', async () => {
      db.dockAppointment.findFirst.mockResolvedValue({ id: 'appt1', status: 'SCHEDULED' });
      db.dockAppointment.update.mockResolvedValue({ id: 'appt1', status: 'CANCELLED' });
      const result = await service.cancelDockAppointment('t1', 'appt1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('getDockUtilization', () => {
    it('sums booked minutes per dock door and computes utilization percentage', async () => {
      db.dockAppointment.findMany.mockResolvedValue([
        { dockDoor: 'D1', durationMinutes: 120 },
        { dockDoor: 'D1', durationMinutes: 60 },
      ]);

      const result = await service.getDockUtilization('t1', 'w1', 1);

      expect(result.doors[0].dockDoor).toBe('D1');
      expect(result.doors[0].bookedMinutes).toBe(180);
      expect(result.doors[0].utilizationPct).toBeCloseTo(12.5, 1);
    });
  });
});
