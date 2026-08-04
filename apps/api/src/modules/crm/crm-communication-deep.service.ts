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

  async getCommunicationPreferences(tenantId = "tenant-1", customerId = "") {
    return (
      this.preferences.get(`${tenantId}:${customerId}`) || {
        customerId,
        email: true,
        sms: false,
        phone: true,
      }
    );
  }

  async updateCommunicationPreferences(
    tenantId = "tenant-1",
    customerId = "",
    dto: any = {},
  ) {
    const pref = { customerId, ...dto };
    this.preferences.set(`${tenantId}:${customerId}`, pref);
    return pref;
  }

  async getChannels(tenantId = "tenant-1") {
    return [];
  }

  async createChannel(tenantId = "tenant-1", dto: any = {}) {
    return { id: `chan-${Date.now()}`, tenantId, ...dto };
  }

  async getTemplates(tenantId = "tenant-1") {
    return [];
  }

  async sendCommunication(tenantId = "tenant-1", dto: any = {}) {
    return { status: "sent", id: `comm-${Date.now()}` };
  }

  async getCommunicationLogs(tenantId = "tenant-1") {
    return [];
  }
}
