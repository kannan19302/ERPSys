import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommunicationHelpdeskService {
  async getTickets(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      assignedTo?: string;
      priority?: string;
      search?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.assignedTo) where.assignedTo = params.assignedTo;
    if (params.priority) where.priority = params.priority;
    if (params.search)
      where.OR = [
        { subject: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    const [data, total] = await Promise.all([
      prisma.helpdeskTicket.findMany({
        where,
        skip,
        take: limit,
        include: {
          sla: true,
          satisfaction: true,
          comments: { take: 1, orderBy: { createdAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.helpdeskTicket.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getTicket(tenantId: string, id: string) {
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id, tenantId },
      include: {
        comments: { orderBy: { createdAt: "asc" } },
        sla: true,
        satisfaction: true,
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async createTicket(
    tenantId: string,
    userId: string,
    dto: {
      subject: string;
      description: string;
      customerId: string;
      customerEmail: string;
      customerName: string;
      priority?: string;
      source?: string;
      category?: string;
      assignedTo?: string;
    },
  ) {
    const ticket = await prisma.helpdeskTicket.create({
      data: {
        tenantId,
        subject: dto.subject,
        description: dto.description,
        customerId: dto.customerId,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        priority: dto.priority || "MEDIUM",
        source: dto.source || "PORTAL",
        category: dto.category,
        assignedTo: dto.assignedTo,
      },
    });
    if (dto.priority) {
      const slaMins =
        dto.priority === "CRITICAL"
          ? 15
          : dto.priority === "HIGH"
            ? 30
            : dto.priority === "MEDIUM"
              ? 60
              : 240;
      await prisma.ticketSla.create({
        data: {
          tenantId,
          ticketId: ticket.id,
          priority: dto.priority,
          responseMins: slaMins,
          resolutionMins: slaMins * 4,
        },
      });
    }
    return ticket;
  }

  async updateTicket(
    tenantId: string,
    id: string,
    dto: {
      subject?: string;
      description?: string;
      priority?: string;
      category?: string;
      status?: string;
    },
  ) {
    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    const data: any = { ...dto };
    if (dto.status === "RESOLVED") data.resolvedAt = new Date();
    if (dto.status === "CLOSED") data.closedAt = new Date();
    return prisma.helpdeskTicket.update({ where: { id }, data });
  }

  async assignTicket(tenantId: string, id: string, assignedTo: string) {
    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    return prisma.helpdeskTicket.update({
      where: { id },
      data: { assignedTo },
    });
  }

  async addTicketComment(
    tenantId: string,
    ticketId: string,
    userId: string,
    dto: { content: string; authorName: string; isInternal?: boolean },
  ) {
    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    return prisma.ticketComment.create({
      data: {
        tenantId,
        ticketId,
        authorId: userId,
        authorName: dto.authorName,
        content: dto.content,
        isInternal: dto.isInternal || false,
      },
    });
  }

  async useCannedResponse(tenantId: string, id: string) {
    const response = await prisma.cannedResponse.findFirst({
      where: { id, tenantId },
    });
    if (!response) throw new NotFoundException("Canned response not found");
    return response;
  }

  async getCannedResponses(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return prisma.cannedResponse.findMany({ where, orderBy: { title: "asc" } });
  }

  async createCannedResponse(
    tenantId: string,
    userId: string,
    dto: {
      title: string;
      content: string;
      category?: string;
      shortcut?: string;
    },
  ) {
    return prisma.cannedResponse.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content,
        category: dto.category,
        shortcut: dto.shortcut,
        createdBy: userId,
      },
    });
  }

  async sendSatisfactionSurvey(tenantId: string, ticketId: string) {
    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    return {
      message: "Satisfaction survey sent",
      ticketId,
      customerEmail: existing.customerEmail,
    };
  }

  async submitSatisfaction(
    tenantId: string,
    ticketId: string,
    dto: { rating: number; feedback?: string; category?: string },
  ) {
    if (dto.rating < 1 || dto.rating > 5)
      throw new BadRequestException("Rating must be between 1 and 5");
    const existing = await prisma.customerSatisfaction.findFirst({
      where: { tenantId, ticketId },
    });
    if (existing) {
      return prisma.customerSatisfaction.update({
        where: { id: existing.id },
        data: {
          rating: dto.rating,
          feedback: dto.feedback,
          category: dto.category,
        },
      });
    }
    return prisma.customerSatisfaction.create({
      data: {
        tenantId,
        ticketId,
        rating: dto.rating,
        feedback: dto.feedback,
        category: dto.category,
      },
    });
  }

  async escalateTicket(tenantId: string, id: string, _reason: string) {
    const existing = await prisma.helpdeskTicket.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Ticket not found");
    return prisma.helpdeskTicket.update({
      where: { id },
      data: {
        status: "ESCALATED",
        escalatedAt: new Date(),
        priority: "CRITICAL",
      },
    });
  }

  async getHelpdeskDashboard(tenantId: string) {
    const [
      openCount,
      pendingCount,
      resolvedCount,
      escalatedCount,
      avgResponseTime,
      ticketsByPriority,
      ticketsByCategory,
    ] = await Promise.all([
      prisma.helpdeskTicket.count({ where: { tenantId, status: "OPEN" } }),
      prisma.helpdeskTicket.count({ where: { tenantId, status: "PENDING" } }),
      prisma.helpdeskTicket.count({ where: { tenantId, status: "RESOLVED" } }),
      prisma.helpdeskTicket.count({ where: { tenantId, status: "ESCALATED" } }),
      prisma.ticketSla.aggregate({
        where: { tenantId, respondedAt: { not: null } },
        _avg: { responseMins: true },
      }),
      prisma.helpdeskTicket.groupBy({
        by: ["priority"],
        where: { tenantId },
        _count: true,
      }),
      prisma.helpdeskTicket.groupBy({
        by: ["category"],
        where: { tenantId },
        _count: true,
      }),
    ]);
    return {
      openCount,
      pendingCount,
      resolvedCount,
      escalatedCount,
      avgResponseTime: avgResponseTime._avg.responseMins || 0,
      ticketsByPriority,
      ticketsByCategory,
    };
  }
}
