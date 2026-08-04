import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class FieldServiceTicketsService {
  // ── Service Tickets ──
  async getTickets(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.source) where.source = query.source;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search)
      where.title = { contains: query.search, mode: "insensitive" };
    if (query.slaBreached !== undefined)
      where.slaBreached = query.slaBreached === "true";
    if (query.fromDate) where.createdAt = { gte: new Date(query.fromDate) };
    if (query.toDate)
      where.createdAt = { ...where.createdAt, lte: new Date(query.toDate) };
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[query.sortBy || "createdAt"] = query.sortOrder || "desc";
    const [data, total] = await Promise.all([
      prisma.fieldServiceTicket.findMany({
        where,
        include: {
          sla: { select: { id: true, name: true } },
          _count: {
            select: { dispatches: true, appointments: true, timesheets: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.fieldServiceTicket.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  async getTicketById(tenantId: string, id: string) {
    const ticket = await prisma.fieldServiceTicket.findFirst({
      where: { tenantId, id },
      include: {
        sla: true,
        dispatches: {
          include: { technician: { select: { id: true, name: true } } },
        },
        appointments: {
          include: { technician: { select: { id: true, name: true } } },
        },
        timesheets: {
          include: { technician: { select: { id: true, name: true } } },
        },
        partsUsage: true,
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }
  async createTicket(tenantId: string, data: any) {
    let slaDeadline: Date | null = null;
    let slaId = data.slaId;
    if (data.slaId) {
      const sla = await prisma.fieldServiceSla.findFirst({
        where: { tenantId, id: data.slaId },
      });
      if (sla) {
        const now = new Date();
        slaDeadline = new Date(now.getTime() + sla.resolutionTimeMin * 60000);
      }
    } else {
      const defaultSla = await prisma.fieldServiceSla.findFirst({
        where: { tenantId, isDefault: true, status: "ACTIVE" },
      });
      if (defaultSla) {
        slaId = defaultSla.id;
        const now = new Date();
        slaDeadline = new Date(
          now.getTime() + defaultSla.resolutionTimeMin * 60000,
        );
      }
    }
    return prisma.fieldServiceTicket.create({
      data: { ...data, tenantId, slaId, slaDeadline },
      include: { sla: true },
    });
  }
  async updateTicket(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceTicket.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    if (data.slaId && data.slaId !== existing.slaId) {
      const sla = await prisma.fieldServiceSla.findFirst({
        where: { tenantId, id: data.slaId },
      });
      if (sla)
        data.slaDeadline = new Date(Date.now() + sla.resolutionTimeMin * 60000);
    }
    const updated = await prisma.fieldServiceTicket.update({
      where: { id },
      data,
      include: { sla: true },
    });
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      if (data.status === "RESOLVED" && !existing.completedDate) {
        await prisma.fieldServiceTicket.update({
          where: { id },
          data: { completedDate: new Date() as any },
        });
      }
    }
    return updated;
  }
  async deleteTicket(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceTicket.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    return prisma.fieldServiceTicket.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async assignTicket(tenantId: string, id: string, technicianId: string) {
    const existing = await prisma.fieldServiceTicket.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    const autoDispatch = await prisma.fieldServiceDispatch.create({
      data: { tenantId, ticketId: id, technicianId, status: "SCHEDULED" },
      include: { technician: true },
    });
    await prisma.fieldServiceTicket.update({
      where: { id },
      data: { status: "ASSIGNED" },
    });
    return autoDispatch;
  }
  async closeTicket(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceTicket.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    return prisma.fieldServiceTicket.update({
      where: { id },
      data: {
        status: "CLOSED",
        completedDate: new Date() as any,
        resolution: data.resolution,
        totalCost: data.totalCost || existing.totalCost,
        partsCost: data.partsCost || existing.partsCost,
        laborCost: data.laborCost || existing.laborCost,
        invoiceRef: data.invoiceRef,
      },
    });
  }
  async getTicketStats(tenantId: string) {
    const [
      open,
      inProgress,
      resolved,
      byPriority,
      byCategory,
      slaBreached,
      avgResolution,
    ] = await Promise.all([
      prisma.fieldServiceTicket.count({
        where: { tenantId, status: { in: ["OPEN", "ASSIGNED"] } },
      }),
      prisma.fieldServiceTicket.count({
        where: { tenantId, status: "IN_PROGRESS" },
      }),
      prisma.fieldServiceTicket.count({
        where: { tenantId, status: { in: ["RESOLVED", "CLOSED"] } },
      }),
      prisma.fieldServiceTicket.groupBy({
        by: ["priority"],
        where: { tenantId },
        _count: true,
      }),
      prisma.fieldServiceTicket.groupBy({
        by: ["category"],
        where: { tenantId },
        _count: true,
      }),
      prisma.fieldServiceTicket.count({
        where: { tenantId, slaBreached: true },
      }),
      prisma.fieldServiceTicket.aggregate({
        where: {
          tenantId,
          completedDate: { not: null },
        },
        _avg: { totalCost: true },
      }),
    ]);
    return {
      open,
      inProgress,
      resolved,
      byPriority,
      byCategory,
      slaBreached,
      avgResolutionCost: avgResolution._avg?.totalCost || 0,
    };
  }
  async bulkUpdateTickets(tenantId: string, ids: string[], data: any) {
    return prisma.fieldServiceTicket.updateMany({
      where: { tenantId, id: { in: ids } },
      data,
    });
  }

  // ── SLA Management ──
  async getSlas(tenantId: string) {
    return prisma.fieldServiceSla.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }
  async getSlaById(tenantId: string, id: string) {
    const sla = await prisma.fieldServiceSla.findFirst({
      where: { tenantId, id },
    });
    if (!sla) throw new NotFoundException("SLA not found");
    return sla;
  }
  async createSla(tenantId: string, data: any) {
    if (data.isDefault) {
      await prisma.fieldServiceSla.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return prisma.fieldServiceSla.create({ data: { ...data, tenantId } });
  }
  async updateSla(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceSla.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("SLA not found");
    if (data.isDefault) {
      await prisma.fieldServiceSla.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return prisma.fieldServiceSla.update({ where: { id }, data });
  }
  async deleteSla(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceSla.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("SLA not found");
    return prisma.fieldServiceSla.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async checkSlaCompliance(tenantId: string, slaId: string) {
    const sla = await prisma.fieldServiceSla.findFirst({
      where: { tenantId, id: slaId },
    });
    if (!sla) throw new NotFoundException("SLA not found");
    const tickets = await prisma.fieldServiceTicket.findMany({
      where: { tenantId, slaId, status: { in: ["RESOLVED", "CLOSED"] } },
    });
    const total = tickets.length;
    const breached = tickets.filter((t) => t.slaBreached).length;
    return {
      total,
      breached,
      complianceRate:
        total > 0 ? Math.round((1 - breached / total) * 10000) / 100 : 100,
    };
  }
  async evaluateTicketSla(tenantId: string, ticketId: string) {
    const ticket = await prisma.fieldServiceTicket.findFirst({
      where: { tenantId, id: ticketId },
    });
    if (!ticket || !ticket.slaDeadline) return { breached: false };
    const now = new Date();
    const breached = now > ticket.slaDeadline;
    if (breached && !ticket.slaBreached) {
      await prisma.fieldServiceTicket.update({
        where: { id: ticketId },
        data: { slaBreached: true },
      });
    }
    return {
      breached,
      slaDeadline: ticket.slaDeadline,
      remaining: ticket.slaDeadline.getTime() - now.getTime(),
    };
  }

  // ── Checklists ──
  async getChecklists(tenantId: string) {
    return prisma.fieldServiceChecklist.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }
  async getChecklistById(tenantId: string, id: string) {
    const cl = await prisma.fieldServiceChecklist.findFirst({
      where: { tenantId, id },
    });
    if (!cl) throw new NotFoundException("Checklist not found");
    return cl;
  }
  async createChecklist(tenantId: string, data: any) {
    return prisma.fieldServiceChecklist.create({ data: { ...data, tenantId } });
  }
  async updateChecklist(tenantId: string, id: string, data: any) {
    const existing = await prisma.fieldServiceChecklist.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Checklist not found");
    return prisma.fieldServiceChecklist.update({ where: { id }, data });
  }
  async deleteChecklist(tenantId: string, id: string) {
    const existing = await prisma.fieldServiceChecklist.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Checklist not found");
    return prisma.fieldServiceChecklist.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
