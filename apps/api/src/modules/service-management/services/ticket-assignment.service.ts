// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class TicketAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async assignTicket(
    tenantId: string,
    ticketId: string,
    assigneeId: string,
    actorId: string,
  ) {
    const ticket = await this.prisma.serviceTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket || ticket.tenantId !== tenantId) return null;

    const oldAssigneeId = ticket.assigneeId;
    if (oldAssigneeId === assigneeId) return ticket;

    const updated = await this.prisma.serviceTicket.update({
      where: { id: ticketId },
      data: { assigneeId },
    });

    await this.prisma.serviceTicketActivity.create({
      data: {
        tenantId,
        ticketId,
        actorId,
        action: "ASSIGNMENT",
        details: { old: oldAssigneeId, new: assigneeId },
      },
    });

    return updated;
  }
}
