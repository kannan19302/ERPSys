import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  InventoryLogisticsService,
  createCarrierSchema,
  createServiceLevelSchema,
  createAsnSchema,
  receiveAsnSchema,
  createInboundShipmentSchema,
  createOutboundShipmentSchema,
  addTrackingEventSchema,
} from './inventory-logistics.service';

interface AuthReq extends Request { user: { tenantId: string; orgId: string; userId: string }; }

@Controller('inventory/logistics')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryLogisticsController {
  constructor(private readonly svc: InventoryLogisticsService) {}

  // ─── Carrier Management ───────────────────────────────────────────────────

  @Get('carriers')
  listCarriers(@Req() req: AuthReq) {
    return this.svc.listCarriers(req.user.tenantId);
  }

  @Post('carriers')
  createCarrier(@Req() req: AuthReq, @ZodBody(createCarrierSchema) dto: typeof createCarrierSchema._type) {
    return this.svc.createCarrier(req.user.tenantId, dto);
  }

  @Patch('carriers/:id')
  updateCarrier(@Req() req: AuthReq, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.updateCarrier(req.user.tenantId, id, body as Parameters<InventoryLogisticsService['updateCarrier']>[2]);
  }

  @Delete('carriers/:id')
  deactivateCarrier(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deactivateCarrier(req.user.tenantId, id);
  }

  @Get('carriers/:carrierId/service-levels')
  listServiceLevels(@Req() req: AuthReq, @Param('carrierId') carrierId: string) {
    return this.svc.listServiceLevels(req.user.tenantId, carrierId);
  }

  @Post('carriers/service-levels')
  addServiceLevel(@Req() req: AuthReq, @ZodBody(createServiceLevelSchema) dto: typeof createServiceLevelSchema._type) {
    return this.svc.addServiceLevel(req.user.tenantId, dto);
  }

  // ─── ASN ─────────────────────────────────────────────────────────────────

  @Get('asns')
  listAsns(@Req() req: AuthReq, @Query('vendorId') vendorId?: string, @Query('warehouseId') warehouseId?: string, @Query('status') status?: string) {
    return this.svc.listAsns(req.user.tenantId, { vendorId, warehouseId, status });
  }

  @Get('asns/:id')
  getAsn(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getAsn(req.user.tenantId, id);
  }

  @Post('asns')
  createAsn(@Req() req: AuthReq, @ZodBody(createAsnSchema) dto: typeof createAsnSchema._type) {
    return this.svc.createAsn(req.user.tenantId, dto);
  }

  @Post('asns/:id/in-transit')
  markAsnInTransit(@Req() req: AuthReq, @Param('id') id: string, @Body('trackingNumber') trackingNumber?: string) {
    return this.svc.markAsnInTransit(req.user.tenantId, id, trackingNumber);
  }

  @Post('asns/:id/arrived')
  markAsnArrived(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.markAsnArrived(req.user.tenantId, id);
  }

  @Post('asns/:id/receive')
  receiveAsn(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(receiveAsnSchema) dto: typeof receiveAsnSchema._type) {
    return this.svc.receiveAsn(req.user.tenantId, id, dto);
  }

  @Post('asns/:id/cancel')
  cancelAsn(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.cancelAsn(req.user.tenantId, id);
  }

  // ─── Inbound Shipments ────────────────────────────────────────────────────

  @Get('inbound')
  listInbound(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listInboundShipments(req.user.tenantId, warehouseId);
  }

  @Post('inbound')
  createInbound(@Req() req: AuthReq, @ZodBody(createInboundShipmentSchema) dto: typeof createInboundShipmentSchema._type) {
    return this.svc.createInboundShipment(req.user.tenantId, dto);
  }

  @Patch('inbound/:id/status')
  updateInboundStatus(@Req() req: AuthReq, @Param('id') id: string, @Body('status') status: string, @Body('arrivedAt') arrivedAt?: string, @Body('completedAt') completedAt?: string) {
    return this.svc.updateInboundShipmentStatus(req.user.tenantId, id, status, { arrivedAt, completedAt });
  }

  @Post('inbound/:id/tracking')
  addInboundTracking(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(addTrackingEventSchema) dto: typeof addTrackingEventSchema._type) {
    return this.svc.addInboundTrackingEvent(req.user.tenantId, id, dto);
  }

  // ─── Outbound Shipments ───────────────────────────────────────────────────

  @Get('outbound')
  listOutbound(@Req() req: AuthReq, @Query('salesOrderId') salesOrderId?: string, @Query('warehouseId') warehouseId?: string, @Query('status') status?: string) {
    return this.svc.listOutboundShipments(req.user.tenantId, { salesOrderId, warehouseId, status });
  }

  @Post('outbound')
  createOutbound(@Req() req: AuthReq, @ZodBody(createOutboundShipmentSchema) dto: typeof createOutboundShipmentSchema._type) {
    return this.svc.createOutboundShipment(req.user.tenantId, dto);
  }

  @Post('outbound/:id/ship')
  shipOutbound(@Req() req: AuthReq, @Param('id') id: string, @Body('trackingNumber') trackingNumber?: string) {
    return this.svc.shipOutbound(req.user.tenantId, id, trackingNumber);
  }

  @Post('outbound/:id/deliver')
  recordDelivery(@Req() req: AuthReq, @Param('id') id: string, @Body('proofOfDelivery') pod?: string, @Body('recipientName') recipientName?: string) {
    return this.svc.recordDelivery(req.user.tenantId, id, pod, recipientName);
  }

  @Post('outbound/:id/exception')
  flagException(@Req() req: AuthReq, @Param('id') id: string, @Body('reason') reason: string) {
    return this.svc.flagOutboundException(req.user.tenantId, id, reason);
  }

  @Post('outbound/:id/tracking')
  addOutboundTracking(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(addTrackingEventSchema) dto: typeof addTrackingEventSchema._type) {
    return this.svc.addOutboundTrackingEvent(req.user.tenantId, id, dto);
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Req() req: AuthReq) {
    return this.svc.getLogisticsDashboard(req.user.tenantId);
  }

  @Get('exceptions')
  getExceptions(@Req() req: AuthReq) {
    return this.svc.getShipmentExceptions(req.user.tenantId);
  }
}
