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
}
