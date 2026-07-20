import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { UsageAlertsService } from "./usage-alerts.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updateNotificationPrefsSchema = z.object({
  billingAlerts: z.boolean().optional(),
  usageAlerts: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  maintenanceNotices: z.boolean().optional(),
});

const updateNotificationChannelsSchema = z.object({
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
});

const verifyChannelSchema = z.object({
  channel: z.enum(["email", "sms", "push"]),
  code: z.string().min(1),
});

const sendTestNotificationSchema = z.object({
  channel: z.enum(["email", "in_app", "push", "sms"]),
});

const scheduleNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  channel: z.enum(["email", "in_app", "push", "sms"]),
  scheduledAt: z.string().datetime(),
  recipients: z.array(z.string()).optional(),
});

const updateDigestSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
  time: z.string().optional(),
  includeBilling: z.boolean().optional(),
  includeUsage: z.boolean().optional(),
});

@ApiTags("saas-notifications")
@ApiBearerAuth()
@Controller("saas/notifications")
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationPrefsController {
  constructor(private readonly usageAlertsService: UsageAlertsService) {}

  @ApiOperation({ summary: "Get notification preferences" })
  @Permissions("saas.alert.read")
  @Get("preferences")
  async getNotificationPreferences(@Req() _req: AuthReq) {
    return {
      billingAlerts: true,
      usageAlerts: true,
      productUpdates: false,
      securityAlerts: true,
      maintenanceNotices: true,
    };
  }

  @ApiOperation({ summary: "Update notification preferences" })
  @Permissions("saas.alert.create")
  @Put("preferences")
  async updateNotificationPreferences(@Req() _req: AuthReq, @ZodBody(updateNotificationPrefsSchema) body: z.infer<typeof updateNotificationPrefsSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "List notification channels" })
  @Permissions("saas.alert.read")
  @Get("channels")
  async listNotificationChannels(@Req() _req: AuthReq) {
    return [
      { id: "email", name: "Email", verified: true, address: "user@example.com" },
      { id: "in_app", name: "In-App", verified: true, address: null },
      { id: "push", name: "Push", verified: false, address: null },
      { id: "sms", name: "SMS", verified: false, address: null },
    ];
  }

  @ApiOperation({ summary: "Update notification channels" })
  @Permissions("saas.alert.create")
  @Put("channels")
  async updateNotificationChannels(@Req() _req: AuthReq, @ZodBody(updateNotificationChannelsSchema) body: z.infer<typeof updateNotificationChannelsSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "Verify channel" })
  @Permissions("saas.alert.create")
  @Post("channels/verify")
  async verifyChannel(@Req() _req: AuthReq, @ZodBody(verifyChannelSchema) body: z.infer<typeof verifyChannelSchema>) {
    return { success: true, channel: body.channel, verified: true };
  }

  @ApiOperation({ summary: "Get notification history" })
  @Permissions("saas.alert.read")
  @Get("history")
  async getNotificationHistory(@Req() req: AuthReq) {
    return this.usageAlertsService.getAlertHistory(req.user.tenantId).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Send test notification" })
  @Permissions("saas.alert.create")
  @Post("test")
  async sendTestNotification(@Req() _req: AuthReq, @ZodBody(sendTestNotificationSchema) body: z.infer<typeof sendTestNotificationSchema>) {
    return { success: true, channel: body.channel, sentAt: new Date() };
  }

  @ApiOperation({ summary: "List scheduled notifications" })
  @Permissions("saas.alert.read")
  @Get("scheduled")
  async listScheduledNotifications(@Req() _req: AuthReq) {
    return [];
  }

  @ApiOperation({ summary: "Schedule notification" })
  @Permissions("saas.alert.create")
  @Post("scheduled")
  async scheduleNotification(@Req() _req: AuthReq, @ZodBody(scheduleNotificationSchema) body: z.infer<typeof scheduleNotificationSchema>) {
    return { success: true, id: "sched_" + Date.now(), ...body };
  }

  @ApiOperation({ summary: "Cancel scheduled notification" })
  @Permissions("saas.alert.create")
  @Delete("scheduled/:id")
  async cancelScheduledNotification(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, cancelledId: id };
  }

  @ApiOperation({ summary: "Get digest settings" })
  @Permissions("saas.alert.read")
  @Get("digest")
  async getDigestSettings(@Req() _req: AuthReq) {
    return { enabled: false, frequency: "weekly", time: "09:00", includeBilling: true, includeUsage: true };
  }

  @ApiOperation({ summary: "Update digest settings" })
  @Permissions("saas.alert.create")
  @Put("digest")
  async updateDigestSettings(@Req() _req: AuthReq, @ZodBody(updateDigestSettingsSchema) body: z.infer<typeof updateDigestSettingsSchema>) {
    return { success: true, ...body };
  }
}
