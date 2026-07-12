import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class WarehouseOpsController {
  constructor(private readonly svc: WarehouseOpsService) {}

  // ── Dashboard ────────────────────────────────────────────────────────────
  @Get('dashboard')
  dashboard(@Req() req: AuthReq) {
    return this.svc.getWarehouseOpsDashboard(req.user.tenantId);
  }

  // ── Warehouse Tasks ──────────────────────────────────────────────────────
  @Get('tasks')
  listTasks(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('taskType') taskType?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.listTasks(req.user.tenantId, { status, taskType, warehouseId });
  }

  @Get('tasks/dashboard')
  taskDashboard(@Req() req: AuthReq) {
    return this.svc.getTaskDashboard(req.user.tenantId);
  }

  @Get('tasks/worker/:workerId')
  workerQueue(@Req() req: AuthReq, @Param('workerId') workerId: string) {
    return this.svc.getWorkerQueue(req.user.tenantId, workerId);
  }

  @Get('tasks/:id')
  getTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getTask(req.user.tenantId, id);
  }

  @Post('tasks')
  createTask(@Req() req: AuthReq, @ZodBody(createWarehouseTaskSchema) body: z.infer<typeof createWarehouseTaskSchema>) {
    return this.svc.createTask(req.user.tenantId, body);
  }

  @Patch('tasks/:id/assign')
  assignTask(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(assignTaskSchema) body: z.infer<typeof assignTaskSchema>) {
    return this.svc.assignTask(req.user.tenantId, id, body.workerId);
  }

  @Patch('tasks/:id/start')
  startTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.startTask(req.user.tenantId, id);
  }

  @Patch('tasks/:id/complete')
  completeTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeTask(req.user.tenantId, id);
  }

  @Patch('tasks/:id/cancel')
  cancelTask(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.cancelTask(req.user.tenantId, id);
  }

  // ── Bin Transfers ────────────────────────────────────────────────────────
  @Get('bin-transfers')
  listBinTransfers(@Req() req: AuthReq, @Query('status') status?: string) {
    return this.svc.listBinTransfers(req.user.tenantId, status);
  }

  @Get('bin-transfers/:id')
  getBinTransfer(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getBinTransfer(req.user.tenantId, id);
  }

  @Post('bin-transfers')
  createBinTransfer(@Req() req: AuthReq, @ZodBody(createBinTransferSchema) body: z.infer<typeof createBinTransferSchema>) {
    return this.svc.createBinTransfer(req.user.tenantId, body);
  }

  @Patch('bin-transfers/:id/approve')
  approveBinTransfer(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.approveBinTransfer(req.user.tenantId, id, req.user.userId);
  }

  @Patch('bin-transfers/:id/reject')
  rejectBinTransfer(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(rejectTransferSchema) body: z.infer<typeof rejectTransferSchema>) {
    return this.svc.rejectBinTransfer(req.user.tenantId, id, body.reason);
  }

  @Patch('bin-transfers/:id/complete')
  completeBinTransfer(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeBinTransfer(req.user.tenantId, id);
  }

  // ── GRN ─────────────────────────────────────────────────────────────────
  @Get('grn')
  listGrns(
    @Req() req: AuthReq,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.listGrns(req.user.tenantId, { status, warehouseId });
  }

  @Get('grn/dashboard')
  grnDashboard(@Req() req: AuthReq) {
    return this.svc.getGrnDashboard(req.user.tenantId);
  }

  @Get('grn/:id')
  getGrn(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getGrn(req.user.tenantId, id);
  }

  @Post('grn')
  createGrn(@Req() req: AuthReq, @ZodBody(createGrnSchema) body: z.infer<typeof createGrnSchema>) {
    return this.svc.createGrn(req.user.tenantId, body);
  }

  @Patch('grn/:id/verify')
  verifyGrn(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(verifyGrnLinesSchema) body: z.infer<typeof verifyGrnLinesSchema>) {
    return this.svc.verifyGrn(req.user.tenantId, id, body);
  }

  @Patch('grn/:id/quality-check')
  qualityCheckGrn(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.qualityCheckGrn(req.user.tenantId, id);
  }

  @Patch('grn/:id/putaway')
  completeGrnPutaway(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completeGrnPutaway(req.user.tenantId, id);
  }

  @Patch('grn/:id/reject')
  rejectGrn(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(rejectGrnSchema) body: z.infer<typeof rejectGrnSchema>) {
    return this.svc.rejectGrn(req.user.tenantId, id, body.reason);
  }

  // ── Packing Sessions ─────────────────────────────────────────────────────
  @Get('packing')
  listPackingSessions(@Req() req: AuthReq, @Query('status') status?: string) {
    return this.svc.listPackingSessions(req.user.tenantId, status);
  }

  @Get('packing/:id')
  getPackingSession(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getPackingSession(req.user.tenantId, id);
  }

  @Post('packing')
  createPackingSession(@Req() req: AuthReq, @ZodBody(createPackingSessionSchema) body: z.infer<typeof createPackingSessionSchema>) {
    return this.svc.createPackingSession(req.user.tenantId, body);
  }

  @Post('packing/:id/cartons')
  addCarton(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(addCartonSchema) body: z.infer<typeof addCartonSchema>) {
    return this.svc.addCarton(req.user.tenantId, id, body);
  }

  @Patch('packing/:sessionId/cartons/:cartonId/seal')
  sealCarton(
    @Req() req: AuthReq,
    @Param('sessionId') sessionId: string,
    @Param('cartonId') cartonId: string,
  ) {
    return this.svc.sealCarton(req.user.tenantId, sessionId, cartonId);
  }

  @Patch('packing/:id/complete')
  completePackingSession(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.completePackingSession(req.user.tenantId, id);
  }
}
