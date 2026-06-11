import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class FieldServiceService {
  async getTickets(tenantId: string) {
    return prisma.serviceTicket.findMany({
      where: { tenantId },
      orderBy: { slaDeadline: 'asc' },
    });
  }

  async createTicket(
    tenantId: string,
    dto: { title: string; customerName: string; description: string; priority?: string; slaDeadline: string }
  ) {
    return prisma.serviceTicket.create({
      data: {
        tenantId,
        title: dto.title,
        customerName: dto.customerName,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        slaDeadline: new Date(dto.slaDeadline),
      },
    });
  }

  async getDispatches(tenantId: string) {
    return prisma.serviceDispatch.findMany({
      where: { tenantId },
      include: { ticket: true },
      orderBy: { scheduledTime: 'desc' },
    });
  }

  async createDispatch(
    tenantId: string,
    dto: { ticketId: string; technicianId: string; scheduledTime: string; routeDetails: string }
  ) {
    return prisma.serviceDispatch.create({
      data: {
        tenantId,
        ticketId: dto.ticketId,
        technicianId: dto.technicianId,
        scheduledTime: new Date(dto.scheduledTime),
        routeDetails: JSON.parse(dto.routeDetails),
        status: 'ASSIGNED',
      },
    });
  }

  async getChecklists(tenantId: string) {
    return prisma.technicianChecklist.findMany({
      where: { tenantId },
      include: { dispatch: { include: { ticket: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChecklist(
    tenantId: string,
    dto: { dispatchId: string; items: string; signatureUrl?: string }
  ) {
    return prisma.technicianChecklist.create({
      data: {
        tenantId,
        dispatchId: dto.dispatchId,
        items: JSON.parse(dto.items),
        signatureUrl: dto.signatureUrl,
        isOfflineSynced: false,
      },
    });
  }

  async getPreventativeMaintenances(tenantId: string) {
    return prisma.preventativeMaintenance.findMany({
      where: { tenantId },
      orderBy: { nextRunDate: 'asc' },
    });
  }

  async createPreventativeMaintenance(
    tenantId: string,
    dto: { customerName: string; description: string; recurrenceCron: string; nextRunDate: string }
  ) {
    return prisma.preventativeMaintenance.create({
      data: {
        tenantId,
        customerName: dto.customerName,
        description: dto.description,
        recurrenceCron: dto.recurrenceCron,
        nextRunDate: new Date(dto.nextRunDate),
      },
    });
  }
}
