import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class YardManagementService {
  // ── Dock Doors ────────────────────────────────────────────────────────────────

  async listDockDoors(tenantId: string, warehouseId?: string) {
    return prisma.dockDoor.findMany({
      where: { tenantId, ...(warehouseId ? { warehouseId } : {}) },
      include: { _count: { select: { appointments: true } } },
      orderBy: [{ warehouseId: 'asc' }, { doorNumber: 'asc' }],
    });
  }

  async createDockDoor(tenantId: string, dto: {
    warehouseId: string; doorNumber: string; doorType?: string; notes?: string;
  }) {
    return prisma.dockDoor.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        doorNumber: dto.doorNumber,
        doorType: (dto.doorType ?? 'DUAL') as never,
        notes: dto.notes,
      },
    });
  }

  async updateDockDoor(tenantId: string, id: string, dto: {
    status?: string; doorType?: string; notes?: string;
  }) {
    const door = await prisma.dockDoor.findFirst({ where: { tenantId, id } });
    if (!door) throw new NotFoundException('Dock door not found');
    return prisma.dockDoor.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as never }),
        ...(dto.doorType && { doorType: dto.doorType as never }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteDockDoor(tenantId: string, id: string) {
    const door = await prisma.dockDoor.findFirst({ where: { tenantId, id } });
    if (!door) throw new NotFoundException('Dock door not found');
    const active = await prisma.yardAppointment.count({
      where: { tenantId, dockDoorId: id, status: { in: ['SCHEDULED', 'CHECKED_IN', 'LOADING'] as never[] } },
    });
    if (active > 0) throw new BadRequestException('Cannot delete a door with active appointments');
    await prisma.dockDoor.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Appointments ──────────────────────────────────────────────────────────────

  async listAppointments(tenantId: string, warehouseId?: string, status?: string, date?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status as never;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      where.scheduledAt = { gte: d, lt: next };
    }
    return prisma.yardAppointment.findMany({
      where,
      include: { dockDoor: true, gatePass: true, _count: { select: { yardMoves: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getAppointment(tenantId: string, id: string) {
    const a = await prisma.yardAppointment.findFirst({
      where: { tenantId, id },
      include: { dockDoor: true, gatePass: true, yardMoves: true },
    });
    if (!a) throw new NotFoundException('Appointment not found');
    return a;
  }

  async createAppointment(tenantId: string, dto: {
    warehouseId: string;
    scheduledAt: string;
    appointmentType?: string;
    dockDoorId?: string;
    carrierId?: string;
    carrierName?: string;
    driverName?: string;
    truckPlate?: string;
    trailerNumber?: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    const seq = await prisma.yardAppointment.count({ where: { tenantId } });
    const appointmentNumber = `YA-${String(seq + 1).padStart(6, '0')}`;

    if (dto.dockDoorId) {
      const door = await prisma.dockDoor.findFirst({ where: { tenantId, id: dto.dockDoorId } });
      if (!door) throw new BadRequestException('Dock door not found');
      if (door.status === 'MAINTENANCE' || door.status === 'CLOSED') {
        throw new BadRequestException(`Dock door is ${door.status}`);
      }
      // Check for time conflicts (±2 hours window)
      const scheduledAt = new Date(dto.scheduledAt);
      const windowStart = new Date(scheduledAt.getTime() - 2 * 3600000);
      const windowEnd = new Date(scheduledAt.getTime() + 2 * 3600000);
      const conflict = await prisma.yardAppointment.count({
        where: {
          tenantId,
          dockDoorId: dto.dockDoorId,
          status: { in: ['SCHEDULED', 'CHECKED_IN', 'LOADING'] as never[] },
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
      });
      if (conflict > 0) throw new BadRequestException('Dock door has a conflicting appointment in the ±2h window');
    }

    return prisma.yardAppointment.create({
      data: {
        tenantId,
        appointmentNumber,
        warehouseId: dto.warehouseId,
        scheduledAt: new Date(dto.scheduledAt),
        appointmentType: dto.appointmentType ?? 'INBOUND',
        dockDoorId: dto.dockDoorId,
        carrierId: dto.carrierId,
        carrierName: dto.carrierName,
        driverName: dto.driverName,
        truckPlate: dto.truckPlate,
        trailerNumber: dto.trailerNumber,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
      },
      include: { dockDoor: true },
    });
  }

  async checkIn(tenantId: string, id: string, checkedInBy: string, dto: {
    dockDoorId?: string; truckPlate?: string; driverName?: string; vehicleWeight?: number;
  }) {
    const a = await this.getAppointment(tenantId, id);
    if (a.status !== 'SCHEDULED') throw new BadRequestException('Only SCHEDULED appointments can be checked in');

    if (dto.dockDoorId) {
      await prisma.dockDoor.update({
        where: { id: dto.dockDoorId },
        data: { status: 'OCCUPIED' },
      });
    }

    const seq = await prisma.gatePass.count({ where: { tenantId } });
    const passNumber = `GP-${String(seq + 1).padStart(6, '0')}`;

    await prisma.gatePass.create({
      data: {
        tenantId,
        appointmentId: id,
        passNumber,
        gateInAt: new Date(),
        gateInBy: checkedInBy,
        vehicleWeight: dto.vehicleWeight != null ? new Prisma.Decimal(dto.vehicleWeight) : undefined,
      },
    });

    return prisma.yardAppointment.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        ...(dto.dockDoorId && { dockDoorId: dto.dockDoorId }),
        ...(dto.truckPlate && { truckPlate: dto.truckPlate }),
        ...(dto.driverName && { driverName: dto.driverName }),
      },
      include: { gatePass: true },
    });
  }

  async startLoading(tenantId: string, id: string) {
    const a = await this.getAppointment(tenantId, id);
    if (a.status !== 'CHECKED_IN') throw new BadRequestException('Appointment must be CHECKED_IN to start loading');
    return prisma.yardAppointment.update({
      where: { id },
      data: { status: 'LOADING', loadingStartAt: new Date() },
    });
  }

  async complete(tenantId: string, id: string, completedBy: string, dto: { notes?: string }) {
    const a = await this.getAppointment(tenantId, id);
    if (!['CHECKED_IN', 'LOADING'].includes(a.status)) {
      throw new BadRequestException('Appointment must be CHECKED_IN or LOADING to complete');
    }

    if (a.dockDoorId) {
      await prisma.dockDoor.update({ where: { id: a.dockDoorId }, data: { status: 'AVAILABLE' } });
    }

    if (a.gatePass) {
      await prisma.gatePass.update({
        where: { id: a.gatePass.id },
        data: { gateOutAt: new Date(), gateOutBy: completedBy },
      });
    }

    return prisma.yardAppointment.update({
      where: { id },
      data: {
        status: 'COMPLETE',
        completedAt: new Date(),
        ...(dto.notes && { notes: dto.notes }),
      },
    });
  }

  async markNoShow(tenantId: string, id: string) {
    const a = await this.getAppointment(tenantId, id);
    if (a.status !== 'SCHEDULED') throw new BadRequestException('Only SCHEDULED appointments can be marked no-show');
    return prisma.yardAppointment.update({ where: { id }, data: { status: 'NO_SHOW' } });
  }

  async cancelAppointment(tenantId: string, id: string) {
    const a = await this.getAppointment(tenantId, id);
    if (['COMPLETE', 'CANCELLED', 'NO_SHOW'].includes(a.status)) {
      throw new BadRequestException('Cannot cancel a terminal appointment');
    }
    if (a.dockDoorId && ['CHECKED_IN', 'LOADING'].includes(a.status)) {
      await prisma.dockDoor.update({ where: { id: a.dockDoorId }, data: { status: 'AVAILABLE' } });
    }
    return prisma.yardAppointment.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async rescheduled(tenantId: string, id: string, dto: { scheduledAt: string; dockDoorId?: string }) {
    const a = await this.getAppointment(tenantId, id);
    if (!['SCHEDULED'].includes(a.status)) {
      throw new BadRequestException('Only SCHEDULED appointments can be rescheduled');
    }
    return prisma.yardAppointment.update({
      where: { id },
      data: {
        scheduledAt: new Date(dto.scheduledAt),
        ...(dto.dockDoorId !== undefined && { dockDoorId: dto.dockDoorId }),
      },
    });
  }

  // ── Yard Moves ────────────────────────────────────────────────────────────────

  async listYardMoves(tenantId: string, warehouseId?: string, status?: string) {
    return prisma.yardMove.findMany({
      where: {
        tenantId,
        ...(warehouseId ? { warehouseId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: { appointment: { select: { appointmentNumber: true, carrierName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createYardMove(tenantId: string, dto: {
    warehouseId: string; trailerNumber: string; fromLocation: string; toLocation: string;
    appointmentId?: string; assignedTo?: string; notes?: string;
  }) {
    return prisma.yardMove.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        trailerNumber: dto.trailerNumber,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        appointmentId: dto.appointmentId,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
      },
    });
  }

  async startYardMove(tenantId: string, id: string) {
    const move = await prisma.yardMove.findFirst({ where: { tenantId, id } });
    if (!move) throw new NotFoundException('Yard move not found');
    if (move.status !== 'PENDING') throw new BadRequestException('Yard move must be PENDING to start');
    return prisma.yardMove.update({ where: { id }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });
  }

  async completeYardMove(tenantId: string, id: string) {
    const move = await prisma.yardMove.findFirst({ where: { tenantId, id } });
    if (!move) throw new NotFoundException('Yard move not found');
    if (move.status !== 'IN_PROGRESS') throw new BadRequestException('Yard move must be IN_PROGRESS to complete');

    await prisma.yardMove.update({ where: { id }, data: { status: 'COMPLETE', completedAt: new Date() } });

    // Update yard inventory location if tracked
    await prisma.yardInventory.updateMany({
      where: { tenantId, trailerNumber: move.trailerNumber, departedAt: null },
      data: { location: move.toLocation },
    });

    return prisma.yardMove.findFirst({ where: { id } });
  }

  async cancelYardMove(tenantId: string, id: string) {
    const move = await prisma.yardMove.findFirst({ where: { tenantId, id } });
    if (!move) throw new NotFoundException('Yard move not found');
    if (['COMPLETE', 'CANCELLED'].includes(move.status)) {
      throw new BadRequestException('Cannot cancel a terminal yard move');
    }
    return prisma.yardMove.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ── Yard Inventory ────────────────────────────────────────────────────────────

  async listYardInventory(tenantId: string, warehouseId?: string) {
    return prisma.yardInventory.findMany({
      where: { tenantId, ...(warehouseId ? { warehouseId } : {}), departedAt: null },
      orderBy: { arrivedAt: 'asc' },
    });
  }

  async addYardInventory(tenantId: string, dto: {
    warehouseId: string; trailerNumber: string; location: string;
    productId?: string; description?: string; qty?: number; uom?: string; notes?: string;
  }) {
    return prisma.yardInventory.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        trailerNumber: dto.trailerNumber,
        location: dto.location,
        productId: dto.productId,
        description: dto.description,
        qty: dto.qty != null ? new Prisma.Decimal(dto.qty) : undefined,
        uom: dto.uom,
        notes: dto.notes,
      },
    });
  }

  async departYardInventory(tenantId: string, id: string) {
    const inv = await prisma.yardInventory.findFirst({ where: { tenantId, id } });
    if (!inv) throw new NotFoundException('Yard inventory record not found');
    if (inv.departedAt) throw new BadRequestException('Already departed');
    return prisma.yardInventory.update({ where: { id }, data: { departedAt: new Date() } });
  }

  // ── Gate Pass ─────────────────────────────────────────────────────────────────

  async getGatePass(tenantId: string, appointmentId: string) {
    const gp = await prisma.gatePass.findFirst({ where: { tenantId, appointmentId } });
    if (!gp) throw new NotFoundException('Gate pass not found');
    return gp;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string, warehouseId?: string) {
    const where = { tenantId, ...(warehouseId ? { warehouseId } : {}) };
    const doorWhere = { tenantId, ...(warehouseId ? { warehouseId } : {}) };

    const [
      totalDoors, availableDoors, occupiedDoors,
      totalAppointments, scheduled, checkedIn, loading, todayComplete,
      pendingMoves, yardTrailers,
    ] = await Promise.all([
      prisma.dockDoor.count({ where: doorWhere }),
      prisma.dockDoor.count({ where: { ...doorWhere, status: 'AVAILABLE' } }),
      prisma.dockDoor.count({ where: { ...doorWhere, status: 'OCCUPIED' } }),
      prisma.yardAppointment.count({ where }),
      prisma.yardAppointment.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.yardAppointment.count({ where: { ...where, status: 'CHECKED_IN' } }),
      prisma.yardAppointment.count({ where: { ...where, status: 'LOADING' } }),
      prisma.yardAppointment.count({
        where: {
          ...where, status: 'COMPLETE',
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.yardMove.count({ where: { ...where, status: { in: ['PENDING', 'IN_PROGRESS'] as never[] } } }),
      prisma.yardInventory.count({ where: { ...where, departedAt: null } }),
    ]);

    return {
      doors: { total: totalDoors, available: availableDoors, occupied: occupiedDoors },
      appointments: { total: totalAppointments, scheduled, checkedIn, loading, todayComplete },
      pendingMoves,
      yardTrailers,
    };
  }

  async getDockDoorSchedule(tenantId: string, warehouseId: string, date: string) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);

    const doors = await prisma.dockDoor.findMany({
      where: { tenantId, warehouseId },
      include: {
        appointments: {
          where: { scheduledAt: { gte: d, lt: next } },
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { doorNumber: 'asc' },
    });

    return doors.map(door => ({
      id: door.id,
      doorNumber: door.doorNumber,
      doorType: door.doorType,
      status: door.status,
      appointments: door.appointments.map(a => ({
        id: a.id,
        appointmentNumber: a.appointmentNumber,
        scheduledAt: a.scheduledAt,
        status: a.status,
        carrierName: a.carrierName,
        appointmentType: a.appointmentType,
      })),
    }));
  }

  async getAppointmentsByDateRange(tenantId: string, from: string, to: string, warehouseId?: string) {
    return prisma.yardAppointment.findMany({
      where: {
        tenantId,
        ...(warehouseId ? { warehouseId } : {}),
        scheduledAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: { dockDoor: { select: { doorNumber: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getTurnaroundReport(tenantId: string, warehouseId?: string) {
    const completed = await prisma.yardAppointment.findMany({
      where: {
        tenantId,
        ...(warehouseId ? { warehouseId } : {}),
        status: 'COMPLETE',
        checkedInAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        id: true, appointmentType: true, carrierName: true,
        scheduledAt: true, checkedInAt: true, loadingStartAt: true, completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });

    const rows = completed.map(a => {
      const waitMins = a.checkedInAt && a.loadingStartAt
        ? (a.loadingStartAt.getTime() - a.checkedInAt.getTime()) / 60000 : null;
      const loadingMins = a.loadingStartAt && a.completedAt
        ? (a.completedAt.getTime() - a.loadingStartAt.getTime()) / 60000 : null;
      const totalMins = a.checkedInAt && a.completedAt
        ? (a.completedAt.getTime() - a.checkedInAt.getTime()) / 60000 : null;
      return { ...a, waitMins, loadingMins, totalMins };
    });

    const totals = rows.filter(r => r.totalMins != null);
    const avgTurnaround = totals.length
      ? totals.reduce((s, r) => s + (r.totalMins ?? 0), 0) / totals.length : 0;

    return { appointments: rows, avgTurnaroundMinutes: Math.round(avgTurnaround) };
  }
}
