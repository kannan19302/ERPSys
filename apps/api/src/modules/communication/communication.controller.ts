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
import { CommunicationAdminService } from './communication-admin.service';
import { CommunicationBotsService } from './communication-bots.service';
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
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly adminService: CommunicationAdminService,
    private readonly botsService: CommunicationBotsService,
  ) {}

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
  async setPresence(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { presence: Presence; statusText?: string; statusEmoji?: string; clearAt?: string }) {
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
  async createMeeting(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { title?: string; conversationId?: string; lobby?: boolean }) {
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

  /* ── Threads ── */

  @ApiOperation({ summary: 'Get thread messages' })
  @Get('messages/:parentId/thread')
  @Permissions('communication.message.read')
  async getThreadMessages(@Req() req: AuthenticatedRequest, @Param('parentId') parentId: string) {
    return this.communicationService.getThreadMessages(req.user.tenantId, parentId);
  }

  /* ── Forward ── */

  @ApiOperation({ summary: 'Forward message to another channel' })
  @Post('messages/:id/forward')
  @Permissions('communication.message.create')
  async forwardMessage(
    @Req() req: AuthenticatedRequest, @Param('id') id: string,
    @ZodBody(z.any()) dto: { toChannelId: string; comment?: string }
  ) {
    return this.communicationService.forwardMessage(req.user.tenantId, id, req.user.userId, dto);
  }

  /* ── Presence Scheduling ── */

  @ApiOperation({ summary: 'Get status schedules' })
  @Get('status-schedules')
  @Permissions('communication.channel.read')
  async getStatusSchedules(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getStatusSchedules(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Create status schedule' })
  @Post('status-schedules')
  @Permissions('communication.channel.read')
  async createStatusSchedule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: {
    presence: string; statusText?: string; statusEmoji?: string;
    startTime: string; endTime: string; isRecurring?: boolean; recurrenceRule?: string;
  }) {
    return this.communicationService.createStatusSchedule(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete status schedule' })
  @Delete('status-schedules/:id')
  @Permissions('communication.channel.read')
  async deleteStatusSchedule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.deleteStatusSchedule(req.user.tenantId, id, req.user.userId);
  }

  /* ── Search with filters ── */

  @ApiOperation({ summary: 'Search messages with filters' })
  @Get('search/filtered')
  @Permissions('communication.message.search')
  async searchFiltered(
    @Req() req: AuthenticatedRequest, @Query('q') q: string,
    @Query('channelId') channelId?: string, @Query('authorId') authorId?: string,
    @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string
  ) {
    return this.communicationService.searchMessagesFiltered(req.user.tenantId, req.user.userId, q || '', { channelId, authorId, dateFrom, dateTo });
  }

  /* ── Task from message ── */

  @ApiOperation({ summary: 'Create a task from a message' })
  @Post('messages/:id/create-task')
  @Permissions('communication.message.create')
  async createTaskFromMessage(
    @Req() req: AuthenticatedRequest, @Param('id') id: string,
    @ZodBody(z.any()) dto: { projectId?: string; dueDate?: string }
  ) {
    return this.communicationService.createTaskFromMessage(req.user.tenantId, id, req.user.userId, dto);
  }

  /* ── Unread summary ── */

  @ApiOperation({ summary: 'Get unread summary across all conversations' })
  @Get('unread-summary')
  @Permissions('communication.message.read')
  async getUnreadSummary(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getUnreadSummary(req.user.tenantId, req.user.userId);
  }

  /* ── Meeting enhancements ── */

  @ApiOperation({ summary: 'Join a meeting' })
  @Post('meetings/:id/join')
  @Permissions('communication.channel.read')
  async joinMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.joinMeeting(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Leave a meeting' })
  @Post('meetings/:id/leave')
  @Permissions('communication.channel.read')
  async leaveMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.leaveMeeting(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle raise hand in meeting' })
  @Post('meetings/:id/raise-hand')
  @Permissions('communication.channel.read')
  async toggleHandRaise(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleHandRaise(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle mute in meeting' })
  @Post('meetings/:id/mute')
  @Permissions('communication.channel.read')
  async toggleMuteMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleMuteSelf(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle video in meeting' })
  @Post('meetings/:id/video')
  @Permissions('communication.channel.read')
  async toggleVideoMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleVideoSelf(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle screen sharing in meeting' })
  @Post('meetings/:id/screen-share')
  @Permissions('communication.channel.read')
  async toggleScreenShare(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.toggleScreenShare(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get meeting participants' })
  @Get('meetings/:id/participants')
  @Permissions('communication.channel.read')
  async getMeetingParticipants(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.getMeetingParticipants(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get meeting chat' })
  @Get('meetings/:id/chat')
  @Permissions('communication.channel.read')
  async getMeetingChat(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.getMeetingChat(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Send meeting chat message' })
  @Post('meetings/:id/chat')
  @Permissions('communication.message.create')
  async sendMeetingChat(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { content: string }) {
    return this.communicationService.sendMeetingChat(req.user.tenantId, id, req.user.userId, dto.content);
  }

  @ApiOperation({ summary: 'Admit participant to meeting lobby' })
  @Post('meetings/:id/admit/:targetUserId')
  @Permissions('communication.channel.create')
  async admitToMeeting(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('targetUserId') targetUserId: string) {
    return this.communicationService.admitToMeeting(req.user.tenantId, id, req.user.userId, targetUserId);
  }

  @ApiOperation({ summary: 'Start meeting recording' })
  @Post('meetings/:id/recordings/start')
  @Permissions('communication.channel.create')
  async startRecording(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.startRecording(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Stop meeting recording' })
  @Post('meetings/:id/recordings/:recordingId/stop')
  @Permissions('communication.channel.create')
  async stopRecording(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('recordingId') recordingId: string) {
    return this.communicationService.stopRecording(req.user.tenantId, id, req.user.userId, recordingId);
  }

  /* ── Channel Tabs ── */

  @ApiOperation({ summary: 'Get channel tabs' })
  @Get('channels/:channelId/tabs')
  @Permissions('communication.channel.read')
  async getTabs(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.adminService.getTabs(req.user.tenantId, channelId);
  }

  @ApiOperation({ summary: 'Create channel tab' })
  @Post('channels/:channelId/tabs')
  @Permissions('communication.channel.manage')
  async createTab(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @ZodBody(z.any()) dto: {
    type: string; label: string; icon?: string; url?: string; entityType?: string; entityId?: string;
  }) {
    return this.adminService.createTab(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Update channel tab' })
  @Patch('tabs/:tabId')
  @Permissions('communication.channel.manage')
  async updateTab(@Req() req: AuthenticatedRequest, @Param('tabId') tabId: string, @ZodBody(z.any()) dto: any) {
    return this.adminService.updateTab(req.user.tenantId, tabId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete channel tab' })
  @Delete('tabs/:tabId')
  @Permissions('communication.channel.manage')
  async deleteTab(@Req() req: AuthenticatedRequest, @Param('tabId') tabId: string) {
    return this.adminService.deleteTab(req.user.tenantId, tabId, req.user.userId);
  }

  /* ── Channel Moderation ── */

  @ApiOperation({ summary: 'Get channel moderation settings' })
  @Get('channels/:channelId/moderation')
  @Permissions('communication.channel.read')
  async getModeration(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.adminService.getModeration(req.user.tenantId, channelId);
  }

  @ApiOperation({ summary: 'Set slow mode' })
  @Put('channels/:channelId/moderation/slow-mode')
  @Permissions('communication.channel.manage')
  async setSlowMode(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @ZodBody(z.any()) dto: { slowModeSecs: number }) {
    return this.adminService.setSlowMode(req.user.tenantId, channelId, req.user.userId, dto.slowModeSecs);
  }

  @ApiOperation({ summary: 'Set who can post' })
  @Put('channels/:channelId/moderation/who-can-post')
  @Permissions('communication.channel.manage')
  async setWhoCanPost(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @ZodBody(z.any()) dto: { whoCanPost: string }) {
    return this.adminService.setWhoCanPost(req.user.tenantId, channelId, req.user.userId, dto.whoCanPost);
  }

  /* ── Pinned Messages ── */

  @ApiOperation({ summary: 'Get pinned messages for a channel' })
  @Get('channels/:channelId/pinned')
  @Permissions('communication.message.read')
  async getPinnedMessages(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.adminService.getPinnedMessages(req.user.tenantId, channelId);
  }

  /* ── Channel Analytics ── */

  @ApiOperation({ summary: 'Get channel analytics' })
  @Get('channels/:channelId/analytics')
  @Permissions('communication.channel.read')
  async getChannelAnalytics(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @Query('days') days?: string) {
    return this.adminService.getChannelAnalytics(req.user.tenantId, channelId, days ? parseInt(days, 10) : 30);
  }

  /* ── Message Edit History ── */

  @ApiOperation({ summary: 'Get message edit history' })
  @Get('messages/:id/edit-history')
  @Permissions('communication.message.read')
  async getMessageEditHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.getMessageEditHistory(req.user.tenantId, id);
  }

  /* ── Bots ── */

  @ApiOperation({ summary: 'Get bots for a channel' })
  @Get('channels/:channelId/bots')
  @Permissions('communication.channel.read')
  async getBots(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.botsService.getBots(req.user.tenantId, channelId);
  }

  @ApiOperation({ summary: 'Create bot' })
  @Post('channels/:channelId/bots')
  @Permissions('communication.channel.manage')
  async createBot(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @ZodBody(z.any()) dto: { name: string; avatar?: string }) {
    return this.botsService.createBot(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Update bot' })
  @Patch('bots/:botId')
  @Permissions('communication.channel.manage')
  async updateBot(@Req() req: AuthenticatedRequest, @Param('botId') botId: string, @ZodBody(z.any()) dto: any) {
    return this.botsService.updateBot(req.user.tenantId, botId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete bot' })
  @Delete('bots/:botId')
  @Permissions('communication.channel.manage')
  async deleteBot(@Req() req: AuthenticatedRequest, @Param('botId') botId: string) {
    return this.botsService.deleteBot(req.user.tenantId, botId, req.user.userId);
  }

  @ApiOperation({ summary: 'Regenerate bot token' })
  @Post('bots/:botId/regenerate-token')
  @Permissions('communication.channel.manage')
  async regenerateBotToken(@Req() req: AuthenticatedRequest, @Param('botId') botId: string) {
    return this.botsService.regenerateToken(req.user.tenantId, botId, req.user.userId);
  }

  @ApiOperation({ summary: 'Set bot webhook URL' })
  @Put('bots/:botId/webhook')
  @Permissions('communication.channel.manage')
  async setWebhookUrl(@Req() req: AuthenticatedRequest, @Param('botId') botId: string, @ZodBody(z.any()) dto: { webhookUrl: string }) {
    return this.botsService.setWebhookUrl(req.user.tenantId, botId, req.user.userId, dto.webhookUrl);
  }

  /* ── Feature 1: Polls ── */

  @ApiOperation({ summary: 'Create poll' })
  @Post('polls')
  @Permissions('communication.message.create')
  async createPoll(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ channelId: z.string(), question: z.string(), options: z.array(z.object({ label: z.string(), emoji: z.string().optional() })).min(2).max(10) })) dto: any) {
    return this.communicationService.createPoll(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Get polls for channel' })
  @Get('channels/:channelId/polls')
  @Permissions('communication.message.read')
  async getPolls(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.communicationService.getPolls(req.user.tenantId, channelId);
  }

  @ApiOperation({ summary: 'Vote on poll' })
  @Post('polls/:pollId/vote')
  @Permissions('communication.message.create')
  async votePoll(@Req() req: AuthenticatedRequest, @Param('pollId') pollId: string, @ZodBody(z.object({ optionId: z.string() })) dto: { optionId: string }) {
    return this.communicationService.votePoll(req.user.tenantId, pollId, req.user.userId, dto.optionId);
  }

  @ApiOperation({ summary: 'Close poll' })
  @Post('polls/:pollId/close')
  @Permissions('communication.message.create')
  async closePoll(@Req() req: AuthenticatedRequest, @Param('pollId') pollId: string) {
    return this.communicationService.closePoll(req.user.tenantId, pollId, req.user.userId);
  }

  /* ── Feature 2: Slash Commands ── */

  @ApiOperation({ summary: 'Execute slash command' })
  @Post('commands')
  @Permissions('communication.message.create')
  async handleCommand(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ channelId: z.string(), text: z.string() })) dto: { channelId: string; text: string }) {
    return this.communicationService.handleSlashCommand(req.user.tenantId, req.user.userId, dto.channelId, dto.text);
  }

  /* ── Feature 3: Reminders ── */

  @ApiOperation({ summary: 'Create reminder' })
  @Post('reminders')
  @Permissions('communication.channel.read')
  async createReminder(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ text: z.string(), remindAt: z.coerce.date(), channelId: z.string().optional(), messageId: z.string().optional() })) dto: any) {
    return this.communicationService.createReminder(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Get reminders' })
  @Get('reminders')
  @Permissions('communication.channel.read')
  async getReminders(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getReminders(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete reminder' })
  @Delete('reminders/:reminderId')
  @Permissions('communication.channel.read')
  async deleteReminder(@Req() req: AuthenticatedRequest, @Param('reminderId') reminderId: string) {
    return this.communicationService.deleteReminder(req.user.tenantId, reminderId, req.user.userId);
  }

  @ApiOperation({ summary: 'Snooze reminder' })
  @Post('reminders/:reminderId/snooze')
  @Permissions('communication.channel.read')
  async snoozeReminder(@Req() req: AuthenticatedRequest, @Param('reminderId') reminderId: string, @ZodBody(z.object({ minutes: z.number().optional() })) dto: { minutes?: number }) {
    return this.communicationService.snoozeReminder(req.user.tenantId, reminderId, req.user.userId, dto.minutes);
  }

  /* ── Feature 4: Scheduled Messages ── */

  @ApiOperation({ summary: 'Schedule a message' })
  @Post('channels/:channelId/schedule')
  @Permissions('communication.message.create')
  async scheduleMessage(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @ZodBody(z.object({ content: z.string(), scheduledAt: z.coerce.date() })) dto: any) {
    return this.communicationService.scheduleMessage(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Get scheduled messages' })
  @Get('scheduled')
  @Permissions('communication.message.read')
  async getScheduledMessages(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getScheduledMessages(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete scheduled message' })
  @Delete('scheduled/:messageId')
  @Permissions('communication.message.create')
  async deleteScheduledMessage(@Req() req: AuthenticatedRequest, @Param('messageId') messageId: string) {
    return this.communicationService.deleteScheduledMessage(req.user.tenantId, messageId, req.user.userId);
  }

  /* ── Feature 5: Custom Emoji ── */

  @ApiOperation({ summary: 'Upload custom emoji' })
  @Post('emoji')
  @Permissions('communication.channel.manage')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadEmoji(@Req() req: AuthenticatedRequest, @UploadedFile() file: any, @ZodBody(z.string()) name: any) {
    return this.communicationService.uploadCustomEmoji(req.user.tenantId, req.user.userId, file, name?.name || 'emoji');
  }

  @ApiOperation({ summary: 'Get custom emojis' })
  @Get('emoji')
  @Permissions('communication.channel.read')
  async getEmojis(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getCustomEmojis(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Delete custom emoji' })
  @Delete('emoji/:emojiId')
  @Permissions('communication.channel.manage')
  async deleteEmoji(@Req() req: AuthenticatedRequest, @Param('emojiId') emojiId: string) {
    return this.communicationService.deleteCustomEmoji(req.user.tenantId, emojiId);
  }

  /* ── Feature 6: Translation ── */

  @ApiOperation({ summary: 'Translate message' })
  @Post('messages/:id/translate')
  @Permissions('communication.message.read')
  async translateMessage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ targetLang: z.string() })) dto: { targetLang: string }) {
    return this.communicationService.translateMessage(req.user.tenantId, id, dto.targetLang);
  }

  /* ── Feature 7: Meeting Summaries ── */

  @ApiOperation({ summary: 'Generate meeting summary' })
  @Post('meetings/:id/summary')
  @Permissions('communication.meeting.manage')
  async generateMeetingSummary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.generateMeetingSummary(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get meeting summary' })
  @Get('meetings/:id/summary')
  @Permissions('communication.channel.read')
  async getMeetingSummary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.getMeetingSummary(req.user.tenantId, id);
  }

  /* ── Feature 8: Channel Templates ── */

  @ApiOperation({ summary: 'Get channel templates' })
  @Get('channel-templates')
  @Permissions('communication.channel.create')
  async getChannelTemplates(@Req() req: AuthenticatedRequest) {
    return this.communicationService.getChannelTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create channel from template' })
  @Post('channel-templates/apply')
  @Permissions('communication.channel.create')
  async createFromTemplate(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ templateId: z.string(), name: z.string(), description: z.string().optional() })) dto: any) {
    return this.communicationService.createChannelFromTemplate(req.user.tenantId, req.user.orgId || 'default', req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Create new template' })
  @Post('channel-templates')
  @Permissions('communication.channel.manage')
  async createTemplate(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.communicationService.createChannelTemplate(req.user.tenantId, dto);
  }

  /* ── Feature 9: Ephemeral Messages ── */

  @ApiOperation({ summary: 'Send ephemeral/view-once message' })
  @Post('channels/:channelId/ephemeral')
  @Permissions('communication.message.create')
  async sendEphemeral(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @ZodBody(z.object({ content: z.string(), expiresInSecs: z.number().optional() })) dto: any) {
    return this.communicationService.sendEphemeralMessage(req.user.tenantId, channelId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Mark view-once message as viewed' })
  @Post('messages/:id/viewed')
  @Permissions('communication.message.read')
  async markViewed(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.communicationService.markMessageViewed(req.user.tenantId, id, req.user.userId);
  }

  /* ── Feature 10: Voice Messages ── */

  @ApiOperation({ summary: 'Upload voice message' })
  @Post('channels/:channelId/voice')
  @Permissions('communication.message-attachment.upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadVoice(@Req() req: AuthenticatedRequest, @Param('channelId') channelId: string, @UploadedFile() file: any) {
    return this.communicationService.uploadVoiceMessage(req.user.tenantId, channelId, req.user.userId, file);
  }
}
