import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

export type Presence = 'ACTIVE' | 'AWAY' | 'BRB' | 'DND' | 'OOO' | 'INACTIVE';

export interface AttachmentDto {
  id: string;
  name: string;
  size: number;
  mime: string;
  url?: string;
}

@Injectable()
export class CommunicationService {
  /* ─────────────────────────────────────────────────────────
     Helpers
     ───────────────────────────────────────────────────────── */

  private async resolveOrgId(tenantId: string, orgId?: string): Promise<string> {
    if (orgId && orgId !== 'org-system-default') return orgId;
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) throw new BadRequestException('No Organization found.');
    return org.id;
  }

  private meetingCode(): string {
    const seg = () => Math.random().toString(36).slice(2, 6);
    return `${seg()}-${seg()}-${seg()}`;
  }

  private groupReactions(rows: { emoji: string; userId: string }[]) {
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const list = map.get(r.emoji) ?? [];
      list.push(r.userId);
      map.set(r.emoji, list);
    }
    return [...map.entries()].map(([emoji, userIds]) => ({ emoji, userIds }));
  }

  private displayName(u: { firstName: string; lastName: string }) {
    return `${u.firstName} ${u.lastName}`.trim();
  }

  /* ─────────────────────────────────────────────────────────
     Workspace bootstrap & directory
     ───────────────────────────────────────────────────────── */

  /** Ensure a tenant has at least one Space with default channels. Idempotent, no fake content. */
  async ensureSeed(tenantId: string, orgId: string, userId: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const spaceCount = await prisma.connectSpace.count({ where: { tenantId } });
    if (spaceCount > 0) return;

    const space = await prisma.connectSpace.create({
      data: { tenantId, orgId: resolvedOrgId, name: 'General', emoji: '🏢', createdBy: userId },
    });
    for (const [name, topic] of [
      ['general', 'Company-wide announcements'],
      ['random', 'Non-work banter'],
    ] as const) {
      const existing = await prisma.channel.findFirst({ where: { tenantId, orgId: resolvedOrgId, name, kind: 'CHANNEL' } });
      if (!existing) {
        await prisma.channel.create({
          data: { tenantId, orgId: resolvedOrgId, name, kind: 'CHANNEL', spaceId: space.id, topic, type: 'PUBLIC', createdBy: userId },
        });
      }
    }
  }

  async getDirectory(tenantId: string) {
    const [users, presence] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        orderBy: { firstName: 'asc' },
      }),
      prisma.userPresence.findMany({ where: { tenantId } }),
    ]);
    const presenceByUser = new Map(presence.map((p) => [p.userId, p]));
    return users.map((u) => {
      const p = presenceByUser.get(u.id);
      return {
        id: u.id,
        name: this.displayName(u),
        email: u.email,
        avatar: u.avatar,
        presence: (p?.presence ?? 'INACTIVE') as Presence,
        statusText: p?.statusText ?? null,
        statusEmoji: p?.statusEmoji ?? null,
      };
    });
  }

  /** One-shot payload for the Connect UI. */
  async getWorkspace(tenantId: string, userId: string, orgId?: string) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    await this.ensureSeed(tenantId, resolvedOrgId, userId);

    const [spaces, directory, channels, memberships] = await Promise.all([
      prisma.connectSpace.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } }),
      this.getDirectory(tenantId),
      prisma.channel.findMany({ where: { tenantId, kind: 'CHANNEL' }, orderBy: { name: 'asc' } }),
      prisma.channelMember.findMany({ where: { tenantId, userId }, select: { channelId: true, starred: true, muted: true } }),
    ]);

    const memberPrefs = new Map(memberships.map((m) => [m.channelId, { starred: m.starred, muted: m.muted }]));

    const myChannelIds = memberships.map((m) => m.channelId);
    const conversations = myChannelIds.length
      ? await prisma.channel.findMany({
          where: { tenantId, id: { in: myChannelIds }, kind: { in: ['DM', 'GROUP'] } },
          include: { members: true },
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    const nameById = new Map(directory.map((d) => [d.id, d.name]));

    // Read-state for unread badges + last-message previews.
    const channelIds = [...channels.map((c) => c.id), ...conversations.map((c) => c.id)];
    const reads = await prisma.channelRead.findMany({ where: { tenantId, userId, channelId: { in: channelIds.length ? channelIds : ['_'] } } });
    const lastReadByChannel = new Map(reads.map((r) => [r.channelId, r.lastReadAt]));
    const activity = await this.getConversationActivity(tenantId, userId, channelIds, lastReadByChannel, nameById);

    const dmList = conversations.map((c) => {
      let name = c.name;
      if (c.kind === 'DM') {
        const otherId = c.members.map((m) => m.userId).find((id) => id !== userId);
        name = otherId ? nameById.get(otherId) ?? 'Direct message' : 'Direct message';
      }
      const prefs = memberPrefs.get(c.id);
      return { id: c.id, kind: c.kind, name, topic: c.topic, memberIds: c.members.map((m) => m.userId), starred: prefs?.starred ?? false, muted: prefs?.muted ?? false, ...activity.get(c.id) };
    });

    return {
      me: directory.find((d) => d.id === userId) ?? { id: userId, name: 'You', email: '', avatar: null, presence: 'ACTIVE', statusText: null },
      directory,
      spaces: spaces.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji })),
      channels: channels.map((c) => {
        const prefs = memberPrefs.get(c.id);
        return { id: c.id, kind: 'CHANNEL', name: c.name, spaceId: c.spaceId, topic: c.topic, starred: prefs?.starred ?? false, muted: prefs?.muted ?? false, ...activity.get(c.id) };
      }),
      conversations: dmList,
    };
  }

  /** Compute unread count + last-message preview for each conversation. */
  private async getConversationActivity(
    tenantId: string,
    userId: string,
    channelIds: string[],
    lastReadByChannel: Map<string, Date>,
    nameById: Map<string, string>
  ) {
    const result = new Map<string, { unreadCount: number; lastMessage?: { content: string; ts: number; authorName: string; system: boolean } }>();
    await Promise.all(
      channelIds.map(async (id) => {
        const lastRead = lastReadByChannel.get(id) ?? new Date(0);
        const [unreadCount, last] = await Promise.all([
          prisma.message.count({ where: { tenantId, channelId: id, deletedAt: null, userId: { not: userId }, createdAt: { gt: lastRead } } }),
          prisma.message.findFirst({ where: { tenantId, channelId: id }, orderBy: { createdAt: 'desc' }, select: { content: true, createdAt: true, userId: true, kind: true, deletedAt: true } }),
        ]);
        result.set(id, {
          unreadCount,
          lastMessage: last
            ? {
                content: last.deletedAt ? 'message deleted' : last.kind === 'SYSTEM' ? 'started a meeting' : last.content,
                ts: last.createdAt.getTime(),
                authorName: nameById.get(last.userId) ?? 'Someone',
                system: last.kind === 'SYSTEM',
              }
            : undefined,
        });
      })
    );
    return result;
  }

  /** Mark a conversation read up to now for the current user. */
  async markRead(tenantId: string, channelId: string, userId: string) {
    await prisma.channelRead.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { tenantId, channelId, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  /* ─────────────────────────────────────────────────────────
     Spaces & channels
     ───────────────────────────────────────────────────────── */

  async createSpace(tenantId: string, orgId: string, userId: string, dto: { name: string; emoji?: string }) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.connectSpace.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, emoji: dto.emoji || '#', createdBy: userId },
    });
  }

  async createChannel(
    tenantId: string,
    orgId: string,
    userId: string,
    dto: { name: string; spaceId?: string; topic?: string; description?: string }
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const name = dto.name.trim().replace(/^#/, '');
    if (!name) throw new BadRequestException('Channel name required.');
    const existing = await prisma.channel.findFirst({ where: { tenantId, orgId: resolvedOrgId, name, kind: 'CHANNEL' } });
    if (existing) throw new BadRequestException(`Channel #${name} already exists.`);
    return prisma.channel.create({
      data: {
        tenantId, orgId: resolvedOrgId, name, kind: 'CHANNEL',
        spaceId: dto.spaceId || null, topic: dto.topic || null,
        description: dto.description || null, type: 'PUBLIC', createdBy: userId,
      },
    });
  }

  /** Find-or-create a 1:1 DM channel between two users. */
  async getOrCreateDM(tenantId: string, orgId: string, userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new BadRequestException('Cannot DM yourself.');
    const other = await prisma.user.findFirst({ where: { id: otherUserId, tenantId } });
    if (!other) throw new NotFoundException('User not found.');
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const key = `dm:${[userId, otherUserId].sort().join(':')}`;

    let channel = await prisma.channel.findFirst({ where: { tenantId, name: key, kind: 'DM' }, include: { members: true } });
    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          tenantId, orgId: resolvedOrgId, name: key, kind: 'DM', type: 'PRIVATE', createdBy: userId,
          members: { create: [{ tenantId, userId }, { tenantId, userId: otherUserId }] },
        },
        include: { members: true },
      });
    }
    return { id: channel.id, kind: 'DM' as const, name: this.displayName(other), memberIds: channel.members.map((m) => m.userId) };
  }

  async createGroup(tenantId: string, orgId: string, userId: string, dto: { name: string; memberIds: string[] }) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const ids = Array.from(new Set([userId, ...(dto.memberIds || [])]));
    if (ids.length < 2) throw new BadRequestException('A group needs at least one other member.');
    const channel = await prisma.channel.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name || 'Group', kind: 'GROUP', type: 'PRIVATE', createdBy: userId,
        members: { create: ids.map((id) => ({ tenantId, userId: id })) },
      },
      include: { members: true },
    });
    return { id: channel.id, kind: 'GROUP' as const, name: channel.name, memberIds: channel.members.map((m) => m.userId) };
  }

  /* ─────────────────────────────────────────────────────────
     Messages, threads, reactions
     ───────────────────────────────────────────────────────── */

  private serializeMessage(m: {
    id: string; channelId: string; userId: string; content: string; kind: string;
    parentId: string | null; pinned: boolean; attachments: Prisma.JsonValue; meetingId: string | null;
    editedAt: Date | null; deletedAt: Date | null; createdAt: Date;
    reactions?: { emoji: string; userId: string }[];
  }) {
    return {
      id: m.id,
      conversationId: m.channelId,
      authorId: m.userId,
      content: m.deletedAt ? '' : m.content,
      kind: m.kind,
      parentId: m.parentId ?? undefined,
      pinned: m.pinned,
      attachments: m.deletedAt ? [] : (m.attachments as unknown as AttachmentDto[]),
      meetingId: m.meetingId ?? undefined,
      ts: m.createdAt.getTime(),
      editedTs: m.editedAt ? m.editedAt.getTime() : undefined,
      deleted: !!m.deletedAt,
      reactions: m.deletedAt ? [] : this.groupReactions(m.reactions ?? []),
    };
  }

  async getMessages(tenantId: string, channelId: string) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Conversation not found');
    const messages = await prisma.message.findMany({
      where: { tenantId, channelId },
      orderBy: { createdAt: 'asc' },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    return messages.map((m) => this.serializeMessage(m));
  }

  async createMessage(
    tenantId: string,
    channelId: string,
    userId: string,
    dto: { content: string; parentId?: string; attachments?: AttachmentDto[] }
  ) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Conversation not found');
    const content = (dto.content || '').trim();
    const attachments = dto.attachments ?? [];
    if (!content && attachments.length === 0) throw new BadRequestException('Message is empty.');
    if (dto.parentId) {
      const parent = await prisma.message.findFirst({ where: { id: dto.parentId, tenantId, channelId } });
      if (!parent) throw new BadRequestException('Parent message not found.');
    }
    const msg = await prisma.message.create({
      data: {
        tenantId, channelId, userId, content, kind: 'USER',
        parentId: dto.parentId || null,
        attachments: attachments as unknown as Prisma.InputJsonValue,
      },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    await prisma.channel.update({ where: { id: channelId }, data: { updatedAt: new Date() } });
    await this.notifyMentions(tenantId, channelId, userId, content);
    return this.serializeMessage(msg);
  }

  /** Parse @mentions and create CHAT notifications for mentioned users. */
  private async notifyMentions(tenantId: string, channelId: string, authorId: string, content: string) {
    const tokens = Array.from(content.matchAll(/@(\w+)/g)).map((m) => m[1]!.toLowerCase());
    if (tokens.length === 0) return;
    const [author, channel, users] = await Promise.all([
      prisma.user.findFirst({ where: { id: authorId, tenantId }, select: { firstName: true, lastName: true } }),
      prisma.channel.findFirst({ where: { id: channelId, tenantId }, select: { name: true, kind: true } }),
      prisma.user.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, firstName: true } }),
    ]);
    const authorName = author ? `${author.firstName} ${author.lastName}`.trim() : 'Someone';
    const where = channel ? (channel.kind === 'CHANNEL' ? `#${channel.name}` : channel.name) : 'a conversation';
    const targets = users.filter((u) => u.id !== authorId && tokens.includes(u.firstName.toLowerCase()));
    const snippet = content.length > 120 ? `${content.slice(0, 117)}…` : content;
    await Promise.all(
      targets.map((u) =>
        prisma.notification.create({
          data: { tenantId, userId: u.id, title: `${authorName} mentioned you in ${where}`, content: snippet, type: 'CHAT', link: '/connect', status: 'UNREAD' },
        })
      )
    );
  }

  async editMessage(tenantId: string, messageId: string, userId: string, content: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.userId !== userId) throw new BadRequestException('You can only edit your own messages.');
    if (msg.deletedAt) throw new BadRequestException('Cannot edit a deleted message.');
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim(), editedAt: new Date() },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    return this.serializeMessage(updated);
  }

  async deleteMessage(tenantId: string, messageId: string, userId: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.userId !== userId) throw new BadRequestException('You can only delete your own messages.');
    await prisma.messageReaction.deleteMany({ where: { messageId } });
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: '', attachments: [], pinned: false },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    return this.serializeMessage(updated);
  }

  async togglePin(tenantId: string, messageId: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { pinned: !msg.pinned },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    return this.serializeMessage(updated);
  }

  async toggleReaction(tenantId: string, messageId: string, userId: string, emoji: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    const existing = await prisma.messageReaction.findFirst({ where: { messageId, userId, emoji } });
    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.messageReaction.create({ data: { tenantId, messageId, userId, emoji } });
    }
    const rows = await prisma.messageReaction.findMany({ where: { messageId }, select: { emoji: true, userId: true } });
    return { messageId, reactions: this.groupReactions(rows) };
  }

  /* ─────────────────────────────────────────────────────────
     Presence
     ───────────────────────────────────────────────────────── */

  async getPresence(tenantId: string) {
    return prisma.userPresence.findMany({ where: { tenantId } });
  }

  async setPresence(tenantId: string, userId: string, dto: { presence: Presence; statusText?: string; statusEmoji?: string }) {
    return prisma.userPresence.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      create: { tenantId, userId, presence: dto.presence, statusText: dto.statusText ?? null, statusEmoji: dto.statusEmoji ?? null },
      update: { presence: dto.presence, statusText: dto.statusText ?? null, statusEmoji: dto.statusEmoji ?? null },
    });
  }

  /* ─────────────────────────────────────────────────────────
     Bookmarks
     ───────────────────────────────────────────────────────── */

  async toggleBookmark(tenantId: string, messageId: string, userId: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    const existing = await prisma.messageBookmark.findFirst({ where: { messageId, userId } });
    if (existing) {
      await prisma.messageBookmark.delete({ where: { id: existing.id } });
      return { messageId, bookmarked: false };
    }
    await prisma.messageBookmark.create({ data: { tenantId, messageId, userId } });
    return { messageId, bookmarked: true };
  }

  async getBookmarks(tenantId: string, userId: string) {
    const bookmarks = await prisma.messageBookmark.findMany({
      where: { tenantId, userId },
      include: { message: { include: { reactions: { select: { emoji: true, userId: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((b) => this.serializeMessage(b.message));
  }

  /* ─────────────────────────────────────────────────────────
     Star / Mute conversations
     ───────────────────────────────────────────────────────── */

  async toggleStar(tenantId: string, channelId: string, userId: string) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership) {
      await prisma.channelMember.create({ data: { tenantId, channelId, userId, starred: true } });
      return { channelId, starred: true };
    }
    const updated = await prisma.channelMember.update({ where: { id: membership.id }, data: { starred: !membership.starred } });
    return { channelId, starred: updated.starred };
  }

  async toggleMute(tenantId: string, channelId: string, userId: string) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership) {
      await prisma.channelMember.create({ data: { tenantId, channelId, userId, muted: true } });
      return { channelId, muted: true };
    }
    const updated = await prisma.channelMember.update({ where: { id: membership.id }, data: { muted: !membership.muted } });
    return { channelId, muted: updated.muted };
  }

  /* ─────────────────────────────────────────────────────────
     Meetings
     ───────────────────────────────────────────────────────── */

  async getMeetings(tenantId: string) {
    return prisma.connectMeeting.findMany({ where: { tenantId, active: true }, orderBy: { startedAt: 'desc' } });
  }

  async createMeeting(tenantId: string, userId: string, dto: { title?: string; conversationId?: string }) {
    const meeting = await prisma.connectMeeting.create({
      data: {
        tenantId, hostId: userId, code: this.meetingCode(),
        title: dto.title || 'Connect meeting', channelId: dto.conversationId || null, active: true,
      },
    });
    // Post a joinable system message into the conversation.
    if (dto.conversationId) {
      const channel = await prisma.channel.findFirst({ where: { id: dto.conversationId, tenantId } });
      if (channel) {
        await prisma.message.create({
          data: {
            tenantId, channelId: dto.conversationId, userId, kind: 'SYSTEM', meetingId: meeting.id,
            content: `started a video meeting · connect.meet/${meeting.code}`,
          },
        });
      }
    }
    return meeting;
  }

  async endMeeting(tenantId: string, id: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return prisma.connectMeeting.update({ where: { id }, data: { active: false, endedAt: new Date() } });
  }

  /* ─────────────────────────────────────────────────────────
     Calendar
     ───────────────────────────────────────────────────────── */

  async getEvents(tenantId: string) {
    return prisma.calendarEvent.findMany({ where: { tenantId }, orderBy: [{ date: 'asc' }, { time: 'asc' }] });
  }

  async createEvent(
    tenantId: string,
    userId: string,
    dto: {
      title: string; date: string; time: string; durationMins?: number; withMeet?: boolean; attendeeIds?: string[];
      description?: string; location?: string; color?: string; allDay?: boolean; recurrence?: string;
    }
  ) {
    if (!dto.title?.trim() || !dto.date) throw new BadRequestException('Title and date are required.');
    return prisma.calendarEvent.create({
      data: {
        tenantId, createdBy: userId, title: dto.title.trim(), date: dto.date, time: dto.time || '00:00',
        durationMins: dto.durationMins ?? 30,
        meetingCode: dto.withMeet ? this.meetingCode() : null,
        attendees: (dto.attendeeIds ?? [userId]) as unknown as Prisma.InputJsonValue,
        description: dto.description ?? null,
        location: dto.location ?? null,
        color: dto.color ?? null,
        allDay: dto.allDay ?? false,
        recurrence: dto.recurrence ?? 'none',
      },
    });
  }

  async deleteEvent(tenantId: string, id: string) {
    const ev = await prisma.calendarEvent.findFirst({ where: { id, tenantId } });
    if (!ev) throw new NotFoundException('Event not found');
    await prisma.calendarEvent.delete({ where: { id } });
    return { ok: true };
  }

  /* ─────────────────────────────────────────────────────────
     Legacy: notifications & email templates (unchanged)
     ───────────────────────────────────────────────────────── */

  async getNotifications(tenantId: string, userId: string) {
    return prisma.notification.findMany({ where: { tenantId, userId }, orderBy: { createdAt: 'desc' } });
  }

  async createNotification(
    tenantId: string,
    userId: string,
    dto: { title: string; content: string; type?: string; link?: string }
  ) {
    return prisma.notification.create({
      data: {
        tenantId, userId, title: dto.title, content: dto.content,
        type: dto.type || 'SYSTEM', link: dto.link || null, status: 'UNREAD',
      },
    });
  }

  async updateNotificationStatus(tenantId: string, notificationId: string, userId: string, status: 'READ' | 'ARCHIVED') {
    const notification = await prisma.notification.findFirst({ where: { id: notificationId, tenantId, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    return prisma.notification.update({ where: { id: notificationId }, data: { status } });
  }

  async getEmailTemplates(tenantId: string) {
    return prisma.emailTemplate.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createEmailTemplate(
    tenantId: string,
    dto: { name: string; subject: string; bodyHtml: string; bodyText?: string },
    _createdBy: string
  ) {
    const existing = await prisma.emailTemplate.findFirst({ where: { tenantId, name: dto.name } });
    if (existing) throw new BadRequestException(`Email template with name ${dto.name} already exists.`);
    return prisma.emailTemplate.create({
      data: {
        tenantId, name: dto.name, subject: dto.subject,
        body: dto.bodyHtml || dto.bodyText || '', variables: [] as Prisma.InputJsonValue,
      },
    });
  }
}
