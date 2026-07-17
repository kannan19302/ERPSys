import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { TransferOrdersService } from './transfer-orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/transfer-orders')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class TransferOrdersController {
  constructor(private readonly svc: TransferOrdersService) {}

  @Permissions('inventory.transfer_orders.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Permissions('inventory.transfer_orders.read')
  @Get('in-transit')
  getInTransitSummary(@Request() req: AuthRequest) {
    return this.svc.getInTransitSummary(req.user.tenantId);
  }

  @Permissions('inventory.transfer_orders.read')
  @Get('receiving-report')
  getReceivingReport(
    @Request() req: AuthRequest,
    @Query('fromWarehouseId') fromWarehouseId?: string,
    @Query('toWarehouseId') toWarehouseId?: string,
  ) {
    return this.svc.getReceivingReport(req.user.tenantId, fromWarehouseId, toWarehouseId);
  }

  @Permissions('inventory.transfer_orders.read')
  @Get()
  listTransferOrders(
    @Request() req: AuthRequest,
    @Query('status') status?: string,
    @Query('fromWarehouseId') fromWarehouseId?: string,
    @Query('toWarehouseId') toWarehouseId?: string,
  ) {
    return this.svc.listTransferOrders(req.user.tenantId, status, fromWarehouseId, toWarehouseId);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Post()
  createTransferOrder(
    @Request() req: AuthRequest,
    @Body() dto: {
      fromWarehouseId: string;
      toWarehouseId: string;
      priority?: string;
      requestedDate?: string;
      expectedDate?: string;
      notes?: string;
      carrier?: string;
      estimatedCost?: number;
      lines: { productId: string; requestedQty: number; uom?: string; unitCost?: number; lotNumber?: string; serialNumbers?: string[]; binLocationId?: string; notes?: string }[];
    },
  ) {
    return this.svc.createTransferOrder(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.transfer_orders.read')
  @Get(':id')
  getTransferOrder(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getTransferOrder(req.user.tenantId, id);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Put(':id')
  updateTransferOrder(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: {
      priority?: string;
      expectedDate?: string;
      notes?: string;
      carrier?: string;
      trackingNumber?: string;
      estimatedCost?: number;
    },
  ) {
    return this.svc.updateTransferOrder(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Patch(':id/submit')
  submitForApproval(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.submitForApproval(req.user.tenantId, id);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Patch(':id/approve')
  approve(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approve(req.user.tenantId, id, req.user.userId);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Patch(':id/ship')
  ship(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: {
      carrier?: string;
      trackingNumber?: string;
      shippedLines: { lineId: string; shippedQty: number }[];
    },
  ) {
    return this.svc.ship(req.user.tenantId, id, req.user.userId, dto);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Patch(':id/receive')
  receive(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: {
      notes?: string;
      lines: { lineId: string; receivedQty: number; acceptedQty: number; rejectedQty?: number; rejectionReason?: string }[];
    },
  ) {
    return this.svc.receive(req.user.tenantId, id, req.user.userId, dto);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Patch(':id/cancel')
  cancel(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancel(req.user.tenantId, id);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Patch(':id/close-out')
  closeOut(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.closeOut(req.user.tenantId, id);
  }

  // Lines
  @Permissions('inventory.transfer_orders.manage')
  @Post(':id/lines')
  addLine(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: {
      productId: string;
      requestedQty: number;
      uom?: string;
      unitCost?: number;
      lotNumber?: string;
      serialNumbers?: string[];
      binLocationId?: string;
      notes?: string;
    },
  ) {
    return this.svc.addLine(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.transfer_orders.manage')
  @Delete(':id/lines/:lineId')
  removeLine(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ) {
    return this.svc.removeLine(req.user.tenantId, id, lineId);
  }

  // Receipts
  @Permissions('inventory.transfer_orders.read')
  @Get(':id/receipts')
  listReceipts(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listReceipts(req.user.tenantId, id);
  }
}
