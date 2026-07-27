import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmPortalDeepService {
  async getPortalCustomization(tenantId = "tenant-1") {
    const custom = await db.portalCustomization.findFirst({
      where: { tenantId },
    });
    if (custom) return custom;
    return {
      tenantId,
      primaryColor: "#2563eb",
      headerTitle: "Customer Portal",
      logoUrl: null,
    };
  }

  async updatePortalCustomization(tenantId = "tenant-1", dto: any = {}) {
    const existing = await db.portalCustomization.findFirst({
      where: { tenantId },
    });
    if (existing) {
      return db.portalCustomization.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return db.portalCustomization.create({
      data: {
        tenantId,
        primaryColor: dto.primaryColor ?? "#2563eb",
        headerTitle: dto.headerTitle ?? "Customer Portal",
        ...dto,
      },
    });
  }

  async getPortalDocuments(tenantId = "tenant-1", customerId = "") {
    return db.portalDocument.findMany({ where: { tenantId, customerId } });
  }

  async uploadPortalDocument(
    tenantId = "tenant-1",
    customerId = "",
    dto: any = {},
  ) {
    return db.portalDocument.create({
      data: {
        tenantId,
        customerId,
        name: dto.name,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async deletePortalDocument(tenantId = "tenant-1", id = "") {
    const doc = await db.portalDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException("Portal document not found");
    return db.portalDocument.delete({ where: { id } });
  }

  async getPortalNotifications(tenantId = "tenant-1", customerId = "") {
    return db.portalNotification.findMany({ where: { tenantId, customerId } });
  }

  async markNotificationAsRead(tenantId = "tenant-1", id = "") {
    const notif = await db.portalNotification.findFirst({
      where: { id, tenantId },
    });
    if (!notif) throw new NotFoundException("Notification not found");
    return db.portalNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async getForumTopics(
    tenantId = "tenant-1",
    params?: { page?: number; limit?: number },
  ) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      db.portalForumTopic.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { _count: { select: { replies: true } } },
      }),
      db.portalForumTopic.count({ where: { tenantId } }),
    ]);

    return { data, totalCount, page, limit };
  }

  async createForumTopic(
    tenantId = "tenant-1",
    customerId = "",
    dto: any = {},
  ) {
    return db.portalForumTopic.create({
      data: {
        tenantId,
        customerId,
        title: dto.title,
        content: dto.content,
        status: "OPEN",
      },
    });
  }

  async getForumTopicById(tenantId = "tenant-1", id = "") {
    const topic = await db.portalForumTopic.findFirst({
      where: { id, tenantId },
    });
    if (!topic) throw new NotFoundException("Forum topic not found");
    return topic;
  }

  async closeForumTopic(tenantId = "tenant-1", id = "") {
    const topic = await db.portalForumTopic.findFirst({
      where: { id, tenantId },
    });
    if (!topic) throw new NotFoundException("Forum topic not found");
    return db.portalForumTopic.update({
      where: { id },
      data: { status: "CLOSED" },
    });
  }

  async getForumReplies(tenantId = "tenant-1", topicId = "") {
    const topic = await db.portalForumTopic.findFirst({
      where: { id: topicId, tenantId },
    });
    if (!topic) throw new NotFoundException("Forum topic not found");

    return db.portalForumReply.findMany({
      where: { topicId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createForumReply(
    tenantId = "tenant-1",
    topicId = "",
    authorId = "",
    dto: any = {},
  ) {
    const topic = await db.portalForumTopic.findFirst({
      where: { id: topicId, tenantId },
    });
    if (!topic) throw new NotFoundException("Forum topic not found");

    return db.portalForumReply.create({
      data: {
        topicId,
        authorId,
        content: dto.content,
      },
    });
  }

  async markReplyAsAnswer(tenantId = "tenant-1", replyId = "") {
    const reply = await db.portalForumReply.findFirst({
      where: { id: replyId },
    });
    if (!reply) throw new NotFoundException("Reply not found");

    await db.portalForumReply.updateMany({
      where: { topicId: reply.topicId },
      data: { isAnswer: false },
    });

    await db.portalForumReply.update({
      where: { id: replyId },
      data: { isAnswer: true },
    });

    await db.portalForumTopic.update({
      where: { id: reply.topicId },
      data: { status: "RESOLVED" },
    });

    return db.portalForumReply.findFirst({ where: { id: replyId } });
  }

  async upvoteForumTopic(tenantId = "tenant-1", id = "") {
    const topic = await db.portalForumTopic.findFirst({
      where: { id, tenantId },
    });
    if (!topic) throw new NotFoundException("Forum topic not found");
    return db.portalForumTopic.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
  }

  async upvoteForumReply(tenantId = "tenant-1", id = "") {
    const reply = await db.portalForumReply.findFirst({ where: { id } });
    if (!reply) throw new NotFoundException("Reply not found");
    return db.portalForumReply.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
  }

  async getPortalAnalytics(tenantId = "tenant-1") {
    const [
      totalCustomers,
      totalDocuments,
      totalForumTopics,
      totalReplies,
      totalNotifications,
      popularTopics,
    ] = await Promise.all([
      db.customer.count({ where: { tenantId } }),
      db.portalDocument.count({ where: { tenantId } }),
      db.portalForumTopic.count({ where: { tenantId } }),
      db.portalForumReply.count({}),
      db.portalNotification.count({ where: { tenantId } }),
      db.portalForumTopic.findMany({ where: { tenantId }, take: 5 }),
    ]);

    return {
      totalCustomers,
      totalDocuments,
      totalForumTopics,
      totalReplies,
      totalNotifications,
      popularTopics,
    };
  }

  async getPortalQuickLinks(tenantId = "tenant-1", customerId = "") {
    const [openCases, recentDocs, recentTopics, unpaidInvoices] =
      await Promise.all([
        db.case.count({
          where: { tenantId, customerId, status: { not: "CLOSED" } },
        }),
        db.portalDocument.findMany({
          where: { tenantId, customerId },
          take: 5,
        }),
        db.portalForumTopic.findMany({
          where: { tenantId, customerId },
          take: 5,
        }),
        db.invoice.count({
          where: { tenantId, customerId, status: { not: "PAID" } },
        }),
      ]);

    return {
      openCases,
      recentDocs,
      recentTopics,
      unpaidInvoices,
    };
  }

  async getPortalAnalyticsOverview(tenantId = "tenant-1") {
    return this.getPortalAnalytics(tenantId);
  }

  async searchPortalContent(tenantId = "tenant-1", query = "") {
    return { docs: [], topics: [] };
  }
}
