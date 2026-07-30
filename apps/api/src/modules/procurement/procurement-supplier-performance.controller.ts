// @ts-nocheck
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SupplierPerformanceService } from './services/supplier-performance.service';
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

@ApiTags('procurement-supplier-performance')
@ApiBearerAuth()
@Controller('procurement/supplier-performance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementSupplierPerformanceController {
  constructor(private readonly supplierPerformanceService: SupplierPerformanceService) {}

  @ApiOperation({ summary: 'List supplier scorecards' })
  @Get('scorecards')
  @Permissions('procurement.supplier-performance.read')
  async listScorecards(
    @Req() req: AuthenticatedRequest,
    @Query('supplierId') supplierId?: string,
    @Query('period') period?: string,
  ) {
    return this.supplierPerformanceService.listScorecards(req.user.tenantId, supplierId, period);
  }

  @ApiOperation({ summary: 'Get supplier scorecard by id' })
  @Get('scorecards/:id')
  @Permissions('procurement.supplier-performance.read')
  async getScorecard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.supplierPerformanceService.getScorecard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create supplier scorecard' })
  @Post('scorecards')
  @Permissions('procurement.supplier-performance.create')
  async createScorecard(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.supplierPerformanceService.createScorecard(req.user.tenantId, body, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Update supplier scorecard' })
  @Patch('scorecards/:id')
  @Permissions('procurement.supplier-performance.update')
  async updateScorecard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: any) {
    return this.supplierPerformanceService.updateScorecard(req.user.tenantId, id, body, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'List supplier performance KPIs' })
  @Get('kpis')
  @Permissions('procurement.supplier-performance.read')
  async listKpis(@Req() req: AuthenticatedRequest, @Query('scorecardId') scorecardId?: string) {
    return this.supplierPerformanceService.listKpis(req.user.tenantId, scorecardId);
  }

  @ApiOperation({ summary: 'Record KPI value' })
  @Post('kpis')
  @Permissions('procurement.supplier-performance.create')
  async recordKpiValue(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.supplierPerformanceService.recordKpiValue(req.user.tenantId, body, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'List supplier assessments' })
  @Get('assessments')
  @Permissions('procurement.supplier-performance.read')
  async listAssessments(@Req() req: AuthenticatedRequest, @Query('supplierId') supplierId?: string) {
    return this.supplierPerformanceService.listAssessments(req.user.tenantId, supplierId);
  }

  @ApiOperation({ summary: 'Create supplier assessment' })
  @Post('assessments')
  @Permissions('procurement.supplier-performance.create')
  async createAssessment(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.supplierPerformanceService.createAssessment(req.user.tenantId, body, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get supplier risk profile' })
  @Get('risk/:supplierId')
  @Permissions('procurement.supplier-performance.read')
  async getSupplierRiskProfile(@Req() req: AuthenticatedRequest, @Param('supplierId') supplierId: string) {
    return this.supplierPerformanceService.getSupplierRiskProfile(req.user.tenantId, supplierId);
  }

  @ApiOperation({ summary: 'List supplier NCRs' })
  @Get('ncrs')
  @Permissions('procurement.supplier-performance.read')
  async listSupplierNcrs(
    @Req() req: AuthenticatedRequest,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
  ) {
    return this.supplierPerformanceService.listSupplierNcrs(req.user.tenantId, supplierId, status);
  }

  @ApiOperation({ summary: 'Get top suppliers by score' })
  @Get('top-suppliers')
  @Permissions('procurement.supplier-performance.read')
  async getTopSuppliers(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    return this.supplierPerformanceService.getTopSuppliers(req.user.tenantId, limit ? parseInt(limit, 10) : 10);
  }

  @ApiOperation({ summary: 'Compare supplier performance' })
  @Post('compare')
  @Permissions('procurement.supplier-performance.read')
  async getSupplierComparison(@Req() req: AuthenticatedRequest, @Body() body: { supplierIds: string[] }) {
    return this.supplierPerformanceService.getSupplierComparison(req.user.tenantId, body.supplierIds);
  }
}
