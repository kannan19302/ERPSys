import { Controller, Get, Post, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PosService } from './pos.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('pos')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('terminals')
  @Permissions('pos.terminal.read')
  async getTerminals(@Req() req: AuthenticatedRequest) {
    return this.posService.getTerminals(req.user.tenantId);
  }

  @Post('terminals')
  @Permissions('pos.terminal.create')
  async createTerminal(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; code: string; warehouseId?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createTerminal(req.user.tenantId, orgId, dto);
  }

  @Get('registers')
  @Permissions('pos.register.read')
  async getRegisters(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.posService.getRegisters(req.user.tenantId);
  }

  @Post('registers/open')
  @Permissions('pos.register.create')
  async openRegister(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { terminalId: string; startingCash: number }
  ): Promise<unknown> {
    return this.posService.openRegister(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Put('registers/:id/close')
  @Permissions('pos.register.create')
  async closeRegister(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { endingCash: number; actualCash: number }
  ): Promise<unknown> {
    return this.posService.closeRegister(req.user.tenantId, id, dto);
  }

  @Get('registers/:registerId/shifts')
  @Permissions('pos.shift.read')
  async getShifts(@Req() req: AuthenticatedRequest, @Param('registerId') registerId: string) {
    return this.posService.getShifts(req.user.tenantId, registerId);
  }

  @Post('registers/:registerId/shifts/start')
  @Permissions('pos.shift.create')
  async startShift(
    @Req() req: AuthenticatedRequest,
    @Param('registerId') registerId: string,
    @Body() dto: { employeeId: string }
  ) {
    return this.posService.startShift(req.user.tenantId, registerId, dto);
  }

  @Put('shifts/:shiftId/end')
  @Permissions('pos.shift.create')
  async endShift(@Req() req: AuthenticatedRequest, @Param('shiftId') shiftId: string) {
    return this.posService.endShift(req.user.tenantId, shiftId);
  }

  @Get('registers/:registerId/cash-entries')
  @Permissions('pos.cash-entry.read')
  async getCashEntries(@Req() req: AuthenticatedRequest, @Param('registerId') registerId: string): Promise<unknown> {
    return this.posService.getCashEntries(req.user.tenantId, registerId);
  }

  @Post('registers/:registerId/cash-entries')
  @Permissions('pos.cash-entry.create')
  async addCashEntry(
    @Req() req: AuthenticatedRequest,
    @Param('registerId') registerId: string,
    @Body() dto: { type: 'IN' | 'OUT'; amount: number; reason?: string }
  ): Promise<unknown> {
    return this.posService.addCashEntry(req.user.tenantId, registerId, dto, req.user.userId || 'system');
  }
}
