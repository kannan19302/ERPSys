import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProcurementService } from './procurement.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreatePurchaseOrderInput,
  CreatePurchaseReceiptInput,
  CreateRFQInput,
  CreateSupplierQuotationInput,
  CreatePurchaseReturnInput,
  createPurchaseRequisitionSchema,
  CreatePurchaseRequisitionInput,
  createBlanketPurchaseAgreementSchema,
  CreateBlanketPurchaseAgreementInput,
} from '@unerp/shared';

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
    @Body() dto: { status: string },
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
    @Body() dto: { status: string },
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

  // ── PURCHASE RETURNS ──────────────────────────────

  @Get('returns')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseReturns(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getPurchaseReturns(req.user.tenantId);
  }

  @Post('returns')
  @Permissions('procurement.purchase-order.create')
  async createPurchaseReturn(@Req() req: AuthenticatedRequest, @Body() dto: CreatePurchaseReturnInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createPurchaseReturn(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  // ── PURCHASE REQUISITIONS ─────────────────────────

  @Get('requisitions')
  @Permissions('procurement.purchase-order.read')
  async getRequisitions(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getRequisitions(req.user.tenantId);
  }

  @Get('requisitions/:id')
  @Permissions('procurement.purchase-order.read')
  async getRequisitionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getRequisitionById(req.user.tenantId, id);
  }

  @Post('requisitions')
  @Permissions('procurement.purchase-order.create')
  async createRequisition(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createPurchaseRequisitionSchema)) dto: CreatePurchaseRequisitionInput,
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createRequisition(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('requisitions/:id/approve')
  @Permissions('procurement.purchase-order.update')
  async approveRequisition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.updateRequisitionStatus(req.user.tenantId, id, 'APPROVED', req.user.userId || 'system');
  }

  @Patch('requisitions/:id/reject')
  @Permissions('procurement.purchase-order.update')
  async rejectRequisition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.updateRequisitionStatus(req.user.tenantId, id, 'REJECTED', req.user.userId || 'system');
  }

  @Post('requisitions/:id/convert-po')
  @Permissions('procurement.purchase-order.create')
  async convertRequisitionToPO(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.convertRequisitionToPO(req.user.tenantId, id, req.user.userId || 'system');
  }

  // ── BLANKET PURCHASE AGREEMENTS ───────────────────

  @Get('blanket-agreements')
  @Permissions('procurement.purchase-order.read')
  async getBlanketAgreements(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getBlanketAgreements(req.user.tenantId);
  }

  @Get('blanket-agreements/:id')
  @Permissions('procurement.purchase-order.read')
  async getBlanketAgreementById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getBlanketAgreementById(req.user.tenantId, id);
  }

  @Post('blanket-agreements')
  @Permissions('procurement.purchase-order.create')
  async createBlanketAgreement(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBlanketPurchaseAgreementSchema)) dto: CreateBlanketPurchaseAgreementInput,
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createBlanketAgreement(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Post('blanket-agreements/:id/release')
  @Permissions('procurement.purchase-order.create')
  async createReleaseOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { items: Array<{ itemId: string; releaseQty: number }> },
  ) {
    return this.procurementService.createReleaseOrder(req.user.tenantId, id, dto, req.user.userId || 'system');
  }

  // ── SUPPLIER SCORECARD ─────────────────────────────

  @Get('vendors/:id/scorecard')
  @Permissions('procurement.purchase-order.read')
  async getVendorPerformanceMetrics(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getVendorPerformanceMetrics(req.user.tenantId, id);
  }

  // ── 3-WAY MATCH CHECK ──────────────────────────────

  @Get('purchase-orders/:id/three-way-match')
  @Permissions('procurement.purchase-order.read')
  async getThreeWayMatchReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getThreeWayMatchReport(req.user.tenantId, id);
  }
}
