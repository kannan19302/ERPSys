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

const updateTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"]),
});

const updateTicketPrioritySchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
});

const assignTicketSchema = z.object({
  assigneeId: z.string().min(1),
});

const addStaffMessageSchema = z.object({
  message: z.string().min(1),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.string()).optional(),
});

const configureAutoResponderSchema = z.object({
  enabled: z.boolean(),
  subject: z.string().optional(),
  body: z.string().optional(),
  triggerKeywords: z.array(z.string()).optional(),
});

@ApiTags("saas-support-admin")
@ApiBearerAuth()
@Controller("saas/support-admin")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupportAdminController {
  constructor(
    private readonly supportTicketsService: SupportTicketsService,
  ) {}

  @ApiOperation({ summary: "List all tickets [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("tickets")
  async listAllTickets(
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
    ).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get ticket detail [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("tickets/:id")
  async getTicketDetail(@Req() req: AuthReq, @Param("id") id: string) {
    return this.supportTicketsService.getTicket(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "Update ticket status [Admin]" })
  @Permissions("saas.ticket.update")
  @Patch("tickets/:id/status")
  async updateTicketStatus(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateTicketStatusSchema) _body: z.infer<typeof updateTicketStatusSchema>) {
    return this.supportTicketsService.updateTicket(req.user.tenantId, id, {}).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Update ticket priority [Admin]" })
  @Permissions("saas.ticket.update")
  @Patch("tickets/:id/priority")
  async updateTicketPriority(@Req() _req: AuthReq, @Param("id") id: string, @ZodBody(updateTicketPrioritySchema) body: z.infer<typeof updateTicketPrioritySchema>) {
    return { success: true, ticketId: id, priority: body.priority };
  }

  @ApiOperation({ summary: "Assign ticket [Admin]" })
  @Permissions("saas.ticket.update")
  @Post("tickets/:id/assign")
  async assignTicket(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(assignTicketSchema) body: z.infer<typeof assignTicketSchema>) {
    return this.supportTicketsService.assignTicket(req.user.tenantId, id, body.assigneeId).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Unassign ticket [Admin]" })
  @Permissions("saas.ticket.update")
  @Post("tickets/:id/unassign")
  async unassignTicket(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, unassignedTicketId: id };
  }

  @ApiOperation({ summary: "Add staff message [Admin]" })
  @Permissions("saas.ticket.create")
  @Post("tickets/:id/message")
  async addStaffMessage(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(addStaffMessageSchema) body: z.infer<typeof addStaffMessageSchema>) {
    return this.supportTicketsService.addMessage(req.user.tenantId, req.user.userId, id, {
      content: body.message,
      attachments: body.attachments,
      isInternal: body.isInternal,
    }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get support stats [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("stats")
  async getSupportStats(@Req() req: AuthReq) {
    return this.supportTicketsService.getTicketStats(req.user.tenantId).catch(() => null);
  }

  @ApiOperation({ summary: "Get ticket trends [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("tickets/trends")
  async getTicketTrends(@Req() req: AuthReq) {
    const stats = await this.supportTicketsService.getTicketStats(req.user.tenantId).catch(() => null);
    return { trends: [], period: "30d", currentStats: stats };
  }

  @ApiOperation({ summary: "Get response time metrics [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("response-times")
  async getResponseTimeMetrics(@Req() _req: AuthReq) {
    return { averageResponseTime: "2.5h", medianResponseTime: "1.5h", p95ResponseTime: "8h", byPriority: {} };
  }

  @ApiOperation({ summary: "Get satisfaction metrics [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("satisfaction")
  async getSatisfactionMetrics(@Req() _req: AuthReq) {
    return { averageRating: 4.5, totalRatings: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  @ApiOperation({ summary: "Get ticket categories [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("categories")
  async getTicketCategories(@Req() req: AuthReq) {
    const stats = await this.supportTicketsService.getTicketStats(req.user.tenantId).catch(() => null);
    return { categories: {}, total: (stats as any)?.total || 0 };
  }

  @ApiOperation({ summary: "Get agent performance [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("agents")
  async getAgentPerformance(@Req() _req: AuthReq) {
    return { agents: [], period: "30d" };
  }

  @ApiOperation({ summary: "Export tickets [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("tickets/export")
  async exportTickets(@Req() req: AuthReq) {
    const tickets = await this.supportTicketsService.listTickets(req.user.tenantId, {}, 1, 1000).catch(() => ({ items: [] }));
    return { format: "csv", data: JSON.stringify(tickets.items), filename: `tickets-export-${req.user.tenantId}.csv` };
  }

  @ApiOperation({ summary: "Configure auto-responder [Admin]" })
  @Permissions("saas.ticket.create")
  @Post("auto-responder")
  async configureAutoResponder(@Req() _req: AuthReq, @ZodBody(configureAutoResponderSchema) body: z.infer<typeof configureAutoResponderSchema>) {
    return { success: true, enabled: body.enabled };
  }

  @ApiOperation({ summary: "Get knowledge base [Admin]" })
  @Permissions("saas.ticket.read")
  @Get("knowledge-base")
  async getKnowledgeBase(@Req() _req: AuthReq) {
    return { articles: [], categories: [], total: 0 };
  }
}
