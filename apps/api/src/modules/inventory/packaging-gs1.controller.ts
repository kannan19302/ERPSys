import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { PackagingGs1Service } from './packaging-gs1.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest { user: { tenantId: string; orgId: string; userId: string } }

@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
@Controller('inventory/packaging-gs1')
export class PackagingGs1Controller {
  constructor(private readonly svc: PackagingGs1Service) {}

  @Permissions('inventory.packaging_gs1.read')
  @Get('dashboard')
  dashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // Packaging Specs
  @Permissions('inventory.packaging_gs1.read')
  @Get('specs')
  listSpecs(@Request() req: AuthRequest, @Query('productId') productId: string) {
    return this.svc.listSpecsByProduct(req.user.tenantId, productId);
  }

  @Permissions('inventory.packaging_gs1.read')
  @Get('specs/:id')
  getSpec(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getSpec(req.user.tenantId, id);
  }

  @Permissions('inventory.packaging_gs1.read')
  @Get('hierarchy')
  getHierarchy(@Request() req: AuthRequest, @Query('productId') productId: string) {
    return this.svc.getPackagingHierarchy(req.user.tenantId, productId);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('specs')
  upsertSpec(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertSpec(req.user.tenantId, body);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Patch('specs/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateSpec(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deactivateSpec(req.user.tenantId, id);
  }

  // Barcodes
  @Permissions('inventory.packaging_gs1.read')
  @Get('barcodes')
  listBarcodes(@Request() req: AuthRequest, @Query('packagingSpecId') packagingSpecId?: string) {
    return this.svc.listBarcodes(req.user.tenantId, packagingSpecId);
  }

  @Permissions('inventory.packaging_gs1.read')
  @Get('barcodes/lookup')
  lookupBarcode(@Request() req: AuthRequest, @Query('value') value: string) {
    return this.svc.lookupBarcode(req.user.tenantId, value);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('barcodes')
  addBarcode(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.addBarcode(req.user.tenantId, body);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Patch('barcodes/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateBarcode(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deactivateBarcode(req.user.tenantId, id);
  }

  // GS1 Application Identifiers
  @Permissions('inventory.packaging_gs1.read')
  @Get('gs1-ais')
  listGs1Ais(@Request() req: AuthRequest) {
    return this.svc.listGs1Ais(req.user.tenantId);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('gs1-ais')
  upsertGs1Ai(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.upsertGs1Ai(req.user.tenantId, body);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('gs1-ais/seed-standard')
  @HttpCode(HttpStatus.OK)
  seedStandardGs1Ais(@Request() req: AuthRequest) {
    return this.svc.seedStandardGs1Ais(req.user.tenantId);
  }

  // Label Templates
  @Permissions('inventory.packaging_gs1.read')
  @Get('label-templates')
  listLabelTemplates(@Request() req: AuthRequest, @Query('templateType') templateType?: string) {
    return this.svc.listLabelTemplates(req.user.tenantId, templateType);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('label-templates')
  createLabelTemplate(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.createLabelTemplate(req.user.tenantId, body);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Patch('label-templates/:id')
  updateLabelTemplate(@Request() req: AuthRequest, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateLabelTemplate(req.user.tenantId, id, body);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('label-assignments')
  assignLabel(@Request() req: AuthRequest, @Body() body: any) {
    return this.svc.assignLabelToSpec(req.user.tenantId, body);
  }

  @Permissions('inventory.packaging_gs1.read')
  @Get('label-assignments/resolve')
  getLabelForSpec(@Request() req: AuthRequest, @Query('packagingSpecId') specId: string, @Query('customerId') customerId?: string) {
    return this.svc.getLabelForSpec(req.user.tenantId, specId, customerId);
  }

  // SSCC
  @Permissions('inventory.packaging_gs1.read')
  @Get('sscc')
  listSscc(@Request() req: AuthRequest, @Query('onlyUnused') onlyUnused?: string) {
    return this.svc.listSsccRecords(req.user.tenantId, onlyUnused === 'true');
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('sscc/allocate')
  allocateSscc(@Request() req: AuthRequest, @Body() body: { gs1CompanyPrefix: string; extensionDigit?: number }) {
    return this.svc.allocateSscc(req.user.tenantId, body.gs1CompanyPrefix, body.extensionDigit);
  }

  @Permissions('inventory.packaging_gs1.manage')
  @Post('sscc/:sscc/mark-used')
  @HttpCode(HttpStatus.OK)
  markSsccUsed(@Request() req: AuthRequest, @Param('sscc') sscc: string, @Body() body: { shipmentRef: string }) {
    return this.svc.markSsccUsed(req.user.tenantId, sscc, body.shipmentRef);
  }
}
