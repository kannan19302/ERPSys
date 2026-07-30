// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { CommunicationHelpdeskService } from "../services/communication-helpdesk.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-helpdesk")
@ApiBearerAuth()
@Controller("communication/helpdesk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HelpdeskController {
  constructor(private readonly svc: CommunicationHelpdeskService) {}

  @Get("tickets")
  @Permissions("communication.helpdesk.read")
  @ApiOperation({ summary: "List helpdesk tickets" })
  async getTickets(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getTickets(req.user.tenantId, q);
  }

  @Get("tickets/:id")
  @Permissions("communication.helpdesk.read")
  @ApiOperation({ summary: "Get helpdesk ticket" })
  async getTicket(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getTicket(req.user.tenantId, id);
  }

  @Post("tickets")
  @Permissions("communication.helpdesk.create")
  @ApiOperation({ summary: "Create helpdesk ticket" })
  async createTicket(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createTicket(req.user.tenantId, req.user.userId, body.body);
  }

  @Patch("tickets/:id")
  @Permissions("communication.helpdesk.update")
  @ApiOperation({ summary: "Update helpdesk ticket" })
  async updateTicket(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.updateTicket(req.user.tenantId, id, body.body);
  }

  @Post("tickets/:id/assign")
  @Permissions("communication.helpdesk.update")
  @ApiOperation({ summary: "Assign ticket" })
  async assignTicket(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.assignTicket(req.user.tenantId, id, body.body?.assignedTo);
  }

  @Post("tickets/:id/comments")
  @Permissions("communication.helpdesk.create")
  @ApiOperation({ summary: "Add ticket comment" })
  async addComment(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.addTicketComment(
      req.user.tenantId,
      id,
      req.user.userId,
      body.body,
    );
  }

  @Post("tickets/:id/escalate")
  @Permissions("communication.helpdesk.update")
  @ApiOperation({ summary: "Escalate ticket" })
  async escalateTicket(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.escalateTicket(
      req.user.tenantId,
      id,
      body.body?.reason || "",
    );
  }

  @Get("canned-responses")
  @Permissions("communication.helpdesk.read")
  @ApiOperation({ summary: "List canned responses" })
  async getCannedResponses(
    @Req() req: AuthReq,
    @Query("category") category?: string,
  ) {
    return this.svc.getCannedResponses(req.user.tenantId, category);
  }

  @Post("canned-responses")
  @Permissions("communication.helpdesk.create")
  @ApiOperation({ summary: "Create canned response" })
  async createCannedResponse(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createCannedResponse(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Get("canned-responses/:id")
  @Permissions("communication.helpdesk.read")
  @ApiOperation({ summary: "Get canned response" })
  async useCannedResponse(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.useCannedResponse(req.user.tenantId, id);
  }

  @Post("tickets/:id/satisfaction")
  @Permissions("communication.helpdesk.create")
  @ApiOperation({ summary: "Submit satisfaction rating" })
  async submitSatisfaction(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.submitSatisfaction(req.user.tenantId, id, body.body);
  }

  @Post("tickets/:id/send-survey")
  @Permissions("communication.helpdesk.create")
  @ApiOperation({ summary: "Send satisfaction survey" })
  async sendSatisfactionSurvey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.sendSatisfactionSurvey(req.user.tenantId, id);
  }

  @Get("dashboard")
  @Permissions("communication.helpdesk.read")
  @ApiOperation({ summary: "Helpdesk dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getHelpdeskDashboard(req.user.tenantId);
  }
}
