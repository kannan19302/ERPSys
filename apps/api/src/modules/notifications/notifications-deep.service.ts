// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class NotificationsDeepService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async getTemplates(tenantId: string, channel?: string) {
    const where: any = { tenantId, isActive: true };
    if (channel) where.channel = channel;
    return prisma.notificationTemplate.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async getTemplate(tenantId: string, id: string) {
    const tmpl = await prisma.notificationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tmpl) throw new NotFoundException("Template not found");
    return tmpl;
  }

  async createTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      subject: string;
      body: string;
      channel?: string;
      variables?: string[];
      eventType?: string;
      category?: string;
    },
  ) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { tenantId_name: { tenantId, name: data.name } },
    });
    if (existing)
      throw new BadRequestException("Template with this name already exists");
    return prisma.notificationTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        subject: data.subject,
        body: data.body,
        channel: data.channel ?? "EMAIL",
        variables: data.variables ?? [],
        eventType: data.eventType,
        category: data.category,
      },
    });
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      subject?: string;
      body?: string;
      channel?: string;
      variables?: string[];
      eventType?: string;
      isActive?: boolean;
      category?: string;
    },
  ) {
    const tmpl = await prisma.notificationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tmpl) throw new NotFoundException("Template not found");
    if (data.name && data.name !== tmpl.name) {
      const dup = await prisma.notificationTemplate.findUnique({
        where: { tenantId_name: { tenantId, name: data.name } },
      });
      if (dup) throw new BadRequestException("Template name already taken");
    }
    return prisma.notificationTemplate.update({ where: { id }, data });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const tmpl = await prisma.notificationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tmpl) throw new NotFoundException("Template not found");
    return prisma.notificationTemplate.delete({ where: { id } });
  }

  async renderTemplate(
    tenantId: string,
    id: string,
    variables: Record<string, string>,
  ) {
    const tmpl = await this.getTemplate(tenantId, id);
    let subject = tmpl.subject;
    let body = tmpl.body;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }
    return { subject, body };
  }

  async getPreferences(tenantId: string, userId: string) {
    return prisma.notificationPreference.findMany({
      where: { tenantId, userId },
    });
  }

  async upsertPreference(
    tenantId: string,
    userId: string,
    data: {
      channelName: string;
      eventType: string;
      isEnabled: boolean;
    },
  ) {
    return prisma.notificationPreference.upsert({
      where: {
        tenantId_userId_channelName_eventType: {
          tenantId,
          userId,
          channelName: data.channelName,
          eventType: data.eventType,
        },
      },
      update: { isEnabled: data.isEnabled },
      create: {
        tenantId,
        userId,
        channelName: data.channelName,
        eventType: data.eventType,
        isEnabled: data.isEnabled,
      },
    });
  }

  async bulkUpdatePreferences(
    tenantId: string,
    userId: string,
    preferences: {
      channelName: string;
      eventType: string;
      isEnabled: boolean;
    }[],
  ) {
    const results: any[] = [];
    for (const pref of preferences) {
      results.push(await this.upsertPreference(tenantId, userId, pref));
    }
    return results;
  }

  async getDigests(tenantId: string, userId: string) {
    return prisma.notificationDigest.findMany({ where: { tenantId, userId } });
  }

  async upsertDigest(
    tenantId: string,
    userId: string,
    data: {
      frequency: string;
      channel?: string;
      isEnabled?: boolean;
      preferences?: Record<string, any>;
    },
  ) {
    return prisma.notificationDigest.upsert({
      where: {
        tenantId_userId_frequency: {
          tenantId,
          userId,
          frequency: data.frequency,
        },
      },
      update: {
        channel: data.channel,
        isEnabled: data.isEnabled,
        preferences: data.preferences,
      },
      create: {
        tenantId,
        userId,
        frequency: data.frequency,
        channel: data.channel ?? "EMAIL",
        isEnabled: data.isEnabled ?? true,
        preferences: data.preferences ?? {},
      },
    });
  }

  async deleteDigest(tenantId: string, userId: string, id: string) {
    const digest = await prisma.notificationDigest.findFirst({
      where: { id, tenantId, userId },
    });
    if (!digest) throw new NotFoundException("Digest not found");
    return prisma.notificationDigest.delete({ where: { id } });
  }

  async createBatch(
    tenantId: string,
    data: {
      name: string;
      channel?: string;
      templateId?: string;
      items: {
        userId: string;
        recipient: string;
        subject: string;
        body: string;
      }[];
      scheduledAt?: string;
    },
  ) {
    const batch = await prisma.notificationBatch.create({
      data: {
        tenantId,
        name: data.name,
        channel: data.channel ?? "EMAIL",
        templateId: data.templateId,
        totalItems: data.items.length,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });
    await prisma.notificationBatchItem.createMany({
      data: data.items.map((item) => ({
        tenantId,
        batchId: batch.id,
        userId: item.userId,
        recipient: item.recipient,
        subject: item.subject,
        body: item.body,
      })),
    });
    return batch;
  }

  async getBatches(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.notificationBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getBatchItems(tenantId: string, batchId: string) {
    const batch = await prisma.notificationBatch.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) throw new NotFoundException("Batch not found");
    return prisma.notificationBatchItem.findMany({
      where: { tenantId, batchId },
    });
  }

  async processBatch(tenantId: string, batchId: string) {
    const batch = await prisma.notificationBatch.findFirst({
      where: { id: batchId, tenantId, status: "PENDING" },
    });
    if (!batch)
      throw new NotFoundException("Batch not found or already processed");
    await prisma.notificationBatch.update({
      where: { id: batchId },
      data: { status: "PROCESSING" },
    });

    const items = await prisma.notificationBatchItem.findMany({
      where: { tenantId, batchId, status: "PENDING" },
    });
    let sent = 0;
    let failed = 0;

    for (const item of items) {
      try {
        this.eventEmitter.emit("notification.send", {
          tenantId,
          userId: item.userId,
          type: "BATCH",
          title: item.subject,
          body: item.body,
          channel: batch.channel,
        });
        await prisma.notificationBatchItem.update({
          where: { id: item.id },
          data: { status: "SENT", sentAt: new Date() },
        });
        sent++;
      } catch (err: any) {
        await prisma.notificationBatchItem.update({
          where: { id: item.id },
          data: { status: "FAILED", errorMsg: err.message },
        });
        failed++;
      }
    }

    const finalStatus =
      failed === 0 ? "COMPLETED" : sent > 0 ? "PARTIAL" : "FAILED";
    await prisma.notificationBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        sentItems: sent,
        failedItems: failed,
        sentAt: new Date(),
      },
    });
    return { batchId, status: finalStatus, sent, failed };
  }

  async getChannels(tenantId: string) {
    const channels = await prisma.notificationChannel.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
    if (channels.length === 0) {
      await prisma.notificationChannel.createMany({
        data: [
          { tenantId, name: "Web", isEnabled: true },
          { tenantId, name: "Email", isEnabled: true },
          { tenantId, name: "SMS", isEnabled: false },
          { tenantId, name: "Push", isEnabled: false },
        ],
      });
      return prisma.notificationChannel.findMany({ where: { tenantId } });
    }
    return channels;
  }

  async updateChannel(tenantId: string, name: string, isEnabled: boolean) {
    const existing = await prisma.notificationChannel.findFirst({
      where: { tenantId, name },
    });
    if (!existing) throw new BadRequestException(`Channel ${name} not found`);
    return prisma.notificationChannel.update({
      where: { id: existing.id },
      data: { isEnabled },
    });
  }

  async getDeliveryLogs(
    tenantId: string,
    userId?: string,
    status?: string,
    limit = 50,
  ) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (status) where.status = status;
    return prisma.notificationDeliveryLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async logDelivery(
    tenantId: string,
    data: {
      notificationId?: string;
      templateId?: string;
      userId: string;
      channel: string;
      status?: string;
      errorMsg?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return prisma.notificationDeliveryLog.create({
      data: {
        tenantId,
        notificationId: data.notificationId,
        templateId: data.templateId,
        userId: data.userId,
        channel: data.channel,
        status: data.status ?? "QUEUED",
        errorMsg: data.errorMsg,
        metadata: data.metadata ?? {},
      },
    });
  }
}
