import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  WarehouseOpsService,
  createWarehouseTaskSchema,
  createBinTransferSchema,
  createGrnSchema,
  verifyGrnLinesSchema,
  createPackingSessionSchema,
  addCartonSchema,
} from './warehouse-ops.service';

interface AuthReq extends Request { user: { tenantId: string; orgId: string; userId: string }; }

const assignTaskSchema = z.object({ workerId: z.string().min(1) });
const rejectTransferSchema = z.object({ reason: z.string().min(1) });
const rejectGrnSchema = z.object({ reason: z.string().min(1) });

@Controller('inventory/warehouse-ops')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class WarehouseOpsController {
  constructor(private readonly svc: WarehouseOpsService) {}

  // ── Dashboard ────────────────────────────────────────────────────────────
  @Permissions('inventory.warehouse_ops.read')
  @Get('dashboard')
  dashboard(@Req() req: AuthReq) {
    return this.svc.getWarehouseOpsDashboard(req.user.tenantId);
  }

  // ── Warehouse Tasks ──────────────────────────────────────────────────────
  @Permissions('inventory.warehouse_ops.read')
  @Get('tasks')
  listTasks(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('taskType') taskType?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.listTasks(req.user.tenantId, { status, taskType, warehouseId });
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('tasks/dashboard')
  taskDashboard(@Req() req: AuthReq) {
    return this.svc.getTaskDashboard(req.user.tenantId);
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('tasks/worker/:workerId')
  workerQueue(@Req() req: AuthReq, @Param('workerId') workerId: string) {
    return this.svc.getWorkerQueue(req.user.tenantId, workerId);
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('tasks/:id')
  getTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getTask(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Post('tasks')
  createTask(@Req() req: AuthReq, @ZodBody(createWarehouseTaskSchema) body: z.infer<typeof createWarehouseTaskSchema>) {
    return this.svc.createTask(req.user.tenantId, body);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('tasks/:id/assign')
  assignTask(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(assignTaskSchema) body: z.infer<typeof assignTaskSchema>) {
    return this.svc.assignTask(req.user.tenantId, id, body.workerId);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('tasks/:id/start')
  startTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.startTask(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('tasks/:id/complete')
  completeTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeTask(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('tasks/:id/cancel')
  cancelTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.cancelTask(req.user.tenantId, id);
  }

  // ── Bin Transfers ────────────────────────────────────────────────────────
  @Permissions('inventory.warehouse_ops.read')
  @Get('bin-transfers')
  listBinTransfers(@Req() req: AuthReq, @Query('status') status?: string) {
    return this.svc.listBinTransfers(req.user.tenantId, status);
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('bin-transfers/:id')
  getBinTransfer(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getBinTransfer(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Post('bin-transfers')
  createBinTransfer(@Req() req: AuthReq, @ZodBody(createBinTransferSchema) body: z.infer<typeof createBinTransferSchema>) {
    return this.svc.createBinTransfer(req.user.tenantId, body);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('bin-transfers/:id/approve')
  approveBinTransfer(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.approveBinTransfer(req.user.tenantId, id, req.user.userId);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('bin-transfers/:id/reject')
  rejectBinTransfer(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(rejectTransferSchema) body: z.infer<typeof rejectTransferSchema>) {
    return this.svc.rejectBinTransfer(req.user.tenantId, id, body.reason);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('bin-transfers/:id/complete')
  completeBinTransfer(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeBinTransfer(req.user.tenantId, id);
  }

  // ── GRN ─────────────────────────────────────────────────────────────────
  @Permissions('inventory.warehouse_ops.read')
  @Get('grn')
  listGrns(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.listGrns(req.user.tenantId, { status, warehouseId });
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('grn/dashboard')
  grnDashboard(@Req() req: AuthReq) {
    return this.svc.getGrnDashboard(req.user.tenantId);
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('grn/:id')
  getGrn(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getGrn(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Post('grn')
  createGrn(@Req() req: AuthReq, @ZodBody(createGrnSchema) body: z.infer<typeof createGrnSchema>) {
    return this.svc.createGrn(req.user.tenantId, body);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('grn/:id/verify')
  verifyGrn(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(verifyGrnLinesSchema) body: z.infer<typeof verifyGrnLinesSchema>) {
    return this.svc.verifyGrn(req.user.tenantId, id, body);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('grn/:id/quality-check')
  qualityCheckGrn(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.qualityCheckGrn(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('grn/:id/putaway')
  completeGrnPutaway(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeGrnPutaway(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('grn/:id/reject')
  rejectGrn(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(rejectGrnSchema) body: z.infer<typeof rejectGrnSchema>) {
    return this.svc.rejectGrn(req.user.tenantId, id, body.reason);
  }

  // ── Packing Sessions ─────────────────────────────────────────────────────
  @Permissions('inventory.warehouse_ops.read')
  @Get('packing')
  listPackingSessions(@Req() req: AuthReq, @Query('status') status?: string) {
    return this.svc.listPackingSessions(req.user.tenantId, status);
  }

  @Permissions('inventory.warehouse_ops.read')
  @Get('packing/:id')
  getPackingSession(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getPackingSession(req.user.tenantId, id);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Post('packing')
  createPackingSession(@Req() req: AuthReq, @ZodBody(createPackingSessionSchema) body: z.infer<typeof createPackingSessionSchema>) {
    return this.svc.createPackingSession(req.user.tenantId, body);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Post('packing/:id/cartons')
  addCarton(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(addCartonSchema) body: z.infer<typeof addCartonSchema>) {
    return this.svc.addCarton(req.user.tenantId, id, body);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('packing/:sessionId/cartons/:cartonId/seal')
  sealCarton(
    @Req() req: AuthReq,
    @Param('sessionId') sessionId: string,
    @Param('cartonId') cartonId: string,
  ) {
    return this.svc.sealCarton(req.user.tenantId, sessionId, cartonId);
  }

  @Permissions('inventory.warehouse_ops.manage')
  @Patch('packing/:id/complete')
  completePackingSession(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completePackingSession(req.user.tenantId, id);
  }
}
