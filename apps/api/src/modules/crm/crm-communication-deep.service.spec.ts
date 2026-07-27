import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CrmCommunicationDeepService } from "./crm-communication-deep.service";

describe("CrmCommunicationDeepService", () => {
  let svc: CrmCommunicationDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmCommunicationDeepService],
    }).compile();
    svc = module.get<CrmCommunicationDeepService>(CrmCommunicationDeepService);
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("Social Media Posts", () => {
    it("should create a draft post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Hello world",
      });
      expect(post.status).toBe("DRAFT");
      expect(post.platform).toBe("TWITTER");
    });

    it("should create a scheduled post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "LINKEDIN",
        content: "Scheduled post",
        scheduledAt: "2026-08-01T00:00:00Z",
      });
      expect(post.status).toBe("SCHEDULED");
      expect(post.scheduledAt).toBeDefined();
    });

    it("should list posts for tenant", async () => {
      await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Post 1",
      });
      await svc.createPost("tenant-1", {
        platform: "LINKEDIN",
        content: "Post 2",
      });
      const posts = await svc.getSocialMediaPosts("tenant-1");
      expect(posts.length).toBe(2);
    });

    it("should not list posts from other tenants", async () => {
      await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Post 1",
      });
      const posts = await svc.getSocialMediaPosts("tenant-2");
      expect(posts.length).toBe(0);
    });

    it("should update a draft post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Original",
      });
      const updated = await svc.updatePost("tenant-1", post.id, {
        content: "Updated",
      });
      expect(updated.content).toBe("Updated");
    });

    it("should throw on updating published post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Publish me",
      });
      await svc.publishSocialPost("tenant-1", post.id);
      await expect(
        svc.updatePost("tenant-1", post.id, { content: "Nope" }),
      ).rejects.toThrow();
    });

    it("should delete a post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Delete me",
      });
      await svc.deletePost("tenant-1", post.id);
      const posts = await svc.getSocialMediaPosts("tenant-1");
      expect(posts.length).toBe(0);
    });

    it("should schedule a post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Schedule me",
      });
      const scheduled = await svc.scheduleSocialPost(
        "tenant-1",
        post.id,
        "2026-09-01T00:00:00Z",
      );
      expect(scheduled.status).toBe("SCHEDULED");
    });

    it("should publish a post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Publish me",
      });
      const published = await svc.publishSocialPost("tenant-1", post.id);
      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedAt).toBeDefined();
      expect(published.analytics).toBeDefined();
    });

    it("should throw on publishing already published post", async () => {
      const post = await svc.createPost("tenant-1", {
        platform: "TWITTER",
        content: "Publish me",
      });
      await svc.publishSocialPost("tenant-1", post.id);
      await expect(
        svc.publishSocialPost("tenant-1", post.id),
      ).rejects.toThrow();
    });
  });

  describe("Opt-Out", () => {
    it("should opt-out an entity", async () => {
      const optOut = await svc.optOutEntity(
        "tenant-1",
        "CUSTOMER",
        "cust-1",
        "EMAIL",
        "No spam",
      );
      expect(optOut.channel).toBe("EMAIL");
    });

    it("should list opt-outs for tenant", async () => {
      await svc.optOutEntity("tenant-1", "CUSTOMER", "cust-1", "EMAIL");
      await svc.optOutEntity("tenant-1", "LEAD", "lead-1", "SMS");
      const list = await svc.getOptOutList("tenant-1");
      expect(list.length).toBe(2);
    });

    it("should not duplicate opt-outs", async () => {
      await svc.optOutEntity("tenant-1", "CUSTOMER", "cust-1", "EMAIL");
      await svc.optOutEntity("tenant-1", "CUSTOMER", "cust-1", "EMAIL");
      const list = await svc.getOptOutList("tenant-1");
      expect(list.length).toBe(1);
    });
  });

  describe("Communication Preferences", () => {
    it("should return defaults for new entity", async () => {
      const prefs = await svc.getCommunicationPreferences(
        "tenant-1",
        "CUSTOMER",
        "cust-1",
      );
      expect(prefs.email).toBe(true);
      expect(prefs.sms).toBe(true);
    });

    it("should update preferences", async () => {
      await svc.updateCommunicationPreferences(
        "tenant-1",
        "CUSTOMER",
        "cust-1",
        { email: false, sms: false },
      );
      const prefs = await svc.getCommunicationPreferences(
        "tenant-1",
        "CUSTOMER",
        "cust-1",
      );
      expect(prefs.email).toBe(false);
      expect(prefs.sms).toBe(false);
    });
  });

  describe("Analytics", () => {
    it("should return communication analytics", async () => {
      const analytics = await svc.getCommunicationAnalytics("tenant-1");
      expect(analytics).toBeDefined();
      expect(typeof analytics.total).toBe("number");
    });

    it("should return multi-channel dashboard", async () => {
      const dash = await svc.getMultiChannelDashboard("tenant-1");
      expect(dash).toBeDefined();
      expect(typeof dash.totalLogs).toBe("number");
    });

    it("should return unread message count", async () => {
      const count = await svc.getUnreadMessageCount("tenant-1", "user-1");
      expect(typeof count).toBe("number");
    });
  });
});
