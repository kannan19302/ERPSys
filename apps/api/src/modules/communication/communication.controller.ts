import { Controller, Get, Post, Patch, Delete, Param, Put, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CommunicationService, Presence } from './communication.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

interface AttachmentDto { id: string; name: string; size: number; mime: string; url?: string }

@ApiTags('communication')
@ApiBearerAuth()
@Controller('communication')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  /* ── Workspace & directory ── */

  @ApiOperation({ summary: 'Get workspace' })
  @Permissions('communication.read')
  @Get('workspace')
  @Permissions('communication.channel.read')
  async getWorkspace(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getWorkspace(req.user.tenantId, req.user.userId, req.user.orgId);
  }

  @ApiOperation({ summary: 'Get directory' })
  @Permissions('communication.read')
  @Get('directory')
  @Permissions('communication.channel.read')
  async getDirectory(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getDirectory(req.user.tenantId);
  }

  /* ── Spaces & channels ── */

  @ApiOperation({ summary: 'Create space' })
  @Permissions('communication.create')
  @Post('spaces')
  @Permissions('communication.channel.create')
  async createSpace(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { name: string; emoji?: string }) {
    return this.communicationService.createSpace(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Create channel' })
  @Permissions('communication.create')
  @Post('channels')
  @Permissions('communication.channel.create')
  async createChannel(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; spaceId?: string; topic?: string; description?: string }
  ) {
    return this.communicationService.createChannel(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Create d m' })
  @Permissions('communication.create')
  @Post('channels/dm')
  @Permissions('communication.channel.create')
  async createDM(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { userId: string }) {
    return this.communicationService.getOrCreateDM(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto.userId);
  }

  @ApiOperation({ summary: 'Create group' })
  @Permissions('communication.create')
  @Post('channels/group')
  @Permissions('communication.channel.create')
  async createGroup(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { name: string; memberIds: string[] }) {
    return this.communicationService.createGroup(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Mark read' })
  @Permissions('communication.create')
  @Post('channels/:channelId/read')
  @Permissions('communication.message.read')
  async markRead(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.markRead(req.user.tenantId, channelId, req.user.userId);
  }

  /* ── Messages ── */

  @ApiOperation({ summary: 'Get messages' })
  @Permissions('communication.read')
  @Get('channels/:channelId/messages')
  @Permissions('communication.message.read')
  async getMessages(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.getMessages(req.user.tenantId, channelId);
  }

  @ApiOperation({ summary: 'Create message' })
  @Permissions('communication.create')
  @Post('channels/:channelId/messages')
  @Permissions('communication.message.create')
  async createMessage(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @ZodBody(z.any()) dto: { content: string; parentId?: string; attachments?: AttachmentDto[] }
  ) {
    return this.communicationService.createMessage(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Edit message' })
  @Permissions('communication.update')
  @Patch('messages/:id')
  @Permissions('communication.message.create')
  async editMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { content: string }) {
    return this.communicationService.editMessage(req.user.tenantId, id, req.user.userId, dto.content);
  }

  @ApiOperation({ summary: 'Delete message' })
  @Permissions('communication.delete')
  @Delete('messages/:id')
  @Permissions('communication.message.create')
  async deleteMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteMessage(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle pin' })
  @Permissions('communication.create')
  @Post('messages/:id/pin')
  @Permissions('communication.message.create')
  async togglePin(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.togglePin(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Toggle reaction' })
  @Permissions('communication.create')
  @Post('messages/:id/reactions')
  @Permissions('communication.message.create')
  async toggleReaction(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { emoji: string }) {
    return this.communicationService.toggleReaction(req.user.tenantId, id, req.user.userId, dto.emoji);
  }

  /* ── Bookmarks ── */

  @ApiOperation({ summary: 'Get bookmarks' })
  @Permissions('communication.read')
  @Get('bookmarks')
  @Permissions('communication.message.read')
  async getBookmarks(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getBookmarks(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle bookmark' })
  @Permissions('communication.create')
  @Post('messages/:id/bookmark')
  @Permissions('communication.message.create')
  async toggleBookmark(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleBookmark(req.user.tenantId, id, req.user.userId);
  }

  /* ── Star / Mute ── */

  @ApiOperation({ summary: 'Toggle star' })
  @Permissions('communication.create')
  @Post('channels/:channelId/star')
  @Permissions('communication.channel.read')
  async toggleStar(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.toggleStar(req.user.tenantId, channelId, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle mute' })
  @Permissions('communication.create')
  @Post('channels/:channelId/mute')
  @Permissions('communication.channel.read')
  async toggleMute(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.toggleMute(req.user.tenantId, channelId, req.user.userId);
  }

  /* ── Presence ── */

  @ApiOperation({ summary: 'Get presence' })
  @Permissions('communication.read')
  @Get('presence')
  @Permissions('communication.channel.read')
  async getPresence(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getPresence(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Set presence' })
  @Permissions('communication.update')
  @Put('presence')
  @Permissions('communication.channel.read')
  async setPresence(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { presence: Presence; statusText?: string; statusEmoji?: string }) {
    return this.communicationService.setPresence(req.user.tenantId, req.user.userId, dto);
  }

  /* ── Meetings ── */

  @ApiOperation({ summary: 'Get meetings' })
  @Permissions('communication.read')
  @Get('meetings')
  @Permissions('communication.channel.read')
  async getMeetings(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getMeetings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create meeting' })
  @Permissions('communication.create')
  @Post('meetings')
  @Permissions('communication.channel.create')
  async createMeeting(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { title?: string; conversationId?: string }) {
    return this.communicationService.createMeeting(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'End meeting' })
  @Permissions('communication.update')
  @Put('meetings/:id/end')
  @Permissions('communication.channel.create')
  async endMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.endMeeting(req.user.tenantId, id);
  }

  /* ── Calendar ── */

  @ApiOperation({ summary: 'Get events' })
  @Permissions('communication.read')
  @Get('events')
  @Permissions('communication.channel.read')
  async getEvents(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEvents(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create event' })
  @Permissions('communication.create')
  @Post('events')
  @Permissions('communication.channel.create')
  async createEvent(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
      title: string; date: string; time: string; durationMins?: number; withMeet?: boolean; attendeeIds?: string[];
      description?: string; location?: string; color?: string; allDay?: boolean; recurrence?: string;
    }
  ) {
    return this.communicationService.createEvent(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete event' })
  @Permissions('communication.delete')
  @Delete('events/:id')
  @Permissions('communication.channel.create')
  async deleteEvent(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteEvent(req.user.tenantId, id);
  }

  /* ── Legacy: notifications & email templates ── */

  @ApiOperation({ summary: 'Get notifications' })
  @Permissions('communication.read')
  @Get('notifications')
  @Permissions('communication.notification.read')
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getNotifications(req.user.tenantId, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Create notification' })
  @Permissions('communication.create')
  @Post('notifications')
  @Permissions('communication.notification.create')
  async createNotification(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { userId: string; title: string; content: string; type?: string; link?: string }
  ) {
    return this.communicationService.createNotification(req.user.tenantId, dto.userId, dto);
  }

  @ApiOperation({ summary: 'Update notification status' })
  @Permissions('communication.update')
  @Put('notifications/:id/status')
  @Permissions('communication.notification.update')
  async updateNotificationStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: 'READ' | 'ARCHIVED' }
  ) {
    return this.communicationService.updateNotificationStatus(req.user.tenantId, id, req.user.userId || 'system', dto.status);
  }

  @ApiOperation({ summary: 'Get email templates' })
  @Permissions('communication.read')
  @Get('email-templates')
  @Permissions('communication.email-template.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEmailTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create email template' })
  @Permissions('communication.create')
  @Post('email-templates')
  @Permissions('communication.email-template.create')
  async createEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; subject: string; bodyHtml: string; bodyText?: string }
  ) {
    return this.communicationService.createEmailTemplate(req.user.tenantId, dto, req.user.userId || 'system');
  }
}
