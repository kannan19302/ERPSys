import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { YardManagementService } from './yard-management.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/yard-management')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class YardManagementController {
  constructor(private readonly svc: YardManagementService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest, @Query('warehouseId') warehouseId?: string) {
    return this.svc.getDashboard(req.user.tenantId, warehouseId);
  }

  // Dock Doors
  @Get('dock-doors')
  listDockDoors(@Request() req: AuthRequest, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listDockDoors(req.user.tenantId, warehouseId);
  }

  @Post('dock-doors')
  createDockDoor(
    @Request() req: AuthRequest,
    @Body() dto: { warehouseId: string; doorNumber: string; doorType?: string; notes?: string },
  ) {
    return this.svc.createDockDoor(req.user.tenantId, dto);
  }

  @Put('dock-doors/:id')
  updateDockDoor(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { status?: string; doorType?: string; notes?: string },
  ) {
    return this.svc.updateDockDoor(req.user.tenantId, id, dto);
  }

  @Delete('dock-doors/:id')
  deleteDockDoor(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deleteDockDoor(req.user.tenantId, id);
  }

  @Get('dock-doors/schedule')
  getDockDoorSchedule(
    @Request() req: AuthRequest,
    @Query('warehouseId') warehouseId: string,
    @Query('date') date: string,
  ) {
    return this.svc.getDockDoorSchedule(req.user.tenantId, warehouseId, date);
  }

  // Appointments
  @Get('appointments')
  listAppointments(
    @Request() req: AuthRequest,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.svc.listAppointments(req.user.tenantId, warehouseId, status, date);
  }

  @Get('appointments/range')
  getAppointmentsByDateRange(
    @Request() req: AuthRequest,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.getAppointmentsByDateRange(req.user.tenantId, from, to, warehouseId);
  }

  @Get('appointments/turnaround-report')
  getTurnaroundReport(@Request() req: AuthRequest, @Query('warehouseId') warehouseId?: string) {
    return this.svc.getTurnaroundReport(req.user.tenantId, warehouseId);
  }

  @Get('appointments/:id')
  getAppointment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getAppointment(req.user.tenantId, id);
  }

  @Post('appointments')
  createAppointment(
    @Request() req: AuthRequest,
    @Body() dto: {
      warehouseId: string; scheduledAt: string; appointmentType?: string;
      dockDoorId?: string; carrierId?: string; carrierName?: string;
      driverName?: string; truckPlate?: string; trailerNumber?: string;
      referenceNumber?: string; notes?: string;
    },
  ) {
    return this.svc.createAppointment(req.user.tenantId, dto);
  }

  @Patch('appointments/:id/check-in')
  checkIn(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { dockDoorId?: string; truckPlate?: string; driverName?: string; vehicleWeight?: number },
  ) {
    return this.svc.checkIn(req.user.tenantId, id, req.user.userId, dto);
  }

  @Patch('appointments/:id/start-loading')
  startLoading(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.startLoading(req.user.tenantId, id);
  }

  @Patch('appointments/:id/complete')
  complete(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { notes?: string },
  ) {
    return this.svc.complete(req.user.tenantId, id, req.user.userId, dto);
  }

  @Patch('appointments/:id/no-show')
  markNoShow(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.markNoShow(req.user.tenantId, id);
  }

  @Patch('appointments/:id/cancel')
  cancelAppointment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelAppointment(req.user.tenantId, id);
  }

  @Patch('appointments/:id/reschedule')
  reschedule(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { scheduledAt: string; dockDoorId?: string },
  ) {
    return this.svc.rescheduled(req.user.tenantId, id, dto);
  }

  @Get('appointments/:id/gate-pass')
  getGatePass(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getGatePass(req.user.tenantId, id);
  }

  // Yard Moves
  @Get('yard-moves')
  listYardMoves(
    @Request() req: AuthRequest,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listYardMoves(req.user.tenantId, warehouseId, status);
  }

  @Post('yard-moves')
  createYardMove(
    @Request() req: AuthRequest,
    @Body() dto: {
      warehouseId: string; trailerNumber: string; fromLocation: string; toLocation: string;
      appointmentId?: string; assignedTo?: string; notes?: string;
    },
  ) {
    return this.svc.createYardMove(req.user.tenantId, dto);
  }

  @Patch('yard-moves/:id/start')
  startYardMove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.startYardMove(req.user.tenantId, id);
  }

  @Patch('yard-moves/:id/complete')
  completeYardMove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.completeYardMove(req.user.tenantId, id);
  }

  @Patch('yard-moves/:id/cancel')
  cancelYardMove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelYardMove(req.user.tenantId, id);
  }

  // Yard Inventory
  @Get('yard-inventory')
  listYardInventory(@Request() req: AuthRequest, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listYardInventory(req.user.tenantId, warehouseId);
  }

  @Post('yard-inventory')
  addYardInventory(
    @Request() req: AuthRequest,
    @Body() dto: {
      warehouseId: string; trailerNumber: string; location: string;
      productId?: string; description?: string; qty?: number; uom?: string; notes?: string;
    },
  ) {
    return this.svc.addYardInventory(req.user.tenantId, dto);
  }

  @Patch('yard-inventory/:id/depart')
  departYardInventory(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.departYardInventory(req.user.tenantId, id);
  }
}
