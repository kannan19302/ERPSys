import { Controller, Get, Post, Patch, Delete, Param, Put, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { CommunicationService, Presence } from './communication.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

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
  @Get('workspace')
  @Permissions('communication.channel.read')
  async getWorkspace(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getWorkspace(req.user.tenantId, req.user.userId, req.user.orgId);
  }

  @ApiOperation({ summary: 'Get directory' })
  @Get('directory')
  @Permissions('communication.channel.read')
  async getDirectory(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getDirectory(req.user.tenantId);
  }

  /* ── Spaces & channels ── */

  @ApiOperation({ summary: 'Create space' })
  @Post('spaces')
  @Permissions('communication.channel.create')
  async createSpace(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { name: string; emoji?: string }) {
    return this.communicationService.createSpace(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Create channel' })
  @Post('channels')
  @Permissions('communication.channel.create')
  async createChannel(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; spaceId?: string; topic?: string; description?: string }
  ) {
    return this.communicationService.createChannel(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Create d m' })
  @Post('channels/dm')
  @Permissions('communication.channel.create')
  async createDM(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { userId: string }) {
    return this.communicationService.getOrCreateDM(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto.userId);
  }

  @ApiOperation({ summary: 'Create group' })
  @Post('channels/group')
  @Permissions('communication.channel.create')
  async createGroup(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { name: string; memberIds: string[] }) {
    return this.communicationService.createGroup(req.user.tenantId, req.user.orgId || 'org-system-default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Mark read' })
  @Permissions('communication.message.read')
  @Post('channels/:channelId/read')
  async markRead(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.markRead(req.user.tenantId, channelId, req.user.userId);
  }

  /* ── Channel management & roles (US-B1/B2/B3) ── */

  @ApiOperation({ summary: 'Browse public channels not yet joined' })
  @Permissions('communication.channel.read')
  @Get('channels/browse')
  async browseChannels(@Req() req: AuthenticatedRequest) {
    return this.communicationService.browseChannels(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'List channel members with their role' })
  @Permissions('communication.channel.read')
  @Get('channels/:id/members')
  async getChannelMembers(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.getChannelMembers(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Rename or archive a channel' })
  @Permissions('communication.channel.manage')
  @Patch('channels/:id')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Channel', 'id')
  async updateChannel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ name: z.string().optional(), archived: z.boolean().optional(), topic: z.string().optional(), description: z.string().optional() }))
    dto: { name?: string; archived?: boolean; topic?: string; description?: string }
  ) {
    return this.communicationService.updateChannel(req.user.tenantId, id, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Join a public channel' })
  @Permissions('communication.channel.join')
  @Post('channels/:id/join')
  async joinChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.joinChannel(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Add a channel member' })
  @Permissions('communication.channel.member.manage')
  @Post('channels/:id/members')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Channel', 'id')
  async addChannelMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ userId: z.string() })) dto: { userId: string }
  ) {
    return this.communicationService.addChannelMember(req.user.tenantId, id, req.user.userId, dto.userId);
  }

  @ApiOperation({ summary: 'Remove a channel member' })
  @Permissions('communication.channel.member.manage')
  @Delete('channels/:id/members/:userId')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Channel', 'id')
  async removeChannelMember(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.communicationService.removeChannelMember(req.user.tenantId, id, req.user.userId, userId);
  }

  /* ── Search (US-A6) ── */

  @ApiOperation({ summary: 'Search messages across my channels' })
  @Permissions('communication.message.search')
  @Get('search')
  async search(@Req() req: AuthenticatedRequest, @Query('q') q: string) {
    return this.communicationService.searchMessages(req.user.tenantId, req.user.userId, q || '');
  }

  @ApiOperation({ summary: 'Get message read receipts (US-B4)' })
  @Permissions('communication.message.read')
  @Get('messages/:id/read-receipts')
  async getReadReceipts(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.getMessageReadReceipts(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get link preview metadata (US-C2)' })
  @Permissions('communication.message.read')
  @Get('link-preview')
  async getLinkPreview(@Query('url') url: string) {
    return this.communicationService.getLinkPreview(url);
  }

  /* ── Messages ── */

  @ApiOperation({ summary: 'Get messages' })
  @Get('channels/:channelId/messages')
  @Permissions('communication.message.read')
  async getMessages(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.getMessages(req.user.tenantId, channelId);
  }

  @ApiOperation({ summary: 'Create message' })
  @Post('channels/:channelId/messages')
  @Permissions('communication.message.create')
  async createMessage(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @ZodBody(z.any()) dto: { content: string; parentId?: string; attachments?: AttachmentDto[] }
  ) {
    return this.communicationService.createMessage(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Upload a real file attachment for a Connect message (US-A1/US-A2)' })
  @ApiConsumes('multipart/form-data')
  @Permissions('communication.message-attachment.upload')
  @Post('channels/:channelId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.communicationService.uploadAttachment(req.user.tenantId, channelId, req.user.userId, file);
  }

  @ApiOperation({ summary: 'Edit message' })
  @Patch('messages/:id')
  @Permissions('communication.message.create')
  async editMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { content: string }) {
    return this.communicationService.editMessage(req.user.tenantId, id, req.user.userId, dto.content);
  }

  @ApiOperation({ summary: 'Delete message' })
  @Delete('messages/:id')
  @Permissions('communication.message.create')
  async deleteMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteMessage(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle pin' })
  @Post('messages/:id/pin')
  @Permissions('communication.message.create')
  async togglePin(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.togglePin(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Toggle reaction' })
  @Post('messages/:id/reactions')
  @Permissions('communication.message.create')
  async toggleReaction(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { emoji: string }) {
    return this.communicationService.toggleReaction(req.user.tenantId, id, req.user.userId, dto.emoji);
  }

  /* ── Bookmarks ── */

  @ApiOperation({ summary: 'Get bookmarks' })
  @Get('bookmarks')
  @Permissions('communication.message.read')
  async getBookmarks(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getBookmarks(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle bookmark' })
  @Post('messages/:id/bookmark')
  @Permissions('communication.message.create')
  async toggleBookmark(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleBookmark(req.user.tenantId, id, req.user.userId);
  }

  /* ── Star / Mute ── */

  @ApiOperation({ summary: 'Toggle star' })
  @Post('channels/:channelId/star')
  @Permissions('communication.channel.read')
  async toggleStar(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.toggleStar(req.user.tenantId, channelId, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle mute' })
  @Post('channels/:channelId/mute')
  @Permissions('communication.channel.read')
  async toggleMute(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.toggleMute(req.user.tenantId, channelId, req.user.userId);
  }

  @ApiOperation({ summary: 'Set my per-channel notification level (US-B5)' })
  @Permissions('communication.channel.read')
  @Put('channels/:channelId/notify-level')
  async setNotifyLevel(
    @Req() req: AuthenticatedRequest,
    @Param('channelId') channelId: string,
    @ZodBody(z.object({ notifyLevel: z.enum(['ALL', 'MENTIONS', 'NONE']) })) dto: { notifyLevel: 'ALL' | 'MENTIONS' | 'NONE' }
  ) {
    return this.communicationService.setNotifyLevel(req.user.tenantId, channelId, req.user.userId, dto.notifyLevel);
  }

  /* ── Presence ── */

  @ApiOperation({ summary: 'Get presence' })
  @Get('presence')
  @Permissions('communication.channel.read')
  async getPresence(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getPresence(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Set presence' })
  @Put('presence')
  @Permissions('communication.channel.read')
  async setPresence(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { presence: Presence; statusText?: string; statusEmoji?: string }) {
    return this.communicationService.setPresence(req.user.tenantId, req.user.userId, dto);
  }

  /* ── Meetings ── */

  @ApiOperation({ summary: 'Get meetings' })
  @Get('meetings')
  @Permissions('communication.channel.read')
  async getMeetings(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getMeetings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create meeting' })
  @Post('meetings')
  @Permissions('communication.channel.create')
  async createMeeting(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { title?: string; conversationId?: string }) {
    return this.communicationService.createMeeting(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'End meeting' })
  @Put('meetings/:id/end')
  @Permissions('communication.channel.create')
  async endMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.endMeeting(req.user.tenantId, id);
  }

  /* ── Calendar ── */

  @ApiOperation({ summary: 'Get events' })
  @Get('events')
  @Permissions('communication.channel.read')
  async getEvents(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEvents(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create event' })
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
  @Delete('events/:id')
  @Permissions('communication.channel.create')
  async deleteEvent(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteEvent(req.user.tenantId, id);
  }

  /* ── Legacy: notifications & email templates ── */

  @ApiOperation({ summary: 'Get notifications' })
  @Get('notifications')
  @Permissions('communication.notification.read')
  async getNotifications(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getNotifications(req.user.tenantId, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Create notification' })
  @Post('notifications')
  @Permissions('communication.notification.create')
  async createNotification(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { userId: string; title: string; content: string; type?: string; link?: string }
  ) {
    return this.communicationService.createNotification(req.user.tenantId, dto.userId, dto);
  }

  @ApiOperation({ summary: 'Update notification status' })
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
  @Get('email-templates')
  @Permissions('communication.email-template.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getEmailTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create email template' })
  @Post('email-templates')
  @Permissions('communication.email-template.create')
  async createEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; subject: string; bodyHtml: string; bodyText?: string }
  ) {
    return this.communicationService.createEmailTemplate(req.user.tenantId, dto, req.user.userId || 'system');
  }
}
