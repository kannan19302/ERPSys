import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MinMaxReplenService } from './minmax-replen.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('api/inventory/minmax-replen')
export class MinMaxReplenController {
  constructor(private readonly svc: MinMaxReplenService) {}

  @Permissions('inventory.minmax_replen.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // ── Levels ────────────────────────────────────────────────────────────────
  @Permissions('inventory.minmax_replen.read')
  @Get('levels')
  listLevels(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listLevels(req.user.tenantId, {
      warehouseId: q.warehouseId, productId: q.productId,
      active: q.active !== undefined ? q.active === 'true' : undefined,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Permissions('inventory.minmax_replen.manage')
  @Post('levels')
  upsertLevel(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertLevel(req.user.tenantId, req.user.userId, body);
  }

  @Permissions('inventory.minmax_replen.manage')
  @Patch('levels/:id/deactivate')
  deactivateLevel(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deactivateLevel(req.user.tenantId, id, req.user.userId);
  }

  // ── Replenishment Run ─────────────────────────────────────────────────────
  @Permissions('inventory.minmax_replen.manage')
  @Post('run')
  runReplenishment(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.runReplenishment(req.user.tenantId, req.user.userId, body);
  }

  @Permissions('inventory.minmax_replen.read')
  @Get('run-logs')
  listRunLogs(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listRunLogs(req.user.tenantId, {
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  // ── Suggestions ───────────────────────────────────────────────────────────
  @Permissions('inventory.minmax_replen.read')
  @Get('suggestions')
  listSuggestions(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listSuggestions(req.user.tenantId, {
      status: q.status, warehouseId: q.warehouseId, productId: q.productId,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Permissions('inventory.minmax_replen.manage')
  @Patch('suggestions/:id/approve')
  approveSuggestion(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveSuggestion(req.user.tenantId, id, req.user.userId);
  }

  @Permissions('inventory.minmax_replen.manage')
  @Patch('suggestions/:id/order')
  markOrdered(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.markOrdered(req.user.tenantId, id);
  }

  @Permissions('inventory.minmax_replen.manage')
  @Patch('suggestions/:id/receive')
  markReceived(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.markReceived(req.user.tenantId, id);
  }

  @Permissions('inventory.minmax_replen.manage')
  @Patch('suggestions/:id/cancel')
  cancelSuggestion(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.cancelSuggestion(req.user.tenantId, id, req.user.userId, body.reason ?? '');
  }
}
