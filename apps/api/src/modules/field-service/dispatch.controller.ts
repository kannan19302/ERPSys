import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { DispatchService } from './dispatch.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('field-service/dispatch')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('board')
  async getBoard(@Req() req: AuthReq, @Query('date') date?: string) {
    return this.dispatchService.getDispatchBoard(req.user.tenantId, date);
  }

  @Post('assign')
  async assign(@Req() req: AuthReq, @Body() body: { ticketId: string; technicianId: string; scheduledTime: string; notes?: string }) {
    return this.dispatchService.assignTechnician(req.user.tenantId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Req() req: AuthReq, @Param('id') id: string, @Body() body: { status: string }) {
    return this.dispatchService.updateDispatchStatus(req.user.tenantId, id, body.status);
  }

  @Get('sla')
  async getSlaStatus(@Req() req: AuthReq) {
    return this.dispatchService.getSlaStatus(req.user.tenantId);
  }

  @Get('preventive-maintenance')
  async getUpcomingPM(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.dispatchService.getUpcomingPM(req.user.tenantId, Number(days) || 30);
  }
}
