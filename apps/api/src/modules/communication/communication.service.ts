import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class CommunicationService {
  async getChannels(tenantId: string) {
    return prisma.channel.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createChannel(
    tenantId: string,
    orgId: string,
    dto: { name: string; description?: string; type?: string },
    createdBy: string
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.channel.findFirst({
      where: { tenantId, orgId: resolvedOrgId, name: dto.name },
    });
    if (existing) throw new BadRequestException(`Channel with name ${dto.name} already exists.`);

    return prisma.channel.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        type: dto.type || 'PUBLIC',
        createdBy,
      },
    });
  }

  async getMessages(tenantId: string, channelId: string) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Channel not found');

    return prisma.message.findMany({
      where: { tenantId, channelId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(
    tenantId: string,
    channelId: string,
    dto: { content: string },
    userId: string
  ) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Channel not found');

    return prisma.message.create({
      data: {
        tenantId,
        channelId,
        userId,
        content: dto.content,
      },
    });
  }

  async getNotifications(tenantId: string, userId: string) {
    return prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNotification(
    tenantId: string,
    userId: string,
    dto: { title: string; content: string; type?: string; link?: string }
  ) {
    return prisma.notification.create({
      data: {
        tenantId,
        userId,
        title: dto.title,
        content: dto.content,
        type: dto.type || 'SYSTEM',
        link: dto.link || null,
        status: 'UNREAD',
      },
    });
  }

  async updateNotificationStatus(
    tenantId: string,
    notificationId: string,
    userId: string,
    status: 'READ' | 'ARCHIVED'
  ) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, tenantId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return prisma.notification.update({
      where: { id: notificationId },
      data: { status },
    });
  }

  async getEmailTemplates(tenantId: string) {
    return prisma.emailTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createEmailTemplate(
    tenantId: string,
    dto: { name: string; subject: string; bodyHtml: string; bodyText?: string },
    createdBy: string
  ) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) throw new BadRequestException(`Email template with name ${dto.name} already exists.`);

    return prisma.emailTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        bodyText: dto.bodyText || null,
        createdBy,
      },
    });
  }
}
