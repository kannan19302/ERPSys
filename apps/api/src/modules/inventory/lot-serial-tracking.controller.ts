import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  LotSerialTrackingService,
  createBatchSchema,
  createSerialSchema,
  recordLotMovementSchema,
  generatePickSuggestionsSchema,
  confirmPickSchema,
  quarantineOrderSchema,
  releaseQuarantineSchema,
  generateExpiryAlertsSchema,
} from './lot-serial-tracking.service';

interface AuthReq extends Request { user: { tenantId: string; orgId: string; userId: string }; }

const scrapNotesSchema = z.object({ notes: z.string().optional() });
const soldSchema = z.object({ salesOrderId: z.string().optional() });

@Controller('inventory/lot-serial')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class LotSerialTrackingController {
  constructor(private readonly svc: LotSerialTrackingService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────
  @Permissions('inventory.lot_serial.read')
  @Get('dashboard')
  dashboard(@Req() req: AuthReq) {
    return this.svc.getLotSerialDashboard(req.user.tenantId);
  }

  @Permissions('inventory.lot_serial.read')
  @Get('expiry-report')
  expiryReport(@Req() req: AuthReq) {
    return this.svc.getExpiryReport(req.user.tenantId);
  }

  // ── Batches/Lots ───────────────────────────────────────────────────────
  @Permissions('inventory.lot_serial.read')
  @Get('batches')
  listBatches(
    @Req() req: AuthReq,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('expiringBefore') expiringBefore?: string,
  ) {
    return this.svc.listBatches(req.user.tenantId, { productId, status, warehouseId, expiringBefore });
  }

  @Permissions('inventory.lot_serial.read')
  @Get('batches/:id')
  getBatch(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getBatch(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.manage')
  @Post('batches')
  createBatch(@Req() req: AuthReq, @ZodBody(createBatchSchema) body: z.infer<typeof createBatchSchema>) {
    return this.svc.createBatch(req.user.tenantId, body);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('batches/:id/quarantine')
  quarantineBatch(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.quarantineBatch(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('batches/:id/release-quarantine')
  releaseBatchFromQuarantine(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.releaseBatchFromQuarantine(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('batches/:id/expire')
  expireBatch(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.expireBatch(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.read')
  @Get('batches/:id/movements')
  getBatchMovements(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getBatchMovements(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.manage')
  @Post('lot-movements')
  recordLotMovement(@Req() req: AuthReq, @ZodBody(recordLotMovementSchema) body: z.infer<typeof recordLotMovementSchema>) {
    return this.svc.recordLotMovement(req.user.tenantId, req.user.userId, body);
  }

  // ── Serial Numbers ─────────────────────────────────────────────────────
  @Permissions('inventory.lot_serial.read')
  @Get('serials')
  listSerials(
    @Req() req: AuthReq,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listSerials(req.user.tenantId, { productId, status });
  }

  @Permissions('inventory.lot_serial.read')
  @Get('serials/:id')
  getSerial(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getSerial(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.manage')
  @Post('serials')
  createSerial(@Req() req: AuthReq, @ZodBody(createSerialSchema) body: z.infer<typeof createSerialSchema>) {
    return this.svc.createSerial(req.user.tenantId, body);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('serials/:id/sold')
  markSerialSold(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(soldSchema) body: z.infer<typeof soldSchema>) {
    return this.svc.markSerialSold(req.user.tenantId, id, body.salesOrderId);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('serials/:id/returned')
  markSerialReturned(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(scrapNotesSchema) body: z.infer<typeof scrapNotesSchema>) {
    return this.svc.markSerialReturned(req.user.tenantId, id, body.notes);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('serials/:id/scrap')
  scrapSerial(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(scrapNotesSchema) body: z.infer<typeof scrapNotesSchema>) {
    return this.svc.scrapSerial(req.user.tenantId, id, body.notes);
  }

  // ── Pick Suggestions ────────────────────────────────────────────────────
  @Permissions('inventory.lot_serial.manage')
  @Post('pick-suggestions/generate')
  generatePickSuggestions(@Req() req: AuthReq, @ZodBody(generatePickSuggestionsSchema) body: z.infer<typeof generatePickSuggestionsSchema>) {
    return this.svc.generatePickSuggestions(req.user.tenantId, body);
  }

  @Permissions('inventory.lot_serial.read')
  @Get('pick-suggestions')
  listPickSuggestions(
    @Req() req: AuthReq,
    @Query('referenceId') referenceId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listPickSuggestions(req.user.tenantId, { referenceId, status });
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('pick-suggestions/:id/confirm')
  confirmPickSuggestion(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(confirmPickSchema) body: z.infer<typeof confirmPickSchema>) {
    return this.svc.confirmPickSuggestion(req.user.tenantId, id, body);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('pick-suggestions/:id/cancel')
  cancelPickSuggestion(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.cancelPickSuggestion(req.user.tenantId, id);
  }

  // ── Expiry Alerts ───────────────────────────────────────────────────────
  @Permissions('inventory.lot_serial.manage')
  @Post('expiry-alerts/generate')
  generateExpiryAlerts(@Req() req: AuthReq, @ZodBody(generateExpiryAlertsSchema) body: z.infer<typeof generateExpiryAlertsSchema>) {
    return this.svc.generateExpiryAlerts(req.user.tenantId, body);
  }

  @Permissions('inventory.lot_serial.read')
  @Get('expiry-alerts')
  listExpiryAlerts(
    @Req() req: AuthReq,
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: string,
  ) {
    const ack = acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined;
    return this.svc.listExpiryAlerts(req.user.tenantId, { severity, acknowledged: ack });
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('expiry-alerts/:id/acknowledge')
  acknowledgeExpiryAlert(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.acknowledgeExpiryAlert(req.user.tenantId, id, req.user.userId);
  }

  // ── Quarantine Orders ───────────────────────────────────────────────────
  @Permissions('inventory.lot_serial.read')
  @Get('quarantine')
  listQuarantineOrders(@Req() req: AuthReq, @Query('status') status?: string) {
    return this.svc.listQuarantineOrders(req.user.tenantId, status);
  }

  @Permissions('inventory.lot_serial.read')
  @Get('quarantine/:id')
  getQuarantineOrder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getQuarantineOrder(req.user.tenantId, id);
  }

  @Permissions('inventory.lot_serial.manage')
  @Post('quarantine')
  createQuarantineOrder(@Req() req: AuthReq, @ZodBody(quarantineOrderSchema) body: z.infer<typeof quarantineOrderSchema>) {
    return this.svc.createQuarantineOrder(req.user.tenantId, req.user.userId, body);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('quarantine/:id/release')
  releaseQuarantineOrder(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(releaseQuarantineSchema) body: z.infer<typeof releaseQuarantineSchema>) {
    return this.svc.releaseQuarantineOrder(req.user.tenantId, id, req.user.userId, body);
  }

  @Permissions('inventory.lot_serial.manage')
  @Patch('quarantine/:id/scrap')
  scrapQuarantineOrder(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.scrapQuarantineOrder(req.user.tenantId, id);
  }
}
