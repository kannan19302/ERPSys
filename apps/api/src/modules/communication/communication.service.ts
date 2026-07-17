import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { DocumentStorageClient } from '../../common/integrations/document-storage-client';
import { RealtimeClient } from '../../common/integrations/realtime-client';

export type Presence = 'ACTIVE' | 'AWAY' | 'BRB' | 'DND' | 'OOO' | 'INACTIVE' | 'IN_MEETING' | 'FOCUSING';
export type ChannelMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AttachmentDto {
  id: string;
  name: string;
  size: number;
  mime: string;
  url?: string;
}

/** Max attachment size for Connect uploads: 25MB. Drive itself enforces no size/type limits
 *  today (verified by reading documents.service.ts/drive.controller.ts — bare FileInterceptor
 *  with no `limits`/`fileFilter`), so this cap is enforced here rather than "reused" from Drive. */
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

@Injectable()
export class CommunicationService {
  constructor(
    private readonly documentsService: DocumentStorageClient,
    private readonly notificationsGateway: RealtimeClient
  ) {}

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
    const [users, presence, employees, departments] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        orderBy: { firstName: 'asc' },
      }),
      prisma.userPresence.findMany({ where: { tenantId } }),
      prisma.employee.findMany({
        where: { tenantId, deletedAt: null, userId: { not: null } },
        select: { userId: true, designation: true, departmentId: true }
      }),
      prisma.department.findMany({
        where: { tenantId },
        select: { id: true, name: true }
      })
    ]);

    const deptMap = new Map(departments.map(d => [d.id, d.name]));
    const employeeMap = new Map(employees.map(e => [e.userId!, { designation: e.designation, department: e.departmentId ? deptMap.get(e.departmentId) : null }]));
    const presenceByUser = new Map(presence.map((p) => [p.userId, p]));

    return users.map((u) => {
      const p = presenceByUser.get(u.id);
      const emp = employeeMap.get(u.id);
      return {
        id: u.id,
        name: this.displayName(u),
        email: u.email,
        avatar: u.avatar,
        presence: (p?.presence ?? 'INACTIVE') as Presence,
        statusText: p?.statusText ?? null,
        statusEmoji: p?.statusEmoji ?? null,
        designation: emp?.designation ?? null,
        department: emp?.department ?? null,
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
      prisma.channel.findMany({ where: { tenantId, kind: 'CHANNEL', archived: false }, orderBy: { name: 'asc' } }),
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
        // Seed the creator as OWNER so self-service rename/archive/member-management (US-B1/B2)
        // is immediately reachable — same pattern as getOrCreateDM/createGroup's member seeding.
        members: { create: [{ tenantId, userId, role: 'OWNER' }] },
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
     Channel management & roles (US-B1/B2/B3)
     ───────────────────────────────────────────────────────── */

  /** Fetch the requesting user's membership row for a tenant-scoped channel, or null. */
  private async getMembership(tenantId: string, channelId: string, userId: string) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Channel not found');
    const membership = await prisma.channelMember.findFirst({ where: { tenantId, channelId, userId } });
    return { channel, membership };
  }

  private assertRole(membership: { role: string } | null, allowed: ChannelMemberRole[]) {
    if (!membership || !allowed.includes(membership.role as ChannelMemberRole)) {
      throw new ForbiddenException('You do not have permission to manage this channel.');
    }
  }

  /** Rename and/or archive a channel. Rename: OWNER/ADMIN. Archive: OWNER only. */
  async updateChannel(
    tenantId: string,
    channelId: string,
    userId: string,
    dto: { name?: string; archived?: boolean; topic?: string; description?: string }
  ) {
    const { channel, membership } = await this.getMembership(tenantId, channelId, userId);
    if (channel.kind !== 'CHANNEL') throw new BadRequestException('Only channels can be renamed/archived.');

    if (dto.archived !== undefined) {
      this.assertRole(membership, ['OWNER']);
    } else {
      this.assertRole(membership, ['OWNER', 'ADMIN']);
    }

    const data: Prisma.ChannelUpdateInput = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim().replace(/^#/, '');
      if (!name) throw new BadRequestException('Channel name required.');
      const existing = await prisma.channel.findFirst({ where: { tenantId, orgId: channel.orgId, name, kind: 'CHANNEL', id: { not: channelId } } });
      if (existing) throw new BadRequestException(`Channel #${name} already exists.`);
      data.name = name;
    }
    if (dto.topic !== undefined) data.topic = dto.topic;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.archived !== undefined) data.archived = dto.archived;

    return prisma.channel.update({ where: { id: channelId }, data });
  }

  /** Add a member to a channel. Gated to OWNER/ADMIN. Posts a SYSTEM join announcement. */
  async addChannelMember(tenantId: string, channelId: string, userId: string, targetUserId: string) {
    const { membership } = await this.getMembership(tenantId, channelId, userId);
    this.assertRole(membership, ['OWNER', 'ADMIN']);

    const target = await prisma.user.findFirst({ where: { id: targetUserId, tenantId } });
    if (!target) throw new NotFoundException('User not found.');

    const existing = await prisma.channelMember.findFirst({ where: { channelId, userId: targetUserId } });
    if (existing) throw new BadRequestException('User is already a member of this channel.');

    const created = await prisma.channelMember.create({ data: { tenantId, channelId, userId: targetUserId, role: 'MEMBER' } });
    await prisma.message.create({
      data: { tenantId, channelId, userId, kind: 'SYSTEM', content: `${this.displayName(target)} joined the channel` },
    });
    await prisma.channel.update({ where: { id: channelId }, data: { updatedAt: new Date() } });
    return created;
  }

  /** Remove a member from a channel. Gated to OWNER/ADMIN. Posts a SYSTEM departure announcement.
   *  History is retained for remaining members — no destructive delete of past messages. */
  async removeChannelMember(tenantId: string, channelId: string, userId: string, targetUserId: string) {
    const { membership } = await this.getMembership(tenantId, channelId, userId);
    this.assertRole(membership, ['OWNER', 'ADMIN']);

    const target = await prisma.user.findFirst({ where: { id: targetUserId, tenantId } });
    const targetMembership = await prisma.channelMember.findFirst({ where: { channelId, userId: targetUserId } });
    if (!targetMembership) throw new NotFoundException('User is not a member of this channel.');
    if (targetMembership.role === 'OWNER' && targetUserId !== userId) {
      throw new ForbiddenException('Cannot remove the channel owner.');
    }

    await prisma.channelMember.delete({ where: { id: targetMembership.id } });
    await prisma.message.create({
      data: { tenantId, channelId, userId, kind: 'SYSTEM', content: `${target ? this.displayName(target) : 'A member'} left the channel` },
    });
    return { ok: true };
  }

  /** List members of a channel with their role, for the Manage Channel drawer. Requires the
   *  requester to be a member themselves — same visibility rule as every other channel read
   *  path in this file (getMembership throws NotFoundException if the channel isn't tenant-scoped
   *  to the caller; membership is checked explicitly here since read paths don't call assertRole). */
  async getChannelMembers(tenantId: string, channelId: string, userId: string) {
    const { membership } = await this.getMembership(tenantId, channelId, userId);
    if (!membership) throw new ForbiddenException('You are not a member of this channel.');

    const members = await prisma.channelMember.findMany({
      where: { tenantId, channelId },
      select: { userId: true, role: true },
    });
    return members.map((m) => ({ userId: m.userId, role: m.role as ChannelMemberRole }));
  }

  /** Browse PUBLIC channels the requesting user is not yet a member of (discovery). */
  async browseChannels(tenantId: string, userId: string) {
    const myMemberships = await prisma.channelMember.findMany({ where: { tenantId, userId }, select: { channelId: true } });
    const myChannelIds = myMemberships.map((m) => m.channelId);
    const channels = await prisma.channel.findMany({
      where: { tenantId, kind: 'CHANNEL', type: 'PUBLIC', archived: false, id: { notIn: myChannelIds.length ? myChannelIds : ['_'] } },
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
    return channels.map((c) => ({
      id: c.id,
      name: c.name,
      topic: c.topic,
      description: c.description,
      memberCount: c._count.members,
    }));
  }

  /** Join a PUBLIC channel directly, no invite required. */
  async joinChannel(tenantId: string, channelId: string, userId: string) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.kind !== 'CHANNEL' || channel.type !== 'PUBLIC') {
      throw new ForbiddenException('Only public channels can be joined directly.');
    }
    const existing = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (existing) return existing;

    const member = await prisma.channelMember.create({ data: { tenantId, channelId, userId, role: 'MEMBER' } });
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    await prisma.message.create({
      data: { tenantId, channelId, userId, kind: 'SYSTEM', content: `${user ? this.displayName(user) : 'A member'} joined the channel` },
    });
    return member;
  }

  /* ─────────────────────────────────────────────────────────
     Message search (US-A6)
     ───────────────────────────────────────────────────────── */

  /**
   * Search message content, tenant + membership-scoped: only channels/DMs the requesting
   * user belongs to. Uses ILIKE (accelerated by the pg_trgm GIN index idx_messages_content_trgm
   * on messages.content) rather than similarity()/% to keep substring matching predictable for
   * short queries. Soft-deleted messages are excluded.
   */
  async searchMessages(tenantId: string, userId: string, query: string, limit = 50) {
    const q = query.trim();
    if (!q) return [];

    const memberships = await prisma.channelMember.findMany({ where: { tenantId, userId }, select: { channelId: true } });
    const channelIds = memberships.map((m) => m.channelId);
    if (channelIds.length === 0) return [];

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        channelId: string;
        userId: string;
        content: string;
        createdAt: Date;
        channelName: string;
        channelKind: string;
        authorFirstName: string;
        authorLastName: string;
      }>
    >`
      SELECT
        m.id,
        m.channel_id AS "channelId",
        m.user_id AS "userId",
        m.content,
        m.created_at AS "createdAt",
        c.name AS "channelName",
        c.kind AS "channelKind",
        u.first_name AS "authorFirstName",
        u.last_name AS "authorLastName"
      FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN users u ON u.id = m.user_id
      WHERE m.tenant_id = ${tenantId}
        AND m.deleted_at IS NULL
        AND m.channel_id IN (${Prisma.join(channelIds)})
        AND m.content ILIKE ${`%${q}%`}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => {
      const authorName = `${r.authorFirstName} ${r.authorLastName}`.trim();
      const idx = r.content.toLowerCase().indexOf(q.toLowerCase());
      const start = Math.max(0, idx - 40);
      const snippet = idx >= 0 ? `${start > 0 ? '…' : ''}${r.content.slice(start, idx + q.length + 40)}${idx + q.length + 40 < r.content.length ? '…' : ''}` : r.content.slice(0, 80);
      return {
        messageId: r.id,
        channelId: r.channelId,
        channelName: r.channelKind === 'CHANNEL' ? `#${r.channelName}` : r.channelName,
        authorId: r.userId,
        authorName,
        snippet,
        ts: r.createdAt.getTime(),
      };
    });
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

  /**
   * US-A1/US-A2: Upload a real file attachment for a Connect message, replacing the client's
   * previous `URL.createObjectURL(f)` blob-URL fake. Stores the file durably via Drive's
   * DocumentsService (same S3/MinIO-backed storage `drive.controller.ts` uses for
   * `POST /drive/documents`), scoped under this tenant, and returns a durable documentId +
   * download URL to be embedded in the message's `attachments` JSON — never a blob URL.
   *
   * Validation: tenant membership on the channel + a size cap (Drive's own createDocument has
   * no size/type limits today — verified by reading documents.service.ts, no `limits`/`fileFilter`
   * on its FileInterceptor — so this cap is enforced here, not "reused", since there is nothing
   * to reuse for size on the Drive side).
   */
  async uploadAttachment(tenantId: string, channelId: string, userId: string, file: Express.Multer.File) {
    const channel = await prisma.channel.findFirst({ where: { id: channelId, tenantId } });
    if (!channel) throw new NotFoundException('Conversation not found');

    if (!file) throw new BadRequestException('No file provided.');
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB attachment limit.`);
    }

    const orgId = await this.resolveOrgId(tenantId);
    const document = await this.documentsService.createDocument(
      tenantId,
      orgId,
      { name: file.originalname, folderId: undefined },
      userId,
      file
    );
    const versionId = document?.versions?.[0]?.id;

    const attachment: AttachmentDto = {
      id: document!.id,
      name: file.originalname,
      size: file.size,
      mime: file.mimetype,
      url: versionId ? `/drive/documents/versions/${versionId}/download` : undefined,
    };
    return { documentId: document!.id, attachment };
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
    const serialized = this.serializeMessage(msg);
    // US-A3: broadcast the persisted message (real id/createdAt) over the shared /ws gateway so
    // other open clients in this channel's room see it within ~1s instead of the next 5s poll.
    // Clients without a live socket keep working via the existing polling GET endpoints.
    this.notificationsGateway.broadcastChatMessage(channelId, { ...serialized, tenantId });
    return serialized;
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

  async setPresence(tenantId: string, userId: string, dto: { presence: Presence; statusText?: string; statusEmoji?: string; clearAt?: string }) {
    const updated = await prisma.userPresence.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      create: { tenantId, userId, presence: dto.presence, statusText: dto.statusText ?? null, statusEmoji: dto.statusEmoji ?? null, clearAt: dto.clearAt ? new Date(dto.clearAt) : null },
      update: { presence: dto.presence, statusText: dto.statusText ?? null, statusEmoji: dto.statusEmoji ?? null, clearAt: dto.clearAt ? new Date(dto.clearAt) : null },
    });
    this.notificationsGateway.broadcastPresenceUpdate(tenantId, {
      userId, presence: updated.presence, statusText: updated.statusText, statusEmoji: updated.statusEmoji, timestamp: new Date().toISOString(),
    });
    return updated;
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

  /** US-B5: set the caller's own per-channel notification preference (ALL/MENTIONS/NONE).
   *  Personal preference on a channel the caller is already a member of — same pattern as
   *  toggleStar/toggleMute, not a channel-management operation, so no OWNER/ADMIN role gating. */
  async setNotifyLevel(tenantId: string, channelId: string, userId: string, notifyLevel: 'ALL' | 'MENTIONS' | 'NONE') {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId } });
    if (!membership) {
      await prisma.channelMember.create({ data: { tenantId, channelId, userId, notifyLevel } });
      return { channelId, notifyLevel };
    }
    const updated = await prisma.channelMember.update({ where: { id: membership.id }, data: { notifyLevel } });
    return { channelId, notifyLevel: updated.notifyLevel };
  }

  /* ─────────────────────────────────────────────────────────
     Meetings
     ───────────────────────────────────────────────────────── */

  async getMeetings(tenantId: string) {
    return prisma.connectMeeting.findMany({ where: { tenantId, active: true }, orderBy: { startedAt: 'desc' } });
  }

  async createMeeting(tenantId: string, userId: string, dto: { title?: string; conversationId?: string; lobby?: boolean }) {
    const meeting = await prisma.connectMeeting.create({
      data: {
        tenantId, hostId: userId, code: this.meetingCode(),
        title: dto.title || 'Connect meeting', channelId: dto.conversationId || null, active: true, lobby: dto.lobby ?? false,
      },
    });
    await prisma.meetingParticipant.create({ data: { tenantId, meetingId: meeting.id, userId, isMuted: false, isVideoOn: false } });
    if (dto.conversationId) {
      const channel = await prisma.channel.findFirst({ where: { id: dto.conversationId, tenantId } });
      if (channel) {
        await prisma.message.create({
          data: { tenantId, channelId: dto.conversationId, userId, kind: 'SYSTEM', meetingId: meeting.id, content: `started a video meeting \u00b7 connect.meet/${meeting.code}` },
        });
      }
    }
    return meeting;
  }

  async endMeeting(tenantId: string, id: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    await prisma.meetingParticipant.updateMany({ where: { meetingId: id, leftAt: null }, data: { leftAt: new Date() } });
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

  /* ── Read receipts & link previews (US-B4 / US-C2) ── */

  private previewCache = new Map<string, any>();

  async getMessageReadReceipts(tenantId: string, messageId: string, userId: string) {
    const message = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!message) throw new NotFoundException('Message not found');

    const membership = await prisma.channelMember.findFirst({ where: { channelId: message.channelId, userId } });
    if (!membership) throw new ForbiddenException('You are not a member of this channel');

    const channel = await prisma.channel.findFirst({
      where: { id: message.channelId },
      include: { _count: { select: { members: true } } }
    });
    if (!channel) throw new NotFoundException('Channel not found');

    // Bounded check: read receipts only for DMs/GROUPs or small channels (<= 8 members)
    if (channel.kind !== 'DM' && channel.kind !== 'GROUP' && channel._count.members > 8) {
      return [];
    }

    const members = await prisma.channelMember.findMany({
      where: { channelId: message.channelId, userId: { not: message.userId } }
    });

    const memberUserIds = members.map(m => m.userId);
    if (memberUserIds.length === 0) return [];

    const [users, reads] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: memberUserIds }, tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, avatar: true }
      }),
      prisma.channelRead.findMany({
        where: { channelId: message.channelId, userId: { in: memberUserIds } }
      })
    ]);

    const readMap = new Map(reads.map(r => [r.userId, r.lastReadAt]));
    const userMap = new Map(users.map(u => [u.id, u]));

    const seenBy: Array<{ userId: string; name: string; avatar: string | null; seenAt: Date }> = [];
    for (const memberId of memberUserIds) {
      const readAt = readMap.get(memberId);
      const user = userMap.get(memberId);
      if (readAt && user && readAt.getTime() >= message.createdAt.getTime() - 1000) {
        seenBy.push({
          userId: memberId,
          name: `${user.firstName} ${user.lastName}`.trim(),
          avatar: user.avatar,
          seenAt: readAt
        });
      }
    }

    return seenBy;
  }

  async getLinkPreview(urlStr: string) {
    if (!urlStr) throw new BadRequestException('URL parameter is required.');
    let cleanUrl = urlStr.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `http://${cleanUrl}`;
    }

    if (this.previewCache.has(cleanUrl)) {
      return this.previewCache.get(cleanUrl);
    }

    try {
      const response = await fetch(cleanUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(4000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();

      const result = {
        url: cleanUrl,
        title: this.extractMeta(html, /<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i) ||
               this.extractMeta(html, /<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"/i) ||
               this.extractMeta(html, /<title>([^<]*)<\/title>/i) || undefined,
        description: this.extractMeta(html, /<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i) ||
                     this.extractMeta(html, /<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/i) ||
                     this.extractMeta(html, /<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || undefined,
        image: this.extractMeta(html, /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i) ||
               this.extractMeta(html, /<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"/i) || undefined,
        siteName: this.extractMeta(html, /<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"/i) || undefined
      };

      this.previewCache.set(cleanUrl, result);
      return result;
    } catch (err) {
      return { url: cleanUrl };
    }
  }

  private extractMeta(html: string, regex: RegExp): string | null {
    const match = html.match(regex);
    if (match && match[1]) {
      return match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────
     Threads (US-A4: dedicated thread view)
     ───────────────────────────────────────────────────────── */

  async getThreadMessages(tenantId: string, parentId: string) {
    const parent = await prisma.message.findFirst({ where: { id: parentId, tenantId } });
    if (!parent) throw new NotFoundException('Thread parent not found');
    const [parentMsg, replies] = await Promise.all([
      prisma.message.findFirst({
        where: { id: parentId },
        include: { reactions: { select: { emoji: true, userId: true } } },
      }),
      prisma.message.findMany({
        where: { tenantId, parentId, deletedAt: null },
        include: { reactions: { select: { emoji: true, userId: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return {
      parent: parentMsg ? this.serializeMessage(parentMsg) : null,
      replies: replies.map((m) => this.serializeMessage(m)),
    };
  }

  /* ─────────────────────────────────────────────────────────
     Forward message to another channel
     ───────────────────────────────────────────────────────── */

  async forwardMessage(tenantId: string, messageId: string, userId: string, dto: { toChannelId: string; comment?: string }) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    const targetChannel = await prisma.channel.findFirst({ where: { id: dto.toChannelId, tenantId } });
    if (!targetChannel) throw new NotFoundException('Target channel not found');
    const membership = await prisma.channelMember.findFirst({ where: { channelId: dto.toChannelId, userId } });
    if (!membership) throw new ForbiddenException('You are not a member of the target channel');

    const forwardNote = dto.comment ? `${dto.comment}\n\n---\nForwarded from ${msg.channelId}:\n` : `Forwarded from ${msg.channelId}:\n`;
    const newMsg = await prisma.message.create({
      data: {
        tenantId, channelId: dto.toChannelId, userId, content: `${forwardNote}${msg.content}`,
        kind: 'USER', attachments: msg.attachments as Prisma.InputJsonValue,
      },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    await prisma.channel.update({ where: { id: dto.toChannelId }, data: { updatedAt: new Date() } });
    await prisma.messageForward.create({
      data: { tenantId, messageId, fromChannelId: msg.channelId, toChannelId: dto.toChannelId, forwardedBy: userId, comment: dto.comment || null },
    });
    return this.serializeMessage(newMsg);
  }

  /* ─────────────────────────────────────────────────────────
     Presence scheduling (Teams-like status scheduling)
     ───────────────────────────────────────────────────────── */

  async getStatusSchedules(tenantId: string, userId: string) {
    return prisma.userStatusSchedule.findMany({ where: { tenantId, userId, isActive: true }, orderBy: { startTime: 'asc' } });
  }

  async createStatusSchedule(tenantId: string, userId: string, dto: {
    presence: string; statusText?: string; statusEmoji?: string;
    startTime: string; endTime: string; isRecurring?: boolean; recurrenceRule?: string;
  }) {
    return prisma.userStatusSchedule.create({
      data: {
        tenantId, userId, presence: dto.presence, statusText: dto.statusText || null,
        statusEmoji: dto.statusEmoji || null, startTime: new Date(dto.startTime), endTime: new Date(dto.endTime),
        isRecurring: dto.isRecurring ?? false, recurrenceRule: dto.recurrenceRule || null,
      },
    });
  }

  async deleteStatusSchedule(tenantId: string, scheduleId: string, userId: string) {
    const sched = await prisma.userStatusSchedule.findFirst({ where: { id: scheduleId, tenantId, userId } });
    if (!sched) throw new NotFoundException('Schedule not found');
    await prisma.userStatusSchedule.delete({ where: { id: scheduleId } });
    return { ok: true };
  }

  /* ─────────────────────────────────────────────────────────
     Search with filters (channel, author, date range)
     ───────────────────────────────────────────────────────── */

  async searchMessagesFiltered(tenantId: string, userId: string, query: string, filters: {
    channelId?: string; authorId?: string; dateFrom?: string; dateTo?: string; limit?: number;
  }) {
    const q = query.trim();
    if (!q) return [];
    const memberships = await prisma.channelMember.findMany({ where: { tenantId, userId }, select: { channelId: true } });
    let channelIds = memberships.map((m) => m.channelId);
    if (filters.channelId && channelIds.includes(filters.channelId)) {
      channelIds = [filters.channelId];
    }
    if (channelIds.length === 0) return [];
    const conditions = [
      `m.tenant_id = '${tenantId.replace(/'/g, "''")}'`,
      `m.deleted_at IS NULL`,
      `m.channel_id IN (${channelIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')})`,
      `m.content ILIKE '%${q.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_')}%'`,
    ];
    if (filters.authorId) conditions.push(`m.user_id = '${filters.authorId.replace(/'/g, "''")}'`);
    if (filters.dateFrom) conditions.push(`m.created_at >= '${filters.dateFrom}'`);
    if (filters.dateTo) conditions.push(`m.created_at <= '${filters.dateTo}'`);
    const limit = Math.min(filters.limit ?? 50, 100);
    const sql = `
      SELECT m.id, m.channel_id AS "channelId", m.user_id AS "userId", m.content, m.created_at AS "createdAt",
             c.name AS "channelName", c.kind AS "channelKind", u.first_name AS "authorFirstName", u.last_name AS "authorLastName"
      FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN users u ON u.id = m.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;
    const rows = await prisma.$queryRawUnsafe<any[]>(sql);
    return rows.map((r: any) => {
      const authorName = `${r.authorFirstName} ${r.authorLastName}`.trim();
      const idx = r.content.toLowerCase().indexOf(q.toLowerCase());
      const start = Math.max(0, idx - 40);
      const snippet = idx >= 0 ? `${start > 0 ? '\u2026' : ''}${r.content.slice(start, idx + q.length + 40)}${idx + q.length + 40 < r.content.length ? '\u2026' : ''}` : r.content.slice(0, 80);
      return { messageId: r.id, channelId: r.channelId, channelName: r.channelKind === 'CHANNEL' ? `#${r.channelName}` : r.channelName, authorId: r.userId, authorName, snippet, ts: r.createdAt.getTime() };
    });
  }

  /* ─────────────────────────────────────────────────────────
     Create task from message (integration with Projects)
     ───────────────────────────────────────────────────────── */

  async createTaskFromMessage(tenantId: string, messageId: string, userId: string, dto: { projectId?: string; dueDate?: string }) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    const projectId = dto.projectId || (await prisma.project.findFirst({ where: { tenantId } }))?.id;
    if (!projectId) throw new BadRequestException('No project available. Create a project first.');
    const task = await prisma.task.create({
      data: {
        tenantId, projectId, name: `From Connect: ${msg.content.slice(0, 80)}${msg.content.length > 80 ? '\u2026' : ''}`,
        description: `Created from a Connect message.\n\n---\n${msg.content}\n\n[View in Connect]`,
        assignedToId: userId, status: 'TODO',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
    return task;
  }

  /* ─────────────────────────────────────────────────────────
     Unread summary across all conversations
     ───────────────────────────────────────────────────────── */

  async getUnreadSummary(tenantId: string, userId: string) {
    const memberships = await prisma.channelMember.findMany({ where: { tenantId, userId }, select: { channelId: true, muted: true } });
    const channelIds = memberships.map((m) => m.channelId);
    if (channelIds.length === 0) return { totalUnread: 0, channels: [] };
    const reads = await prisma.channelRead.findMany({ where: { tenantId, userId, channelId: { in: channelIds } } });
    const lastReadByChannel = new Map(reads.map((r) => [r.channelId, r.lastReadAt]));
    const results = await Promise.all(
      channelIds.map(async (id) => {
        const lastRead = lastReadByChannel.get(id) ?? new Date(0);
        const count = await prisma.message.count({ where: { tenantId, channelId: id, deletedAt: null, userId: { not: userId }, createdAt: { gt: lastRead } } });
        return { channelId: id, unreadCount: count };
      })
    );
    const totalUnread = results.reduce((sum, r) => sum + r.unreadCount, 0);
    return { totalUnread, channels: results };
  }

  /* ─────────────────────────────────────────────────────────
     Meeting enhancements: participants, chat, lobby, recording, hand raise
     ───────────────────────────────────────────────────────── */

  async joinMeeting(tenantId: string, meetingId: string, userId: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (!meeting.active) throw new BadRequestException('Meeting has ended');
    return prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId, userId } },
      create: { tenantId, meetingId, userId, isMuted: true, isVideoOn: false },
      update: { leftAt: null, isHandRaised: false },
    });
  }

  async leaveMeeting(_tenantId: string, meetingId: string, userId: string) {
    const participant = await prisma.meetingParticipant.findFirst({ where: { meetingId, userId } });
    if (!participant) throw new NotFoundException('Not in meeting');
    return prisma.meetingParticipant.update({ where: { id: participant.id }, data: { leftAt: new Date(), isHandRaised: false, isScreenSharing: false } });
  }

  async toggleHandRaise(_tenantId: string, meetingId: string, userId: string) {
    const participant = await prisma.meetingParticipant.findFirst({ where: { meetingId, userId } });
    if (!participant) throw new NotFoundException('Not in meeting');
    return prisma.meetingParticipant.update({ where: { id: participant.id }, data: { isHandRaised: !participant.isHandRaised } });
  }

  async toggleMuteSelf(_tenantId: string, meetingId: string, userId: string) {
    const participant = await prisma.meetingParticipant.findFirst({ where: { meetingId, userId } });
    if (!participant) throw new NotFoundException('Not in meeting');
    return prisma.meetingParticipant.update({ where: { id: participant.id }, data: { isMuted: !participant.isMuted } });
  }

  async toggleVideoSelf(_tenantId: string, meetingId: string, userId: string) {
    const participant = await prisma.meetingParticipant.findFirst({ where: { meetingId, userId } });
    if (!participant) throw new NotFoundException('Not in meeting');
    return prisma.meetingParticipant.update({ where: { id: participant.id }, data: { isVideoOn: !participant.isVideoOn } });
  }

  async toggleScreenShare(tenantId: string, meetingId: string, userId: string) {
    const participant = await prisma.meetingParticipant.findFirst({ where: { meetingId, userId } });
    if (!participant) throw new NotFoundException('Not in meeting');
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    const newSharing = !participant.isScreenSharing;
    if (newSharing) {
      await prisma.meetingParticipant.updateMany({ where: { meetingId, isScreenSharing: true }, data: { isScreenSharing: false } });
    }
    return prisma.meetingParticipant.update({ where: { id: participant.id }, data: { isScreenSharing: newSharing } });
  }

  async getMeetingParticipants(tenantId: string, meetingId: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    const participants = await prisma.meetingParticipant.findMany({ where: { meetingId, leftAt: null } });
    const userIds = participants.map((p) => p.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, avatar: true } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return participants.map((p) => ({
      id: p.id, userId: p.userId, name: userMap.get(p.userId) ? `${userMap.get(p.userId)!.firstName} ${userMap.get(p.userId)!.lastName}`.trim() : 'Unknown',
      avatar: userMap.get(p.userId)?.avatar ?? null, joinedAt: p.joinedAt, isHandRaised: p.isHandRaised, isScreenSharing: p.isScreenSharing, isMuted: p.isMuted, isVideoOn: p.isVideoOn,
    }));
  }

  async getMeetingChat(tenantId: string, meetingId: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    const messages = await prisma.meetingChatMessage.findMany({
      where: { tenantId, meetingId }, orderBy: { createdAt: 'asc' },
    });
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return messages.map((m) => ({
      id: m.id, userId: m.userId, content: m.content, createdAt: m.createdAt,
      authorName: userMap.get(m.userId) ? `${userMap.get(m.userId)!.firstName} ${userMap.get(m.userId)!.lastName}`.trim() : 'Unknown',
    }));
  }

  async sendMeetingChat(tenantId: string, meetingId: string, userId: string, content: string) {
    if (!content.trim()) throw new BadRequestException('Message is required');
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return prisma.meetingChatMessage.create({ data: { tenantId, meetingId, userId, content: content.trim() } });
  }

  async admitToMeeting(tenantId: string, meetingId: string, userId: string, targetUserId: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId, hostId: userId } });
    if (!meeting) throw new ForbiddenException('Only the host can admit participants');
    return prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId, userId: targetUserId } },
      create: { tenantId, meetingId, userId: targetUserId, isMuted: true, isVideoOn: false },
      update: { leftAt: null },
    });
  }

  async startRecording(tenantId: string, meetingId: string, userId: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId, hostId: userId } });
    if (!meeting) throw new ForbiddenException('Only the host can start recording');
    return prisma.meetingRecording.create({ data: { tenantId, meetingId, startedBy: userId, status: 'RECORDING' } });
  }

  async stopRecording(tenantId: string, meetingId: string, _userId: string, recordingId: string) {
    const recording = await prisma.meetingRecording.findFirst({ where: { id: recordingId, tenantId, meetingId } });
    if (!recording) throw new NotFoundException('Recording not found');
    return prisma.meetingRecording.update({
      where: { id: recordingId },
      data: { status: 'COMPLETED', endedAt: new Date(), durationSecs: Math.round((Date.now() - recording.startedAt.getTime()) / 1000) },
    });
  }

  /* ── Feature 1: Message Polls ── */

  async createPoll(tenantId: string, userId: string, dto: { channelId: string; question: string; options: { label: string; emoji?: string }[] }) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId: dto.channelId, userId, tenantId } });
    if (!membership) throw new ForbiddenException('Not a channel member');

    const poll = await prisma.connectPoll.create({
      data: {
        tenantId, channelId: dto.channelId, userId,
        question: dto.question,
        options: { create: dto.options.map((o) => ({ label: o.label, emoji: o.emoji || '' })) },
      },
      include: { options: true, votes: true },
    });

    this.notificationsGateway.broadcastChatMessage(dto.channelId, { type: 'poll', poll, tenantId });
    return poll;
  }

  async getPolls(tenantId: string, channelId: string) {
    return prisma.connectPoll.findMany({
      where: { tenantId, channelId },
      include: { options: { include: { votes: { select: { id: true, userId: true, optionId: true } } } }, votes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async votePoll(tenantId: string, pollId: string, userId: string, optionId: string) {
    const poll = await prisma.connectPoll.findFirst({ where: { id: pollId, tenantId } });
    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.isClosed) throw new BadRequestException('Poll is closed');

    const option = await prisma.connectPollOption.findFirst({ where: { id: optionId, pollId } });
    if (!option) throw new NotFoundException('Option not found');

    return prisma.connectPollVote.upsert({
      where: { pollId_userId: { pollId, userId } },
      create: { tenantId, pollId, optionId, userId },
      update: { optionId },
    });
  }

  async closePoll(tenantId: string, pollId: string, userId: string) {
    const poll = await prisma.connectPoll.findFirst({ where: { id: pollId, tenantId } });
    if (!poll) throw new NotFoundException('Poll not found');
    if (poll.userId !== userId) throw new ForbiddenException('Only the poll creator can close it');
    await prisma.connectPoll.update({ where: { id: pollId }, data: { isClosed: true } });
    this.notificationsGateway.broadcastChatMessage(poll.channelId, { type: 'poll_closed', pollId, tenantId });
    return { ok: true };
  }

  /* ── Feature 2: Slash Commands ── */

  async handleSlashCommand(tenantId: string, userId: string, channelId: string, text: string) {
    const parts = text.slice(1).split(' ');
    const command = (parts[0] || '').toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'remind':
      case 'reminder': {
        const match = args.match(/^(?:me\s+)?(?:to\s+)?(.+?)\s+in\s+(\d+)\s*(m|min|minute|h|hr|hour|d|day)s?$/i);
        if (match) {
          const reminderText = match[1] || '';
          const num = match[2] || '0';
          const unit = (match[3] || 'm')[0];
          const ms = parseInt(num) * (unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000);
          return this.createReminder(tenantId, userId, { text: reminderText, remindAt: new Date(Date.now() + ms), channelId });
        }
        throw new BadRequestException('Usage: /remind me to <text> in <N> min/h/d');
      }
      case 'poll': {
        const pollMatch = args.match(/^"(.+)"\s+(.+)$/);
        if (pollMatch) {
          const question = pollMatch[1] || '';
          const optionsStr = pollMatch[2] || '';
          const options = optionsStr.split(',').map((o) => ({ label: o.trim() }));
          return this.createPoll(tenantId, userId, { channelId, question, options });
        }
        throw new BadRequestException('Usage: /poll "Question" option1, option2, option3');
      }
      case 'me':
      case 'meet':
        return this.createMeeting(tenantId, userId, { title: args || 'Quick meeting' });
      case 'dnd': {
        const duration = parseInt(args) || 60;
        return this.setPresence(tenantId, userId, { presence: 'DND' as Presence, statusText: `Do not disturb (${duration}m)` });
      }
      case 'status': {
        if (!args) throw new BadRequestException('Usage: /status <text>');
        return this.setPresence(tenantId, userId, { presence: 'ACTIVE' as Presence, statusText: args });
      }
      case 'help':
      case '?':
        return {
          commands: [
            { name: '/remind', usage: '/remind me to <text> in <N> min/h/d' },
            { name: '/poll', usage: '/poll "Question" option1, option2, ...' },
            { name: '/meet', usage: '/meet <title>' },
            { name: '/dnd', usage: '/dnd <minutes>' },
            { name: '/status', usage: '/status <text>' },
            { name: '/msg', usage: '/msg @user <text>' },
            { name: '/code', usage: '/code <language> <code>' },
          ],
        };
      case 'msg': {
        const msgMatch = args.match(/^@(\S+)\s+(.+)$/);
        if (msgMatch) {
          const users = await prisma.user.findMany({ where: { tenantId, email: { contains: msgMatch[1] } }, take: 1 });
          if (users.length === 0) throw new NotFoundException('User not found');
          const org = await prisma.organization.findFirst({ where: { tenantId } });
          const targetUser = users[0]!;
          const dm = await this.getOrCreateDM(tenantId, org?.id || 'default', userId, targetUser.id);
          return { dm, text: msgMatch[2] || '', note: 'Message sent via DM' };
        }
        throw new BadRequestException('Usage: /msg @user <text>');
      }
      case 'code': {
        const codeMatch = args.match(/^(\S+)\s+([\s\S]+)$/);
        if (codeMatch) return { formatted: `\`\`\`${codeMatch[1]}\n${codeMatch[2]}\n\`\`\`` };
        throw new BadRequestException('Usage: /code <language> <code>');
      }
      default:
        throw new NotFoundException(`Unknown command: /${command}. Try /help`);
    }
  }

  /* ── Feature 3: Reminders ── */

  async createReminder(tenantId: string, userId: string, dto: { text: string; remindAt: Date; channelId?: string; messageId?: string }) {
    return prisma.reminder.create({ data: { tenantId, userId, text: dto.text, remindAt: dto.remindAt, channelId: dto.channelId, messageId: dto.messageId } });
  }

  async getReminders(tenantId: string, userId: string) {
    return prisma.reminder.findMany({ where: { tenantId, userId, isSent: false }, orderBy: { remindAt: 'asc' } });
  }

  async deleteReminder(tenantId: string, reminderId: string, userId: string) {
    const r = await prisma.reminder.findFirst({ where: { id: reminderId, tenantId, userId } });
    if (!r) throw new NotFoundException('Reminder not found');
    await prisma.reminder.delete({ where: { id: reminderId } });
    return { ok: true };
  }

  async snoozeReminder(tenantId: string, reminderId: string, userId: string, minutes = 5) {
    const r = await prisma.reminder.findFirst({ where: { id: reminderId, tenantId, userId } });
    if (!r) throw new NotFoundException('Reminder not found');
    return prisma.reminder.update({ where: { id: reminderId }, data: { remindAt: new Date(Date.now() + minutes * 60000), snoozed: true } });
  }

  /* ── Feature 4: Scheduled Messages ── */

  async scheduleMessage(tenantId: string, channelId: string, userId: string, dto: { content: string; scheduledAt: Date }) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId, tenantId } });
    if (!membership) throw new ForbiddenException('Not a channel member');
    return prisma.message.create({
      data: { tenantId, channelId, userId, content: dto.content, scheduledAt: dto.scheduledAt, kind: 'USER' },
    });
  }

  async getScheduledMessages(tenantId: string, userId: string) {
    return prisma.message.findMany({ where: { tenantId, userId, scheduledAt: { not: null }, deletedAt: null }, orderBy: { scheduledAt: 'asc' } });
  }

  async deleteScheduledMessage(tenantId: string, messageId: string, userId: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId, userId, scheduledAt: { not: null } } });
    if (!msg) throw new NotFoundException('Scheduled message not found');
    await prisma.message.delete({ where: { id: messageId } });
    return { ok: true };
  }

  /* ── Feature 5: Custom Emoji ── */

  async uploadCustomEmoji(tenantId: string, userId: string, file: Express.Multer.File, name: string) {
    const doc = await this.documentsService.createDocument(tenantId, 'connect-emoji', { name: file.originalname }, userId, file);
    const docId = (doc as any)?.id;
    const versionUrl = (doc as any)?.versions?.[0]?.fileUrl;
    return prisma.customEmoji.upsert({
      where: { tenantId_name: { tenantId, name } },
      create: { tenantId, name, fileUrl: versionUrl || docId, fileSize: file.size, uploadedBy: userId },
      update: { fileUrl: versionUrl || docId, fileSize: file.size, uploadedBy: userId },
    });
  }

  async getCustomEmojis(tenantId: string) {
    return prisma.customEmoji.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async deleteCustomEmoji(tenantId: string, emojiId: string) {
    const emoji = await prisma.customEmoji.findFirst({ where: { id: emojiId, tenantId } });
    if (!emoji) throw new NotFoundException('Emoji not found');
    await prisma.customEmoji.delete({ where: { id: emojiId } });
    return { ok: true };
  }

  /* ── Feature 6: Message Translation ── */

  async translateMessage(tenantId: string, messageId: string, targetLang: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (!msg.content) return { translatedText: '', sourceLang: targetLang };

    try {
      const { OllamaClient } = await import('../../common/integrations/ollama-client');
      const ollama = new OllamaClient();
      const result = await ollama.translate(msg.content, targetLang);
      return { translatedText: result, sourceLang: 'auto', messageId };
    } catch {
      const simpleMap: Record<string, string> = { es: 'es', fr: 'fr', de: 'de', pt: 'pt', it: 'it', ja: 'ja', ko: 'ko', zh: 'zh', ar: 'ar', hi: 'hi' };
      if (simpleMap[targetLang]) {
        return { translatedText: `[${targetLang}] ${msg.content}`, sourceLang: 'auto', messageId, note: 'AI translation unavailable — prefix-only mode' };
      }
      return { translatedText: msg.content, sourceLang: targetLang, messageId, note: 'Language not supported' };
    }
  }

  /* ── Feature 7: Meeting Summaries (AI Recap) ── */

  async generateMeetingSummary(tenantId: string, meetingId: string) {
    const meeting = await prisma.connectMeeting.findFirst({ where: { id: meetingId, tenantId }, include: { chatMessages: { orderBy: { createdAt: 'asc' } } } });
    if (!meeting) throw new NotFoundException('Meeting not found');

    let summary = 'Meeting concluded. ';
    const participantCount = await prisma.meetingParticipant.count({ where: { meetingId } });
    summary += `${participantCount} participants. `;
    summary += `${meeting.chatMessages.length} chat messages.`;

    const keyPoints: string[] = [];
    const actionItems: string[] = [];

    for (const msg of meeting.chatMessages) {
      const lower = msg.content.toLowerCase();
      if (lower.includes('action') || lower.includes('todo') || lower.includes('will do') || lower.includes('follow up') || lower.includes('assign') || lower.includes('send') || lower.includes('create')) {
        actionItems.push(msg.content);
      } else if (lower.includes('decide') || lower.includes('agree') || lower.includes('conclude') || lower.includes('important') || lower.includes('key')) {
        keyPoints.push(msg.content);
      }
    }

    try {
      const { OllamaClient } = await import('../../common/integrations/ollama-client');
      const ollama = new OllamaClient();
      const transcript = meeting.chatMessages.map((m) => m.content).join('\n');
      if (transcript.length > 20) {
        const aiSummary = await ollama.summarize(transcript);
        if (aiSummary) summary = aiSummary;
      }
    } catch { /* fallback to heuristic summary */ }

    const existing = await prisma.meetingSummary.findFirst({ where: { tenantId, meetingId } });
    if (existing) {
      return prisma.meetingSummary.update({ where: { id: existing.id }, data: { summary, keyPoints, actionItems, generatedAt: new Date() } });
    }
    return prisma.meetingSummary.create({ data: { tenantId, meetingId, summary, keyPoints, actionItems } });
  }

  async getMeetingSummary(tenantId: string, meetingId: string) {
    return prisma.meetingSummary.findFirst({ where: { tenantId, meetingId } });
  }

  /* ── Feature 8: Channel Templates ── */

  async getChannelTemplates(tenantId: string) {
    return prisma.channelTemplate.findMany({ where: { tenantId, isPreset: true }, orderBy: { name: 'asc' } });
  }

  async createChannelFromTemplate(tenantId: string, orgId: string, userId: string, dto: { templateId: string; name: string; description?: string }) {
    const template = await prisma.channelTemplate.findFirst({ where: { id: dto.templateId, tenantId, isPreset: true } });
    if (!template) throw new NotFoundException('Template not found');

    const channel = await this.createChannel(tenantId, orgId, userId, {
      name: dto.name, description: dto.description,
      topic: template.topic ?? undefined,
    });

    if (template.tabs && Array.isArray(template.tabs)) {
      for (const tab of template.tabs as { type?: string; label?: string; url?: string; icon?: string; sortOrder?: number }[]) {
        await prisma.channelTab.create({
          data: { tenantId, channelId: channel.id, type: tab.type || 'LINK', label: tab.label || '', url: tab.url, icon: tab.icon, sortOrder: tab.sortOrder || 0, createdBy: userId },
        }).catch(() => {});
      }
    }

    return channel;
  }

  async createChannelTemplate(tenantId: string, dto: { name: string; description?: string; channelType?: string; topic?: string; emoji?: string; tabs?: any[] }) {
    return prisma.channelTemplate.create({
      data: { tenantId, name: dto.name, description: dto.description, channelType: dto.channelType || 'PUBLIC', topic: dto.topic, emoji: dto.emoji || '', tabs: dto.tabs || [] },
    });
  }

  /* ── Feature 9: Message Expiry / Ephemeral ── */

  async sendEphemeralMessage(tenantId: string, channelId: string, userId: string, dto: { content: string; expiresInSecs?: number }) {
    const msg = await prisma.message.create({
      data: {
        tenantId, channelId, userId, content: dto.content,
        expiresAt: dto.expiresInSecs ? new Date(Date.now() + dto.expiresInSecs * 1000) : new Date(Date.now() + 86400000),
        viewOnce: !dto.expiresInSecs,
      },
    });
    this.notificationsGateway.broadcastChatMessage(channelId, { ...msg, ephemeral: true, tenantId });
    return msg;
  }

  async markMessageViewed(tenantId: string, messageId: string, _userId: string) {
    const msg = await prisma.message.findFirst({ where: { id: messageId, tenantId, viewOnce: true } });
    if (!msg) throw new NotFoundException('Message not found or not view-once');
    await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date(), content: 'This message has been viewed' } });
    return { ok: true };
  }

  /* ── Feature 10: Voice Messages ── */

  async uploadVoiceMessage(tenantId: string, channelId: string, userId: string, file: Express.Multer.File) {
    const membership = await prisma.channelMember.findFirst({ where: { channelId, userId, tenantId } });
    if (!membership) throw new ForbiddenException('Not a channel member');
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException('Voice message too large (max 10MB)');

    const org = await prisma.organization.findFirst({ where: { tenantId } });
    const doc = await this.documentsService.createDocument(tenantId, org?.id || 'default', { name: file.originalname }, userId, file);

    const docId = (doc as any)?.id;
    const versionUrl = (doc as any)?.versions?.[0]?.fileUrl;
    const attachments: AttachmentDto[] = [{ id: docId, name: file.originalname, size: file.size, mime: file.mimetype, url: versionUrl || '' }];
    return prisma.message.create({
      data: {
        tenantId, channelId, userId,
        content: '🎤 Voice message',
        attachments: JSON.parse(JSON.stringify(attachments)),
        kind: 'USER',
      },
    });
  }
}
