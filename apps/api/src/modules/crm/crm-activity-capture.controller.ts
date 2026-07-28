import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmActivityCaptureService } from "./crm-activity-capture.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / activity-capture")
@ApiBearerAuth()
@Controller("crm/activity-capture")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmActivityCaptureController {
  constructor(private readonly svc: CrmActivityCaptureService) {}

  @ApiOperation({ summary: "Get email tracking events" })
  @Get("email-tracking")
  @Permissions("crm.activity-capture.email-tracking.read")
  async getEmailTrackingEvents(
    @Req() req: AuthenticatedRequest,
    @Query("messageId") messageId?: string,
  ) {
    return this.svc.getEmailTrackingEvents(req.user.tenantId, messageId);
  }

  @ApiOperation({ summary: "Record email open (tracking pixel)" })
  @Post("email-tracking/open")
  @Permissions("crm.activity-capture.email-tracking.create")
  async recordEmailOpen(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      messageId: string;
      recipient: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    return this.svc.recordEmailOpen(
      req.user.tenantId,
      body.messageId,
      body.recipient,
      body.ipAddress,
    );
  }

  @ApiOperation({ summary: "Record email click" })
  @Post("email-tracking/click")
  @Permissions("crm.activity-capture.email-tracking.create")
  async recordEmailClick(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      messageId: string;
      recipient: string;
      linkUrl: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ) {
    return this.svc.recordEmailClick(
      req.user.tenantId,
      body.messageId,
      body.recipient,
      body.linkUrl,
    );
  }

  @ApiOperation({ summary: "Get email engagement stats" })
  @Get("email-engagement/:messageId")
  @Permissions("crm.activity-capture.email-tracking.read")
  async getEmailEngagement(
    @Req() req: AuthenticatedRequest,
    @Param("messageId") messageId: string,
  ) {
    return this.svc.getEmailEngagement(req.user.tenantId, messageId);
  }

  @ApiOperation({ summary: "Get auto-captured timeline" })
  @Get("timeline")
  @Permissions("crm.activity-capture.read")
  async getActivityTimeline(
    @Req() req: AuthenticatedRequest,
    @Query("entityType") entityType: string,
    @Query("entityId") entityId: string,
  ) {
    return this.svc.getActivityTimeline(
      req.user.tenantId,
      entityType,
      entityId,
    );
  }

  @ApiOperation({ summary: "Get unlinked emails" })
  @Get("unlinked")
  @Permissions("crm.activity-capture.read")
  async getUnlinkedEmails(@Req() req: AuthenticatedRequest) {
    return this.svc.getUnlinkedEmails(req.user.tenantId);
  }

  @ApiOperation({ summary: "Link email to CRM record" })
  @Post("link")
  @Permissions("crm.activity-capture.create")
  async linkEmailToCrmRecord(
    @Req() req: AuthenticatedRequest,
    @Body() body: { emailId: string; entityType: string; entityId: string },
  ) {
    return this.svc.linkEmailToCrmRecord(
      req.user.tenantId,
      body.emailId,
      body.entityType,
      body.entityId,
    );
  }

  @ApiOperation({ summary: "Trigger mailbox sync" })
  @Post("sync/mailbox/:mailboxId")
  @Permissions("crm.activity-capture.create")
  async syncMailbox(
    @Req() req: AuthenticatedRequest,
    @Param("mailboxId") mailboxId: string,
  ) {
    return this.svc.autoLogEmailFromMailbox(req.user.tenantId, mailboxId);
  }

  @ApiOperation({ summary: "Trigger calendar sync" })
  @Post("sync/calendar/:connectionId")
  @Permissions("crm.activity-capture.create")
  async syncCalendar(
    @Req() req: AuthenticatedRequest,
    @Param("connectionId") connectionId: string,
  ) {
    return this.svc.autoLogCalendarEvent(req.user.tenantId, connectionId);
  }

  @ApiOperation({ summary: "Get auto-capture settings" })
  @Get("settings")
  @Permissions("crm.activity-capture.read")
  async getSettings(@Req() req: AuthenticatedRequest) {
    return this.svc.getAutoCaptureSettings(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: "Update auto-capture settings" })
  @Put("settings")
  @Permissions("crm.activity-capture.update")
  async updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      captureEmails?: boolean;
      captureCalendar?: boolean;
      autoLinkEnabled?: boolean;
      emailProviders?: string[];
      calendarProviders?: string[];
      syncIntervalMinutes?: number;
    },
  ) {
    return this.svc.updateAutoCaptureSettings(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @ApiOperation({ summary: "Get calendar sync logs" })
  @Get("calendar-logs")
  @Permissions("crm.activity-capture.read")
  async getCalendarLogs(
    @Req() req: AuthenticatedRequest,
    @Query("userId") userId?: string,
  ) {
    return this.svc.getCalendarSyncLogs(
      req.user.tenantId,
      userId || req.user.userId,
    );
  }

  @ApiOperation({ summary: "Get A/B tests" })
  @Get("ab-tests")
  @Permissions("crm.activity-capture.ab-tests.read")
  async getABTests(@Req() req: AuthenticatedRequest) {
    return this.svc.getEmailSequenceABTests(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create A/B test" })
  @Post("ab-tests")
  @Permissions("crm.activity-capture.ab-tests.create")
  async createABTest(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      sequenceId: string;
      name: string;
      variantA: Record<string, unknown>;
      variantB: Record<string, unknown>;
    },
  ) {
    return this.svc.createABTest(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get A/B test results" })
  @Get("ab-tests/:id/results")
  @Permissions("crm.activity-capture.ab-tests.read")
  async getABTestResults(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getABTestResults(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Complete A/B test" })
  @Post("ab-tests/:id/complete")
  @Permissions("crm.activity-capture.ab-tests.update")
  async completeABTest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.completeABTest(req.user.tenantId, id);
  }
}
