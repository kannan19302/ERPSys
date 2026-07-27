import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CommunicationOmnichannelService {
  async getUnifiedInbox(
    tenantId: string,
    userId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      platform?: string;
      assignedToMe?: boolean;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.platform) where.platform = params.platform;
    if (params.assignedToMe) where.assignedTo = userId;
    const [data, total] = await Promise.all([
      prisma.omnichannelConversation.findMany({
        where,
        skip,
        take: limit,
        include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
        orderBy: { lastMessageAt: "desc" },
      }),
      prisma.omnichannelConversation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getConversation(tenantId: string, id: string) {
    const conv = await prisma.omnichannelConversation.findFirst({
      where: { id, tenantId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    return conv;
  }

  async sendMessage(
    tenantId: string,
    conversationId: string,
    dto: {
      content: string;
      direction?: string;
      contentType?: string;
      attachments?: any[];
      authorId?: string;
    },
  ) {
    const existing = await prisma.omnichannelConversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!existing) throw new NotFoundException("Conversation not found");
    const msg = await prisma.conversationMessage.create({
      data: {
        tenantId,
        conversationId,
        content: dto.content,
        direction: dto.direction || "OUTBOUND",
        contentType: dto.contentType || "TEXT",
        attachments: dto.attachments || [],
        authorId: dto.authorId,
      },
    });
    await prisma.omnichannelConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return msg;
  }

  async assignConversation(tenantId: string, id: string, assignedTo: string) {
    const existing = await prisma.omnichannelConversation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Conversation not found");
    return prisma.omnichannelConversation.update({
      where: { id },
      data: { assignedTo },
    });
  }

  async closeConversation(tenantId: string, id: string) {
    const existing = await prisma.omnichannelConversation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Conversation not found");
    return prisma.omnichannelConversation.update({
      where: { id },
      data: { status: "CLOSED" },
    });
  }

  async smartTagMessage(
    tenantId: string,
    conversationId: string,
    tags: string[],
  ) {
    const existing = await prisma.omnichannelConversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!existing) throw new NotFoundException("Conversation not found");
    const mergedTags = [
      ...new Set([...((existing.tags as string[]) || []), ...tags]),
    ];
    return prisma.omnichannelConversation.update({
      where: { id: conversationId },
      data: { tags: mergedTags },
    });
  }

  async autoRouteMessage(tenantId: string, conversationId: string) {
    const existing = await prisma.omnichannelConversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!existing) throw new NotFoundException("Conversation not found");
    const rules = await prisma.routingRule.findMany({
      where: { tenantId, isActive: true },
      orderBy: { priority: "asc" },
    });
    let assignedTo = existing.assignedTo;
    for (const rule of rules) {
      const conditions = (rule.conditions as any[]) || [];
      let matched = true;
      for (const c of conditions) {
        const val = (existing as any)[c.field];
        if (c.operator === "equals" && val !== c.value) {
          matched = false;
          break;
        }
        if (c.operator === "contains" && !(val || "").includes(c.value)) {
          matched = false;
          break;
        }
      }
      if (matched) {
        const action = rule.action as any;
        if (action.type === "ASSIGN_TO_AGENT") assignedTo = action.value;
        break;
      }
    }
    if (assignedTo !== existing.assignedTo) {
      return prisma.omnichannelConversation.update({
        where: { id: conversationId },
        data: { assignedTo },
      });
    }
    return existing;
  }

  async getIntegrations(tenantId: string) {
    return prisma.channelIntegration.findMany({ where: { tenantId } });
  }

  async createIntegration(
    tenantId: string,
    userId: string,
    dto: { platform: string; name: string; config: any },
  ) {
    return prisma.channelIntegration.create({
      data: {
        tenantId,
        platform: dto.platform,
        name: dto.name,
        config: dto.config,
        createdBy: userId,
      },
    });
  }

  async updateIntegration(
    tenantId: string,
    id: string,
    dto: { config?: any; isActive?: boolean },
  ) {
    const existing = await prisma.channelIntegration.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Integration not found");
    return prisma.channelIntegration.update({
      where: { id },
      data: { ...dto, lastSyncedAt: new Date() },
    });
  }

  async getRoutingRules(tenantId: string) {
    return prisma.routingRule.findMany({
      where: { tenantId },
      orderBy: { priority: "asc" },
    });
  }

  async createRoutingRule(
    tenantId: string,
    dto: {
      name: string;
      description?: string;
      priority: number;
      conditions: any;
      action: any;
    },
  ) {
    return prisma.routingRule.create({ data: { tenantId, ...dto } });
  }

  async getOmnichannelDashboard(tenantId: string) {
    const [
      activeConversations,
      pendingConversations,
      closedConversations,
      totalMessages,
      conversationsByPlatform,
      unassignedCount,
    ] = await Promise.all([
      prisma.omnichannelConversation.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.omnichannelConversation.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.omnichannelConversation.count({
        where: { tenantId, status: "CLOSED" },
      }),
      prisma.conversationMessage.count({ where: { tenantId } }),
      prisma.omnichannelConversation.groupBy({
        by: ["platform"],
        where: { tenantId },
        _count: true,
      }),
      prisma.omnichannelConversation.count({
        where: { tenantId, assignedTo: null, status: "ACTIVE" },
      }),
    ]);
    return {
      activeConversations,
      pendingConversations,
      closedConversations,
      totalMessages,
      conversationsByPlatform,
      unassignedCount,
    };
  }
}
