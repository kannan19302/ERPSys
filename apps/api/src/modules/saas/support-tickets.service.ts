import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SupportTicketsService {
  async listTickets(tenantId: string, filters: { status?: string; priority?: string }, page: number, limit: number) {
    const where: Record<string, unknown> = { tenantId };

    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.priority) where.priority = filters.priority.toUpperCase();

    const [items, total] = await Promise.all([
      prisma.tenantSupportTicket.findMany({
        where: where as any,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { messages: true } } },
      }),
      prisma.tenantSupportTicket.count({ where: where as any }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createTicket(tenantId: string, userId: string, dto: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    attachments?: string[];
  }) {
    const priorityMap: Record<string, string> = { low: "LOW", medium: "NORMAL", high: "HIGH", urgent: "URGENT" };

    return prisma.tenantSupportTicket.create({
      data: {
        tenantId,
        userId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category ?? "GENERAL",
        priority: priorityMap[dto.priority ?? "medium"] ?? "NORMAL",
        messages: {
          create: {
            userId,
            message: dto.description,
            attachments: (dto.attachments ?? []) as any,
            isStaff: false,
          },
        },
      },
      include: { messages: true },
    });
  }

  async getTicket(tenantId: string, id: string) {
    const ticket = await prisma.tenantSupportTicket.findFirst({
      where: { id, tenantId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async updateTicket(tenantId: string, id: string, dto: {
    subject?: string;
    description?: string;
    category?: string;
    priority?: string;
  }) {
    const ticket = await prisma.tenantSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    const data: Record<string, unknown> = {};
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;

    return prisma.tenantSupportTicket.update({
      where: { id },
      data,
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  async addMessage(tenantId: string, userId: string, id: string, body: {
    content: string;
    attachments?: string[];
    isInternal?: boolean;
  }) {
    const ticket = await prisma.tenantSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (ticket.status === "CLOSED") throw new BadRequestException("Cannot add message to closed ticket");

    return prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId,
        message: body.content,
        attachments: (body.attachments ?? []) as any,
        isStaff: body.isInternal ?? false,
      },
    });
  }

  async closeTicket(tenantId: string, id: string) {
    const ticket = await prisma.tenantSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    return prisma.tenantSupportTicket.update({
      where: { id },
      data: { status: "CLOSED", resolvedAt: new Date() },
    });
  }

  async reopenTicket(tenantId: string, id: string) {
    const ticket = await prisma.tenantSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (ticket.status !== "CLOSED" && ticket.status !== "RESOLVED") {
      throw new BadRequestException("Only closed or resolved tickets can be reopened");
    }

    return prisma.tenantSupportTicket.update({
      where: { id },
      data: { status: "OPEN", resolvedAt: null },
    });
  }

  async escalateTicket(tenantId: string, id: string) {
    const ticket = await prisma.tenantSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    const nextPriority: Record<string, string> = {
      LOW: "NORMAL",
      NORMAL: "HIGH",
      HIGH: "URGENT",
    };

    const newPriority = nextPriority[ticket.priority] ?? "URGENT";
    return prisma.tenantSupportTicket.update({
      where: { id },
      data: { priority: newPriority },
    });
  }

  async assignTicket(tenantId: string, id: string, assigneeId: string) {
    const ticket = await prisma.tenantSupportTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    return prisma.tenantSupportTicket.update({
      where: { id },
      data: { assignedTo: assigneeId, status: "IN_PROGRESS" },
    });
  }

  async getTicketStats(tenantId: string) {
    const tickets = await prisma.tenantSupportTicket.findMany({
      where: { tenantId },
      select: { status: true, priority: true, category: true, createdAt: true },
    });

    return {
      total: tickets.length,
      openCount: tickets.filter((t) => t.status === "OPEN").length,
      inProgressCount: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      waitingCustomerCount: tickets.filter((t) => t.status === "WAITING_CUSTOMER").length,
      resolvedCount: tickets.filter((t) => t.status === "RESOLVED").length,
      closedCount: tickets.filter((t) => t.status === "CLOSED").length,
      byPriority: {
        low: tickets.filter((t) => t.priority === "LOW").length,
        normal: tickets.filter((t) => t.priority === "NORMAL").length,
        high: tickets.filter((t) => t.priority === "HIGH").length,
        urgent: tickets.filter((t) => t.priority === "URGENT").length,
      },
    };
  }
}
