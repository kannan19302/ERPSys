import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { SubcontractingService } from './subcontracting.service';
import { DebitNotesService } from './debit-notes.service';
import { VendorRmaService } from './vendor-rma.service';
import { SupplierNcrCarService } from './supplier-ncr-car.service';

interface AuthRequest extends Request { user: { tenantId: string; userId: string; orgId?: string; email: string; roles: string[] } }

@ApiTags('Procurement Expansion')
@ApiBearerAuth()
@Controller('procurement/expansion')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementExpansionController {
  constructor(
    private readonly subcontractingService: SubcontractingService,
    private readonly debitNotesService: DebitNotesService,
    private readonly vendorRmaService: VendorRmaService,
    private readonly supplierNcrCarService: SupplierNcrCarService,
  ) {}

  // ── Subcontracting ──────────────────────────────────────────

  @Get('subcontracting')
  @Permissions('procurement.purchase-order.read')
  async listSubcontracting(@Req() req: AuthRequest, @Query() q: any) {
    return this.subcontractingService.list(req.user.tenantId, q);
  }

  @Get('subcontracting/:id')
  @Permissions('procurement.purchase-order.read')
  async getSubcontracting(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.subcontractingService.getById(req.user.tenantId, id);
  }

  @Post('subcontracting')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SubcontractingOrder')
  @Permissions('procurement.purchase-order.create')
  async createSubcontracting(@Req() req: AuthRequest, @Body() dto: any) {
    return this.subcontractingService.create(req.user.tenantId, dto);
  }

  @Patch('subcontracting/:id')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SubcontractingOrder')
  @Permissions('procurement.purchase-order.update')
  async updateSubcontracting(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.subcontractingService.updateOrder(req.user.tenantId, id, dto);
  }

  @Patch('subcontracting/:id/status')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SubcontractingOrder')
  @Permissions('procurement.purchase-order.update')
  async updateSubcontractingStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.subcontractingService.updateStatus(req.user.tenantId, id, dto.status);
  }

  @Patch('subcontracting/:id/close')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SubcontractingOrder')
  @Permissions('procurement.subcontracting.close')
  async closeSubcontracting(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.subcontractingService.closeOrder(req.user.tenantId, id);
  }

  @Post('subcontracting/:id/issue-material/:materialId')
  @Permissions('procurement.purchase-order.update')
  async issueSubcontractingMaterial(@Req() req: AuthRequest, @Param('id') id: string, @Param('materialId') materialId: string, @Body() dto: { issuedQty: number }) {
    return this.subcontractingService.issueMaterial(req.user.tenantId, id, materialId, dto.issuedQty);
  }

  @Post('subcontracting/:id/record-consumption/:materialId')
  @Permissions('procurement.purchase-order.update')
  async recordSubcontractingConsumption(@Req() req: AuthRequest, @Param('id') id: string, @Param('materialId') materialId: string, @Body() dto: { consumedQty: number }) {
    return this.subcontractingService.recordConsumption(req.user.tenantId, id, materialId, dto.consumedQty);
  }

  @Get('subcontracting/by-vendor/:vendorId')
  @Permissions('procurement.purchase-order.read')
  async listSubcontractingByVendor(@Req() req: AuthRequest, @Param('vendorId') vendorId: string, @Query() q: any) {
    return this.subcontractingService.getOrdersBySubcontractor(req.user.tenantId, vendorId, q);
  }

  @Get('subcontracting/material-consumption')
  @Permissions('procurement.subcontracting.material')
  async subcontractingMaterialConsumption(@Req() req: AuthRequest, @Query() q: { vendorId?: string; startDate?: string; endDate?: string }) {
    return this.subcontractingService.getMaterialConsumptionReport(req.user.tenantId, q.vendorId, q.startDate, q.endDate);
  }

  @Get('subcontracting/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async subcontractingStats(@Req() req: AuthRequest) {
    return this.subcontractingService.getStats(req.user.tenantId);
  }

  // ── Debit Notes ─────────────────────────────────────────────

  @Get('debit-notes')
  @Permissions('procurement.purchase-order.read')
  async listDebitNotes(@Req() req: AuthRequest, @Query() q: any) {
    return this.debitNotesService.list(req.user.tenantId, q);
  }

  @Get('debit-notes/:id')
  @Permissions('procurement.purchase-order.read')
  async getDebitNote(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.debitNotesService.getById(req.user.tenantId, id);
  }

  @Post('debit-notes')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DebitNote')
  @Permissions('procurement.purchase-order.create')
  async createDebitNote(@Req() req: AuthRequest, @Body() dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.debitNotesService.create(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('debit-notes/:id/status')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DebitNote')
  @Permissions('procurement.purchase-order.update')
  async updateDebitNoteStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.debitNotesService.updateStatus(req.user.tenantId, id, dto.status);
  }

  @Patch('debit-notes/:id')
  @Permissions('procurement.purchase-order.update')
  async updateDebitNote(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.debitNotesService.update(req.user.tenantId, id, dto);
  }

  @Get('debit-notes/by-vendor/:vendorId')
  @Permissions('procurement.purchase-order.read')
  async listDebitNotesByVendor(@Req() req: AuthRequest, @Param('vendorId') vendorId: string, @Query() q: any) {
    return this.debitNotesService.getDebitNotesByVendor(req.user.tenantId, vendorId, q);
  }

  @Get('debit-notes/by-date-range')
  @Permissions('procurement.purchase-order.read')
  async listDebitNotesByDateRange(@Req() req: AuthRequest, @Query() q: any) {
    return this.debitNotesService.getDebitNotesByDateRange(req.user.tenantId, q.startDate, q.endDate, q);
  }

  @Get('debit-notes/stats/detailed')
  @Permissions('procurement.purchase-order.read')
  async debitNoteStatsDetailed(@Req() req: AuthRequest) {
    return this.debitNotesService.getDebitNoteStatsDetailed(req.user.tenantId);
  }

  @Post('debit-notes/:id/refund')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DebitNote')
  @Permissions('procurement.debit-note.refund')
  async processDebitNoteRefund(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.debitNotesService.processDebitNoteRefund(req.user.tenantId, id, dto);
  }

  @Get('debit-notes/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async debitNoteStats(@Req() req: AuthRequest) {
    return this.debitNotesService.getStats(req.user.tenantId);
  }

  // ── Vendor RMA ──────────────────────────────────────────────

  @Get('vendor-rma')
  @Permissions('procurement.purchase-order.read')
  async listRmas(@Req() req: AuthRequest, @Query() q: any) {
    return this.vendorRmaService.listRmas(req.user.tenantId, q);
  }

  @Get('vendor-rma/:id')
  @Permissions('procurement.purchase-order.read')
  async getRma(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.vendorRmaService.getRmaById(req.user.tenantId, id);
  }

  @Post('vendor-rma')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('VendorRmaRequest')
  @Permissions('procurement.purchase-order.create')
  async createRma(@Req() req: AuthRequest, @Body() dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.vendorRmaService.createRma(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('vendor-rma/:id/status')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('VendorRmaRequest')
  @Permissions('procurement.purchase-order.update')
  async updateRmaStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string; rejectionReason?: string }) {
    return this.vendorRmaService.updateRmaStatus(req.user.tenantId, id, dto.status, dto.rejectionReason);
  }

  @Patch('vendor-rma/:id/resolve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('VendorRmaRequest')
  @Permissions('procurement.vendor-rma.resolve')
  async resolveRma(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.vendorRmaService.resolveRma(req.user.tenantId, id, dto);
  }

  @Patch('vendor-rma/:id/cancel')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('VendorRmaRequest')
  @Permissions('procurement.vendor-rma.cancel')
  async cancelRma(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.vendorRmaService.cancelRma(req.user.tenantId, id, dto.reason);
  }

  @Get('vendor-rma/by-vendor/:vendorId')
  @Permissions('procurement.purchase-order.read')
  async listRmasByVendor(@Req() req: AuthRequest, @Param('vendorId') vendorId: string, @Query() q: any) {
    return this.vendorRmaService.getRmasByVendor(req.user.tenantId, vendorId, q);
  }

  @Get('vendor-rma/by-date-range')
  @Permissions('procurement.purchase-order.read')
  async listRmasByDateRange(@Req() req: AuthRequest, @Query() q: any) {
    return this.vendorRmaService.getRmasByDateRange(req.user.tenantId, q.startDate, q.endDate, q);
  }

  @Get('vendor-rma/:rmaId/shipments')
  @Permissions('procurement.purchase-order.read')
  async listRmaShipments(@Req() req: AuthRequest, @Param('rmaId') rmaId: string, @Query() q: any) {
    return this.vendorRmaService.listShipments(req.user.tenantId, rmaId, q);
  }

  @Post('vendor-rma/:rmaId/shipments')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('VendorReturnShipment')
  @Permissions('procurement.purchase-order.create')
  async createRmaShipment(@Req() req: AuthRequest, @Param('rmaId') rmaId: string, @Body() dto: any) {
    return this.vendorRmaService.createShipment(req.user.tenantId, { ...dto, rmaRequestId: rmaId });
  }

  @Patch('vendor-rma/shipments/:id/status')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('VendorReturnShipment')
  @Permissions('procurement.purchase-order.update')
  async updateShipmentStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.vendorRmaService.updateShipmentStatus(req.user.tenantId, id, dto.status, dto.creditMemoRef, dto.creditAmount);
  }

  @Get('vendor-rma/stats/detailed')
  @Permissions('procurement.purchase-order.read')
  async rmaStatsDetailed(@Req() req: AuthRequest) {
    return this.vendorRmaService.getRmaStatsDetailed(req.user.tenantId);
  }

  @Get('vendor-rma/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async rmaStats(@Req() req: AuthRequest) {
    return this.vendorRmaService.getStats(req.user.tenantId);
  }

  // ── Supplier NCR/CAR ────────────────────────────────────────

  @Get('ncr')
  @Permissions('procurement.purchase-order.read')
  async listNcrs(@Req() req: AuthRequest, @Query() q: any) {
    return this.supplierNcrCarService.listNcrs(req.user.tenantId, q);
  }

  @Get('ncr/:id')
  @Permissions('procurement.purchase-order.read')
  async getNcr(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.supplierNcrCarService.getNcrById(req.user.tenantId, id);
  }

  @Post('ncr')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SupplierNcr')
  @Permissions('procurement.purchase-order.create')
  async createNcr(@Req() req: AuthRequest, @Body() dto: any) {
    return this.supplierNcrCarService.createNcr(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Patch('ncr/:id/status')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SupplierNcr')
  @Permissions('procurement.purchase-order.update')
  async updateNcrStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string; resolution?: string }) {
    return this.supplierNcrCarService.updateNcrStatus(req.user.tenantId, id, dto.status, dto.resolution);
  }

  @Patch('ncr/:id/escalate')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SupplierNcr')
  @Permissions('procurement.supplier-ncr.escalate')
  async escalateNcr(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: any) {
    return this.supplierNcrCarService.escalateNcr(req.user.tenantId, id, dto);
  }

  @Get('ncr/by-supplier/:vendorId')
  @Permissions('procurement.purchase-order.read')
  async listNcrsBySupplier(@Req() req: AuthRequest, @Param('vendorId') vendorId: string, @Query() q: any) {
    return this.supplierNcrCarService.getNcrsBySupplier(req.user.tenantId, vendorId, q);
  }

  @Get('ncr/quality-metrics')
  @Permissions('procurement.supplier-ncr.metrics')
  async qualityMetrics(@Req() req: AuthRequest, @Query() q: { vendorId?: string; startDate?: string; endDate?: string }) {
    return this.supplierNcrCarService.getQualityMetrics(req.user.tenantId, q.vendorId, q.startDate, q.endDate);
  }

  @Get('car')
  @Permissions('procurement.purchase-order.read')
  async listCars(@Req() req: AuthRequest, @Query() q: any) {
    return this.supplierNcrCarService.listCars(req.user.tenantId, q);
  }

  @Get('car/:id')
  @Permissions('procurement.purchase-order.read')
  async getCar(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.supplierNcrCarService.getCarById(req.user.tenantId, id);
  }

  @Post('ncr/:ncrId/car')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SupplierCarRequest')
  @Permissions('procurement.purchase-order.create')
  async createCarFromNcr(@Req() req: AuthRequest, @Param('ncrId') ncrId: string, @Body() dto: any) {
    return this.supplierNcrCarService.createCarFromNcr(req.user.tenantId, ncrId, dto);
  }

  @Patch('car/:id/status')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SupplierCarRequest')
  @Permissions('procurement.purchase-order.update')
  async updateCarStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string; vendorResponse?: string }) {
    return this.supplierNcrCarService.updateCarStatus(req.user.tenantId, id, dto.status, dto.vendorResponse);
  }

  @Get('car/by-supplier/:vendorId')
  @Permissions('procurement.purchase-order.read')
  async listCarsBySupplier(@Req() req: AuthRequest, @Param('vendorId') vendorId: string, @Query() q: any) {
    return this.supplierNcrCarService.getCarsBySupplier(req.user.tenantId, vendorId, q);
  }

  @Patch('car/:id/reopen')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('SupplierCarRequest')
  @Permissions('procurement.supplier-car.reopen')
  async reopenCar(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.supplierNcrCarService.reopenCar(req.user.tenantId, id, dto.reason);
  }

  @Get('ncr/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async ncrCarStats(@Req() req: AuthRequest) {
    return this.supplierNcrCarService.getStats(req.user.tenantId);
  }
}
