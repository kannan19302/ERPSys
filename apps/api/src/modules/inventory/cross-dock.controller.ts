import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { CrossDockService } from './cross-dock.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CrossDockStatus, CrossDockType, DockDoorStatus } from '@prisma/client';

interface AuthRequest { user: { tenantId: string; userId: string } }

@UseGuards(JwtAuthGuard)
@Controller('inventory/cross-dock')
export class CrossDockController {
  constructor(private readonly svc: CrossDockService) {}

  // Stations
  @Post('stations')
  createStation(@Request() req: AuthRequest, @Body() body: {
    warehouseId: string; code: string; name: string; doorNumber: string;
    isInbound?: boolean; isOutbound?: boolean; notes?: string;
  }) {
    return this.svc.createStation(req.user.tenantId, body);
  }

  @Patch('stations/:id/status')
  updateStationStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('status') status: DockDoorStatus,
  ) {
    return this.svc.updateStationStatus(req.user.tenantId, id, status);
  }

  @Get('stations')
  listStations(@Request() req: AuthRequest, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listStations(req.user.tenantId, warehouseId);
  }

  // Orders
  @Post('orders')
  createOrder(@Request() req: AuthRequest, @Body() body: {
    type?: CrossDockType; warehouseId: string; stationId?: string;
    productId: string; expectedQty: number; inboundRef?: string;
    outboundRef?: string; supplierName?: string; customerName?: string;
    expectedArrival?: string; expectedDispatch?: string;
  }) {
    return this.svc.createOrder(req.user.tenantId, req.user.userId, {
      ...body,
      expectedArrival: body.expectedArrival ? new Date(body.expectedArrival) : undefined,
      expectedDispatch: body.expectedDispatch ? new Date(body.expectedDispatch) : undefined,
    });
  }

  @Patch('orders/:id/receive')
  receiveGoods(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('receivedQty') receivedQty: number,
  ) {
    return this.svc.receiveGoods(req.user.tenantId, req.user.userId, id, receivedQty);
  }

  @Patch('orders/:id/stage')
  stageOrder(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('stationId') stationId?: string,
  ) {
    return this.svc.stageOrder(req.user.tenantId, req.user.userId, id, stationId);
  }

  @Patch('orders/:id/dispatch')
  dispatchOrder(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('dispatchedQty') dispatchedQty: number,
  ) {
    return this.svc.dispatchOrder(req.user.tenantId, req.user.userId, id, dispatchedQty);
  }

  @Patch('orders/:id/cancel')
  cancelOrder(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.svc.cancelOrder(req.user.tenantId, req.user.userId, id, reason);
  }

  @Get('orders')
  listOrders(
    @Request() req: AuthRequest,
    @Query('status') status?: CrossDockStatus,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.listOrders(req.user.tenantId, status, warehouseId);
  }

  @Get('orders/:id')
  getOrder(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getOrder(req.user.tenantId, id);
  }

  @Get('orders/:id/events')
  getEvents(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getEvents(req.user.tenantId, id);
  }

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }
}
