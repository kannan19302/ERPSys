import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { AppInstalledGuard } from '../../common/guards/app-installed.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FieldServiceService } from './field-service.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('field-service')
@ApiBearerAuth()
@Controller('field-service')
@UseGuards(JwtAuthGuard, RbacGuard, AppInstalledGuard)
export class FieldServiceController {
  constructor(private readonly service: FieldServiceService) {}

  @ApiOperation({ summary: 'Get tickets' })
  @Permissions('field_service.read')
  @Get('tickets')
  @Permissions('hr.employee.read')
  async getTickets(@Req() req: AuthenticatedRequest) {
    return this.service.getTickets(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create ticket' })
  @Permissions('field_service.create')
  @Post('tickets')
  @Permissions('hr.employee.read')
  async createTicket(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { title: string; customerName: string; description: string; priority?: string; slaDeadline: string }
  ) {
    return this.service.createTicket(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get dispatches' })
  @Permissions('field_service.read')
  @Get('dispatches')
  @Permissions('hr.employee.read')
  async getDispatches(@Req() req: AuthenticatedRequest) {
    return this.service.getDispatches(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create dispatch' })
  @Permissions('field_service.create')
  @Post('dispatches')
  @Permissions('hr.employee.read')
  async createDispatch(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { ticketId: string; technicianId: string; scheduledTime: string; routeDetails: string }
  ) {
    return this.service.createDispatch(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get checklists' })
  @Permissions('field_service.read')
  @Get('checklists')
  @Permissions('hr.employee.read')
  async getChecklists(@Req() req: AuthenticatedRequest) {
    return this.service.getChecklists(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create checklist' })
  @Permissions('field_service.create')
  @Post('checklists')
  @Permissions('hr.employee.read')
  async createChecklist(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { dispatchId: string; items: string; signatureUrl?: string }
  ) {
    return this.service.createChecklist(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get preventative maintenances' })
  @Permissions('field_service.read')
  @Get('preventative')
  @Permissions('hr.employee.read')
  async getPreventativeMaintenances(@Req() req: AuthenticatedRequest) {
    return this.service.getPreventativeMaintenances(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create preventative maintenance' })
  @Permissions('field_service.create')
  @Post('preventative')
  @Permissions('hr.employee.read')
  async createPreventativeMaintenance(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { customerName: string; description: string; recurrenceCron: string; nextRunDate: string }
  ) {
    return this.service.createPreventativeMaintenance(req.user.tenantId, dto);
  }
}
