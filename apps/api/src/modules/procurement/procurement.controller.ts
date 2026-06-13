import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProcurementService } from './procurement.service';
import { CreatePurchaseOrderInput, CreatePurchaseReceiptInput, UpdatePurchaseOrderStatusInput, CreateRFQInput, CreateSupplierQuotationInput, UpdateSupplierQuotationStatusInput } from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('procurement')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('purchase-orders')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseOrders(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getPurchaseOrders(req.user.tenantId);
  }

  @Get('purchase-orders/:id')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseOrderById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.procurementService.getPurchaseOrderById(req.user.tenantId, id);
  }

  @Post('purchase-orders')
  @Permissions('procurement.purchase-order.create')
  async createPurchaseOrder(@Req() req: AuthenticatedRequest, @Body() dto: CreatePurchaseOrderInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createPurchaseOrder(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('purchase-orders/:id/status')
  @Permissions('procurement.purchase-order.update')
  async updatePurchaseOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusInput,
  ): Promise<unknown> {
    return this.procurementService.updatePurchaseOrderStatus(req.user.tenantId, id, dto.status, req.user.userId || 'system');
  }

  @Post('purchase-receipts')
  @Permissions('procurement.purchase-receipt.create')
  async createPurchaseReceipt(@Req() req: AuthenticatedRequest, @Body() dto: CreatePurchaseReceiptInput) {
    return this.procurementService.createPurchaseReceipt(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Get('purchase-receipts')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseReceipts(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getPurchaseReceipts(req.user.tenantId);
  }

  // ── REQUEST FOR QUOTATIONS (RFQ) ─────────────────

  @Get('rfqs')
  @Permissions('procurement.purchase-order.read')
  async getRFQs(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getRFQs(req.user.tenantId);
  }

  @Get('rfqs/:id')
  @Permissions('procurement.purchase-order.read')
  async getRFQById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getRFQById(req.user.tenantId, id);
  }

  @Post('rfqs')
  @Permissions('procurement.purchase-order.create')
  async createRFQ(@Req() req: AuthenticatedRequest, @Body() dto: CreateRFQInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createRFQ(req.user.tenantId, orgId, dto);
  }

  // ── SUPPLIER QUOTATIONS ──────────────────────────

  @Get('supplier-quotations')
  @Permissions('procurement.purchase-order.read')
  async getSupplierQuotations(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getSupplierQuotations(req.user.tenantId);
  }

  @Get('supplier-quotations/:id')
  @Permissions('procurement.purchase-order.read')
  async getSupplierQuotationById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getSupplierQuotationById(req.user.tenantId, id);
  }

  @Post('supplier-quotations')
  @Permissions('procurement.purchase-order.create')
  async createSupplierQuotation(@Req() req: AuthenticatedRequest, @Body() dto: CreateSupplierQuotationInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createSupplierQuotation(req.user.tenantId, orgId, dto);
  }

  @Patch('supplier-quotations/:id/status')
  @Permissions('procurement.purchase-order.update')
  async updateSupplierQuotationStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierQuotationStatusInput,
  ) {
    return this.procurementService.updateSupplierQuotationStatus(req.user.tenantId, id, dto.status);
  }

  @Post('supplier-quotations/:id/convert-po')
  @Permissions('procurement.purchase-order.create')
  async convertSupplierQuotationToPO(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.procurementService.convertSupplierQuotationToPO(req.user.tenantId, id, req.user.userId || 'system');
  }
}
