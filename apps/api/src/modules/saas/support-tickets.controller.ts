import {
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SupportTicketsService } from "./support-tickets.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  attachments: z.array(z.string()).optional(),
});

const updateTicketSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

const addMessageSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
  isInternal: z.boolean().default(false),
});

const assignTicketSchema = z.object({
  assigneeId: z.string().min(1),
});

@ApiTags("saas-support")
@ApiBearerAuth()
@Controller("saas/support")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @ApiOperation({ summary: "List support tickets" })
  @Permissions("saas.ticket.read")
  @Get("tickets")
  async listTickets(
    @Req() req: AuthReq,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.supportTicketsService.listTickets(
      req.user.tenantId,
      { status, priority },
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @ApiOperation({ summary: "Create support ticket" })
  @Permissions("saas.ticket.create")
  @Post("tickets")
  async createTicket(@Req() req: AuthReq, @ZodBody(createTicketSchema) body: z.infer<typeof createTicketSchema>) {
    return this.supportTicketsService.createTicket(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: "Get support ticket" })
  @Permissions("saas.ticket.read")
  @Get("tickets/:id")
  async getTicket(@Req() req: AuthReq, @Param("id") id: string) {
    return this.supportTicketsService.getTicket(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Update support ticket" })
  @Permissions("saas.ticket.update")
  @Patch("tickets/:id")
  async updateTicket(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateTicketSchema) body: z.infer<typeof updateTicketSchema>) {
    return this.supportTicketsService.updateTicket(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Add message to ticket" })
  @Permissions("saas.ticket.update")
  @Post("tickets/:id/messages")
  async addMessage(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(addMessageSchema) body: z.infer<typeof addMessageSchema>) {
    return this.supportTicketsService.addMessage(req.user.tenantId, req.user.userId, id, body);
  }

  @ApiOperation({ summary: "Close ticket" })
  @Permissions("saas.ticket.update")
  @Post("tickets/:id/close")
  async closeTicket(@Req() req: AuthReq, @Param("id") id: string) {
    return this.supportTicketsService.closeTicket(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Reopen ticket" })
  @Permissions("saas.ticket.update")
  @Post("tickets/:id/reopen")
  async reopenTicket(@Req() req: AuthReq, @Param("id") id: string) {
    return this.supportTicketsService.reopenTicket(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Escalate ticket" })
  @Permissions("saas.ticket.update")
  @Post("tickets/:id/escalate")
  async escalateTicket(@Req() req: AuthReq, @Param("id") id: string) {
    return this.supportTicketsService.escalateTicket(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Assign ticket" })
  @Permissions("saas.ticket.update")
  @Patch("tickets/:id/assign")
  async assignTicket(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(assignTicketSchema) body: z.infer<typeof assignTicketSchema>) {
    return this.supportTicketsService.assignTicket(req.user.tenantId, id, body.assigneeId);
  }

  @ApiOperation({ summary: "Get ticket stats" })
  @Permissions("saas.ticket.read")
  @Get("stats")
  async getTicketStats(@Req() req: AuthReq) {
    return this.supportTicketsService.getTicketStats(req.user.tenantId);
  }
}
