import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { randomUUID } from 'crypto';

@Injectable()
export class CommunicationBotsService {
  /* ── Bot CRUD ── */

  async getBots(tenantId: string, channelId: string) {
    return prisma.connectBot.findMany({ where: { tenantId, channelId } });
  }

  async createBot(tenantId: string, channelId: string, userId: string, dto: { name: string; avatar?: string }) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    const existing = await prisma.connectBot.findFirst({ where: { tenantId, channelId, name: dto.name } });
    if (existing) throw new BadRequestException(`Bot "${dto.name}" already exists in this channel.`);
    const token = `bot_${randomUUID().replace(/-/g, '')}`;
    return prisma.connectBot.create({
      data: {
        tenantId, channelId, name: dto.name,
        avatar: dto.avatar || '🤖', token, isActive: true,
        createdBy: userId,
      },
    });
  }

  async updateBot(tenantId: string, botId: string, userId: string, dto: { name?: string; avatar?: string; isActive?: boolean }) {
    const bot = await prisma.connectBot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) throw new NotFoundException('Bot not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: bot.channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    return prisma.connectBot.update({ where: { id: botId }, data: dto });
  }

  async deleteBot(tenantId: string, botId: string, userId: string) {
    const bot = await prisma.connectBot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) throw new NotFoundException('Bot not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: bot.channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    await prisma.connectBot.delete({ where: { id: botId } });
    return { ok: true };
  }

  async regenerateToken(tenantId: string, botId: string, userId: string) {
    const bot = await prisma.connectBot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) throw new NotFoundException('Bot not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: bot.channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    const token = `bot_${randomUUID().replace(/-/g, '')}`;
    return prisma.connectBot.update({ where: { id: botId }, data: { token } });
  }

  /* ── Bot Messaging ── */

  async postAsBot(tenantId: string, botId: string, content: string) {
    const bot = await prisma.connectBot.findFirst({ where: { id: botId, tenantId, isActive: true } });
    if (!bot) throw new NotFoundException('Bot not found or inactive');
    const msg = await prisma.message.create({
      data: {
        tenantId, channelId: bot.channelId, userId: bot.id,
        content, kind: 'USER',
      },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    await prisma.channel.update({ where: { id: bot.channelId }, data: { updatedAt: new Date() } });
    return msg;
  }

  /* ── Webhook posting ── */

  async postViaWebhook(webhookUrl: string, payload: { content: string; username?: string; avatar?: string }) {
    if (!payload.content?.trim()) throw new BadRequestException('Content is required');
    const bot = await prisma.connectBot.findFirst({ where: { webhookUrl, isActive: true } });
    if (!bot) throw new NotFoundException('Webhook not found or inactive');
    const msg = await prisma.message.create({
      data: {
        tenantId: bot.tenantId, channelId: bot.channelId, userId: bot.id,
        content: payload.content.trim(), kind: 'USER',
      },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    await prisma.channel.update({ where: { id: bot.channelId }, data: { updatedAt: new Date() } });
    return { ok: true, messageId: msg.id };
  }

  async setWebhookUrl(tenantId: string, botId: string, userId: string, webhookUrl: string) {
    const bot = await prisma.connectBot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) throw new NotFoundException('Bot not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: bot.channelId, userId } });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) throw new ForbiddenException();
    const existing = await prisma.connectBot.findFirst({ where: { webhookUrl, id: { not: botId } } });
    if (existing) throw new BadRequestException('Webhook URL already in use by another bot');
    return prisma.connectBot.update({ where: { id: botId }, data: { webhookUrl } });
  }
}
