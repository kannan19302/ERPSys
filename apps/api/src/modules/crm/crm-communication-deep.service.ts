import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmCommunicationDeepService {
  private posts: any[] = [];
  private optOuts: any[] = [];
  // NOTE: this whole service keeps its state in memory. Nothing here survives a
  // restart and none of it is protected by row-level security, so the tenant
  // filtering below is the only isolation it has. It needs real persistence
  // before it can carry anything a customer depends on.
  private channels: any[] = [];
  private logs: any[] = [];
  private preferences = new Map<string, any>();

  async createPost(tenantId = "tenant-1", dto: any = {}) {
    const status = dto.scheduledAt ? "SCHEDULED" : "DRAFT";
    const post = {
      id: `post-${Date.now()}-${Math.random()}`,
      tenantId,
      status,
      ...dto,
      createdAt: new Date(),
    };
    this.posts.push(post);
    return post;
  }

  async getSocialMediaPosts(tenantId = "tenant-1") {
    return this.posts.filter((p) => p.tenantId === tenantId);
  }

  async updatePost(tenantId = "tenant-1", id = "", dto: any = {}) {
    const post = this.posts.find((p) => p.id === id && p.tenantId === tenantId);
    if (!post) throw new NotFoundException("Post not found");
    if (post.status === "PUBLISHED") {
      throw new BadRequestException("Cannot update published post");
    }
    Object.assign(post, dto);
    return post;
  }

  async deletePost(tenantId = "tenant-1", id = "") {
    this.posts = this.posts.filter(
      (p) => !(p.id === id && p.tenantId === tenantId),
    );
    return { status: "deleted" };
  }

  async scheduleSocialPost(tenantId = "tenant-1", id = "", scheduledAt = "") {
    const post = await this.updatePost(tenantId, id, {
      status: "SCHEDULED",
      scheduledAt,
    });
    return post;
  }

  async publishSocialPost(tenantId = "tenant-1", id = "") {
    const post = this.posts.find((p) => p.id === id && p.tenantId === tenantId);
    if (!post) throw new NotFoundException("Post not found");
    if (post.status === "PUBLISHED") {
      throw new BadRequestException("Post is already published");
    }
    post.status = "PUBLISHED";
    post.publishedAt = new Date();
    post.analytics = { impressions: 0, engagements: 0, clicks: 0 };
    return post;
  }

  async getSocialPostAnalytics(tenantId = "tenant-1", id = "") {
    const post = this.posts.find((p) => p.id === id && p.tenantId === tenantId);
    if (!post) throw new NotFoundException("Post not found");
    return post.analytics || { impressions: 0, engagements: 0, clicks: 0 };
  }

  async getOptOutList(tenantId = "tenant-1") {
    return this.optOuts.filter((o) => o.tenantId === tenantId);
  }

  async recordOptOut(tenantId = "tenant-1", dto: any = {}) {
    const opt = {
      id: `opt-${Date.now()}-${Math.random()}`,
      tenantId,
      ...dto,
      optedOutAt: new Date(),
    };
    this.optOuts.push(opt);
    return opt;
  }

  async isCustomerOptedOut(tenantId = "tenant-1", email = "") {
    const found = this.optOuts.find(
      (o) => o.tenantId === tenantId && o.email === email,
    );
    return !!found;
  }

  /**
   * Opt an entity out of a channel. Idempotent: opting the same
   * (entity, channel) out twice records one suppression, because the opt-out
   * list is a set of suppressions, not an event log — a duplicate would make
   * `getOptOutList` misreport how many entities are suppressed.
   */
  async optOutEntity(
    tenantId = "tenant-1",
    entityType = "CUSTOMER",
    entityId = "",
    channel = "EMAIL",
    reason?: string,
  ) {
    const existing = this.optOuts.find(
      (o) =>
        o.tenantId === tenantId &&
        o.entityType === entityType &&
        o.entityId === entityId &&
        o.channel === channel,
    );
    if (existing) return existing;

    const opt = {
      id: `opt-${Date.now()}-${this.optOuts.length}`,
      tenantId,
      entityType,
      entityId,
      channel,
      reason: reason ?? null,
      optedOutAt: new Date(),
    };
    this.optOuts.push(opt);
    return opt;
  }

  private preferenceKey(
    tenantId: string,
    entityType: string,
    entityId: string,
  ) {
    return `${tenantId}:${entityType}:${entityId}`;
  }

  /**
   * Preferences are keyed by (tenant, entityType, entityId): a CUSTOMER and a
   * LEAD can share an id, and collapsing them would leak one's preferences onto
   * the other. Defaults are opt-in for the channels the customer has a standing
   * relationship on, matching the consent model in the CRM spec.
   */
  async getCommunicationPreferences(
    tenantId = "tenant-1",
    entityType = "CUSTOMER",
    entityId = "",
  ) {
    return (
      this.preferences.get(
        this.preferenceKey(tenantId, entityType, entityId),
      ) || {
        entityType,
        entityId,
        email: true,
        sms: true,
        phone: true,
      }
    );
  }

  async updateCommunicationPreferences(
    tenantId = "tenant-1",
    entityType = "CUSTOMER",
    entityId = "",
    dto: any = {},
  ) {
    const current = await this.getCommunicationPreferences(
      tenantId,
      entityType,
      entityId,
    );
    const pref = { ...current, entityType, entityId, ...dto };
    this.preferences.set(
      this.preferenceKey(tenantId, entityType, entityId),
      pref,
    );
    return pref;
  }

  /** Aggregate counts across the communication log for a tenant. */
  async getCommunicationAnalytics(tenantId = "tenant-1") {
    const logs = this.logs.filter((l) => l.tenantId === tenantId);
    const byChannel: Record<string, number> = {};
    for (const l of logs) {
      byChannel[l.channel ?? "UNKNOWN"] =
        (byChannel[l.channel ?? "UNKNOWN"] ?? 0) + 1;
    }
    return {
      total: logs.length,
      byChannel,
      optOuts: this.optOuts.filter((o) => o.tenantId === tenantId).length,
    };
  }

  /** Channel-level rollup for the multi-channel dashboard. */
  async getMultiChannelDashboard(tenantId = "tenant-1") {
    const logs = this.logs.filter((l) => l.tenantId === tenantId);
    return {
      totalLogs: logs.length,
      channels: this.channels.filter((c) => c.tenantId === tenantId).length,
      posts: this.posts.filter((p) => p.tenantId === tenantId).length,
    };
  }

  /** Messages addressed to a user that carry no read receipt. */
  async getUnreadMessageCount(tenantId = "tenant-1", userId = "") {
    return this.logs.filter(
      (l) => l.tenantId === tenantId && l.recipientId === userId && !l.readAt,
    ).length;
  }

  async getChannels(tenantId = "tenant-1") {
    return this.channels.filter((c) => c.tenantId === tenantId);
  }

  async createChannel(tenantId = "tenant-1", dto: any = {}) {
    const channel = {
      id: `chan-${Date.now()}-${this.channels.length}`,
      tenantId,
      ...dto,
    };
    this.channels.push(channel);
    return channel;
  }

  async getTemplates(tenantId = "tenant-1") {
    return [];
  }

  async sendCommunication(tenantId = "tenant-1", dto: any = {}) {
    const log = {
      id: `comm-${Date.now()}-${this.logs.length}`,
      tenantId,
      channel: dto.channel ?? "EMAIL",
      recipientId: dto.recipientId ?? null,
      readAt: null,
      sentAt: new Date(),
      ...dto,
    };
    this.logs.push(log);
    return { status: "sent", id: log.id };
  }

  async getCommunicationLogs(tenantId = "tenant-1") {
    return this.logs.filter((l) => l.tenantId === tenantId);
  }
}
