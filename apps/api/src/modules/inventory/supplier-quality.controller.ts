import { Controller, Get, Post, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  SupplierQualityService,
  createScorecardSchema,
  createNcrSchema,
  closeNcrSchema,
  createCarSchema,
  respondCarSchema,
} from './supplier-quality.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-supplier-quality')
@Controller('inventory/supplier-quality')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SupplierQualityController {
  constructor(private readonly service: SupplierQualityService) {}

  @Permissions('inventory.supplier_quality.read')
  @Get('dashboard')
  @ApiOperation({ summary: 'Supplier quality overview dashboard' })
  getDashboard(@Req() req: AuthReq) {
    return this.service.getQualityDashboard(req.user.tenantId);
  }

  @Permissions('inventory.supplier_quality.read')
  @Get('scorecards')
  @ApiOperation({ summary: 'List supplier quality scorecards' })
  listScorecards(@Req() req: AuthReq, @Query('vendorId') vendorId?: string) {
    return this.service.listScorecards(req.user.tenantId, vendorId);
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('scorecards')
  @ApiOperation({ summary: 'Create a supplier scorecard for a period' })
  createScorecard(@Req() req: AuthReq, @ZodBody(createScorecardSchema) dto: any) {
    return this.service.createScorecard(req.user.tenantId, dto);
  }

  @Permissions('inventory.supplier_quality.read')
  @Get('scorecards/vendor/:vendorId')
  @ApiOperation({ summary: 'Get score history for a specific vendor' })
  getVendorScoreHistory(@Req() req: AuthReq, @Param('vendorId') vendorId: string) {
    return this.service.getVendorScoreHistory(req.user.tenantId, vendorId);
  }

  @Permissions('inventory.supplier_quality.read')
  @Get('ncrs')
  @ApiOperation({ summary: 'List supplier NCRs' })
  listNcrs(
    @Req() req: AuthReq,
    @Query('vendorId') vendorId?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listNcrs(req.user.tenantId, { vendorId, severity, status });
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('ncrs')
  @ApiOperation({ summary: 'Raise a supplier NCR' })
  createNcr(@Req() req: AuthReq, @ZodBody(createNcrSchema) dto: any) {
    return this.service.createNcr(req.user.tenantId, dto);
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('ncrs/:id/close')
  @ApiOperation({ summary: 'Close an NCR with resolution notes' })
  closeNcr(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(closeNcrSchema) dto: any) {
    return this.service.closeNcr(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.supplier_quality.read')
  @Get('cars')
  @ApiOperation({ summary: 'List corrective action requests' })
  listCars(@Req() req: AuthReq, @Query('ncrId') ncrId?: string) {
    return this.service.listCars(req.user.tenantId, ncrId);
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('cars')
  @ApiOperation({ summary: 'Raise a CAR against an NCR' })
  createCar(@Req() req: AuthReq, @ZodBody(createCarSchema) dto: any) {
    return this.service.createCar(req.user.tenantId, dto);
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('cars/:id/respond')
  @ApiOperation({ summary: 'Vendor response to a CAR' })
  respondToCar(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(respondCarSchema) dto: any) {
    return this.service.respondToCar(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('cars/:id/accept')
  @ApiOperation({ summary: 'Accept a vendor CAR response' })
  acceptCar(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.acceptCar(req.user.tenantId, id);
  }

  @Permissions('inventory.supplier_quality.manage')
  @Post('cars/:id/reject')
  @ApiOperation({ summary: 'Reject a vendor CAR response' })
  rejectCar(@Req() req: AuthReq, @Param('id') id: string) {
    return this.service.rejectCar(req.user.tenantId, id);
  }
}
