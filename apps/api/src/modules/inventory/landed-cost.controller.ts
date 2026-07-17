import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { LandedCostService } from './landed-cost.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/landed-cost')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class LandedCostController {
  constructor(private readonly svc: LandedCostService) {}

  // Dashboard
  @Permissions('inventory.landed_cost.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Permissions('inventory.landed_cost.read')
  @Get('charge-type-summary')
  getChargeTypeSummary(@Request() req: AuthRequest) {
    return this.svc.getChargeTypeSummary(req.user.tenantId);
  }

  // Allocation report
  @Permissions('inventory.landed_cost.read')
  @Get('allocation-report')
  getAllocationReport(
    @Request() req: AuthRequest,
    @Query('voucherId') voucherId?: string,
  ) {
    return this.svc.getAllocationReport(req.user.tenantId, voucherId);
  }

  // Vouchers
  @Permissions('inventory.landed_cost.read')
  @Get('vouchers')
  listVouchers(
    @Request() req: AuthRequest,
    @Query('status') status?: string,
  ) {
    return this.svc.listVouchers(req.user.tenantId, status);
  }

  @Permissions('inventory.landed_cost.manage')
  @Post('vouchers')
  createVoucher(
    @Request() req: AuthRequest,
    @Body() dto: {
      description?: string;
      allocationMethod: string;
      currency?: string;
      vendorId?: string;
      invoiceRef?: string;
      notes?: string;
    },
  ) {
    return this.svc.createVoucher(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.landed_cost.read')
  @Get('vouchers/:id')
  getVoucher(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getVoucher(req.user.tenantId, id);
  }

  @Permissions('inventory.landed_cost.manage')
  @Put('vouchers/:id')
  updateVoucher(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: {
      description?: string;
      allocationMethod?: string;
      currency?: string;
      vendorId?: string;
      invoiceRef?: string;
      notes?: string;
    },
  ) {
    return this.svc.updateVoucher(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.landed_cost.manage')
  @Delete('vouchers/:id')
  deleteVoucher(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deleteVoucher(req.user.tenantId, id);
  }

  @Permissions('inventory.landed_cost.manage')
  @Patch('vouchers/:id/submit')
  submitVoucher(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.submitVoucher(req.user.tenantId, id);
  }

  @Permissions('inventory.landed_cost.manage')
  @Patch('vouchers/:id/cancel')
  cancelVoucher(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelVoucher(req.user.tenantId, id);
  }

  @Permissions('inventory.landed_cost.manage')
  @Patch('vouchers/:id/allocate')
  allocate(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.allocate(req.user.tenantId, id);
  }

  // Charge Lines
  @Permissions('inventory.landed_cost.read')
  @Get('vouchers/:id/charge-lines')
  listChargeLines(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listChargeLines(req.user.tenantId, id);
  }

  @Permissions('inventory.landed_cost.manage')
  @Post('vouchers/:id/charge-lines')
  addChargeLine(
    @Request() req: AuthRequest,
    @Param('id') voucherId: string,
    @Body() dto: {
      chargeType: string;
      description?: string;
      amount: number;
      currency?: string;
      accountCode?: string;
    },
  ) {
    return this.svc.addChargeLine(req.user.tenantId, voucherId, dto);
  }

  @Permissions('inventory.landed_cost.manage')
  @Put('vouchers/:id/charge-lines/:lineId')
  updateChargeLine(
    @Request() req: AuthRequest,
    @Param('id') voucherId: string,
    @Param('lineId') lineId: string,
    @Body() dto: {
      chargeType?: string;
      description?: string;
      amount?: number;
      currency?: string;
      accountCode?: string;
    },
  ) {
    return this.svc.updateChargeLine(req.user.tenantId, voucherId, lineId, dto);
  }

  @Permissions('inventory.landed_cost.manage')
  @Delete('vouchers/:id/charge-lines/:lineId')
  removeChargeLine(
    @Request() req: AuthRequest,
    @Param('id') voucherId: string,
    @Param('lineId') lineId: string,
  ) {
    return this.svc.removeChargeLine(req.user.tenantId, voucherId, lineId);
  }

  // Receipt Links
  @Permissions('inventory.landed_cost.read')
  @Get('vouchers/:id/receipt-links')
  listReceiptLinks(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listReceiptLinks(req.user.tenantId, id);
  }

  @Permissions('inventory.landed_cost.manage')
  @Post('vouchers/:id/receipt-links')
  linkReceipt(
    @Request() req: AuthRequest,
    @Param('id') voucherId: string,
    @Body() dto: {
      stockEntryId: string;
      totalQty: number;
      totalValue: number;
      totalWeight?: number;
      totalVolume?: number;
    },
  ) {
    return this.svc.linkReceipt(req.user.tenantId, voucherId, dto);
  }

  @Permissions('inventory.landed_cost.manage')
  @Delete('vouchers/:id/receipt-links/:stockEntryId')
  unlinkReceipt(
    @Request() req: AuthRequest,
    @Param('id') voucherId: string,
    @Param('stockEntryId') stockEntryId: string,
  ) {
    return this.svc.unlinkReceipt(req.user.tenantId, voucherId, stockEntryId);
  }

  // Allocations
  @Permissions('inventory.landed_cost.read')
  @Get('vouchers/:id/allocations')
  listAllocations(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listAllocations(req.user.tenantId, id);
  }
}
