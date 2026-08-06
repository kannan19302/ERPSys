import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TicketLifecycleService } from "../services/ticket-lifecycle.service";
import { TicketAssignmentService } from "../services/ticket-assignment.service";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";

// This controller creates, reads, reassigns and transitions support tickets for
// a tenant, and had no @UseGuards at all — `UseGuards` was imported and never
// applied — so every route was reachable unauthenticated. Same defect class as
// the nine controllers in the R12 sweep: @Permissions writes metadata that only
// RbacGuard reads, and RbacGuard is only present if it is declared.
@Controller("service-management/tickets")
@UseGuards(JwtAuthGuard, RbacGuard)
export class TicketController {
  constructor(
    private readonly lifecycleService: TicketLifecycleService,
    private readonly assignmentService: TicketAssignmentService,
  ) {}

  @Permissions("service-management.ticket.create")
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
      reporterId: req.user?.id,
    });
  }

  @Permissions("service-management.ticket.read")
  @Get(":id")
  async getTicket(@Req() req: any, @Param("id") id: string) {
    const tenantId = req.app?.current_tenant_id || "demo";
    return this.lifecycleService.getTicket(tenantId, id);
  }

  @Permissions("service-management.status.update")
  @Patch(":id/status")
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const tenantId = req.app?.current_tenant_id || "demo";
    const actorId = req.user?.id || "system";
    return this.lifecycleService.updateStatus(
      tenantId,
      id,
      body.status,
      actorId,
    );
  }

  @Permissions("service-management.ticket.assign")
  @Patch(":id/assign")
  async assignTicket(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const tenantId = req.app?.current_tenant_id || "demo";
    const actorId = req.user?.id || "system";
    return this.assignmentService.assignTicket(
      tenantId,
      id,
      body.assigneeId,
      actorId,
    );
  }
}
