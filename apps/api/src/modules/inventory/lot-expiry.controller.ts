import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LotExpiryService } from './lot-expiry.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('inventory/lot-expiry')
export class LotExpiryController {
  constructor(private readonly svc: LotExpiryService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) { return this.svc.getDashboard(req.user.tenantId); }

  @Post('lots')
  registerLot(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.registerLot(req.user.tenantId, req.user.userId, dto);
  }

  @Get('lots')
  listLots(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listLots(req.user.tenantId, {
      productId: q.productId, status: q.status,
      expiringBeforeDays: q.expiringBeforeDays ? +q.expiringBeforeDays : undefined,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Get('lots/:id')
  getLot(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getLot(req.user.tenantId, id);
  }

  @Patch('lots/:id/quarantine')
  quarantineLot(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason: string }) {
    return this.svc.quarantineLot(req.user.tenantId, id, dto.reason);
  }

  @Patch('lots/:id/release')
  releaseLot(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.releaseLot(req.user.tenantId, id);
  }

  @Post('lots/:id/consume')
  consumeFromLot(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { qty: number }) {
    return this.svc.consumeFromLot(req.user.tenantId, id, dto.qty);
  }

  @Get('fefo')
  getFEFOPick(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.getFEFOPick(req.user.tenantId, q.productId, q.warehouseId, +q.qty);
  }

  @Post('alerts/scan')
  scanExpiryAlerts(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.scanExpiryAlerts(req.user.tenantId, dto);
  }

  @Get('alerts')
  listAlerts(@Request() req: AuthRequest, @Query('dismissed') dismissed?: string) {
    return this.svc.listAlerts(req.user.tenantId, dismissed === 'true');
  }

  @Patch('alerts/:id/dismiss')
  dismissAlert(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.dismissAlert(req.user.tenantId, id);
  }

  @Post('disposals')
  disposeLot(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.disposeLot(req.user.tenantId, req.user.userId, dto);
  }

  @Get('disposals')
  listDisposals(@Request() req: AuthRequest, @Query('lotId') lotId?: string) {
    return this.svc.listDisposals(req.user.tenantId, lotId);
  }
}
