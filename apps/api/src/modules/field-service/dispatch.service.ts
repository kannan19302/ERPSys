import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class DispatchService {

  async getDispatchBoard(tenantId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    const tickets = await prisma.serviceTicket.findMany({
      where: { tenantId, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } },
      orderBy: { priority: 'desc' },
    });

    const dispatches = await prisma.serviceDispatch.findMany({
      where: { tenantId, scheduledTime: { gte: dayStart, lte: dayEnd } },
    });

    const dispatchedTicketIds = new Set(dispatches.map((d) => d.ticketId));
    const unassigned = tickets.filter((t) => !dispatchedTicketIds.has(t.id));

    return {
      date: dayStart.toISOString().slice(0, 10),
      totalTickets: tickets.length,
      dispatched: dispatches.length,
      unassigned: unassigned.length,
      dispatches: dispatches.map((d) => ({
        id: d.id, ticketId: d.ticketId, technicianId: d.technicianId,
        scheduledTime: d.scheduledTime, status: d.status,
      })),
      unassignedTickets: unassigned.map((t) => ({
        id: t.id, title: t.title, priority: t.priority, status: t.status, customerName: t.customerName,
      })),
    };
  }

  async assignTechnician(tenantId: string, dto: {
    ticketId: string; technicianId: string; scheduledTime: string; notes?: string;
  }) {
    const ticket = await prisma.serviceTicket.findFirst({ where: { id: dto.ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Service ticket not found');

    const dispatch = await prisma.serviceDispatch.create({
      data: {
        tenantId, ticketId: dto.ticketId, technicianId: dto.technicianId,
        scheduledTime: new Date(dto.scheduledTime),
        routeDetails: { notes: dto.notes || '' },
        status: 'ASSIGNED',
      },
    });

    await prisma.serviceTicket.update({ where: { id: dto.ticketId }, data: { status: 'ASSIGNED' } });
    return dispatch;
  }

  async updateDispatchStatus(tenantId: string, dispatchId: string, status: string) {
    const dispatch = await prisma.serviceDispatch.findFirst({ where: { id: dispatchId, tenantId } });
    if (!dispatch) throw new NotFoundException('Dispatch not found');

    if (status === 'COMPLETED') {
      await prisma.serviceTicket.update({ where: { id: dispatch.ticketId }, data: { status: 'RESOLVED' } });
    }

    return prisma.serviceDispatch.update({ where: { id: dispatchId }, data: { status } });
  }

  async getSlaStatus(tenantId: string) {
    const tickets = await prisma.serviceTicket.findMany({
      where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } },
    });

    const now = new Date();
    const results = tickets.map((t) => {
      const deadline = new Date(t.slaDeadline);
      const breached = now > deadline;
      const remainingHours = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

      return {
        ticketId: t.id, title: t.title, priority: t.priority,
        slaDeadline: t.slaDeadline,
        remainingHours: Math.round(remainingHours * 10) / 10,
        breached,
      };
    });

    return {
      totalOpen: tickets.length,
      breached: results.filter((r) => r.breached).length,
      atRisk: results.filter((r) => !r.breached && r.remainingHours < 2).length,
      tickets: results,
    };
  }

  async getUpcomingPM(tenantId: string, withinDays = 30) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + withinDays);

    const pmRecords = await prisma.preventativeMaintenance.findMany({
      where: { tenantId, nextRunDate: { lte: cutoff }, status: { not: 'COMPLETED' } },
      orderBy: { nextRunDate: 'asc' },
    });

    return pmRecords.map((pm) => ({
      id: pm.id, customerName: pm.customerName, description: pm.description,
      nextRunDate: pm.nextRunDate, recurrenceCron: pm.recurrenceCron,
      overdue: new Date(pm.nextRunDate) < new Date(),
    }));
  }
}
