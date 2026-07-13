import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomerReturnsService } from './customer-returns.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('api/inventory/customer-returns')
export class CustomerReturnsController {
  constructor(private readonly svc: CustomerReturnsService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // ── RMAs ──────────────────────────────────────────────────────────────────
  @Get('rmas')
  listRmas(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listRmas(req.user.tenantId, {
      customerId: q.customerId, status: q.status,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Post('rmas')
  createRma(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createRma(req.user.tenantId, { ...body, requestedById: req.user.userId });
  }

  @Get('rmas/:id')
  getRma(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getRma(req.user.tenantId, id);
  }

  @Patch('rmas/:id/approve')
  approveRma(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveRma(req.user.tenantId, id, req.user.userId);
  }

  @Patch('rmas/:id/reject')
  rejectRma(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.rejectRma(req.user.tenantId, id, req.user.userId, body.reason ?? '');
  }

  @Patch('rmas/:id/receive')
  receiveRma(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.receiveRma(req.user.tenantId, id, body);
  }

  @Patch('rmas/:rmaId/lines/:lineId/inspect')
  inspectLine(
    @Request() req: AuthRequest,
    @Param('rmaId') rmaId: string,
    @Param('lineId') lineId: string,
    @Body() body: any,
  ) {
    return this.svc.inspectLine(req.user.tenantId, rmaId, lineId, { ...body, inspectedById: req.user.userId });
  }

  @Patch('rmas/:id/close')
  closeRma(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.closeRma(req.user.tenantId, id);
  }

  // ── Credits ───────────────────────────────────────────────────────────────
  @Get('credits')
  listCredits(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listCredits(req.user.tenantId, {
      customerId: q.customerId, status: q.status,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Post('rmas/:rmaId/credit')
  issueCredit(@Request() req: AuthRequest, @Param('rmaId') rmaId: string, @Body() body: any) {
    return this.svc.issueCredit(req.user.tenantId, rmaId, { ...body, issuedById: req.user.userId });
  }

  @Patch('credits/:id/void')
  voidCredit(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.voidCredit(req.user.tenantId, id, { ...body, voidedById: req.user.userId });
  }

  // ── Restocks ──────────────────────────────────────────────────────────────
  @Post('restocks')
  restockLine(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.restockLine(req.user.tenantId, { ...body, restockedById: req.user.userId });
  }

  @Get('restocks')
  listRestocks(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listRestocks(req.user.tenantId, { rmaLineId: q.rmaLineId, productId: q.productId });
  }
}
