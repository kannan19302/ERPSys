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

    // US-B6: Check user presence status and suppress email/push if status is DND
    const presence = await prisma.userPresence.findFirst({
      where: { tenantId: payload.tenantId, userId: payload.userId }
    });
    const isDnd = presence?.presence === 'DND';

    if (channel === 'ALL' || channel === 'IN_APP') {
      await this.deliverInApp(payload);
    }
    if (!isDnd) {
      if (channel === 'ALL' || channel === 'EMAIL') {
        await this.deliverEmail(payload);
      }
      if (channel === 'ALL' || channel === 'PUSH') {
        await this.deliverPush(payload);
      }
    } else {
      const { pinoLogger } = await import('../../common/services/logger.service');
      pinoLogger.info({
        userId: payload.userId,
        tenantId: payload.tenantId,
        title: payload.title,
      }, 'Notification delivery suppressed due to DND status');
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

  /**
   * Fans a notification out to every active device token for this user
   * (.ai/MULTI_CLIENT_MASTER_PLAN.md § 7) — doubles as a cache-invalidation
   * signal for Flutter's read cache. Same "queued, not actually sent" fidelity
   * as deliverEmail: no FCM/APNs/WNS integration exists yet, so this logs the
   * fan-out per device rather than silently dropping it.
   */
  private async deliverPush(payload: NotificationPayload) {
    const tokens = await prisma.pushDeviceToken.findMany({
      where: { tenantId: payload.tenantId, userId: payload.userId, isActive: true },
    });
    if (!tokens.length) return;

    const { pinoLogger } = await import('../../common/services/logger.service');
    for (const t of tokens) {
      pinoLogger.info({
        channel: 'PUSH',
        deviceId: t.deviceId,
        platform: t.platform,
        title: payload.title,
        tenantId: payload.tenantId,
      }, 'Push notification queued');
    }
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
