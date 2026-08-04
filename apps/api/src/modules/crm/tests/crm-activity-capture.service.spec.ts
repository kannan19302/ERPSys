import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmActivityCaptureService } from "../crm-activity-capture.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    mailboxConnection: { findFirst: vi.fn() },
    linkedEmail: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn(), findMany: vi.fn() },
    calendarSyncLog: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    emailTrackingEvent: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    autoCaptureSetting: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailSequenceABTest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lead: { findFirst: vi.fn(), findMany: vi.fn() },
    organization: { findFirst: vi.fn() },
    emailSequence: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";
const USER = "user-1";

describe("CrmActivityCaptureService", () => {
  let service: CrmActivityCaptureService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmActivityCaptureService();
  });

  describe("autoLogEmailFromMailbox", () => {
    it("throws if mailbox not found", async () => {
      (prisma.mailboxConnection.findFirst as any).mockResolvedValue(null);
      await expect(
        service.autoLogEmailFromMailbox(TENANT, "x"),
      ).rejects.toThrow(NotFoundException);
    });

    it("syncs unlinked emails and creates activities", async () => {
      (prisma.mailboxConnection.findFirst as any).mockResolvedValue({
        id: "mbx-1",
        orgId: "org-1",
      });
      (prisma.linkedEmail.findMany as any).mockResolvedValue([
        {
          id: "em-1",
          subject: "Hello",
          body: "Test body",
          fromEmail: "a@test.com",
          leadId: null,
          contactId: null,
          customerId: null,
          opportunityId: null,
          isLinked: false,
          receivedAt: new Date(),
        },
      ]);
      (prisma.lead.findFirst as any).mockResolvedValue({ id: "lead-1" });
      (prisma.activity.create as any).mockResolvedValue({ id: "act-1" });
      (prisma.linkedEmail.update as any).mockResolvedValue({});

      const result = await service.autoLogEmailFromMailbox(TENANT, "mbx-1");
      expect(result.synced).toBe(1);
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "EMAIL", subject: "Hello" }),
        }),
      );
    });
  });

  describe("autoLogCalendarEvent", () => {
    it("returns placeholder for calendar sync", async () => {
      (prisma.calendarSyncLog.findFirst as any).mockResolvedValue({
        id: "cal-1",
      });
      const result = await service.autoLogCalendarEvent(TENANT, "cal-1");
      expect(result).toHaveProperty("message");
    });
  });

  describe("getEmailTrackingEvents", () => {
    it("returns tracking events filtered by tenant", async () => {
      (prisma.emailTrackingEvent.findMany as any).mockResolvedValue([
        { id: "evt-1", eventType: "OPENED" },
      ]);
      const result = await service.getEmailTrackingEvents(TENANT);
      expect(result).toHaveLength(1);
    });

    it("filters by messageId when provided", async () => {
      (prisma.emailTrackingEvent.findMany as any).mockResolvedValue([]);
      await service.getEmailTrackingEvents(TENANT, "msg-1");
      expect(
        (prisma.emailTrackingEvent.findMany as any).mock.calls[0][0].where
          .messageId,
      ).toBe("msg-1");
    });
  });

  describe("recordEmailOpen", () => {
    it("creates an OPENED tracking event", async () => {
      (prisma.emailTrackingEvent.create as any).mockResolvedValue({
        id: "evt-1",
      });
      const result = await service.recordEmailOpen(
        TENANT,
        "msg-1",
        "a@b.com",
        "Mozilla/5.0",
        "127.0.0.1",
      );
      expect(result.id).toBe("evt-1");
      expect(
        (prisma.emailTrackingEvent.create as any).mock.calls[0][0].data
          .eventType,
      ).toBe("OPENED");
    });
  });

  describe("recordEmailClick", () => {
    it("creates a CLICKED tracking event with linkUrl", async () => {
      (prisma.emailTrackingEvent.create as any).mockResolvedValue({
        id: "evt-2",
      });
      const result = await service.recordEmailClick(
        TENANT,
        "msg-1",
        "a@b.com",
        "https://example.com",
      );
      expect(result.id).toBe("evt-2");
      expect(
        (prisma.emailTrackingEvent.create as any).mock.calls[0][0].data.linkUrl,
      ).toBe("https://example.com");
    });
  });

  describe("getEmailEngagement", () => {
    it("returns aggregated engagement stats", async () => {
      (prisma.emailTrackingEvent.findMany as any).mockResolvedValue([
        { eventType: "OPENED", recipient: "a@b.com" },
        { eventType: "OPENED", recipient: "a@b.com" },
        { eventType: "CLICKED", recipient: "a@b.com" },
        { eventType: "BOUNCED", recipient: "b@c.com" },
      ]);
      const result = await service.getEmailEngagement(TENANT, "msg-1");
      expect(result.opens).toBe(2);
      expect(result.clicks).toBe(1);
      expect(result.uniqueOpens).toBe(1);
      expect(result.bounces).toBe(1);
    });
  });

  describe("getCalendarSyncLogs", () => {
    it("returns logs filtered by tenant and optional userId", async () => {
      (prisma.calendarSyncLog.findMany as any).mockResolvedValue([
        { id: "log-1" },
      ]);
      const result = await service.getCalendarSyncLogs(TENANT, USER);
      expect(result).toHaveLength(1);
      expect(
        (prisma.calendarSyncLog.findMany as any).mock.calls[0][0].where.userId,
      ).toBe(USER);
    });
  });

  describe("createCalendarSyncLog", () => {
    it("creates a sync log entry", async () => {
      (prisma.calendarSyncLog.create as any).mockResolvedValue({ id: "log-1" });
      const result = await service.createCalendarSyncLog(
        TENANT,
        USER,
        "GOOGLE",
        "MEETING_CREATED",
        "SYNCED",
      );
      expect(result.id).toBe("log-1");
    });
  });

  describe("getActivityTimeline", () => {
    it("throws for unsupported entityType", async () => {
      await expect(
        service.getActivityTimeline(TENANT, "INVALID", "id-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("returns activities, linked emails, and tracking events", async () => {
      (prisma.activity.findMany as any).mockResolvedValue([{ id: "act-1" }]);
      (prisma.linkedEmail.findMany as any).mockResolvedValue([
        { id: "em-1", emailId: "eid-1" },
      ]);
      (prisma.emailTrackingEvent.findMany as any).mockResolvedValue([
        { id: "trk-1" },
      ]);
      const result = await service.getActivityTimeline(
        TENANT,
        "LEAD",
        "lead-1",
      );
      expect(result.activities).toHaveLength(1);
      expect(result.linkedEmails).toHaveLength(1);
      expect(result.trackingEvents).toHaveLength(1);
    });
  });

  describe("getUnlinkedEmails", () => {
    it("returns unlinked emails", async () => {
      (prisma.linkedEmail.findMany as any).mockResolvedValue([
        { id: "em-1", isLinked: false },
      ]);
      const result = await service.getUnlinkedEmails(TENANT);
      expect(result).toHaveLength(1);
      expect(
        (prisma.linkedEmail.findMany as any).mock.calls[0][0].where.isLinked,
      ).toBe(false);
    });
  });

  describe("linkEmailToCrmRecord", () => {
    it("throws if email not found", async () => {
      (prisma.linkedEmail.findFirst as any).mockResolvedValue(null);
      await expect(
        service.linkEmailToCrmRecord(TENANT, "em-1", "LEAD", "lead-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws for unsupported entityType", async () => {
      (prisma.linkedEmail.findFirst as any).mockResolvedValue({ id: "em-1" });
      await expect(
        service.linkEmailToCrmRecord(TENANT, "em-1", "INVALID", "x"),
      ).rejects.toThrow(BadRequestException);
    });

    it("links email to a lead", async () => {
      (prisma.linkedEmail.findFirst as any).mockResolvedValue({ id: "em-1" });
      (prisma.linkedEmail.update as any).mockResolvedValue({
        id: "em-1",
        leadId: "lead-1",
        isLinked: true,
      });
      const result = await service.linkEmailToCrmRecord(
        TENANT,
        "em-1",
        "LEAD",
        "lead-1",
      );
      expect(result.isLinked).toBe(true);
    });

    it("links email to an opportunity", async () => {
      (prisma.linkedEmail.findFirst as any).mockResolvedValue({ id: "em-1" });
      (prisma.linkedEmail.update as any).mockResolvedValue({
        id: "em-1",
        opportunityId: "opp-1",
        isLinked: true,
      });
      const result = await service.linkEmailToCrmRecord(
        TENANT,
        "em-1",
        "OPPORTUNITY",
        "opp-1",
      );
      expect(result.isLinked).toBe(true);
    });
  });

  describe("getAutoCaptureSettings", () => {
    it("returns existing settings", async () => {
      (prisma.autoCaptureSetting.findUnique as any).mockResolvedValue({
        id: "set-1",
        captureEmails: true,
      });
      const result = await service.getAutoCaptureSettings(TENANT, USER);
      expect(result.id).toBe("set-1");
    });

    it("creates default settings if none exist", async () => {
      (prisma.autoCaptureSetting.findUnique as any).mockResolvedValue(null);
      (prisma.autoCaptureSetting.create as any).mockResolvedValue({
        id: "set-2",
        captureEmails: true,
        tenantId: TENANT,
        userId: USER,
      });
      const result = await service.getAutoCaptureSettings(TENANT, USER);
      expect(result.tenantId).toBe(TENANT);
    });
  });

  describe("updateAutoCaptureSettings", () => {
    it("throws if settings not found", async () => {
      (prisma.autoCaptureSetting.findUnique as any).mockResolvedValue(null);
      await expect(
        service.updateAutoCaptureSettings(TENANT, USER, {
          captureEmails: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates settings", async () => {
      (prisma.autoCaptureSetting.findUnique as any).mockResolvedValue({
        id: "set-1",
      });
      (prisma.autoCaptureSetting.update as any).mockResolvedValue({
        id: "set-1",
        captureEmails: false,
      });
      const result = await service.updateAutoCaptureSettings(TENANT, USER, {
        captureEmails: false,
      });
      expect(result.captureEmails).toBe(false);
    });
  });

  describe("getEmailSequenceABTests", () => {
    it("returns AB tests", async () => {
      (prisma.emailSequenceABTest.findMany as any).mockResolvedValue([
        { id: "ab-1", status: "RUNNING" },
      ]);
      const result = await service.getEmailSequenceABTests(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe("createABTest", () => {
    it("throws if sequence not found", async () => {
      (prisma.emailSequence.findFirst as any).mockResolvedValue(null);
      await expect(
        service.createABTest(TENANT, {
          sequenceId: "x",
          name: "Test",
          variantA: {},
          variantB: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("creates an AB test", async () => {
      (prisma.emailSequence.findFirst as any).mockResolvedValue({
        id: "seq-1",
      });
      (prisma.emailSequenceABTest.create as any).mockResolvedValue({
        id: "ab-1",
        name: "Test",
        status: "RUNNING",
      });
      const result = await service.createABTest(TENANT, {
        sequenceId: "seq-1",
        name: "Test",
        variantA: { subject: "A" },
        variantB: { subject: "B" },
      });
      expect(result.status).toBe("RUNNING");
    });
  });

  describe("completeABTest", () => {
    it("throws if test not found", async () => {
      (prisma.emailSequenceABTest.findFirst as any).mockResolvedValue(null);
      await expect(service.completeABTest(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws if already completed", async () => {
      (prisma.emailSequenceABTest.findFirst as any).mockResolvedValue({
        id: "ab-1",
        status: "COMPLETED",
      });
      await expect(service.completeABTest(TENANT, "ab-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("completes a running test with winner", async () => {
      (prisma.emailSequenceABTest.findFirst as any).mockResolvedValue({
        id: "ab-1",
        status: "RUNNING",
        sampleSize: 10,
      });
      (prisma.emailTrackingEvent.count as any).mockResolvedValue(5);
      (prisma.emailSequenceABTest.update as any).mockResolvedValue({
        id: "ab-1",
        status: "COMPLETED",
        winner: "A",
      });
      const result = await service.completeABTest(TENANT, "ab-1");
      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("getABTestResults", () => {
    it("returns test by id", async () => {
      (prisma.emailSequenceABTest.findFirst as any).mockResolvedValue({
        id: "ab-1",
        status: "COMPLETED",
      });
      const result = await service.getABTestResults(TENANT, "ab-1");
      expect(result.id).toBe("ab-1");
    });

    it("throws if not found", async () => {
      (prisma.emailSequenceABTest.findFirst as any).mockResolvedValue(null);
      await expect(service.getABTestResults(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
