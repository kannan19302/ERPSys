import { Controller, Get, Post, Patch, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { DispatchService } from './dispatch.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('field-service')
@ApiBearerAuth()
@Controller('field-service/dispatch')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @ApiOperation({ summary: 'Get board' })
  @Permissions('field_service.read')
  @Get('board')
  async getBoard(@Req() req: AuthReq, @Query('date') date?: string) {
    return this.dispatchService.getDispatchBoard(req.user.tenantId, date);
  }

  @ApiOperation({ summary: 'Assign' })
  @Permissions('field_service.create')
  @Post('assign')
  async assign(@Req() req: AuthReq, @ZodBody(z.any()) body: { ticketId: string; technicianId: string; scheduledTime: string; notes?: string }) {
    return this.dispatchService.assignTechnician(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update status' })
  @Permissions('field_service.update')
  @Patch(':id/status')
  async updateStatus(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(z.any()) body: { status: string }) {
    return this.dispatchService.updateDispatchStatus(req.user.tenantId, id, body.status);
  }

  @ApiOperation({ summary: 'Get sla status' })
  @Permissions('field_service.read')
  @Get('sla')
  async getSlaStatus(@Req() req: AuthReq) {
    return this.dispatchService.getSlaStatus(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get upcoming p m' })
  @Permissions('field_service.read')
  @Get('preventive-maintenance')
  async getUpcomingPM(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.dispatchService.getUpcomingPM(req.user.tenantId, Number(days) || 30);
  }
}
