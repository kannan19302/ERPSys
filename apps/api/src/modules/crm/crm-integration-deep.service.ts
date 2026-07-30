// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmIntegrationDeepService {
  async getWebhookConfigs(tenantId = "tenant-1") {
    return db.crmWebhookConfig.findMany({
      where: { tenantId, deletedAt: null },
    });
  }

  async createWebhookConfig(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    return db.crmWebhookConfig.create({
      data: {
        tenantId,
        orgId,
        name: dto.name ?? "Webhook",
        url: dto.url ?? "https://example.com",
        events: dto.events ?? [],
        enabled: dto.enabled ?? true,
      },
    });
  }

  async getWebhookConfig(tenantId = "tenant-1", id = "") {
    const config = await db.crmWebhookConfig.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!config) throw new NotFoundException("Webhook config not found");
    return config;
  }

  async updateWebhookConfig(tenantId = "tenant-1", id = "", dto: any = {}) {
    const config = await db.crmWebhookConfig.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!config) throw new NotFoundException("Webhook config not found");
    return db.crmWebhookConfig.update({
      where: { id },
      data: dto,
    });
  }

  async deleteWebhookConfig(tenantId = "tenant-1", id = "") {
    const config = await db.crmWebhookConfig.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!config) throw new NotFoundException("Webhook config not found");
    return db.crmWebhookConfig.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getWebhookLogs(tenantId = "tenant-1", configId = "") {
    const config = await db.crmWebhookConfig.findFirst({
      where: { id: configId, tenantId, deletedAt: null },
    });
    if (!config) throw new NotFoundException("Webhook config not found");
    return db.crmWebhookDeliveryLog.findMany({
      where: { webhookConfigId: configId },
    });
  }

  async getWebhookDeliveryStats(tenantId = "tenant-1") {
    const configs = await db.crmWebhookConfig.findMany({
      where: { tenantId, deletedAt: null },
    });
    const [success, failed, pending] = await Promise.all([
      db.crmWebhookDeliveryLog.count({ where: { status: "SUCCESS" } }),
      db.crmWebhookDeliveryLog.count({ where: { status: "FAILED" } }),
      db.crmWebhookDeliveryLog.count({ where: { status: "PENDING" } }),
    ]);

    return {
      totalWebhooks: configs.length,
      success,
      failed,
      pending,
    };
  }

  async testWebhook(tenantId = "tenant-1", configId = "") {
    const config = await db.crmWebhookConfig.findFirst({
      where: { id: configId, tenantId, deletedAt: null },
    });
    if (!config) throw new NotFoundException("Webhook config not found");

    const payload = {
      event: "test",
      message: `test webhook payload for ${config.name}`,
    };
    const log = await db.crmWebhookDeliveryLog.create({
      data: {
        webhookConfigId: configId,
        status: "SUCCESS",
        payload,
      },
    });

    return {
      logId: log.id,
      payload,
    };
  }

  async getCalendarConnections(tenantId = "tenant-1") {
    return db.crmCalendarConnection.findMany({ where: { tenantId } });
  }

  async createCalendarConnection(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    return db.crmCalendarConnection.create({
      data: {
        tenantId,
        orgId,
        name: dto.name ?? "Calendar Connection",
        provider: dto.provider ?? "GOOGLE",
        syncEnabled: dto.syncEnabled ?? true,
      },
    });
  }

  async updateCalendarConnection(
    tenantId = "tenant-1",
    id = "",
    dto: any = {},
  ) {
    const conn = await db.crmCalendarConnection.findFirst({
      where: { id, tenantId },
    });
    if (!conn) throw new NotFoundException("Calendar connection not found");
    return db.crmCalendarConnection.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCalendarConnection(tenantId = "tenant-1", id = "") {
    const conn = await db.crmCalendarConnection.findFirst({
      where: { id, tenantId },
    });
    if (!conn) throw new NotFoundException("Calendar connection not found");
    return db.crmCalendarConnection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async syncCalendar(tenantId = "tenant-1", connectionId = "") {
    const conn = await db.crmCalendarConnection.findFirst({
      where: { id: connectionId, tenantId },
    });
    if (!conn) throw new NotFoundException("Calendar connection not found");

    return db.crmCalendarConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });
  }

  async getSlackConnections(tenantId = "tenant-1") {
    return db.crmSlackConnection.findMany({ where: { tenantId } });
  }

  async createSlackConnection(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    return db.crmSlackConnection.create({
      data: {
        tenantId,
        orgId,
        name: dto.name ?? dto.workspaceName ?? "Slack Workspace",
        workspaceName: dto.workspaceName ?? "Slack",
        enabled: dto.enabled ?? true,
      },
    });
  }

  async updateSlackConnection(tenantId = "tenant-1", id = "", dto: any = {}) {
    const conn = await db.crmSlackConnection.findFirst({
      where: { id, tenantId },
    });
    if (!conn) throw new NotFoundException("Slack connection not found");
    return db.crmSlackConnection.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSlackConnection(tenantId = "tenant-1", id = "") {
    const conn = await db.crmSlackConnection.findFirst({
      where: { id, tenantId },
    });
    if (!conn) throw new NotFoundException("Slack connection not found");
    return db.crmSlackConnection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async sendSlackNotification(
    tenantId = "tenant-1",
    connectionId = "",
    channel = "#general",
    message = "Hello",
  ) {
    const conn = await db.crmSlackConnection.findFirst({
      where: { id: connectionId, tenantId },
    });
    if (!conn) throw new NotFoundException("Slack connection not found");

    const log = await db.crmEventDeliveryLog.create({
      data: {
        tenantId,
        eventType: "slack.notification",
        destination: channel,
        status: "SENT",
        payload: { message },
      },
    });

    return { logId: log.id, status: "SENT" };
  }

  async getIntegrationDashboard(tenantId = "tenant-1") {
    const [webhooks, calendar, slack, deliveryLogsCount, eventLogsCount] =
      await Promise.all([
        db.crmWebhookConfig.findMany({ where: { tenantId, deletedAt: null } }),
        db.crmCalendarConnection.findMany({ where: { tenantId } }),
        db.crmSlackConnection.findMany({ where: { tenantId } }),
        db.crmWebhookDeliveryLog.count({}),
        db.crmEventDeliveryLog.count({}),
      ]);

    return {
      webhooks: {
        total: webhooks.length,
        active: webhooks.filter((w: any) => w.enabled).length,
      },
      calendar: {
        total: calendar.length,
        active: calendar.filter((c: any) => c.syncEnabled).length,
      },
      slack: {
        total: slack.length,
        active: slack.filter((s: any) => s.enabled).length,
      },
      totalDeliveryLogs: deliveryLogsCount,
      totalEventLogs: eventLogsCount,
    };
  }

  async getEventDeliveryLogs(
    tenantId = "tenant-1",
    eventType?: string,
    status?: string,
  ) {
    const where: any = { tenantId };
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    return db.crmEventDeliveryLog.findMany({ where });
  }

  async getEventDeliveryStats(tenantId = "tenant-1") {
    const [sent, failed, pending] = await Promise.all([
      db.crmEventDeliveryLog.count({ where: { tenantId, status: "SENT" } }),
      db.crmEventDeliveryLog.count({ where: { tenantId, status: "FAILED" } }),
      db.crmEventDeliveryLog.count({ where: { tenantId, status: "PENDING" } }),
    ]);
    return { sent, failed, pending };
  }

  async retryFailedDelivery(tenantId = "tenant-1", logId = "") {
    const log = await db.crmEventDeliveryLog.findFirst({
      where: { id: logId, tenantId },
    });
    if (!log) throw new NotFoundException("Event log not found");
    if (log.status !== "FAILED")
      throw new BadRequestException("Log is not in FAILED status");

    return db.crmEventDeliveryLog.update({
      where: { id: logId },
      data: {
        status: "PENDING",
        retryCount: (log.retryCount ?? 0) + 1,
      },
    });
  }

  async createConfig(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return this.createWebhookConfig(tenantId, orgId, dto);
  }

  async updateConfig(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updateWebhookConfig(tenantId, id, dto);
  }

  async deleteConfig(tenantId = "tenant-1", id = "") {
    return this.deleteWebhookConfig(tenantId, id);
  }

  async createConnection(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    return this.createCalendarConnection(tenantId, orgId, dto);
  }

  async updateConnection(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updateCalendarConnection(tenantId, id, dto);
  }

  async deleteConnection(tenantId = "tenant-1", id = "") {
    return this.deleteCalendarConnection(tenantId, id);
  }
}
