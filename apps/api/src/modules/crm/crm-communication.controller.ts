import { Controller, Get, Post, Put, Delete, Param, Query, Req, Body, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import {
  CrmCommunicationService,
  channelSchema,
  templateSchema,
} from "./crm-communication.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-communication")
@ApiBearerAuth()
@Controller("crm/communication")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCommunicationChannelController {
  constructor(private readonly svc: CrmCommunicationService) {}

  @ApiOperation({ summary: "List communication channels" })
  @Get("channels")
  @Permissions("crm.communication.read")
  async listChannels(@Req() req: AuthenticatedRequest) {
    return this.svc.getChannels(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get communication channel with templates and logs" })
  @Get("channels/:id")
  @Permissions("crm.communication.read")
  async getChannel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getChannel(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create communication channel" })
  @Post("channels")
  @Permissions("crm.communication.manage")
  @TrackChanges("CommunicationChannel")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createChannel(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = channelSchema.parse(body);
    return this.svc.createChannel(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Update communication channel" })
  @Put("channels/:id")
  @Permissions("crm.communication.manage")
  async updateChannel(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = channelSchema.partial().parse(body);
    return this.svc.updateChannel(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete communication channel" })
  @Delete("channels/:id")
  @Permissions("crm.communication.manage")
  async deleteChannel(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteChannel(req.user.tenantId, id);
  }
}

@ApiTags("crm-communication")
@ApiBearerAuth()
@Controller("crm/communication")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCommunicationTemplateController {
  constructor(private readonly svc: CrmCommunicationService) {}

  @ApiOperation({ summary: "List communication templates" })
  @Get("templates")
  @Permissions("crm.communication.read")
  async listTemplates(
    @Req() req: AuthenticatedRequest,
    @Query("channelId") channelId?: string,
    @Query("category") category?: string,
  ) {
    return this.svc.getTemplates(req.user.tenantId, channelId, category);
  }

  @ApiOperation({ summary: "Get communication template" })
  @Get("templates/:id")
  @Permissions("crm.communication.read")
  async getTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create communication template" })
  @Post("templates")
  @Permissions("crm.communication.manage")
  @TrackChanges("CommunicationTemplate")
  @UseInterceptors(ChangeHistoryInterceptor)
  async createTemplate(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const dto = templateSchema.parse(body);
    return this.svc.createTemplate(req.user.tenantId, req.user.orgId, dto);
  }

  @ApiOperation({ summary: "Update communication template" })
  @Put("templates/:id")
  @Permissions("crm.communication.manage")
  async updateTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: any) {
    const dto = templateSchema.partial().parse(body);
    return this.svc.updateTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete communication template" })
  @Delete("templates/:id")
  @Permissions("crm.communication.manage")
  async deleteTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Send a communication" })
  @Post("send")
  @Permissions("crm.communication.send")
  async sendCommunication(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.svc.sendCommunication(
      req.user.tenantId, req.user.orgId,
      body.channelId, body.templateId,
      body.recipient, body.entityType, body.entityId,
    );
  }
}

@ApiTags("crm-communication")
@ApiBearerAuth()
@Controller("crm/communication")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCommunicationLogController {
  constructor(private readonly svc: CrmCommunicationService) {}

  @ApiOperation({ summary: "List communication logs" })
  @Get("logs")
  @Permissions("crm.communication.read")
  async listLogs(
    @Req() req: AuthenticatedRequest,
    @Query("channelId") channelId?: string,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.getLogs(req.user.tenantId, channelId, entityType, entityId, limit ? Number(limit) : undefined);
  }

  @ApiOperation({ summary: "Communication stats" })
  @Get("stats")
  @Permissions("crm.communication.read")
  async stats(@Req() req: AuthenticatedRequest) {
    return this.svc.getChannelStats(req.user.tenantId);
  }
}
