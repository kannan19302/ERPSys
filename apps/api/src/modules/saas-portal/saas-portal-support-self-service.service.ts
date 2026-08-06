import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SaasPortalSupportSelfServiceService {
  async getTickets(tenantId: string) {
    return prisma.saasPortalSupportTicketDeep.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTicket(tenantId: string, userId: string, dto: any) {
    const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    return prisma.saasPortalSupportTicketDeep.create({
      data: {
        tenantId,
        ticketNumber,
        subject: dto.subject,
        category: dto.category || "BILLING",
        priority: dto.priority || "MEDIUM",
        creatorId: userId,
      },
    });
  }

  async addMessage(
    tenantId: string,
    userId: string,
    ticketId: string,
    dto: { message: string; attachments?: any },
  ) {
    return prisma.saasPortalTicketMessage.create({
      data: {
        ticketId,
        tenantId,
        senderId: userId,
        senderRole: "CUSTOMER",
        message: dto.message,
        attachments: dto.attachments || null,
      },
    });
  }
}
