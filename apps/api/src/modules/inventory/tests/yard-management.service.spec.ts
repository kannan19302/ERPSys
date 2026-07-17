import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { YardManagementService } from '../yard-management.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    dockDoor: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    yardAppointment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    gatePass: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    yardMove: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    yardInventory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const TENANT = 't1';
const USER = 'u1';

const mockDoor = (o: Record<string, unknown> = {}) => ({
  id: 'door1', tenantId: TENANT, warehouseId: 'wh1',
  doorNumber: 'D01', doorType: 'DUAL', status: 'AVAILABLE', notes: null,
  createdAt: new Date(), updatedAt: new Date(),
  ...o,
});

const mockAppt = (o: Record<string, unknown> = {}) => ({
  id: 'appt1', tenantId: TENANT, appointmentNumber: 'YA-000001',
  warehouseId: 'wh1', status: 'SCHEDULED', appointmentType: 'INBOUND',
  scheduledAt: new Date(), dockDoorId: null, gatePass: null, yardMoves: [],
  carrierName: 'FedEx', driverName: 'John', truckPlate: 'TX-1234', trailerNumber: 'TRL-001',
  ...o,
});

const mockMove = (o: Record<string, unknown> = {}) => ({
  id: 'move1', tenantId: TENANT, warehouseId: 'wh1',
  trailerNumber: 'TRL-001', fromLocation: 'GATE-1', toLocation: 'DOCK-3',
  status: 'PENDING', assignedTo: null, startedAt: null, completedAt: null,
  ...o,
});

describe('YardManagementService', () => {
  let svc: YardManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new YardManagementService();
  });

  describe('listDockDoors', () => {
    it('returns doors for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.findMany).mockResolvedValue([mockDoor()] as never);
      const result = await svc.listDockDoors(TENANT);
      expect(result).toHaveLength(1);
    });

    it('filters by warehouseId', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.findMany).mockResolvedValue([] as never);
      await svc.listDockDoors(TENANT, 'wh2');
      expect(prisma.dockDoor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ warehouseId: 'wh2' }) }),
      );
    });
  });

  describe('createDockDoor', () => {
    it('creates a door', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.create).mockResolvedValue(mockDoor() as never);
      const result = await svc.createDockDoor(TENANT, { warehouseId: 'wh1', doorNumber: 'D01', doorType: 'DUAL' });
      expect(result.doorNumber).toBe('D01');
    });
  });

  describe('updateDockDoor', () => {
    it('updates door status', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.findFirst).mockResolvedValue(mockDoor() as never);
      vi.mocked(prisma.dockDoor.update).mockResolvedValue(mockDoor({ status: 'MAINTENANCE' }) as never);
      const result = await svc.updateDockDoor(TENANT, 'door1', { status: 'MAINTENANCE' });
      expect(result.status).toBe('MAINTENANCE');
    });

    it('throws if door not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.findFirst).mockResolvedValue(null as never);
      await expect(svc.updateDockDoor(TENANT, 'bad', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDockDoor', () => {
    it('deletes door with no active appointments', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.findFirst).mockResolvedValue(mockDoor() as never);
      vi.mocked(prisma.yardAppointment.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.dockDoor.delete).mockResolvedValue(mockDoor() as never);
      const result = await svc.deleteDockDoor(TENANT, 'door1');
      expect(result.deleted).toBe(true);
    });

    it('throws if active appointments exist', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.findFirst).mockResolvedValue(mockDoor() as never);
      vi.mocked(prisma.yardAppointment.count).mockResolvedValue(1 as never);
      await expect(svc.deleteDockDoor(TENANT, 'door1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createAppointment', () => {
    it('creates appointment with auto-number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.yardAppointment.create).mockResolvedValue(mockAppt() as never);
      const result = await svc.createAppointment(TENANT, {
        warehouseId: 'wh1', scheduledAt: new Date().toISOString(),
      });
      expect(prisma.yardAppointment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ appointmentNumber: 'YA-000001' }) }),
      );
      expect(result.id).toBe('appt1');
    });

    it('throws if dock door is in MAINTENANCE', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.dockDoor.findFirst).mockResolvedValue(mockDoor({ status: 'MAINTENANCE' }) as never);
      await expect(svc.createAppointment(TENANT, {
        warehouseId: 'wh1', scheduledAt: new Date().toISOString(), dockDoorId: 'door1',
      })).rejects.toThrow(BadRequestException);
    });

    it('throws if dock door has time conflict', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.count)
        .mockResolvedValueOnce(2 as never)  // seq count
        .mockResolvedValueOnce(1 as never); // conflict count
      vi.mocked(prisma.dockDoor.findFirst).mockResolvedValue(mockDoor() as never);
      await expect(svc.createAppointment(TENANT, {
        warehouseId: 'wh1', scheduledAt: new Date().toISOString(), dockDoorId: 'door1',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkIn', () => {
    it('checks in a SCHEDULED appointment', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt() as never);
      vi.mocked(prisma.gatePass.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.gatePass.create).mockResolvedValue({ id: 'gp1', passNumber: 'GP-000001' } as never);
      vi.mocked(prisma.yardAppointment.update).mockResolvedValue(mockAppt({ status: 'CHECKED_IN' }) as never);
      const result = await svc.checkIn(TENANT, 'appt1', USER, {});
      expect(result.status).toBe('CHECKED_IN');
    });

    it('throws if not SCHEDULED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt({ status: 'LOADING' }) as never);
      await expect(svc.checkIn(TENANT, 'appt1', USER, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('startLoading', () => {
    it('moves CHECKED_IN to LOADING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt({ status: 'CHECKED_IN' }) as never);
      vi.mocked(prisma.yardAppointment.update).mockResolvedValue(mockAppt({ status: 'LOADING' }) as never);
      const result = await svc.startLoading(TENANT, 'appt1');
      expect(result.status).toBe('LOADING');
    });

    it('throws if not CHECKED_IN', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt({ status: 'SCHEDULED' }) as never);
      await expect(svc.startLoading(TENANT, 'appt1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('completes a LOADING appointment', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(
        mockAppt({ status: 'LOADING', dockDoorId: 'door1', gatePass: { id: 'gp1' } }) as never,
      );
      vi.mocked(prisma.dockDoor.update).mockResolvedValue(mockDoor() as never);
      vi.mocked(prisma.gatePass.update).mockResolvedValue({ id: 'gp1' } as never);
      vi.mocked(prisma.yardAppointment.update).mockResolvedValue(mockAppt({ status: 'COMPLETE' }) as never);
      const result = await svc.complete(TENANT, 'appt1', USER, {});
      expect(result.status).toBe('COMPLETE');
    });

    it('throws if not in CHECKED_IN or LOADING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt({ status: 'SCHEDULED' }) as never);
      await expect(svc.complete(TENANT, 'appt1', USER, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('markNoShow', () => {
    it('marks SCHEDULED appointment as NO_SHOW', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt() as never);
      vi.mocked(prisma.yardAppointment.update).mockResolvedValue(mockAppt({ status: 'NO_SHOW' }) as never);
      const result = await svc.markNoShow(TENANT, 'appt1');
      expect(result.status).toBe('NO_SHOW');
    });

    it('throws if not SCHEDULED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt({ status: 'CHECKED_IN' }) as never);
      await expect(svc.markNoShow(TENANT, 'appt1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelAppointment', () => {
    it('cancels a SCHEDULED appointment', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt() as never);
      vi.mocked(prisma.yardAppointment.update).mockResolvedValue(mockAppt({ status: 'CANCELLED' }) as never);
      const result = await svc.cancelAppointment(TENANT, 'appt1');
      expect(result.status).toBe('CANCELLED');
    });

    it('throws if already terminal', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardAppointment.findFirst).mockResolvedValue(mockAppt({ status: 'COMPLETE' }) as never);
      await expect(svc.cancelAppointment(TENANT, 'appt1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createYardMove', () => {
    it('creates a yard move', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardMove.create).mockResolvedValue(mockMove() as never);
      const result = await svc.createYardMove(TENANT, {
        warehouseId: 'wh1', trailerNumber: 'TRL-001', fromLocation: 'GATE-1', toLocation: 'DOCK-3',
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('startYardMove', () => {
    it('starts a PENDING move', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardMove.findFirst).mockResolvedValue(mockMove() as never);
      vi.mocked(prisma.yardMove.update).mockResolvedValue(mockMove({ status: 'IN_PROGRESS' }) as never);
      const result = await svc.startYardMove(TENANT, 'move1');
      expect(result?.status).toBe('IN_PROGRESS');
    });

    it('throws if not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardMove.findFirst).mockResolvedValue(mockMove({ status: 'IN_PROGRESS' }) as never);
      await expect(svc.startYardMove(TENANT, 'move1')).rejects.toThrow(BadRequestException);
    });

    it('throws if not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardMove.findFirst).mockResolvedValue(null as never);
      await expect(svc.startYardMove(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeYardMove', () => {
    it('completes an IN_PROGRESS move and updates yard inventory location', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardMove.findFirst)
        .mockResolvedValueOnce(mockMove({ status: 'IN_PROGRESS' }) as never)
        .mockResolvedValueOnce(mockMove({ status: 'COMPLETE' }) as never);
      vi.mocked(prisma.yardMove.update).mockResolvedValue(mockMove({ status: 'COMPLETE' }) as never);
      vi.mocked(prisma.yardInventory.updateMany).mockResolvedValue({ count: 1 } as never);
      await svc.completeYardMove(TENANT, 'move1');
      expect(prisma.yardInventory.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { location: 'DOCK-3' } }),
      );
    });

    it('throws if not IN_PROGRESS', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardMove.findFirst).mockResolvedValue(mockMove({ status: 'PENDING' }) as never);
      await expect(svc.completeYardMove(TENANT, 'move1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboard', () => {
    it('returns aggregated dashboard metrics', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dockDoor.count).mockResolvedValue(10 as never);
      vi.mocked(prisma.yardAppointment.count).mockResolvedValue(5 as never);
      vi.mocked(prisma.yardMove.count).mockResolvedValue(3 as never);
      vi.mocked(prisma.yardInventory.count).mockResolvedValue(8 as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.doors.total).toBe(10);
      expect(result.pendingMoves).toBe(3);
      expect(result.yardTrailers).toBe(8);
    });
  });

  describe('listYardInventory', () => {
    it('returns active yard inventory (no departedAt)', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardInventory.findMany).mockResolvedValue([
        { id: 'yi1', trailerNumber: 'TRL-001', location: 'Y-A1', departedAt: null },
      ] as never);
      const result = await svc.listYardInventory(TENANT);
      expect(result).toHaveLength(1);
      expect(prisma.yardInventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ departedAt: null }) }),
      );
    });
  });

  describe('departYardInventory', () => {
    it('marks inventory as departed', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardInventory.findFirst).mockResolvedValue(
        { id: 'yi1', departedAt: null } as never,
      );
      vi.mocked(prisma.yardInventory.update).mockResolvedValue(
        { id: 'yi1', departedAt: new Date() } as never,
      );
      const result = await svc.departYardInventory(TENANT, 'yi1');
      expect(result.departedAt).toBeDefined();
    });

    it('throws if already departed', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.yardInventory.findFirst).mockResolvedValue(
        { id: 'yi1', departedAt: new Date() } as never,
      );
      await expect(svc.departYardInventory(TENANT, 'yi1')).rejects.toThrow(BadRequestException);
    });
  });
});
