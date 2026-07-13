import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VmiService } from './vmi.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('inventory/vmi')
export class VmiController {
  constructor(private readonly svc: VmiService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Agreements
  @Post('agreements')
  createAgreement(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createAgreement(req.user.tenantId, req.user.userId, dto);
  }

  @Get('agreements')
  listAgreements(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listAgreements(req.user.tenantId, {
      status: q.status, vendorId: q.vendorId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Get('agreements/:id')
  getAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getAgreement(req.user.tenantId, id);
  }

  @Patch('agreements/:id/activate')
  activateAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.activateAgreement(req.user.tenantId, id);
  }

  @Patch('agreements/:id/suspend')
  suspendAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.suspendAgreement(req.user.tenantId, id);
  }

  @Patch('agreements/:id/terminate')
  terminateAgreement(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.terminateAgreement(req.user.tenantId, id);
  }

  // Snapshots
  @Post('snapshots')
  recordSnapshot(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.recordSnapshot(req.user.tenantId, req.user.userId, dto);
  }

  @Get('snapshots')
  listSnapshots(@Request() req: AuthRequest, @Query('agreementId') agreementId: string) {
    return this.svc.listSnapshots(req.user.tenantId, agreementId);
  }

  // Orders
  @Post('orders')
  createOrder(@Request() req: AuthRequest, @Body() dto: any) {
    return this.svc.createOrder(req.user.tenantId, req.user.userId, dto);
  }

  @Get('orders')
  listOrders(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listOrders(req.user.tenantId, {
      status: q.status, agreementId: q.agreementId, vendorId: q.vendorId,
      skip: q.skip ? +q.skip : 0, take: q.take ? +q.take : 20,
    });
  }

  @Patch('orders/:id/status')
  advanceOrderStatus(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.svc.advanceOrderStatus(req.user.tenantId, id, dto);
  }
}
