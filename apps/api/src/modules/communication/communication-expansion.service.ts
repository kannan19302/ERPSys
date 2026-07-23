import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import type {
  CreateChatRoomInput,
  UpdateChatRoomInput,
  SendChatMessageInput,
  UpdateChatMessageInput,
  CreateMessageReactionInput,
  CreateVideoCallRoomInput,
  CreateFileShareInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@unerp/shared';

@Injectable()
export class CommunicationExpansionService {
  // ── Chat Rooms ──

  async getChatRooms(tenantId: string, userId: string) {
    return prisma.chatRoom.findMany({
      where: {
        tenantId,
        OR: [
          { isPrivate: false },
          { members: { some: { userId } } },
        ],
      },
      include: { members: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getChatRoom(tenantId: string, id: string) {
    const room = await prisma.chatRoom.findFirst({ where: { id, tenantId }, include: { members: true } });
    if (!room) throw new NotFoundException('Chat room not found');
    return room;
  }

  async createChatRoom(tenantId: string, userId: string, dto: CreateChatRoomInput) {
    const room = await prisma.chatRoom.create({
      data: { tenantId, createdBy: userId, ...dto },
    });
    await prisma.chatRoomMember.create({
      data: { tenantId, roomId: room.id, userId, role: 'OWNER' },
    });
    return room;
  }

  async updateChatRoom(tenantId: string, id: string, dto: UpdateChatRoomInput) {
    const existing = await prisma.chatRoom.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Chat room not found');
    return prisma.chatRoom.update({ where: { id }, data: dto });
  }

  async deleteChatRoom(tenantId: string, id: string) {
    const existing = await prisma.chatRoom.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Chat room not found');
    return prisma.chatRoom.delete({ where: { id } });
  }

  // ── Messages ──

  async getMessages(tenantId: string, roomId: string, params: { page?: number; limit?: number } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where = { tenantId, roomId };
    const [data, total] = await Promise.all([
      prisma.chatMessage.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { reactions: true, readReceipts: true } }),
      prisma.chatMessage.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async sendMessage(tenantId: string, userId: string, dto: SendChatMessageInput) {
    const room = await prisma.chatRoom.findFirst({ where: { id: dto.roomId, tenantId } });
    if (!room) throw new NotFoundException('Chat room not found');
    return prisma.chatMessage.create({ data: { tenantId, roomId: dto.roomId, senderId: userId, content: dto.content, contentType: dto.contentType, metadata: dto.metadata, parentId: dto.parentId } });
  }

  async updateMessage(tenantId: string, id: string, dto: UpdateChatMessageInput) {
    const existing = await prisma.chatMessage.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Message not found');
    return prisma.chatMessage.update({ where: { id }, data: { content: dto.content, isEdited: true } });
  }

  async deleteMessage(tenantId: string, id: string) {
    const existing = await prisma.chatMessage.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Message not found');
    return prisma.chatMessage.delete({ where: { id } });
  }

  // ── Reactions ──

  async addReaction(tenantId: string, userId: string, messageId: string, dto: CreateMessageReactionInput) {
    const existing = await prisma.messageReaction.findFirst({ where: { tenantId, messageId, userId, emoji: dto.emoji } });
    if (existing) return existing;
    return prisma.messageReaction.create({ data: { tenantId, messageId, userId, emoji: dto.emoji } });
  }

  async removeReaction(tenantId: string, reactionId: string) {
    const existing = await prisma.messageReaction.findFirst({ where: { id: reactionId, tenantId } });
    if (!existing) throw new NotFoundException('Reaction not found');
    return prisma.messageReaction.delete({ where: { id: reactionId } });
  }

  // ── Video Calls ──

  async getVideoCalls(tenantId: string) {
    return prisma.videoCallRoom.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createVideoCall(tenantId: string, userId: string, dto: CreateVideoCallRoomInput) {
    return prisma.videoCallRoom.create({ data: { tenantId, createdBy: userId, ...dto } });
  }

  // ── File Shares ──

  async getFileShares(tenantId: string) {
    return prisma.communicationFileShare.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createFileShare(tenantId: string, userId: string, dto: CreateFileShareInput) {
    return prisma.communicationFileShare.create({ data: { tenantId, uploadedBy: userId, ...dto } });
  }

  // ── Announcements ──

  async getAnnouncements(tenantId: string, params: { page?: number; limit?: number } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      prisma.announcement.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { targets: true } }),
      prisma.announcement.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createAnnouncement(tenantId: string, userId: string, dto: CreateAnnouncementInput) {
    const { targets, ...rest } = dto;
    return prisma.announcement.create({
      data: {
        tenantId,
        createdBy: userId,
        ...rest,
        targets: targets ? { create: targets.map(t => ({ tenantId, ...t })) } : undefined,
      },
      include: { targets: true },
    });
  }

  async updateAnnouncement(tenantId: string, id: string, dto: UpdateAnnouncementInput) {
    const existing = await prisma.announcement.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Announcement not found');
    return prisma.announcement.update({ where: { id }, data: dto });
  }

  async deleteAnnouncement(tenantId: string, id: string) {
    const existing = await prisma.announcement.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Announcement not found');
    return prisma.announcement.delete({ where: { id } });
  }

  async publishAnnouncement(tenantId: string, id: string) {
    const existing = await prisma.announcement.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Announcement not found');
    return prisma.announcement.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
  }
}
