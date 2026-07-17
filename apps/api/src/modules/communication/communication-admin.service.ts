import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class CommunicationAdminService {
  /* ── Channel Moderation ── */

  async getModeration(tenantId: string, channelId: string) {
    const mod = await prisma.channelModeration.findFirst({ where: { tenantId, channelId } });
    return mod ?? { slowModeSecs: 0, whoCanPost: 'EVERYONE', onlyAdminsCanPin: false };
  }

  async setSlowMode(tenantId: string, channelId: string, userId: string, slowModeSecs: number) {
    const valid = [0, 30, 60, 300, 900, 3600];
    if (!valid.includes(slowModeSecs)) throw new BadRequestException(`Invalid slow mode. Use: ${valid.join(', ')}`);
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    return prisma.channelModeration.upsert({
      where: { channelId },
      create: { tenantId, channelId, slowModeSecs },
      update: { slowModeSecs },
    });
  }

  async setWhoCanPost(tenantId: string, channelId: string, userId: string, whoCanPost: string) {
    if (!['EVERYONE', 'ADMINS_ONLY', 'MODERATORS_ONLY'].includes(whoCanPost)) throw new BadRequestException();
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    return prisma.channelModeration.upsert({
      where: { channelId },
      create: { tenantId, channelId, whoCanPost },
      update: { whoCanPost },
    });
  }

  async canUserPost(tenantId: string, channelId: string, userId: string): Promise<boolean> {
    const mod = await prisma.channelModeration.findFirst({ where: { tenantId, channelId } });
    if (!mod || mod.whoCanPost === 'EVERYONE') return true;
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership) return false;
    if (mod.whoCanPost === 'ADMINS_ONLY') return ['OWNER', 'ADMIN'].includes(membership.role);
    if (mod.whoCanPost === 'MODERATORS_ONLY') return ['OWNER', 'ADMIN'].includes(membership.role);
    return true;
  }

  /* ── Channel Tabs ── */

  async getTabs(tenantId: string, channelId: string) {
    return prisma.channelTab.findMany({
      where: { tenantId, channelId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createTab(tenantId: string, channelId: string, userId: string, dto: {
    type: string; label: string; icon?: string; url?: string; entityType?: string; entityId?: string;
  }) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    const maxOrder = await prisma.channelTab.findFirst({
      where: { tenantId, channelId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true },
    });
    return prisma.channelTab.create({
      data: {
        tenantId, channelId, type: dto.type, label: dto.label,
        icon: dto.icon || null, url: dto.url || null,
        entityType: dto.entityType || null, entityId: dto.entityId || null,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1, createdBy: userId,
      },
    });
  }

  async updateTab(tenantId: string, tabId: string, userId: string, dto: Partial<{
    label: string; icon: string; url: string; sortOrder: number;
  }>) {
    const tab = await prisma.channelTab.findFirst({ where: { id: tabId, tenantId } });
    if (!tab) throw new NotFoundException('Tab not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: tab.channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    return prisma.channelTab.update({ where: { id: tabId }, data: dto });
  }

  async deleteTab(tenantId: string, tabId: string, userId: string) {
    const tab = await prisma.channelTab.findFirst({ where: { id: tabId, tenantId } });
    if (!tab) throw new NotFoundException('Tab not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: tab.channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    await prisma.channelTab.delete({ where: { id: tabId } });
    return { ok: true };
  }

  /* ── Pinned Messages Gallery ── */

  async getPinnedMessages(tenantId: string, channelId: string) {
    return prisma.message.findMany({
      where: { tenantId, channelId, pinned: true, deletedAt: null },
      include: { reactions: { select: { emoji: true, userId: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /* ── Channel Analytics ── */

  async getChannelAnalytics(tenantId: string, channelId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const snapshots = await prisma.channelAnalytics.findMany({
      where: { tenantId, channelId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    const total = snapshots.reduce((acc, s) => ({ messageCount: acc.messageCount + s.messageCount, activeUsers: Math.max(acc.activeUsers, s.activeUsers), reactions: acc.reactions + s.reactions }), { messageCount: 0, activeUsers: 0, reactions: 0 });
    return { snapshots, totals: total };
  }

  async recordAnalytics(tenantId: string) {
    const channels = await prisma.channel.findMany({ where: { tenantId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const channel of channels) {
      const [messageCount, activeUsers, reactions] = await Promise.all([
        prisma.message.count({ where: { tenantId, channelId: channel.id, createdAt: { gte: today } } }),
        prisma.message.groupBy({ by: ['userId'], where: { tenantId, channelId: channel.id, createdAt: { gte: today } }, _count: true }).then(r => r.length),
        prisma.messageReaction.count({ where: { message: { channelId: channel.id, tenantId }, createdAt: { gte: today } } }),
      ]);
      await prisma.channelAnalytics.upsert({
        where: { tenantId_channelId_date: { tenantId, channelId: channel.id, date: today } },
        create: { tenantId, channelId: channel.id, date: today, messageCount, activeUsers, reactions },
        update: { messageCount, activeUsers, reactions },
      });
    }
    return { ok: true };
  }

  /* ── Message Edit History ── */

  async getMessageEditHistory(tenantId: string, messageId: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    return prisma.messageEdit.findMany({
      where: { tenantId, messageId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
