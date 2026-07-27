import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { NotificationsDeepService } from "./notifications-deep.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  channel: z.string().optional(),
  variables: z.array(z.string()).optional(),
  eventType: z.string().optional(),
  category: z.string().optional(),
});

const templateUpdateSchema = templateSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

const preferenceSchema = z.object({
  channelName: z.string().min(1),
  eventType: z.string().min(1),
  isEnabled: z.boolean(),
});

const digestSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "INSTANT"]),
  channel: z.string().optional(),
  isEnabled: z.boolean().optional(),
  preferences: z.record(z.any()).optional(),
});

const batchSchema = z.object({
  name: z.string().min(1),
  channel: z.string().optional(),
  templateId: z.string().optional(),
  items: z
    .array(
      z.object({
        userId: z.string().min(1),
        recipient: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(1),
  scheduledAt: z.string().datetime().optional(),
});

const renderSchema = z.object({ variables: z.record(z.string()) });

@ApiTags("notifications-deep")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationsDeepController {
  constructor(private readonly service: NotificationsDeepService) {}

  @Get("channels")
  @Permissions("notifications.channel.read")
  async getChannels(@Req() req: AuthenticatedRequest) {
    return this.service.getChannels(req.user.tenantId);
  }

  @Put("channels")
  @Permissions("notifications.channel.update")
  async updateChannel(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string; isEnabled: boolean },
  ) {
    return this.service.updateChannel(
      req.user.tenantId,
      body.name,
      body.isEnabled,
    );
  }

  @Get("preferences")
  @Permissions("notifications.preference.read")
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.service.getPreferences(req.user.tenantId, req.user.userId);
  }

  @Post("preferences")
  @Permissions("notifications.preference.update")
  async upsertPreference(
    @Req() req: AuthenticatedRequest,
    @ZodBody(preferenceSchema) body: z.infer<typeof preferenceSchema>,
  ) {
    return this.service.upsertPreference(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Post("preferences/bulk")
  @Permissions("notifications.preference.update")
  async bulkUpdatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body() body: { preferences: z.infer<typeof preferenceSchema>[] },
  ) {
    return this.service.bulkUpdatePreferences(
      req.user.tenantId,
      req.user.userId,
      body.preferences,
    );
  }

  @Get("templates")
  @Permissions("notifications.template.read")
  async getTemplates(
    @Req() req: AuthenticatedRequest,
    @Query("channel") channel?: string,
  ) {
    return this.service.getTemplates(req.user.tenantId, channel);
  }

  @Get("templates/:id")
  @Permissions("notifications.template.read")
  async getTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.getTemplate(req.user.tenantId, id);
  }

  @Post("templates")
  @Permissions("notifications.template.create")
  async createTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(templateSchema) body: z.infer<typeof templateSchema>,
  ) {
    return this.service.createTemplate(req.user.tenantId, body);
  }

  @Put("templates/:id")
  @Permissions("notifications.template.update")
  async updateTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(templateUpdateSchema) body: any,
  ) {
    return this.service.updateTemplate(req.user.tenantId, id, body);
  }

  @Delete("templates/:id")
  @Permissions("notifications.template.delete")
  async deleteTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteTemplate(req.user.tenantId, id);
  }

  @Post("templates/:id/render")
  @Permissions("notifications.template.read")
  async renderTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(renderSchema) body: z.infer<typeof renderSchema>,
  ) {
    return this.service.renderTemplate(req.user.tenantId, id, body.variables);
  }

  @Get("digests")
  @Permissions("notifications.digest.read")
  async getDigests(@Req() req: AuthenticatedRequest) {
    return this.service.getDigests(req.user.tenantId, req.user.userId);
  }

  @Post("digests")
  @Permissions("notifications.digest.create")
  async upsertDigest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(digestSchema) body: z.infer<typeof digestSchema>,
  ) {
    return this.service.upsertDigest(req.user.tenantId, req.user.userId, body);
  }

  @Delete("digests/:id")
  @Permissions("notifications.digest.delete")
  async deleteDigest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteDigest(req.user.tenantId, req.user.userId, id);
  }

  @Get("batches")
  @Permissions("notifications.batch.read")
  async getBatches(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.service.getBatches(req.user.tenantId, status);
  }

  @Post("batches")
  @Permissions("notifications.batch.create")
  async createBatch(
    @Req() req: AuthenticatedRequest,
    @ZodBody(batchSchema) body: z.infer<typeof batchSchema>,
  ) {
    return this.service.createBatch(req.user.tenantId, body);
  }

  @Get("batches/:id")
  @Permissions("notifications.batch.read")
  async getBatchItems(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getBatchItems(req.user.tenantId, id);
  }

  @Post("batches/:id/process")
  @Permissions("notifications.batch.create")
  async processBatch(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.processBatch(req.user.tenantId, id);
  }

  @Get("delivery-logs")
  @Permissions("notifications.digest.read")
  async getDeliveryLogs(
    @Req() req: AuthenticatedRequest,
    @Query("userId") userId?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.getDeliveryLogs(
      req.user.tenantId,
      userId,
      status,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
