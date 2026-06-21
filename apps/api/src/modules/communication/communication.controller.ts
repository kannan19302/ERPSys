import { Controller, Get, Post, Patch, Delete, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CommunicationService, Presence } from './communication.service';

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

@Controller('communication')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  /* ── Workspace & directory ── */

  @Get('workspace')
  @Permissions('communication.channel.read')
  async getWorkspace(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getWorkspace(req.user.tenantId, req.user.userId, req.user.orgId);
  }

  @Get('directory')
  @Permissions('communication.channel.read')
  async getDirectory(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getDirectory(req.user.tenantId);
  }

  /* ── Spaces & channels ── */

  @Post('spaces')
  @Permissions('communication.channel.create')
  async createSpace(@Req() req: AuthenticatedRequest, @Body() dto: { name: string; emoji?: string }) {
    return this.communicationService.createSpace(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @Post('channels')
  @Permissions('communication.channel.create')
  async createChannel(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; spaceId?: string; topic?: string; description?: string }
  ) {
    return this.communicationService.createChannel(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @Post('channels/dm')
  @Permissions('communication.channel.create')
  async createDM(@Req() req: AuthenticatedRequest, @Body() dto: { userId: string }) {
    return this.communicationService.getOrCreateDM(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto.userId);
  }

  @Post('channels/group')
  @Permissions('communication.channel.create')
  async createGroup(@Req() req: AuthenticatedRequest, @Body() dto: { name: string; memberIds: string[] }) {
    return this.communicationService.createGroup(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @Post('channels/:channelId/read')
  @Permissions('communication.message.read')
  async markRead(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.markRead(req.user.tenantId, channelId, req.user.userId);
  }

  /* ── Messages ── */

  @Get('channels/:channelId/messages')
  @Permissions('communication.message.read')
  async getMessages(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.getMessages(req.user.tenantId, channelId);
  }

  @Post('channels/:channelId/messages')
  @Permissions('communication.message.create')
  async createMessage(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @Body() dto: { content: string; parentId?: string; attachments?: AttachmentDto[] }
  ) {
    return this.communicationService.createMessage(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @Patch('messages/:id')
  @Permissions('communication.message.create')
  async editMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: { content: string }) {
    return this.communicationService.editMessage(req.user.tenantId, id, req.user.userId, dto.content);
  }

  @Delete('messages/:id')
  @Permissions('communication.message.create')
  async deleteMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteMessage(req.user.tenantId, id, req.user.userId);
  }

  @Post('messages/:id/pin')
  @Permissions('communication.message.create')
  async togglePin(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.togglePin(req.user.tenantId, id);
  }

  @Post('messages/:id/reactions')
  @Permissions('communication.message.create')
  async toggleReaction(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: { emoji: string }) {
    return this.communicationService.toggleReaction(req.user.tenantId, id, req.user.userId, dto.emoji);
  }

  /* ── Bookmarks ── */

  @Get('bookmarks')
  @Permissions('communication.message.read')
  async getBookmarks(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getBookmarks(req.user.tenantId, req.user.userId);
  }

  @Post('messages/:id/bookmark')
  @Permissions('communication.message.create')
  async toggleBookmark(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleBookmark(req.user.tenantId, id, req.user.userId);
  }

  /* ── Star / Mute ── */

  @Post('channels/:channelId/star')
  @Permissions('communication.channel.read')
  async toggleStar(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.toggleStar(req.user.tenantId, channelId, req.user.userId);
  }

  @Post('channels/:channelId/mute')
  @Permissions('communication.channel.read')
  async toggleMute(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.toggleMute(req.user.tenantId, channelId, req.user.userId);
  }

  /* ── Presence ── */

  @Get('presence')
  @Permissions('communication.channel.read')
  async getPresence(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getPresence(req.user.tenantId);
  }

  @Put('presence')
  @Permissions('communication.channel.read')
  async setPresence(@Req() req: AuthenticatedRequest, @Body() dto: { presence: Presence; statusText?: string; statusEmoji?: string }) {
    return this.communicationService.setPresence(req.user.tenantId, req.user.userId, dto);
  }

  /* ── Meetings ── */

  @Get('meetings')
  @Permissions('communication.channel.read')
  async getMeetings(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getMeetings(req.user.tenantId);
  }

  @Post('meetings')
  @Permissions('communication.channel.create')
  async createMeeting(@Req() req: AuthenticatedRequest, @Body() dto: { title?: string; conversationId?: string }) {
    return this.communicationService.createMeeting(req.user.tenantId, req.user.userId, dto);
  }

  @Put('meetings/:id/end')
  @Permissions('communication.channel.create')
  async endMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.endMeeting(req.user.tenantId, id);
  }

  /* ── Calendar ── */

  @Get('events')
  @Permissions('communication.channel.read')
  async getEvents(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEvents(req.user.tenantId);
  }

  @Post('events')
  @Permissions('communication.channel.create')
  async createEvent(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      title: string; date: string; time: string; durationMins?: number; withMeet?: boolean; attendeeIds?: string[];
      description?: string; location?: string; color?: string; allDay?: boolean; recurrence?: string;
    }
  ) {
    return this.communicationService.createEvent(req.user.tenantId, req.user.userId, dto);
  }

  @Delete('events/:id')
  @Permissions('communication.channel.create')
  async deleteEvent(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteEvent(req.user.tenantId, id);
  }

  /* ── Legacy: notifications & email templates ── */

  @Get('notifications')
  @Permissions('communication.notification.read')
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getNotifications(req.user.tenantId, req.user.userId || 'system');
  }

  @Post('notifications')
  @Permissions('communication.notification.create')
  async createNotification(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { userId: string; title: string; content: string; type?: string; link?: string }
  ) {
    return this.communicationService.createNotification(req.user.tenantId, dto.userId, dto);
  }

  @Put('notifications/:id/status')
  @Permissions('communication.notification.update')
  async updateNotificationStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: 'READ' | 'ARCHIVED' }
  ) {
    return this.communicationService.updateNotificationStatus(req.user.tenantId, id, req.user.userId || 'system', dto.status);
  }

  @Get('email-templates')
  @Permissions('communication.email-template.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEmailTemplates(req.user.tenantId);
  }

  @Post('email-templates')
  @Permissions('communication.email-template.create')
  async createEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; subject: string; bodyHtml: string; bodyText?: string }
  ) {
    return this.communicationService.createEmailTemplate(req.user.tenantId, dto, req.user.userId || 'system');
  }
}
