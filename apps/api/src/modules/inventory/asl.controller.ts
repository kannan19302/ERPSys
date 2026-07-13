import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { AslService } from './asl.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/asl')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class AslController {
  constructor(private readonly svc: AslService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get('expiring')
  getExpiringSuppliers(@Request() req: AuthRequest, @Query('daysAhead') daysAhead?: string) {
    return this.svc.getExpiringSuppliers(req.user.tenantId, daysAhead ? Number(daysAhead) : 30);
  }

  // Approved Suppliers
  @Get()
  listApprovedSuppliers(
    @Request() req: AuthRequest,
    @Query('productId') productId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listApprovedSuppliers(req.user.tenantId, productId, vendorId, status);
  }

  @Post()
  createApprovedSupplier(@Request() req: AuthRequest, @Body() dto: {
    productId: string; vendorId: string; vendorProductRef?: string; vendorProductName?: string;
    unitPrice?: number; currency?: string; moq?: number; leadTimeDays?: number;
    maxOrderQty?: number; uom?: string; packSize?: number;
    qualificationDate?: string; expiryDate?: string; conditionalNote?: string;
  }) {
    return this.svc.createApprovedSupplier(req.user.tenantId, req.user.userId, dto);
  }

  @Get(':id')
  getApprovedSupplier(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getApprovedSupplier(req.user.tenantId, id);
  }

  @Put(':id')
  updateApprovedSupplier(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: Partial<{
    vendorProductRef: string; vendorProductName: string; unitPrice: number; currency: string;
    moq: number; leadTimeDays: number; maxOrderQty: number; uom: string; packSize: number;
    expiryDate: string; conditionalNote: string;
  }>) {
    return this.svc.updateApprovedSupplier(req.user.tenantId, id, req.user.userId, dto);
  }

  @Patch(':id/approve')
  approveSupplier(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { qualificationDate?: string }) {
    return this.svc.approveSupplier(req.user.tenantId, id, req.user.userId, dto.qualificationDate);
  }

  @Patch(':id/disqualify')
  disqualifySupplier(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason: string }) {
    return this.svc.disqualifySupplier(req.user.tenantId, id, req.user.userId, dto.reason);
  }

  @Patch(':id/conditional')
  setConditional(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { note: string }) {
    return this.svc.setConditional(req.user.tenantId, id, req.user.userId, dto.note);
  }

  @Patch(':id/set-preferred')
  setPreferred(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { rank?: number }) {
    return this.svc.setPreferred(req.user.tenantId, id, req.user.userId, dto.rank);
  }

  @Patch(':id/unset-preferred')
  unsetPreferred(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.unsetPreferred(req.user.tenantId, id, req.user.userId);
  }

  @Get(':id/change-log')
  getChangeLog(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getChangeLog(req.user.tenantId, id);
  }

  // Price Tiers
  @Post(':id/price-tiers')
  addPriceTier(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: {
    fromQty: number; toQty?: number; unitPrice: number;
    effectiveFrom: string; effectiveTo?: string;
  }) {
    return this.svc.addPriceTier(req.user.tenantId, id, dto);
  }

  @Delete(':id/price-tiers/:tierId')
  deletePriceTier(@Request() req: AuthRequest, @Param('tierId') tierId: string) {
    return this.svc.deletePriceTier(req.user.tenantId, tierId);
  }

  @Get(':id/effective-price')
  getEffectivePrice(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Query('qty') qty: string,
  ) {
    return this.svc.getEffectivePrice(req.user.tenantId, id, Number(qty ?? 1));
  }

  // Vendor Item Attributes
  @Get('attributes/:productId')
  listAttributes(
    @Request() req: AuthRequest,
    @Param('productId') productId: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.svc.listAttributes(req.user.tenantId, productId, vendorId);
  }

  @Post('attributes')
  upsertAttribute(@Request() req: AuthRequest, @Body() dto: {
    productId: string; vendorId: string; attributeKey: string; attributeValue: string;
  }) {
    return this.svc.upsertAttribute(req.user.tenantId, dto);
  }

  @Delete('attributes/:id')
  deleteAttribute(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deleteAttribute(req.user.tenantId, id);
  }

  // Compliance
  @Get('compliance/rules')
  listComplianceRules(@Request() req: AuthRequest) {
    return this.svc.listComplianceRules(req.user.tenantId);
  }

  @Post('compliance/rules')
  upsertComplianceRule(@Request() req: AuthRequest, @Body() dto: {
    productCategory?: string; minApprovedVendors?: number;
    requiresQualification?: boolean; qualificationValidityDays?: number;
    requiresPreferred?: boolean; notes?: string;
  }) {
    return this.svc.upsertComplianceRule(req.user.tenantId, dto);
  }

  @Get('compliance/check/:productId')
  checkProductCompliance(
    @Request() req: AuthRequest,
    @Param('productId') productId: string,
    @Query('category') category?: string,
  ) {
    return this.svc.checkProductCompliance(req.user.tenantId, productId, category);
  }

  @Get('sourcing-report/:productId')
  getVendorSourcingReport(@Request() req: AuthRequest, @Param('productId') productId: string) {
    return this.svc.getVendorSourcingReport(req.user.tenantId, productId);
  }
}
