import { Controller, Get, Post, Delete, Patch, Param, Body, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { VelocityAbcXyzService } from './velocity-abc-xyz.service';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('api/inventory/velocity-abc-xyz')
export class VelocityAbcXyzController {
  constructor(private readonly svc: VelocityAbcXyzService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // ── Classification Runs ────────────────────────────────────────────────────
  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('runs')
  listRuns(@Request() req: AuthRequest, @Query() q: any) {
    return this.svc.listRuns(req.user.tenantId, {
      warehouseId: q.warehouseId,
      status: q.status,
      limit: q.limit ? +q.limit : undefined,
      offset: q.offset ? +q.offset : undefined,
    });
  }

  @Permissions('inventory.velocity_abc_xyz.manage')
  @Post('runs')
  createRun(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createRun(req.user.tenantId, { ...body, runByUserId: req.user.userId });
  }

  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('runs/:id')
  getRun(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getRun(req.user.tenantId, id);
  }

  @Permissions('inventory.velocity_abc_xyz.manage')
  @Delete('runs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRun(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deleteRun(req.user.tenantId, id);
  }

  @Permissions('inventory.velocity_abc_xyz.manage')
  @Post('runs/:id/compute')
  computeClassification(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.computeClassification(req.user.tenantId, id, body.items ?? []);
  }

  @Permissions('inventory.velocity_abc_xyz.manage')
  @Patch('runs/:id/activate')
  activateRun(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.activateRun(req.user.tenantId, id);
  }

  // ── Classification Items ───────────────────────────────────────────────────
  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('runs/:runId/items')
  listItems(@Request() req: AuthRequest, @Param('runId') runId: string, @Query() q: any) {
    return this.svc.listItems(req.user.tenantId, runId, {
      abcClass: q.abcClass, xyzClass: q.xyzClass, combinedClass: q.combinedClass,
      limit: q.limit ? +q.limit : undefined, offset: q.offset ? +q.offset : undefined,
    });
  }

  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('products/:productId/current-class')
  getProductCurrentClass(
    @Request() req: AuthRequest,
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.getProductCurrentClass(req.user.tenantId, productId, warehouseId);
  }

  // ── Slotting Policies ──────────────────────────────────────────────────────
  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('policies')
  listPolicies(@Request() req: AuthRequest) {
    return this.svc.listPolicies(req.user.tenantId);
  }

  @Permissions('inventory.velocity_abc_xyz.manage')
  @Post('policies')
  upsertPolicy(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertPolicy(req.user.tenantId, body);
  }

  @Permissions('inventory.velocity_abc_xyz.manage')
  @Delete('policies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePolicy(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deletePolicy(req.user.tenantId, id);
  }

  // ── Velocity Snapshots ─────────────────────────────────────────────────────
  @Permissions('inventory.velocity_abc_xyz.manage')
  @Post('snapshots')
  recordSnapshot(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.recordSnapshot(req.user.tenantId, body);
  }

  @Permissions('inventory.velocity_abc_xyz.read')
  @Get('products/:productId/snapshots')
  getProductSnapshots(
    @Request() req: AuthRequest,
    @Param('productId') productId: string,
    @Query() q: any,
  ) {
    return this.svc.getProductSnapshots(req.user.tenantId, productId, {
      warehouseId: q.warehouseId,
      months: q.months ? +q.months : undefined,
    });
  }
}
