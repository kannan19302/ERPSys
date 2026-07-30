// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { FieldServiceTicketsService } from "./field-service-tickets.service";
import { FieldServiceDispatchService } from "./field-service-dispatch.service";
import { FieldServiceLogisticsService } from "./field-service-logistics.service";
import { FieldServiceTechMobileService } from "./field-service-tech-mobile.service";
import { FieldServiceSchedulingService } from "./field-service-scheduling.service";
import { FieldServicePartsService } from "./field-service-parts.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string };
}

@Controller("ext/field-service")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FieldServiceController {
  constructor(
    private readonly tickets: FieldServiceTicketsService,
    private readonly dispatch: FieldServiceDispatchService,
    private readonly logistics: FieldServiceLogisticsService,
    private readonly techMobile: FieldServiceTechMobileService,
    private readonly scheduling: FieldServiceSchedulingService,
    private readonly parts: FieldServicePartsService,
  ) {}

  // ── Tickets ──
  @Get("tickets")
  @Permissions("field-service.ticket.read")
  async getTickets(@Req() req: AuthRequest, @Query() query: any) {
    return this.tickets.getTickets(req.user.tenantId, query);
  }
  @Get("tickets/stats")
  @Permissions("field-service.ticket.read")
  async getTicketStats(@Req() req: AuthRequest) {
    return this.tickets.getTicketStats(req.user.tenantId);
  }
  @Get("tickets/:id")
  @Permissions("field-service.ticket.read")
  async getTicket(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.getTicketById(req.user.tenantId, id);
  }
  @Post("tickets")
  @Permissions("field-service.ticket.create")
  async createTicket(@Req() req: AuthRequest, @Body() body: any) {
    return this.tickets.createTicket(req.user.tenantId, body);
  }
  @Put("tickets/:id")
  @Permissions("field-service.ticket.update")
  async updateTicket(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tickets.updateTicket(req.user.tenantId, id, body);
  }
  @Delete("tickets/:id")
  @Permissions("field-service.ticket.delete")
  async deleteTicket(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.deleteTicket(req.user.tenantId, id);
  }
  @Post("tickets/:id/assign")
  @Permissions("field-service.ticket.update")
  async assignTicket(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tickets.assignTicket(req.user.tenantId, id, body.technicianId);
  }
  @Post("tickets/:id/close")
  @Permissions("field-service.ticket.update")
  async closeTicket(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tickets.closeTicket(req.user.tenantId, id, body);
  }
  @Post("tickets/bulk-update")
  @Permissions("field-service.ticket.update")
  async bulkUpdateTickets(@Req() req: AuthRequest, @Body() body: any) {
    return this.tickets.bulkUpdateTickets(
      req.user.tenantId,
      body.ids,
      body.data,
    );
  }
  @Get("tickets/:id/sla-evaluate")
  @Permissions("field-service.ticket.read")
  async evaluateTicketSla(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.evaluateTicketSla(req.user.tenantId, id);
  }

  // ── SLA Management ──
  @Get("slas")
  @Permissions("field-service.sla.read")
  async getSlas(@Req() req: AuthRequest) {
    return this.tickets.getSlas(req.user.tenantId);
  }
  @Get("slas/:id")
  @Permissions("field-service.sla.read")
  async getSla(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.getSlaById(req.user.tenantId, id);
  }
  @Get("slas/:id/compliance")
  @Permissions("field-service.sla.read")
  async checkSlaCompliance(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.checkSlaCompliance(req.user.tenantId, id);
  }
  @Post("slas")
  @Permissions("field-service.sla.create")
  async createSla(@Req() req: AuthRequest, @Body() body: any) {
    return this.tickets.createSla(req.user.tenantId, body);
  }
  @Put("slas/:id")
  @Permissions("field-service.sla.update")
  async updateSla(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tickets.updateSla(req.user.tenantId, id, body);
  }
  @Delete("slas/:id")
  @Permissions("field-service.sla.delete")
  async deleteSla(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.deleteSla(req.user.tenantId, id);
  }

  // ── Checklists ──
  @Get("checklists")
  @Permissions("field-service.checklist.read")
  async getChecklists(@Req() req: AuthRequest) {
    return this.tickets.getChecklists(req.user.tenantId);
  }
  @Get("checklists/:id")
  @Permissions("field-service.checklist.read")
  async getChecklist(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.getChecklistById(req.user.tenantId, id);
  }
  @Post("checklists")
  @Permissions("field-service.checklist.create")
  async createChecklist(@Req() req: AuthRequest, @Body() body: any) {
    return this.tickets.createChecklist(req.user.tenantId, body);
  }
  @Put("checklists/:id")
  @Permissions("field-service.checklist.update")
  async updateChecklist(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.tickets.updateChecklist(req.user.tenantId, id, body);
  }
  @Delete("checklists/:id")
  @Permissions("field-service.checklist.delete")
  async deleteChecklist(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.tickets.deleteChecklist(req.user.tenantId, id);
  }

  // ── Technicians ──
  @Get("technicians")
  @Permissions("field-service.technician.read")
  async getTechnicians(@Req() req: AuthRequest, @Query() query: any) {
    return this.dispatch.getTechnicians(req.user.tenantId, query);
  }
  @Get("technicians/stats")
  @Permissions("field-service.technician.read")
  async getTechnicianStats(@Req() req: AuthRequest) {
    return this.dispatch.getTechnicianStats(req.user.tenantId);
  }
  @Get("technicians/:id")
  @Permissions("field-service.technician.read")
  async getTechnician(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.dispatch.getTechnicianById(req.user.tenantId, id);
  }
  @Post("technicians")
  @Permissions("field-service.technician.create")
  async createTechnician(@Req() req: AuthRequest, @Body() body: any) {
    return this.dispatch.createTechnician(req.user.tenantId, body);
  }
  @Put("technicians/:id")
  @Permissions("field-service.technician.update")
  async updateTechnician(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.updateTechnician(req.user.tenantId, id, body);
  }
  @Delete("technicians/:id")
  @Permissions("field-service.technician.delete")
  async deleteTechnician(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.dispatch.deleteTechnician(req.user.tenantId, id);
  }
  @Patch("technicians/:id/location")
  @Permissions("field-service.technician.update")
  async updateTechnicianLocation(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.updateTechnicianLocation(
      req.user.tenantId,
      id,
      body.latitude,
      body.longitude,
    );
  }
  @Patch("technicians/:id/status")
  @Permissions("field-service.technician.update")
  async setTechnicianStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.setTechnicianStatus(
      req.user.tenantId,
      id,
      body.status,
    );
  }

  // ── Dispatch ──
  @Get("dispatch")
  @Permissions("field-service.dispatch.read")
  async getDispatches(@Req() req: AuthRequest, @Query() query: any) {
    return this.dispatch.getDispatches(req.user.tenantId, query);
  }
  @Get("dispatch/stats")
  @Permissions("field-service.dispatch.read")
  async getDispatchStats(@Req() req: AuthRequest) {
    return this.dispatch.getDispatchStats(req.user.tenantId);
  }
  @Get("dispatch/schedule")
  @Permissions("field-service.dispatch.read")
  async getDailySchedule(
    @Req() req: AuthRequest,
    @Query("date") date?: string,
  ) {
    return this.dispatch.getDailySchedule(req.user.tenantId, date);
  }
  @Get("dispatch/:id")
  @Permissions("field-service.dispatch.read")
  async getDispatch(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.dispatch.getDispatchById(req.user.tenantId, id);
  }
  @Post("dispatch")
  @Permissions("field-service.dispatch.create")
  async createDispatch(@Req() req: AuthRequest, @Body() body: any) {
    return this.dispatch.createDispatch(req.user.tenantId, body);
  }
  @Put("dispatch/:id")
  @Permissions("field-service.dispatch.update")
  async updateDispatch(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.updateDispatch(req.user.tenantId, id, body);
  }
  @Patch("dispatch/:id/status")
  @Permissions("field-service.dispatch.update")
  async updateDispatchStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.updateDispatchStatus(
      req.user.tenantId,
      id,
      body.status,
    );
  }
  @Post("dispatch/:id/cancel")
  @Permissions("field-service.dispatch.update")
  async cancelDispatch(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.dispatch.cancelDispatch(req.user.tenantId, id);
  }

  // ── Appointments ──
  @Get("appointments")
  @Permissions("field-service.appointments.read")
  async getAppointments(@Req() req: AuthRequest, @Query() query: any) {
    return this.dispatch.getAppointments(req.user.tenantId, query);
  }
  @Get("appointments/:id")
  @Permissions("field-service.appointments.read")
  async getAppointment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.dispatch.getAppointmentById(req.user.tenantId, id);
  }
  @Post("appointments")
  @Permissions("field-service.appointments.create")
  async createAppointment(@Req() req: AuthRequest, @Body() body: any) {
    return this.dispatch.createAppointment(req.user.tenantId, body);
  }
  @Put("appointments/:id")
  @Permissions("field-service.appointments.update")
  async updateAppointment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.updateAppointment(req.user.tenantId, id, body);
  }
  @Post("appointments/:id/checkin")
  @Permissions("field-service.appointments.update")
  async checkInAppointment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.checkInAppointment(req.user.tenantId, id, body);
  }
  @Post("appointments/:id/checkout")
  @Permissions("field-service.appointments.update")
  async checkOutAppointment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.dispatch.checkOutAppointment(req.user.tenantId, id, body);
  }
  @Post("appointments/:id/cancel")
  @Permissions("field-service.appointments.update")
  async cancelAppointment(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.dispatch.cancelAppointment(req.user.tenantId, id);
  }

  // ── Inventory ──
  @Get("inventory")
  @Permissions("field-service.inventory.read")
  async getInventory(@Req() req: AuthRequest, @Query() query: any) {
    return this.logistics.getInventoryItems(req.user.tenantId, query);
  }
  @Get("inventory/stats")
  @Permissions("field-service.inventory.read")
  async getInventoryStats(@Req() req: AuthRequest) {
    return this.logistics.getInventoryStats(req.user.tenantId);
  }
  @Get("inventory/low-stock")
  @Permissions("field-service.inventory.read")
  async getLowStockItems(@Req() req: AuthRequest) {
    return this.logistics.getLowStockItems(req.user.tenantId);
  }
  @Get("inventory/:id")
  @Permissions("field-service.inventory.read")
  async getInventoryItem(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.getInventoryItemById(req.user.tenantId, id);
  }
  @Post("inventory")
  @Permissions("field-service.inventory.create")
  async createInventoryItem(@Req() req: AuthRequest, @Body() body: any) {
    return this.logistics.createInventoryItem(req.user.tenantId, body);
  }
  @Put("inventory/:id")
  @Permissions("field-service.inventory.update")
  async updateInventoryItem(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.logistics.updateInventoryItem(req.user.tenantId, id, body);
  }
  @Delete("inventory/:id")
  @Permissions("field-service.inventory.delete")
  async deleteInventoryItem(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.deleteInventoryItem(req.user.tenantId, id);
  }
  @Post("inventory/:id/restock")
  @Permissions("field-service.inventory.update")
  async restockItem(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.logistics.restockItem(req.user.tenantId, id, body.quantity);
  }
  @Post("inventory/:id/transfer")
  @Permissions("field-service.inventory.update")
  async transferStock(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.logistics.transferStock(
      req.user.tenantId,
      id,
      body.fromVan,
      body.quantity,
    );
  }
  @Post("inventory/bulk-update")
  @Permissions("field-service.inventory.update")
  async bulkUpdateInventory(@Req() req: AuthRequest, @Body() body: any) {
    return this.logistics.bulkUpdateInventory(
      req.user.tenantId,
      body.ids,
      body.data,
    );
  }

  // ── Parts Usage ──
  @Get("parts-usage")
  @Permissions("field-service.parts-usage.read")
  async getPartsUsage(@Req() req: AuthRequest, @Query() query: any) {
    return this.logistics.getPartsUsage(req.user.tenantId, query);
  }
  @Post("parts-usage")
  @Permissions("field-service.parts-usage.create")
  async createPartsUsage(@Req() req: AuthRequest, @Body() body: any) {
    return this.logistics.createPartsUsage(req.user.tenantId, body);
  }
  @Delete("parts-usage/:id")
  @Permissions("field-service.parts-usage.delete")
  async deletePartsUsage(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.deletePartsUsage(req.user.tenantId, id);
  }

  // ── Contracts ──
  @Get("contracts")
  @Permissions("field-service.contract.read")
  async getContracts(@Req() req: AuthRequest, @Query() query: any) {
    return this.logistics.getContracts(req.user.tenantId, query);
  }
  @Get("contracts/stats")
  @Permissions("field-service.contract.read")
  async getContractStats(@Req() req: AuthRequest) {
    return this.logistics.getContractStats(req.user.tenantId);
  }
  @Get("contracts/expiring")
  @Permissions("field-service.contract.read")
  async getExpiringContracts(
    @Req() req: AuthRequest,
    @Query("days") days?: string,
  ) {
    return this.logistics.getExpiringContracts(
      req.user.tenantId,
      days ? parseInt(days) : 30,
    );
  }
  @Get("contracts/:id")
  @Permissions("field-service.contract.read")
  async getContract(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.getContractById(req.user.tenantId, id);
  }
  @Post("contracts")
  @Permissions("field-service.contract.create")
  async createContract(@Req() req: AuthRequest, @Body() body: any) {
    return this.logistics.createContract(req.user.tenantId, body);
  }
  @Put("contracts/:id")
  @Permissions("field-service.contract.update")
  async updateContract(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.logistics.updateContract(req.user.tenantId, id, body);
  }
  @Delete("contracts/:id")
  @Permissions("field-service.contract.delete")
  async deleteContract(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.deleteContract(req.user.tenantId, id);
  }
  @Post("contracts/:id/renew")
  @Permissions("field-service.contract.create")
  async renewContract(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.logistics.renewContract(req.user.tenantId, id, body);
  }

  // ── Timesheets ──
  @Get("timesheets")
  @Permissions("field-service.timesheet.read")
  async getTimesheets(@Req() req: AuthRequest, @Query() query: any) {
    return this.logistics.getTimesheets(req.user.tenantId, query);
  }
  @Get("timesheets/stats")
  @Permissions("field-service.timesheet.read")
  async getTimesheetStats(@Req() req: AuthRequest, @Query() query: any) {
    return this.logistics.getTimesheetStats(
      req.user.tenantId,
      query.fromDate,
      query.toDate,
    );
  }
  @Get("timesheets/:id")
  @Permissions("field-service.timesheet.read")
  async getTimesheet(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.getTimesheetById(req.user.tenantId, id);
  }
  @Post("timesheets")
  @Permissions("field-service.timesheet.create")
  async createTimesheet(@Req() req: AuthRequest, @Body() body: any) {
    return this.logistics.createTimesheet(req.user.tenantId, body);
  }
  @Put("timesheets/:id")
  @Permissions("field-service.timesheet.update")
  async updateTimesheet(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.logistics.updateTimesheet(req.user.tenantId, id, body);
  }
  @Delete("timesheets/:id")
  @Permissions("field-service.timesheet.delete")
  async deleteTimesheet(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.deleteTimesheet(req.user.tenantId, id);
  }
  @Post("timesheets/:id/approve")
  @Permissions("field-service.timesheet.approve")
  async approveTimesheet(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.approveTimesheet(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }
  @Post("timesheets/:id/reject")
  @Permissions("field-service.timesheet.approve")
  async rejectTimesheet(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.logistics.rejectTimesheet(req.user.tenantId, id);
  }
  @Post("timesheets/generate-invoice/:ticketId")
  @Permissions("field-service.timesheet.create")
  async generateInvoice(
    @Req() req: AuthRequest,
    @Param("ticketId") ticketId: string,
  ) {
    return this.logistics.generateInvoiceFromTimesheets(
      req.user.tenantId,
      ticketId,
    );
  }

  // ── Technician Mobile Dashboard ──
  @Get("mobile-dashboard/:technicianId")
  @Permissions("field-service.mobile-dashboard.read")
  async getMobileDashboard(
    @Req() req: AuthRequest,
    @Param("technicianId") technicianId: string,
  ) {
    return this.techMobile.getDashboard(req.user.tenantId, technicianId);
  }

  @Get("mobile-dashboard/:technicianId/today")
  @Permissions("field-service.mobile-dashboard.read")
  async getTodayJobs(
    @Req() req: AuthRequest,
    @Param("technicianId") technicianId: string,
  ) {
    return this.techMobile.getTodayJobs(req.user.tenantId, technicianId);
  }

  @Put("mobile-dashboard/:id")
  @Permissions("field-service.mobile-dashboard.update")
  async updateDashboard(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.techMobile.updateDashboard(req.user.tenantId, id, body);
  }

  @Post("mobile-dashboard/upsert")
  @Permissions("field-service.mobile-dashboard.update")
  async upsertDashboard(@Req() req: AuthRequest, @Body() body: any) {
    return this.techMobile.upsertDashboard(req.user.tenantId, body);
  }

  @Get("technician-statuses")
  @Permissions("field-service.technician-status.read")
  async getTechnicianStatuses(@Req() req: AuthRequest) {
    return this.techMobile.getTechnicianStatuses(req.user.tenantId);
  }

  @Patch("technician-statuses/:id")
  @Permissions("field-service.technician-status.update")
  async updateTechnicianStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.techMobile.updateTechnicianStatus(
      req.user.tenantId,
      id,
      body.status,
    );
  }

  // ── Scheduling & Calendar ──
  @Get("schedules")
  @Permissions("field-service.schedule.read")
  async getSchedules(@Req() req: AuthRequest, @Query() query: any) {
    return this.scheduling.getSchedules(req.user.tenantId, query);
  }

  @Get("schedules/weekly")
  @Permissions("field-service.schedule.read")
  async getWeeklySchedule(
    @Req() req: AuthRequest,
    @Query("startDate") startDate: string,
  ) {
    return this.scheduling.getWeeklySchedule(req.user.tenantId, startDate);
  }

  @Get("schedules/:id")
  @Permissions("field-service.schedule.read")
  async getSchedule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.scheduling.getScheduleById(req.user.tenantId, id);
  }

  @Post("schedules")
  @Permissions("field-service.schedule.create")
  async createSchedule(@Req() req: AuthRequest, @Body() body: any) {
    return this.scheduling.createSchedule(req.user.tenantId, body);
  }

  @Put("schedules/:id")
  @Permissions("field-service.schedule.update")
  async updateSchedule(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.scheduling.updateSchedule(req.user.tenantId, id, body);
  }

  @Delete("schedules/:id")
  @Permissions("field-service.schedule.delete")
  async deleteSchedule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.scheduling.deleteSchedule(req.user.tenantId, id);
  }

  @Get("calendar-events")
  @Permissions("field-service.calendar.read")
  async getCalendarEvents(@Req() req: AuthRequest, @Query() query: any) {
    return this.scheduling.getCalendarEvents(req.user.tenantId, query);
  }

  @Post("calendar-events")
  @Permissions("field-service.calendar.create")
  async createCalendarEvent(@Req() req: AuthRequest, @Body() body: any) {
    return this.scheduling.createCalendarEvent(req.user.tenantId, body);
  }

  @Put("calendar-events/:id")
  @Permissions("field-service.calendar.update")
  async updateCalendarEvent(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.scheduling.updateCalendarEvent(req.user.tenantId, id, body);
  }

  @Delete("calendar-events/:id")
  @Permissions("field-service.calendar.delete")
  async deleteCalendarEvent(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.scheduling.deleteCalendarEvent(req.user.tenantId, id);
  }

  // ── Parts & Inventory Check-out ──
  @Get("part-requests")
  @Permissions("field-service.part-request.read")
  async getPartRequests(@Req() req: AuthRequest, @Query() query: any) {
    return this.parts.getPartRequests(req.user.tenantId, query);
  }

  @Get("part-requests/:id")
  @Permissions("field-service.part-request.read")
  async getPartRequest(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.parts.getPartRequestById(req.user.tenantId, id);
  }

  @Post("part-requests")
  @Permissions("field-service.part-request.create")
  async createPartRequest(@Req() req: AuthRequest, @Body() body: any) {
    return this.parts.createPartRequest(req.user.tenantId, body);
  }

  @Put("part-requests/:id")
  @Permissions("field-service.part-request.update")
  async updatePartRequest(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.parts.updatePartRequest(req.user.tenantId, id, body);
  }

  @Post("part-requests/:id/approve")
  @Permissions("field-service.part-request.approve")
  async approvePartRequest(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.parts.approvePartRequest(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Get("van-stock")
  @Permissions("field-service.van-stock.read")
  async getVanStock(@Req() req: AuthRequest, @Query() query: any) {
    return this.parts.getVanStock(req.user.tenantId, query);
  }

  @Get("van-stock/low-stock")
  @Permissions("field-service.van-stock.read")
  async getLowStockAlerts(@Req() req: AuthRequest) {
    return this.parts.getLowStockAlerts(req.user.tenantId);
  }

  @Get("van-stock/:id")
  @Permissions("field-service.van-stock.read")
  async getVanStockItem(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.parts.getVanStockById(req.user.tenantId, id);
  }

  @Post("van-stock")
  @Permissions("field-service.van-stock.create")
  async createVanStock(@Req() req: AuthRequest, @Body() body: any) {
    return this.parts.createVanStock(req.user.tenantId, body);
  }

  @Put("van-stock/:id")
  @Permissions("field-service.van-stock.update")
  async updateVanStock(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.parts.updateVanStock(req.user.tenantId, id, body);
  }

  @Delete("van-stock/:id")
  @Permissions("field-service.van-stock.delete")
  async deleteVanStock(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.parts.deleteVanStock(req.user.tenantId, id);
  }

  @Patch("van-stock/:id/quantity")
  @Permissions("field-service.van-stock.update")
  async adjustVanStockQuantity(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.parts.adjustVanStockQuantity(
      req.user.tenantId,
      id,
      body.quantity,
    );
  }
}
