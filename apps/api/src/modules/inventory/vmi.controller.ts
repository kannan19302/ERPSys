import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { VmiService } from './vmi.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('inventory/vmi')
export class VmiController {
  constructor(private readonly svc: VmiService) {}

  @Permissions('inventory.vmi.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Agreements
  @Permissions('inventory.vmi.manage')
  @Post('agreements')
  createAgreement(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createAgreement(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.vmi.read')
  @Get('agreements')
  listAgreements(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listAgreements(req.user.tenantId, {
      status: q.status, vendorId: q.vendorId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.vmi.read')
  @Get('agreements/:id')
  getAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getAgreement(req.user.tenantId, id);
  }

  @Permissions('inventory.vmi.manage')
  @Patch('agreements/:id/activate')
  activateAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.activateAgreement(req.user.tenantId, id);
  }

  @Permissions('inventory.vmi.manage')
  @Patch('agreements/:id/suspend')
  suspendAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.suspendAgreement(req.user.tenantId, id);
  }

  @Permissions('inventory.vmi.manage')
  @Patch('agreements/:id/terminate')
  terminateAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.terminateAgreement(req.user.tenantId, id);
  }

  // Snapshots
  @Permissions('inventory.vmi.manage')
  @Post('snapshots')
  recordSnapshot(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.recordSnapshot(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.vmi.read')
  @Get('snapshots')
  listSnapshots(@Request() req: AuthRequest, @Query('agreementId') agreementId: string) {
    return this.svc.listSnapshots(req.user.tenantId, agreementId);
  }

  // Orders
  @Permissions('inventory.vmi.manage')
  @Post('orders')
  createOrder(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createOrder(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.vmi.read')
  @Get('orders')
  listOrders(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listOrders(req.user.tenantId, {
      status: q.status, agreementId: q.agreementId, vendorId: q.vendorId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Permissions('inventory.vmi.manage')
  @Patch('orders/:id/status')
  advanceOrderStatus(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.svc.advanceOrderStatus(req.user.tenantId, id, dto);
  }
}
