import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { LotExpiryService } from './lot-expiry.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('inventory/lot-expiry')
export class LotExpiryController {
  constructor(private readonly svc: LotExpiryService) {}

  @Permissions('inventory.lot_expiry.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) { return this.svc.getDashboard(req.user.tenantId); }

  @Permissions('inventory.lot_expiry.manage')
  @Post('lots')
  registerLot(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.registerLot(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.lot_expiry.read')
  @Get('lots')
  listLots(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listLots(req.user.tenantId, {
      productId: q.productId, status: q.status,
      expiringBeforeDays: q.expiringBeforeDays ? +q.expiringBeforeDays : undefined,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.lot_expiry.read')
  @Get('lots/:id')
  getLot(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getLot(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_expiry.manage')
  @Patch('lots/:id/quarantine')
  quarantineLot(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason: string }) {
    return this.svc.quarantineLot(req.user.tenantId, id, dto.reason);
  }

  @Permissions('inventory.lot_expiry.manage')
  @Patch('lots/:id/release')
  releaseLot(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.releaseLot(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_expiry.manage')
  @Post('lots/:id/consume')
  consumeFromLot(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { qty: number }) {
    return this.svc.consumeFromLot(req.user.tenantId, id, dto.qty);
  }

  @Permissions('inventory.lot_expiry.read')
  @Get('fefo')
  getFEFOPick(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.getFEFOPick(req.user.tenantId, q.productId, q.warehouseId, +q.qty);
  }

  @Permissions('inventory.lot_expiry.manage')
  @Post('alerts/scan')
  scanExpiryAlerts(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.scanExpiryAlerts(req.user.tenantId, dto);
  }

  @Permissions('inventory.lot_expiry.read')
  @Get('alerts')
  listAlerts(@Request() req: AuthRequest, @Query('dismissed') dismissed?: string) {
    return this.svc.listAlerts(req.user.tenantId, dismissed === 'true');
  }

  @Permissions('inventory.lot_expiry.manage')
  @Patch('alerts/:id/dismiss')
  dismissAlert(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.dismissAlert(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_expiry.manage')
  @Post('disposals')
  disposeLot(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.disposeLot(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.lot_expiry.read')
  @Get('disposals')
  listDisposals(@Request() req: AuthRequest, @Query('lotId') lotId?: string) {
    return this.svc.listDisposals(req.user.tenantId, lotId);
  }
}
