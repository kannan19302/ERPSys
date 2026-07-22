import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const channelSchema = z.object({
  name: z.string().min(1),
  channelType: z.enum(["EMAIL", "SMS", "WHATSAPP", "CHAT", "PUSH"]),
  provider: z.string().optional().nullable(),
  config: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});
export type ChannelInput = z.infer<typeof channelSchema>;

export const templateSchema = z.object({
  channelId: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  category: z.enum(["GENERAL", "QUOTATION", "INVOICE", "FOLLOWUP", "ALERT", "MARKETING"]).default("GENERAL"),
  isActive: z.boolean().default(true),
});
export type TemplateInput = z.infer<typeof templateSchema>;

@Injectable()
export class CrmCommunicationService {
  async getChannels(tenantId: string) {
    return prisma.communicationChannel.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async getChannel(tenantId: string, id: string) {
    const channel = await prisma.communicationChannel.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        templates: { where: { deletedAt: null }, orderBy: { name: "asc" } },
        logs: { orderBy: { sentAt: "desc" }, take: 20 },
      },
    });
    if (!channel) throw new NotFoundException("Channel not found");
    return channel;
  }

  async createChannel(tenantId: string, orgId: string | undefined, dto: ChannelInput) {
    return prisma.communicationChannel.create({ data: { ...dto, tenantId, orgId: orgId || "" } });
  }

  async updateChannel(tenantId: string, id: string, dto: Partial<ChannelInput>) {
    const existing = await prisma.communicationChannel.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Channel not found");
    return prisma.communicationChannel.update({ where: { id }, data: dto });
  }

  async deleteChannel(tenantId: string, id: string) {
    const existing = await prisma.communicationChannel.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Channel not found");
    const templateCount = await prisma.communicationTemplate.count({ where: { channelId: id, deletedAt: null } });
    if (templateCount > 0) throw new BadRequestException("Cannot delete channel with active templates");
    return prisma.communicationChannel.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getTemplates(tenantId: string, channelId?: string, category?: string) {
    const where: Prisma.CommunicationTemplateWhereInput = { tenantId, deletedAt: null };
    if (channelId) where.channelId = channelId;
    if (category) where.category = category;
    return prisma.communicationTemplate.findMany({
      where, orderBy: { name: "asc" },
      include: { channel: { select: { id: true, name: true, channelType: true } } },
    });
  }

  async getTemplate(tenantId: string, id: string) {
    const tmpl = await prisma.communicationTemplate.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { channel: { select: { id: true, name: true, channelType: true } } },
    });
    if (!tmpl) throw new NotFoundException("Template not found");
    return tmpl;
  }

  async createTemplate(tenantId: string, orgId: string | undefined, dto: TemplateInput) {
    const channel = await prisma.communicationChannel.findFirst({ where: { id: dto.channelId, tenantId } });
    if (!channel) throw new BadRequestException("Channel not found");
    return prisma.communicationTemplate.create({
      data: { ...dto, tenantId, orgId: orgId || "" },
      include: { channel: { select: { id: true, name: true, channelType: true } } },
    });
  }

  async updateTemplate(tenantId: string, id: string, dto: Partial<TemplateInput>) {
    const existing = await prisma.communicationTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Template not found");
    return prisma.communicationTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const existing = await prisma.communicationTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Template not found");
    return prisma.communicationTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getLogs(tenantId: string, channelId?: string, entityType?: string, entityId?: string, limit = 50) {
    const where: Prisma.CommunicationLogWhereInput = { tenantId };
    if (channelId) where.channelId = channelId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.communicationLog.findMany({
      where, orderBy: { sentAt: "desc" }, take: limit,
      include: { channel: { select: { id: true, name: true, channelType: true } } },
    });
  }

  async sendCommunication(
    tenantId: string, orgId: string | undefined, channelId: string, templateId: string,
    recipient: string, entityType?: string, entityId?: string,
  ) {
    const channel = await prisma.communicationChannel.findFirst({ where: { id: channelId, tenantId, isActive: true } });
    if (!channel) throw new BadRequestException("Active channel not found");
    const tmpl = await prisma.communicationTemplate.findFirst({ where: { id: templateId, tenantId, isActive: true } });
    if (!tmpl) throw new BadRequestException("Active template not found");
    return prisma.communicationLog.create({
      data: {
        tenantId, orgId: orgId || "", channelId, templateId,
        recipient, subject: tmpl.subject || "", body: tmpl.body,
        entityType, entityId, status: "SENT", sentAt: new Date(),
      },
    });
  }

  async getChannelStats(tenantId: string) {
    const [channels, totalSent, totalDelivered, totalFailed] = await Promise.all([
      prisma.communicationChannel.count({ where: { tenantId, deletedAt: null } }),
      prisma.communicationLog.count({ where: { tenantId } }),
      prisma.communicationLog.count({ where: { tenantId, status: "DELIVERED" } }),
      prisma.communicationLog.count({ where: { tenantId, status: "FAILED" } }),
    ]);
    const byChannel = await prisma.communicationLog.groupBy({
      by: ["channelId"], where: { tenantId }, _count: true,
    });
    return { channels, totalSent, totalDelivered, totalFailed, byChannel };
  }
}
