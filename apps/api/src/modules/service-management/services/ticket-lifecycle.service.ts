import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@unerp/database";
import { OutboxService } from "@unerp/shared";

@Injectable()
export class TicketLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async createTicket(
    tenantId: string,
    data: {
      title: string;
      description: string;
      type: string;
      priority: string;
      source: string;
      categoryId?: string;
      reporterId?: string;
    },
  ) {
    // Generate a simple number
    const count = await this.prisma.serviceTicket.count({
      where: { tenantId },
    });
    const number = `INC-${(count + 1).toString().padStart(5, "0")}`;

    const ticket = await this.prisma.serviceTicket.create({
      data: {
        tenantId,
        number,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: "NEW",
        source: data.source,
        categoryId: data.categoryId,
        reporterId: data.reporterId,
      },
    });

    await this.logActivity(tenantId, ticket.id, null, "CREATED", {
      new: ticket,
    });
    await this.outbox.writeEvent(this.prisma as any, {
      tenantId,
      eventName: "service.ticket.created",
      eventVersion: 1,
      aggregateType: "ServiceTicket",
      aggregateId: ticket.id,
      payload: ticket as any,
    });
    return ticket;
  }

  async getTicket(tenantId: string, id: string) {
    const ticket = await this.prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        category: true,
        slaPolicy: true,
      },
    });
    if (!ticket || ticket.tenantId !== tenantId) {
      throw new NotFoundException("Ticket not found");
    }
    return ticket;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: string,
    actorId: string,
  ) {
    const ticket = await this.getTicket(tenantId, id);
    const oldStatus = ticket.status;
    if (oldStatus === status) return ticket;

    const data: any = { status };
    if (status === "RESOLVED") data.resolvedAt = new Date();
    if (status === "CLOSED") data.closedAt = new Date();

    const updated = await this.prisma.serviceTicket.update({
      where: { id },
      data,
    });

    await this.logActivity(tenantId, id, actorId, "STATUS_CHANGE", {
      old: oldStatus,
      new: status,
    });
    await this.outbox.writeEvent(this.prisma as any, {
      tenantId,
      eventName: "service.ticket.updated",
      eventVersion: 1,
      aggregateType: "ServiceTicket",
      aggregateId: updated.id,
      payload: updated as any,
    });
    return updated;
  }

  private async logActivity(
    tenantId: string,
    ticketId: string,
    actorId: string | null,
    action: string,
    details: any,
  ) {
    await this.prisma.serviceTicketActivity.create({
      data: {
        tenantId,
        ticketId,
        actorId,
        action,
        details,
      },
    });
  }
}
