import { Controller, Post, Body, Param, Get, Patch, UseGuards, Req } from "@nestjs/common";
import { TicketLifecycleService } from "../services/ticket-lifecycle.service";
import { TicketAssignmentService } from "../services/ticket-assignment.service";

@Controller("service-management/tickets")
export class TicketController {
  constructor(
    private readonly lifecycleService: TicketLifecycleService,
    private readonly assignmentService: TicketAssignmentService
  ) {}

  @Post()
  async createTicket(@Req() req: any, @Body() body: any) {
    const tenantId = req.app?.current_tenant_id || "demo";
    return this.lifecycleService.createTicket(tenantId, {
      title: body.title,
      description: body.description,
      type: body.type,
      priority: body.priority,
      source: body.source || "API",
      categoryId: body.categoryId,
      reporterId: req.user?.id
    });
  }

  @Get(":id")
  async getTicket(@Req() req: any, @Param("id") id: string) {
    const tenantId = req.app?.current_tenant_id || "demo";
    return this.lifecycleService.getTicket(tenantId, id);
  }

  @Patch(":id/status")
  async updateStatus(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const tenantId = req.app?.current_tenant_id || "demo";
    const actorId = req.user?.id || "system";
    return this.lifecycleService.updateStatus(tenantId, id, body.status, actorId);
  }

  @Patch(":id/assign")
  async assignTicket(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    const tenantId = req.app?.current_tenant_id || "demo";
    const actorId = req.user?.id || "system";
    return this.assignmentService.assignTicket(tenantId, id, body.assigneeId, actorId);
  }
}
