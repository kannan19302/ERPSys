import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { OnEvent } from '@nestjs/event-emitter';

interface NotificationPayload {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  channel?: 'IN_APP' | 'EMAIL' | 'PUSH' | 'ALL';
}

@Injectable()
export class NotificationDeliveryService {

  @OnEvent('notification.send')
  async handleNotification(payload: NotificationPayload) {
    const channel = payload.channel || 'IN_APP';

    if (channel === 'ALL' || channel === 'IN_APP') {
      await this.deliverInApp(payload);
    }
    if (channel === 'ALL' || channel === 'EMAIL') {
      await this.deliverEmail(payload);
    }
  }

  private async deliverInApp(payload: NotificationPayload) {
    await prisma.notification.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        content: payload.body || '',
        status: 'UNREAD',
      },
    });
  }

  private async deliverEmail(payload: NotificationPayload) {
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, tenantId: payload.tenantId },
    });
    if (!user?.email) return;

    const { pinoLogger } = await import('../../common/services/logger.service');
    pinoLogger.info({
      channel: 'EMAIL',
      to: user.email,
      subject: payload.title,
      tenantId: payload.tenantId,
    }, 'Email notification queued');
  }

  async getUserNotifications(tenantId: string, userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        tenantId,
        userId,
        ...(unreadOnly ? { status: 'UNREAD' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(_tenantId: string, notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ' },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { tenantId, userId, status: 'UNREAD' },
      data: { status: 'READ' },
    });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    return prisma.notification.count({
      where: { tenantId, userId, status: 'UNREAD' },
    });
  }
}
