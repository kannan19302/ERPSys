// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { CommunicationOmnichannelService } from "../services/communication-omnichannel.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-omnichannel")
@ApiBearerAuth()
@Controller("communication/omnichannel")
@UseGuards(JwtAuthGuard, RbacGuard)
export class OmnichannelController {
  constructor(private readonly svc: CommunicationOmnichannelService) {}

  @Get("inbox")
  @Permissions("communication.omnichannel.read")
  @ApiOperation({ summary: "Get unified inbox" })
  async getInbox(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getUnifiedInbox(req.user.tenantId, req.user.userId, q);
  }

  @Get("conversations/:id")
  @Permissions("communication.omnichannel.read")
  @ApiOperation({ summary: "Get conversation" })
  async getConversation(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getConversation(req.user.tenantId, id);
  }

  @Post("conversations/:id/messages")
  @Permissions("communication.omnichannel.create")
  @ApiOperation({ summary: "Send message" })
  async sendMessage(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.sendMessage(req.user.tenantId, id, {
      ...body.body,
      authorId: req.user.userId,
    });
  }

  @Post("conversations/:id/assign")
  @Permissions("communication.omnichannel.update")
  @ApiOperation({ summary: "Assign conversation" })
  async assignConversation(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.assignConversation(
      req.user.tenantId,
      id,
      body.body?.assignedTo,
    );
  }

  @Post("conversations/:id/close")
  @Permissions("communication.omnichannel.update")
  @ApiOperation({ summary: "Close conversation" })
  async closeConversation(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.closeConversation(req.user.tenantId, id);
  }

  @Post("conversations/:id/tags")
  @Permissions("communication.omnichannel.update")
  @ApiOperation({ summary: "Tag conversation" })
  async smartTagMessage(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.smartTagMessage(
      req.user.tenantId,
      id,
      body.body?.tags || [],
    );
  }

  @Post("conversations/:id/auto-route")
  @Permissions("communication.omnichannel.update")
  @ApiOperation({ summary: "Auto-route conversation" })
  async autoRouteMessage(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.autoRouteMessage(req.user.tenantId, id);
  }

  @Get("integrations")
  @Permissions("communication.omnichannel.read")
  @ApiOperation({ summary: "List integrations" })
  async getIntegrations(@Req() req: AuthReq) {
    return this.svc.getIntegrations(req.user.tenantId);
  }

  @Post("integrations")
  @Permissions("communication.omnichannel.create")
  @ApiOperation({ summary: "Create integration" })
  async createIntegration(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createIntegration(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Patch("integrations/:id")
  @Permissions("communication.omnichannel.update")
  @ApiOperation({ summary: "Update integration" })
  async updateIntegration(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.updateIntegration(req.user.tenantId, id, body.body);
  }

  @Get("routing-rules")
  @Permissions("communication.omnichannel.read")
  @ApiOperation({ summary: "List routing rules" })
  async getRoutingRules(@Req() req: AuthReq) {
    return this.svc.getRoutingRules(req.user.tenantId);
  }

  @Post("routing-rules")
  @Permissions("communication.omnichannel.create")
  @ApiOperation({ summary: "Create routing rule" })
  async createRoutingRule(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createRoutingRule(req.user.tenantId, body.body);
  }

  @Get("dashboard")
  @Permissions("communication.omnichannel.read")
  @ApiOperation({ summary: "Omnichannel dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getOmnichannelDashboard(req.user.tenantId);
  }
}
