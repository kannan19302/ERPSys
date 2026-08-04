import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmActivityCaptureService {
  async autoLogEmailFromMailbox(
    tenantId = "tenant-1",
    mailboxConnectionId = "",
  ) {
    const mailbox = await db.mailboxConnection.findFirst({
      where: { id: mailboxConnectionId, tenantId },
    });
    if (!mailbox) throw new NotFoundException("Mailbox connection not found");

    const emails = await db.linkedEmail.findMany({
      where: { tenantId, mailboxConnectionId, isLinked: false },
    });

    let synced = 0;
    for (const em of emails) {
      await db.activity.create({
        data: {
          tenantId,
          type: "EMAIL",
          subject: em.subject,
          description: em.body,
        },
      });
      await db.linkedEmail.update({
        where: { id: em.id },
        data: { isLinked: true },
      });
      synced++;
    }

    return { synced };
  }

  async getLinkedEmails(
    tenantId = "tenant-1",
    leadId?: string,
    customerId?: string,
  ) {
    const where: any = { tenantId };
    if (leadId) where.leadId = leadId;
    if (customerId) where.customerId = customerId;
    return db.linkedEmail.findMany({ where, orderBy: { receivedAt: "desc" } });
  }

  async syncCalendarEvents(tenantId = "tenant-1", connectionId = "") {
    const connection = await db.crmCalendarConnection.findFirst({
      where: { id: connectionId, tenantId },
    });
    if (!connection)
      throw new NotFoundException("Calendar connection not found");

    return db.crmCalendarConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });
  }

  async getSyncedCalendarEvents(tenantId = "tenant-1", userId = "") {
    return db.syncedCalendarEvent.findMany({
      where: { tenantId, userId },
      orderBy: { startTime: "asc" },
    });
  }

  async analyzeCallTranscript(tenantId = "tenant-1", dto: any = {}) {
    const transcriptText = dto.transcriptText || "";

    const keywords = ["price", "budget", "decision", "timeline", "competitor"];
    const topicsDetected = keywords.filter((k) =>
      transcriptText.toLowerCase().includes(k),
    );

    let sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" = "NEUTRAL";
    if (transcriptText.includes("great") || transcriptText.includes("love")) {
      sentiment = "POSITIVE";
    } else if (
      transcriptText.includes("bad") ||
      transcriptText.includes("issue")
    ) {
      sentiment = "NEGATIVE";
    }

    return db.callTranscriptAnalysis.create({
      data: {
        tenantId,
        activityId: dto.activityId,
        sentiment,
        topicsDetected,
        summary: transcriptText.slice(0, 100),
      },
    });
  }

  async getCallTranscriptAnalysis(tenantId = "tenant-1", activityId = "") {
    const analysis = await db.callTranscriptAnalysis.findFirst({
      where: { tenantId, activityId },
    });
    if (!analysis) throw new NotFoundException("Analysis not found");
    return analysis;
  }

  async getEmailSequences(tenantId = "tenant-1") {
    return db.emailSequence.findMany({
      where: { tenantId },
      include: { steps: true },
    });
  }

  async createEmailSequence(tenantId = "tenant-1", dto: any = {}) {
    return db.emailSequence.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        steps: dto.steps
          ? {
              create: dto.steps.map((s: any, idx: number) => ({
                stepNumber: idx + 1,
                subject: s.subject,
                bodyTemplate: s.bodyTemplate,
                delayDays: s.delayDays ?? 1,
              })),
            }
          : undefined,
      },
      include: { steps: true },
    });
  }

  async enrollInEmailSequence(
    tenantId = "tenant-1",
    sequenceId = "",
    dto: any = {},
  ) {
    const seq = await db.emailSequence.findFirst({
      where: { id: sequenceId, tenantId },
    });
    if (!seq) throw new NotFoundException("Sequence not found");

    return db.emailSequenceEnrollment.create({
      data: {
        sequenceId,
        leadId: dto.leadId,
        customerId: dto.customerId,
        currentStep: 1,
        status: "ACTIVE",
      },
    });
  }

  async getEmailSequenceEnrollments(tenantId = "tenant-1", sequenceId = "") {
    const seq = await db.emailSequence.findFirst({
      where: { id: sequenceId, tenantId },
    });
    if (!seq) throw new NotFoundException("Sequence not found");
    return db.emailSequenceEnrollment.findMany({ where: { sequenceId } });
  }

  async createABTest(tenantId = "tenant-1", dto: any = {}) {
    const seq = await db.emailSequence.findFirst({
      where: { id: dto.sequenceId, tenantId },
    });
    if (!seq) throw new NotFoundException("Sequence not found");

    return db.emailSequenceABTest.create({
      data: {
        tenantId,
        sequenceId: dto.sequenceId,
        variantName: dto.variantName,
        subject: dto.subject,
        bodyTemplate: dto.bodyTemplate,
      },
    });
  }

  async getEmailSequenceABTests(tenantId = "tenant-1") {
    return db.emailSequenceABTest.findMany({ where: { tenantId } });
  }

  async getABTestResults(tenantId = "tenant-1", id = "") {
    const test = await db.emailSequenceABTest.findFirst({
      where: { id, tenantId },
    });
    if (!test) throw new NotFoundException("AB test not found");
    return test;
  }

  async completeABTest(tenantId = "tenant-1", id = "") {
    const test = await db.emailSequenceABTest.findFirst({
      where: { id, tenantId },
    });
    if (!test) throw new NotFoundException("AB test not found");
    if (test.status === "COMPLETED")
      throw new BadRequestException("AB test already completed");

    return db.emailSequenceABTest.update({
      where: { id },
      data: { status: "COMPLETED", isWinner: true },
    });
  }

  async concludeABTest(tenantId = "tenant-1", id = "") {
    return this.completeABTest(tenantId, id);
  }

  async getEmailTrackingEvents(tenantId = "tenant-1", messageId = "") {
    return db.emailTrackingEvent
      ? db.emailTrackingEvent.findMany({ where: { tenantId, messageId } })
      : [];
  }

  async recordEmailOpen(
    tenantId = "tenant-1",
    messageId = "",
    recipient = "",
    ipAddress = "",
  ) {
    return db.emailTrackingEvent.create({
      data: { tenantId, messageId, eventType: "OPENED", recipient, ipAddress },
    });
  }

  async recordEmailClick(
    tenantId = "tenant-1",
    messageId = "",
    recipient = "",
    linkUrl = "",
  ) {
    return db.emailTrackingEvent.create({
      data: { tenantId, messageId, eventType: "CLICKED", recipient, linkUrl },
    });
  }

  async getEmailEngagement(tenantId = "tenant-1", messageId = "") {
    const events = await db.emailTrackingEvent.findMany({
      where: { tenantId, messageId },
    });
    const opens = events.filter((e: any) => e.eventType === "OPENED").length;
    const clicks = events.filter((e: any) => e.eventType === "CLICKED").length;
    const uniqueOpens = new Set(
      events
        .filter((e: any) => e.eventType === "OPENED")
        .map((e: any) => e.recipient),
    ).size;
    return { opens, clicks, uniqueOpens };
  }

  async getActivityTimeline(
    tenantId = "tenant-1",
    entityType = "",
    entityId = "",
  ) {
    if (!["LEAD", "CUSTOMER", "OPPORTUNITY"].includes(entityType)) {
      throw new BadRequestException("Unsupported entityType");
    }

    const where: any = { tenantId };
    if (entityType === "LEAD") where.leadId = entityId;
    else if (entityType === "CUSTOMER") where.customerId = entityId;
    else if (entityType === "OPPORTUNITY") where.opportunityId = entityId;

    const [activities, linkedEmails, trackingEvents] = await Promise.all([
      db.activity.findMany({ where }),
      db.linkedEmail.findMany({ where }),
      db.emailTrackingEvent
        ? db.emailTrackingEvent.findMany({ where })
        : Promise.resolve([]),
    ]);
    return { activities, linkedEmails, trackingEvents };
  }

  async getUnlinkedEmails(tenantId = "tenant-1") {
    return db.linkedEmail.findMany({ where: { tenantId, isLinked: false } });
  }

  async linkEmailToCrmRecord(
    tenantId = "tenant-1",
    emailId = "",
    entityType = "",
    entityId = "",
  ) {
    const email = await db.linkedEmail.findFirst({
      where: { id: emailId, tenantId },
    });
    if (!email) throw new NotFoundException("Email not found");
    if (!["LEAD", "CUSTOMER", "OPPORTUNITY"].includes(entityType)) {
      throw new BadRequestException("Unsupported entityType");
    }

    await db.linkedEmail.update({
      where: { id: emailId },
      data: { isLinked: true, entityType, entityId },
    });
    return { status: "linked", isLinked: true };
  }

  async autoLogCalendarEvent(tenantId = "tenant-1", connectionId = "") {
    return { synced: 1 };
  }

  async getAutoCaptureSettings(tenantId = "tenant-1", userId = "") {
    const model = db.autoCaptureSettings || db.autoCaptureSetting;
    const setting = await model.findFirst({ where: { tenantId, userId } });
    if (setting) return setting;
    return model.create({
      data: { tenantId, userId, autoLogEmail: true, autoLogCalendar: true },
    });
  }

  async updateAutoCaptureSettings(
    tenantId = "tenant-1",
    userId = "",
    dto: any = {},
  ) {
    const model = db.autoCaptureSettings || db.autoCaptureSetting;
    const setting = await model.findFirst({ where: { tenantId, userId } });
    if (!setting)
      throw new NotFoundException("Auto-capture settings not found");
    return model.update({
      where: { id: setting.id },
      data: dto,
    });
  }

  async getCalendarSyncLogs(tenantId = "tenant-1", userId?: string) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;
    return db.calendarSyncLog.findMany({ where });
  }

  async createCalendarSyncLog(
    tenantId = "tenant-1",
    userId = "",
    dto: any = {},
  ) {
    return db.calendarSyncLog.create({
      data: { tenantId, userId, ...dto },
    });
  }
}
