import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MinMaxReplenService } from './minmax-replen.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('api/inventory/minmax-replen')
export class MinMaxReplenController {
  constructor(private readonly svc: MinMaxReplenService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // ── Levels ────────────────────────────────────────────────────────────────
  @Get('levels')
  listLevels(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listLevels(req.user.tenantId, {
      warehouseId: q.warehouseId, productId: q.productId,
      active: q.active !== undefined ? q.active === 'true' : undefined,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Post('levels')
  upsertLevel(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertLevel(req.user.tenantId, req.user.userId, body);
  }

  @Patch('levels/:id/deactivate')
  deactivateLevel(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deactivateLevel(req.user.tenantId, id, req.user.userId);
  }

  // ── Replenishment Run ─────────────────────────────────────────────────────
  @Post('run')
  runReplenishment(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.runReplenishment(req.user.tenantId, req.user.userId, body);
  }

  @Get('run-logs')
  listRunLogs(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listRunLogs(req.user.tenantId, {
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  // ── Suggestions ───────────────────────────────────────────────────────────
  @Get('suggestions')
  listSuggestions(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listSuggestions(req.user.tenantId, {
      status: q.status, warehouseId: q.warehouseId, productId: q.productId,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Patch('suggestions/:id/approve')
  approveSuggestion(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveSuggestion(req.user.tenantId, id, req.user.userId);
  }

  @Patch('suggestions/:id/order')
  markOrdered(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.markOrdered(req.user.tenantId, id);
  }

  @Patch('suggestions/:id/receive')
  markReceived(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.markReceived(req.user.tenantId, id);
  }

  @Patch('suggestions/:id/cancel')
  cancelSuggestion(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.cancelSuggestion(req.user.tenantId, id, req.user.userId, body.reason ?? '');
  }
}
