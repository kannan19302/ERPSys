import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class NotificationsService {
  async getChannels(tenantId: string) {
    const channels = await prisma.notificationChannel.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    if (channels.length === 0) {
      // Seed default channels
      await prisma.notificationChannel.createMany({
        data: [
          { tenantId, name: 'Web', isEnabled: true },
          { tenantId, name: 'Email', isEnabled: true },
          { tenantId, name: 'SMS', isEnabled: false },
        ],
      });
      return prisma.notificationChannel.findMany({ where: { tenantId } });
    }

    return channels;
  }

  async updateChannelStatus(tenantId: string, name: string, isEnabled: boolean) {
    const existing = await prisma.notificationChannel.findFirst({
      where: { tenantId, name },
    });
    if (!existing) throw new BadRequestException(`Channel ${name} not found.`);

    return prisma.notificationChannel.update({
      where: { id: existing.id },
      data: { isEnabled },
    });
  }

  async getPreferences(tenantId: string, userId: string) {
    return prisma.notificationPreference.findMany({
      where: { tenantId, userId },
    });
  }

  async savePreference(
    tenantId: string,
    userId: string,
    dto: { channelName: string; eventType: string; isEnabled: boolean }
  ) {
    const existing = await prisma.notificationPreference.findFirst({
      where: { tenantId, userId, channelName: dto.channelName, eventType: dto.eventType },
    });

    if (existing) {
      return prisma.notificationPreference.update({
        where: { id: existing.id },
        data: { isEnabled: dto.isEnabled },
      });
    }

    return prisma.notificationPreference.create({
      data: {
        tenantId,
        userId,
        channelName: dto.channelName,
        eventType: dto.eventType,
        isEnabled: dto.isEnabled,
      },
    });
  }

  /**
   * Get user notification preferences grouped by category.
   * Maps the existing channelName/eventType model into a per-category view.
   */
  async getUserNotificationPreferences(tenantId: string, userId: string) {
    const CATEGORIES = [
      'Order Updates',
      'Invoice Alerts',
      'Inventory Alerts',
      'HR Notifications',
      'CRM Updates',
      'System Alerts',
      'Security Events',
    ];
    const CHANNELS = ['inApp', 'email', 'sms', 'push'];

    const existing = await prisma.notificationPreference.findMany({
      where: { tenantId, userId },
    });

    // Build a lookup map: `${eventType}::${channelName}` -> isEnabled
    const lookup = new Map<string, boolean>();
    for (const pref of existing) {
      lookup.set(`${pref.eventType}::${pref.channelName}`, pref.isEnabled);
    }

    // Default values per channel
    const defaults: Record<string, boolean> = { inApp: true, email: true, sms: false, push: false };

    return CATEGORIES.map((category) => {
      const result: Record<string, any> = { category };
      for (const ch of CHANNELS) {
        const key = `${category}::${ch}`;
        result[ch] = lookup.has(key) ? lookup.get(key) : defaults[ch];
      }
      return result;
    });
  }

  /**
   * Update notification preferences for a specific category.
   */
  async updateUserNotificationPreferences(
    tenantId: string,
    userId: string,
    dto: { category: string; inApp?: boolean; email?: boolean; sms?: boolean; push?: boolean },
  ) {
    const channels = ['inApp', 'email', 'sms', 'push'] as const;
    const results = [];

    for (const ch of channels) {
      if (dto[ch] === undefined) continue;

      const existing = await prisma.notificationPreference.findFirst({
        where: { tenantId, userId, channelName: ch, eventType: dto.category },
      });

      if (existing) {
        results.push(
          await prisma.notificationPreference.update({
            where: { id: existing.id },
            data: { isEnabled: dto[ch] },
          }),
        );
      } else {
        results.push(
          await prisma.notificationPreference.create({
            data: {
              tenantId,
              userId,
              channelName: ch,
              eventType: dto.category,
              isEnabled: dto[ch]!,
            },
          }),
        );
      }
    }

    return results;
  }
}
