import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProcurementService } from './procurement.service';
import { VendorPortalService } from './vendor-portal.service';
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('procurement')
@ApiBearerAuth()
@Controller('procurement')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementController {
  constructor(
    private readonly procurementService: ProcurementService,
    private readonly vendorPortalService: VendorPortalService,
  ) {}

  @ApiOperation({ summary: 'Get purchase orders' })
  @Get('purchase-orders')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseOrders(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getPurchaseOrders(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get purchase order by id' })
  @Get('purchase-orders/:id')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseOrderById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.procurementService.getPurchaseOrderById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create purchase order' })
  @Post('purchase-orders')
  @Permissions('procurement.purchase-order.create')
  async createPurchaseOrder(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePurchaseOrderInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createPurchaseOrder(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Update purchase order status' })
  @Patch('purchase-orders/:id/status')
  @Permissions('procurement.purchase-order.update')
  async updatePurchaseOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string },
  ): Promise<unknown> {
    return this.procurementService.updatePurchaseOrderStatus(req.user.tenantId, id, dto.status, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Create purchase receipt' })
  @Post('purchase-receipts')
  @Permissions('procurement.purchase-receipt.create')
  async createPurchaseReceipt(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePurchaseReceiptInput) {
    return this.procurementService.createPurchaseReceipt(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get purchase receipts' })
  @Get('purchase-receipts')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseReceipts(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getPurchaseReceipts(req.user.tenantId);
  }

  // ── REQUEST FOR QUOTATIONS (RFQ) ─────────────────

  @ApiOperation({ summary: 'Get r f qs' })
  @Get('rfqs')
  @Permissions('procurement.purchase-order.read')
  async getRFQs(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getRFQs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get r f q by id' })
  @Get('rfqs/:id')
  @Permissions('procurement.purchase-order.read')
  async getRFQById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getRFQById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create r f q' })
  @Post('rfqs')
  @Permissions('procurement.purchase-order.create')
  async createRFQ(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateRFQInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createRFQ(req.user.tenantId, orgId, dto);
  }

  // ── SUPPLIER QUOTATIONS ──────────────────────────

  @ApiOperation({ summary: 'Get supplier quotations' })
  @Get('supplier-quotations')
  @Permissions('procurement.purchase-order.read')
  async getSupplierQuotations(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getSupplierQuotations(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get supplier quotation by id' })
  @Get('supplier-quotations/:id')
  @Permissions('procurement.purchase-order.read')
  async getSupplierQuotationById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getSupplierQuotationById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create supplier quotation' })
  @Post('supplier-quotations')
  @Permissions('procurement.purchase-order.create')
  async createSupplierQuotation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateSupplierQuotationInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createSupplierQuotation(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update supplier quotation status' })
  @Patch('supplier-quotations/:id/status')
  @Permissions('procurement.purchase-order.update')
  async updateSupplierQuotationStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: string },
  ) {
    return this.procurementService.updateSupplierQuotationStatus(req.user.tenantId, id, dto.status);
  }

  @ApiOperation({ summary: 'Convert supplier quotation to p o' })
  @Post('supplier-quotations/:id/convert-po')
  @Permissions('procurement.purchase-order.create')
  async convertSupplierQuotationToPO(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.procurementService.convertSupplierQuotationToPO(req.user.tenantId, id, req.user.userId || 'system');
  }

  // ── PURCHASE RETURNS ──────────────────────────────

  @ApiOperation({ summary: 'Get purchase returns' })
  @Get('returns')
  @Permissions('procurement.purchase-order.read')
  async getPurchaseReturns(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getPurchaseReturns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create purchase return' })
  @Post('returns')
  @Permissions('procurement.purchase-order.create')
  async createPurchaseReturn(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreatePurchaseReturnInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createPurchaseReturn(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  // ── PURCHASE REQUISITIONS ─────────────────────────

  @ApiOperation({ summary: 'Get requisitions' })
  @Get('requisitions')
  @Permissions('procurement.purchase-order.read')
  async getRequisitions(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getRequisitions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get requisition by id' })
  @Get('requisitions/:id')
  @Permissions('procurement.purchase-order.read')
  async getRequisitionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getRequisitionById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create requisition' })
  @Post('requisitions')
  @Permissions('procurement.purchase-order.create')
  async createRequisition(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createPurchaseRequisitionSchema)) dto: CreatePurchaseRequisitionInput,
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createRequisition(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Approve requisition' })
  @Patch('requisitions/:id/approve')
  @Permissions('procurement.purchase-order.update')
  async approveRequisition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.updateRequisitionStatus(req.user.tenantId, id, 'APPROVED', req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Reject requisition' })
  @Patch('requisitions/:id/reject')
  @Permissions('procurement.purchase-order.update')
  async rejectRequisition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.updateRequisitionStatus(req.user.tenantId, id, 'REJECTED', req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Convert requisition to p o' })
  @Post('requisitions/:id/convert-po')
  @Permissions('procurement.purchase-order.create')
  async convertRequisitionToPO(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.convertRequisitionToPO(req.user.tenantId, id, req.user.userId || 'system');
  }

  // ── BLANKET PURCHASE AGREEMENTS ───────────────────

  @ApiOperation({ summary: 'Get blanket agreements' })
  @Get('blanket-agreements')
  @Permissions('procurement.purchase-order.read')
  async getBlanketAgreements(@Req() req: AuthenticatedRequest) {
    return this.procurementService.getBlanketAgreements(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get blanket agreement by id' })
  @Get('blanket-agreements/:id')
  @Permissions('procurement.purchase-order.read')
  async getBlanketAgreementById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getBlanketAgreementById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create blanket agreement' })
  @Post('blanket-agreements')
  @Permissions('procurement.purchase-order.create')
  async createBlanketAgreement(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBlanketPurchaseAgreementSchema)) dto: CreateBlanketPurchaseAgreementInput,
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.procurementService.createBlanketAgreement(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Create release order' })
  @Post('blanket-agreements/:id/release')
  @Permissions('procurement.purchase-order.create')
  async createReleaseOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { items: Array<{ itemId: string; releaseQty: number }> },
  ) {
    return this.procurementService.createReleaseOrder(req.user.tenantId, id, dto, req.user.userId || 'system');
  }

  // ── SUPPLIER SCORECARD ─────────────────────────────

  @ApiOperation({ summary: 'Get vendor performance metrics' })
  @Get('vendors/:id/scorecard')
  @Permissions('procurement.purchase-order.read')
  async getVendorPerformanceMetrics(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getVendorPerformanceMetrics(req.user.tenantId, id);
  }

  // ── 3-WAY MATCH CHECK ──────────────────────────────

  @ApiOperation({ summary: 'Get three way match report' })
  @Get('purchase-orders/:id/three-way-match')
  @Permissions('procurement.purchase-order.read')
  async getThreeWayMatchReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.procurementService.getThreeWayMatchReport(req.user.tenantId, id);
  }

  // ── VENDOR PORTAL MANAGEMENT (tenant admins only) ──

  @ApiOperation({ summary: 'Invite a vendor portal user' })
  @Permissions('procurement.vendor.manage')
  @Post('vendors/:vendorId/portal-users')
  async invitePortalUser(
    @Req() req: AuthenticatedRequest,
    @Param('vendorId') vendorId: string,
    @Body() body: { email: string },
  ) {
    return this.vendorPortalService.inviteUser(req.user.tenantId, vendorId, body.email);
  }

  @ApiOperation({ summary: 'List vendor portal users' })
  @Permissions('procurement.vendor.manage')
  @Get('vendors/:vendorId/portal-users')
  async listPortalUsers(
    @Req() req: AuthenticatedRequest,
    @Param('vendorId') vendorId: string,
  ) {
    return this.vendorPortalService.listUsers(req.user.tenantId, vendorId);
  }

  @ApiOperation({ summary: 'Disable a vendor portal user' })
  @Permissions('procurement.vendor.manage')
  @Patch('portal-users/:userId/disable')
  async disablePortalUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    return this.vendorPortalService.disableUser(req.user.tenantId, userId);
  }

  @ApiOperation({ summary: 'Get POs visible to the portal user\'s vendor' })
  @Permissions('procurement.vendor.manage')
  @Get('vendors/:vendorId/portal/purchase-orders')
  async getPortalPurchaseOrders(
    @Req() req: AuthenticatedRequest,
    @Param('vendorId') vendorId: string,
  ) {
    return this.vendorPortalService.getMyPurchaseOrders(req.user.tenantId, vendorId);
  }

  @ApiOperation({ summary: 'Get RFQs visible to the portal user\'s vendor' })
  @Permissions('procurement.vendor.manage')
  @Get('vendors/:vendorId/portal/rfqs')
  async getPortalRfqs(
    @Req() req: AuthenticatedRequest,
    @Param('vendorId') vendorId: string,
  ) {
    return this.vendorPortalService.getMyRfqs(req.user.tenantId, vendorId);
  }
}
