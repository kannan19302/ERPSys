import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { AppInstalledGuard } from '../../common/guards/app-installed.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FieldServiceService } from './field-service.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('field-service')
@UseGuards(JwtAuthGuard, RbacGuard, AppInstalledGuard)
export class FieldServiceController {
  constructor(private readonly service: FieldServiceService) {}

  @Get('tickets')
  @Permissions('hr.employee.read')
  async getTickets(@Req() req: AuthenticatedRequest) {
    return this.service.getTickets(req.user.tenantId);
  }

  @Post('tickets')
  @Permissions('hr.employee.read')
  async createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { title: string; customerName: string; description: string; priority?: string; slaDeadline: string }
  ) {
    return this.service.createTicket(req.user.tenantId, dto);
  }

  @Get('dispatches')
  @Permissions('hr.employee.read')
  async getDispatches(@Req() req: AuthenticatedRequest) {
    return this.service.getDispatches(req.user.tenantId);
  }

  @Post('dispatches')
  @Permissions('hr.employee.read')
  async createDispatch(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { ticketId: string; technicianId: string; scheduledTime: string; routeDetails: string }
  ) {
    return this.service.createDispatch(req.user.tenantId, dto);
  }

  @Get('checklists')
  @Permissions('hr.employee.read')
  async getChecklists(@Req() req: AuthenticatedRequest) {
    return this.service.getChecklists(req.user.tenantId);
  }

  @Post('checklists')
  @Permissions('hr.employee.read')
  async createChecklist(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { dispatchId: string; items: string; signatureUrl?: string }
  ) {
    return this.service.createChecklist(req.user.tenantId, dto);
  }

  @Get('preventative')
  @Permissions('hr.employee.read')
  async getPreventativeMaintenances(@Req() req: AuthenticatedRequest) {
    return this.service.getPreventativeMaintenances(req.user.tenantId);
  }

  @Post('preventative')
  @Permissions('hr.employee.read')
  async createPreventativeMaintenance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { customerName: string; description: string; recurrenceCron: string; nextRunDate: string }
  ) {
    return this.service.createPreventativeMaintenance(req.user.tenantId, dto);
  }
}
