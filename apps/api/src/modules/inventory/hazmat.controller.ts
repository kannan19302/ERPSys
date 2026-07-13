import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { HazmatService } from './hazmat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/hazmat')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class HazmatController {
  constructor(private readonly svc: HazmatService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get('compliance-report')
  getComplianceReport(@Request() req: AuthRequest) {
    return this.svc.getComplianceReport(req.user.tenantId);
  }

  @Get('hazard-class-summary')
  getHazardClassSummary(@Request() req: AuthRequest) {
    return this.svc.getHazardClassSummary(req.user.tenantId);
  }

  @Get('un-search')
  getUnNumberSearch(@Request() req: AuthRequest, @Query('q') q: string) {
    return this.svc.getUnNumberSearch(req.user.tenantId, q ?? '');
  }

  // Classifications
  @Get('classifications')
  listClassifications(
    @Request() req: AuthRequest,
    @Query('productId') productId?: string,
    @Query('regulation') regulation?: string,
  ) {
    return this.svc.listClassifications(req.user.tenantId, productId, regulation);
  }

  @Post('classifications')
  createClassification(@Request() req: AuthRequest, @Body() dto: {
    productId: string; unNumber: string; properShippingName: string;
    hazardClass: string; subsidiaryHazards?: string[]; packingGroup?: string;
    regulation: string; flashPoint?: number; boilingPoint?: number;
    maxQtyPerPackage?: number; transportIndex?: number;
    isExempted?: boolean; exemptionRef?: string; notes?: string;
  }) {
    return this.svc.createClassification(req.user.tenantId, req.user.userId, dto);
  }

  @Get('classifications/:id')
  getClassification(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getClassification(req.user.tenantId, id);
  }

  @Put('classifications/:id')
  updateClassification(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: Partial<{
    properShippingName: string; hazardClass: string; subsidiaryHazards: string[];
    packingGroup: string; flashPoint: number; boilingPoint: number;
    maxQtyPerPackage: number; isExempted: boolean; exemptionRef: string; notes: string;
  }>) {
    return this.svc.updateClassification(req.user.tenantId, id, dto);
  }

  @Delete('classifications/:id')
  deleteClassification(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deleteClassification(req.user.tenantId, id);
  }

  @Get('classifications/:id/compatibility')
  checkWarehouseCompatibility(
    @Request() req: AuthRequest,
    @Param('id') _id: string,
    @Query('warehouseId') warehouseId: string,
    @Query('hazardClass') hazardClass: string,
  ) {
    return this.svc.checkWarehouseCompatibility(req.user.tenantId, warehouseId, hazardClass);
  }

  // SDS
  @Get('sds')
  listSds(
    @Request() req: AuthRequest,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listSds(req.user.tenantId, productId, status);
  }

  @Post('sds')
  createSds(@Request() req: AuthRequest, @Body() dto: {
    classificationId: string; productId: string; revision: string;
    issueDate: string; expiryDate?: string; supplier: string; language?: string;
    storageConditions?: string; firstAidMeasures?: string; spillProcedures?: string;
    disposalMethods?: string; documentUrl?: string;
  }) {
    return this.svc.createSds(req.user.tenantId, dto);
  }

  @Get('sds/expiring')
  getExpiringSds(@Request() req: AuthRequest, @Query('daysAhead') daysAhead?: string) {
    return this.svc.getExpiringSds(req.user.tenantId, daysAhead ? Number(daysAhead) : 30);
  }

  @Get('sds/:id')
  getSds(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getSds(req.user.tenantId, id);
  }

  @Patch('sds/:id/acknowledge')
  acknowledgeSds(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.acknowledgeSds(req.user.tenantId, id, req.user.userId);
  }

  @Patch('sds/:id/expire')
  expireSds(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.expireSds(req.user.tenantId, id);
  }

  @Patch('sds/:id/supersede')
  supersedeSds(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { newSdsId: string },
  ) {
    return this.svc.supersedeSds(req.user.tenantId, id, dto.newSdsId);
  }

  // Storage Rules
  @Get('storage-rules')
  listStorageRules(@Request() req: AuthRequest) {
    return this.svc.listStorageRules(req.user.tenantId);
  }

  @Post('storage-rules')
  upsertStorageRule(@Request() req: AuthRequest, @Body() dto: {
    hazardClassA: string; hazardClassB: string;
    result: string; condition?: string; notes?: string;
  }) {
    return this.svc.upsertStorageRule(req.user.tenantId, dto);
  }

  @Get('storage-rules/check')
  checkCompatibility(
    @Request() req: AuthRequest,
    @Query('classA') classA: string,
    @Query('classB') classB: string,
  ) {
    return this.svc.checkCompatibility(req.user.tenantId, classA, classB);
  }

  // Manifests
  @Get('manifests')
  listManifests(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listManifests(req.user.tenantId, status);
  }

  @Post('manifests')
  createManifest(@Request() req: AuthRequest, @Body() dto: {
    regulation: string; shipmentRef?: string; carrierId?: string; carrierName?: string;
    originAddress: string; destAddress: string; emergencyContact?: string;
    specialInstructions?: string; weightUnit?: string;
  }) {
    return this.svc.createManifest(req.user.tenantId, req.user.userId, dto);
  }

  @Get('manifests/:id')
  getManifest(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getManifest(req.user.tenantId, id);
  }

  @Post('manifests/:id/lines')
  addManifestLine(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: {
    classificationId: string; productId: string; quantity: number; uom?: string;
    grossWeight?: number; netWeight?: number; numberOfPackages?: number;
    packagingType?: string; labelRequired?: boolean; notes?: string;
  }) {
    return this.svc.addManifestLine(req.user.tenantId, id, dto);
  }

  @Delete('manifests/:id/lines/:lineId')
  removeManifestLine(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ) {
    return this.svc.removeManifestLine(req.user.tenantId, id, lineId);
  }

  @Patch('manifests/:id/submit')
  submitManifest(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.submitManifest(req.user.tenantId, id);
  }

  @Patch('manifests/:id/acknowledge')
  acknowledgeManifest(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.acknowledgeManifest(req.user.tenantId, id);
  }

  @Patch('manifests/:id/in-transit')
  markInTransit(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { shippedAt?: string }) {
    return this.svc.markInTransit(req.user.tenantId, id, dto.shippedAt);
  }

  @Patch('manifests/:id/deliver')
  deliverManifest(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: { deliveredAt?: string }) {
    return this.svc.deliverManifest(req.user.tenantId, id, dto.deliveredAt);
  }

  @Patch('manifests/:id/cancel')
  cancelManifest(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelManifest(req.user.tenantId, id);
  }

  // Incidents
  @Get('incidents')
  listIncidents(
    @Request() req: AuthRequest,
    @Query('productId') productId?: string,
    @Query('open') open?: string,
  ) {
    return this.svc.listIncidents(
      req.user.tenantId, productId,
      open !== undefined ? open === 'true' : undefined,
    );
  }

  @Post('incidents')
  createIncident(@Request() req: AuthRequest, @Body() dto: {
    productId: string; warehouseId?: string; incidentDate: string;
    severity: string; description: string; immediateAction?: string;
  }) {
    return this.svc.createIncident(req.user.tenantId, req.user.userId, dto);
  }

  @Get('incidents/:id')
  getIncident(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getIncident(req.user.tenantId, id);
  }

  @Put('incidents/:id')
  updateIncident(@Request() req: AuthRequest, @Param('id') id: string, @Body() dto: Partial<{
    rootCause: string; correctiveAction: string; reportedToAuthority: boolean; authorityRef: string;
  }>) {
    return this.svc.updateIncident(req.user.tenantId, id, dto);
  }

  @Patch('incidents/:id/close')
  closeIncident(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.closeIncident(req.user.tenantId, id, req.user.userId);
  }
}
