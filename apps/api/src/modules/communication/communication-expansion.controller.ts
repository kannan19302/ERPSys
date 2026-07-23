import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import {
  createChatRoomSchema,
  updateChatRoomSchema,
  sendChatMessageSchema,
  updateChatMessageSchema,
  createMessageReactionSchema,
  typingIndicatorSchema,
  createVideoCallRoomSchema,
  createFileShareSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  type CreateChatRoomInput,
  type UpdateChatRoomInput,
  type SendChatMessageInput,
  type UpdateChatMessageInput,
  type CreateMessageReactionInput,
  type CreateVideoCallRoomInput,
  type CreateFileShareInput,
  type CreateAnnouncementInput,
  type UpdateAnnouncementInput,
} from '@unerp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { CommunicationExpansionService } from './communication-expansion.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('communication-expansion')
@ApiBearerAuth()
@Controller('communication')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class CommunicationExpansionController {
  constructor(private readonly svc: CommunicationExpansionService) {}

  // ── Chat Rooms ──

  @ApiOperation({ summary: 'List chat rooms' })
  @Permissions('communication.chat-room.read')
  @Get('chat-rooms')
  async getChatRooms(@Req() req: AuthReq) {
    return this.svc.getChatRooms(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get chat room' })
  @Permissions('communication.chat-room.read')
  @Get('chat-rooms/:id')
  async getChatRoom(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getChatRoom(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create chat room' })
  @Permissions('communication.chat-room.create')
  @Post('chat-rooms')
  async createChatRoom(@Req() req: AuthReq, @ZodBody(createChatRoomSchema) body: CreateChatRoomInput) {
    return this.svc.createChatRoom(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Update chat room' })
  @Permissions('communication.chat-room.update')
  @Patch('chat-rooms/:id')
  async updateChatRoom(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateChatRoomSchema) body: UpdateChatRoomInput) {
    return this.svc.updateChatRoom(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete chat room' })
  @Permissions('communication.chat-room.delete')
  @Delete('chat-rooms/:id')
  async deleteChatRoom(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteChatRoom(req.user.tenantId, id);
  }

  // ── Chat Messages ──

  @ApiOperation({ summary: 'Get messages' })
  @Permissions('communication.chat-message.read')
  @Get('chat-rooms/:roomId/messages')
  async getMessages(@Req() req: AuthReq, @Param('roomId') roomId: string, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getMessages(req.user.tenantId, roomId, { page, limit });
  }

  @ApiOperation({ summary: 'Send message' })
  @Permissions('communication.chat-message.create')
  @Post('chat-messages')
  async sendMessage(@Req() req: AuthReq, @ZodBody(sendChatMessageSchema) body: SendChatMessageInput) {
    return this.svc.sendMessage(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Edit message' })
  @Permissions('communication.chat-message.update')
  @Patch('chat-messages/:id')
  async updateMessage(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateChatMessageSchema) body: UpdateChatMessageInput) {
    return this.svc.updateMessage(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete message' })
  @Permissions('communication.chat-message.delete')
  @Delete('chat-messages/:id')
  async deleteMessage(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteMessage(req.user.tenantId, id);
  }

  // ── Reactions ──

  @ApiOperation({ summary: 'Add reaction' })
  @Permissions('communication.reaction.create')
  @Post('chat-messages/:messageId/reactions')
  async addReaction(@Req() req: AuthReq, @Param('messageId') messageId: string, @ZodBody(createMessageReactionSchema) body: CreateMessageReactionInput) {
    return this.svc.addReaction(req.user.tenantId, req.user.userId, messageId, body);
  }

  @ApiOperation({ summary: 'Remove reaction' })
  @Permissions('communication.reaction.delete')
  @Delete('chat-messages/:messageId/reactions/:reactionId')
  async removeReaction(@Req() req: AuthReq, @Param('messageId') messageId: string, @Param('reactionId') reactionId: string) {
    return this.svc.removeReaction(req.user.tenantId, reactionId);
  }

  // ── Typing Indicator ──

  @ApiOperation({ summary: 'Typing indicator' })
  @Permissions('communication.chat-message.create')
  @Post('typing')
  async typingIndicator(@Req() req: AuthReq, @ZodBody(typingIndicatorSchema) body: { roomId: string; isTyping: boolean }) {
    return { roomId: body.roomId, userId: req.user.userId, isTyping: body.isTyping };
  }

  // ── Video Calls ──

  @ApiOperation({ summary: 'List video calls' })
  @Permissions('communication.video-call.read')
  @Get('video-calls')
  async getVideoCalls(@Req() req: AuthReq) {
    return this.svc.getVideoCalls(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create video call' })
  @Permissions('communication.video-call.create')
  @Post('video-calls')
  async createVideoCall(@Req() req: AuthReq, @ZodBody(createVideoCallRoomSchema) body: CreateVideoCallRoomInput) {
    return this.svc.createVideoCall(req.user.tenantId, req.user.userId, body);
  }

  // ── File Shares ──

  @ApiOperation({ summary: 'List shared files' })
  @Permissions('communication.file-share.read')
  @Get('file-shares')
  async getFileShares(@Req() req: AuthReq) {
    return this.svc.getFileShares(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Share file' })
  @Permissions('communication.file-share.create')
  @Post('file-shares')
  async createFileShare(@Req() req: AuthReq, @ZodBody(createFileShareSchema) body: CreateFileShareInput) {
    return this.svc.createFileShare(req.user.tenantId, req.user.userId, body);
  }

  // ── Announcements ──

  @ApiOperation({ summary: 'List announcements' })
  @Permissions('communication.announcement.read')
  @Get('announcements')
  async getAnnouncements(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getAnnouncements(req.user.tenantId, { page, limit });
  }

  @ApiOperation({ summary: 'Create announcement' })
  @Permissions('communication.announcement.create')
  @Post('announcements')
  async createAnnouncement(@Req() req: AuthReq, @ZodBody(createAnnouncementSchema) body: CreateAnnouncementInput) {
    return this.svc.createAnnouncement(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Update announcement' })
  @Permissions('communication.announcement.update')
  @Patch('announcements/:id')
  async updateAnnouncement(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateAnnouncementSchema) body: UpdateAnnouncementInput) {
    return this.svc.updateAnnouncement(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete announcement' })
  @Permissions('communication.announcement.delete')
  @Delete('announcements/:id')
  async deleteAnnouncement(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteAnnouncement(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Publish announcement' })
  @Permissions('communication.announcement.publish')
  @Post('announcements/:id/publish')
  async publishAnnouncement(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.publishAnnouncement(req.user.tenantId, id);
  }
}
