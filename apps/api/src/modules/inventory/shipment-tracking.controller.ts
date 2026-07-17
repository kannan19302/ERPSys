import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ShipmentTrackingService } from './shipment-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ShipmentDirection, ShipmentExceptionStatus } from '@prisma/client';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('inventory/shipment-tracking')
export class ShipmentTrackingController {
  constructor(private readonly svc: ShipmentTrackingService) {}

  // Inbound
  @Post('inbound')
  createInbound(@Request() req: AuthRequest, @Body() body: {
    warehouseId: string; asnId?: string; carrierId?: string; trackingNumber?: string;
    expectedArrival?: string; totalPallets?: number; totalCartons?: number; totalWeight?: number; notes?: string;
  }) {
    return this.svc.createInboundShipment(req.user.tenantId, {
      ...body,
      expectedArrival: body.expectedArrival ? new Date(body.expectedArrival) : undefined,
    });
  }

  @Patch('inbound/:id/status')
  updateInboundStatus(@Request() req: AuthRequest, @Param('id') id: string, @Body('status') status: string) {
    return this.svc.updateInboundStatus(req.user.tenantId, id, status);
  }

  @Get('inbound')
  listInbound(@Request() req: AuthRequest, @Query('status') status?: string, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listInboundShipments(req.user.tenantId, status, warehouseId);
  }

  // Outbound
  @Post('outbound')
  createOutbound(@Request() req: AuthRequest, @Body() body: {
    warehouseId: string; salesOrderId?: string; carrierId?: string; serviceLevelId?: string;
    trackingNumber?: string; recipientName?: string; recipientAddr?: string;
    totalPallets?: number; totalCartons?: number; totalWeight?: number;
    estimatedDelivery?: string; notes?: string;
  }) {
    return this.svc.createOutboundShipment(req.user.tenantId, {
      ...body,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
    });
  }

  @Patch('outbound/:id/status')
  updateOutboundStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('proofOfDelivery') proofOfDelivery?: string,
  ) {
    return this.svc.updateOutboundStatus(req.user.tenantId, id, status, proofOfDelivery);
  }

  @Get('outbound')
  listOutbound(@Request() req: AuthRequest, @Query('status') status?: string, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listOutboundShipments(req.user.tenantId, status, warehouseId);
  }

  // Tracking events
  @Post('events')
  addTrackingEvent(@Request() req: AuthRequest, @Body() body: {
    direction: ShipmentDirection; shipmentId: string;
    eventCode: string; description: string; location?: string;
    occurredAt?: string; source?: string;
  }) {
    return this.svc.addTrackingEvent(req.user.tenantId, {
      ...body,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });
  }

  @Get('events')
  getTrackingHistory(
    @Request() req: AuthRequest,
    @Query('direction') direction: ShipmentDirection,
    @Query('shipmentId') shipmentId: string,
  ) {
    return this.svc.getTrackingHistory(req.user.tenantId, direction, shipmentId);
  }

  // Exceptions
  @Post('exceptions')
  reportException(@Request() req: AuthRequest, @Body() body: {
    direction: ShipmentDirection; shipmentId: string;
    exceptionCode: string; description: string; severity?: string;
  }) {
    return this.svc.reportException(req.user.tenantId, req.user.userId, body);
  }

  @Patch('exceptions/:id/status')
  updateExceptionStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('status') status: ShipmentExceptionStatus,
    @Body('note') note?: string,
  ) {
    return this.svc.updateExceptionStatus(req.user.tenantId, id, req.user.userId, status, note);
  }

  @Get('exceptions')
  listExceptions(
    @Request() req: AuthRequest,
    @Query('status') status?: ShipmentExceptionStatus,
    @Query('shipmentId') shipmentId?: string,
  ) {
    return this.svc.listExceptions(req.user.tenantId, status, shipmentId);
  }

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }
}
