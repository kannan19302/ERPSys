import { Controller, Get, Post, Param, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { FieldServiceService } from "./field-service.service";
import { Request } from "express";

interface AuthRequest extends Request { user: { tenantId: string; userId: string }; }

@Controller("ext/field-service")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FieldServiceController {
  constructor(private readonly svc: FieldServiceService) {}

  // ── Tickets ──
  @Get("tickets")
  @Permissions("field-service.ticket.read")
  async getTickets(@Req() req: AuthRequest) { return this.svc.getTickets(req.user.tenantId); }

  @Get("tickets/:id")
  @Permissions("field-service.ticket.read")
  async getTicket(@Req() req: AuthRequest, @Param("id") id: string) { return this.svc.getTicketById(req.user.tenantId, id); }

  @Post("tickets")
  @Permissions("field-service.ticket.create")
  async createTicket(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createTicket(req.user.tenantId, body); }

  // ── Dispatches ──
  @Get("dispatches")
  @Permissions("field-service.dispatch.read")
  async getDispatches(@Req() req: AuthRequest) { return this.svc.getDispatches(req.user.tenantId); }

  @Post("dispatches")
  @Permissions("field-service.dispatch.create")
  async createDispatch(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createDispatch(req.user.tenantId, body); }

  // ── Technicians ──
  @Get("technicians")
  @Permissions("field-service.technician.read")
  async getTechnicians(@Req() req: AuthRequest) { return this.svc.getTechnicians(req.user.tenantId); }

  // ── Preventive Maintenance ──
  @Get("preventive-maintenances")
  @Permissions("field-service.preventive.read")
  async getPreventiveMaintenances(@Req() req: AuthRequest) { return this.svc.getPreventiveMaintenances(req.user.tenantId); }

  @Post("preventive-maintenances")
  @Permissions("field-service.preventive.create")
  async createPreventiveMaintenance(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createPreventiveMaintenance(req.user.tenantId, body); }

  // ── Checklists ──
  @Get("checklists")
  @Permissions("field-service.checklist.read")
  async getChecklists(@Req() req: AuthRequest) { return this.svc.getChecklists(req.user.tenantId); }

  @Post("checklists")
  @Permissions("field-service.checklist.create")
  async createChecklist(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createChecklist(req.user.tenantId, body); }
}
