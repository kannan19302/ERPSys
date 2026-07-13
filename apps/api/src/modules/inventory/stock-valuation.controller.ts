import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { StockValuationService } from './stock-valuation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/stock-valuation')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class StockValuationController {
  constructor(private readonly svc: StockValuationService) {}

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Get('variance-report')
  getVarianceReport(@Request() req: AuthRequest, @Query('productId') productId?: string) {
    return this.svc.getVarianceReport(req.user.tenantId, productId);
  }

  @Get('valuation-summary')
  getValuationSummary(@Request() req: AuthRequest) {
    return this.svc.getValuationSummary(req.user.tenantId);
  }

  // Policies
  @Get('policies')
  listPolicies(@Request() req: AuthRequest) {
    return this.svc.listPolicies(req.user.tenantId);
  }

  @Post('policies')
  upsertPolicy(
    @Request() req: AuthRequest,
    @Body() dto: {
      productId?: string;
      warehouseId?: string;
      method: string;
      standardCost?: number;
      currency?: string;
      notes?: string;
    },
  ) {
    return this.svc.upsertPolicy(req.user.tenantId, req.user.userId, dto);
  }

  @Get('policies/:id')
  getPolicy(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getPolicy(req.user.tenantId, id);
  }

  @Patch('policies/:id/deactivate')
  deactivatePolicy(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.deactivatePolicy(req.user.tenantId, id);
  }

  // Ledger
  @Get('ledger')
  getLedger(
    @Request() req: AuthRequest,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getLedger(req.user.tenantId, productId, warehouseId, limit ? parseInt(limit) : 100);
  }

  @Post('ledger')
  postLedgerEntry(
    @Request() req: AuthRequest,
    @Body() dto: {
      productId: string;
      warehouseId?: string;
      method: string;
      transactionType: string;
      transactionRef: string;
      qty: number;
      unitCost: number;
    },
  ) {
    return this.svc.postLedgerEntry(req.user.tenantId, dto);
  }

  @Get('product-valuation')
  getProductValuation(
    @Request() req: AuthRequest,
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.svc.getProductValuation(req.user.tenantId, productId, warehouseId);
  }

  @Post('compute-issue-cost')
  computeIssueCost(
    @Request() req: AuthRequest,
    @Body() dto: { productId: string; warehouseId?: string; issueQty: number; method: string },
  ) {
    return this.svc.computeIssueCost(req.user.tenantId, dto.productId, dto.warehouseId, dto.issueQty, dto.method);
  }

  // Cost Adjustments
  @Get('adjustments')
  listAdjustments(@Request() req: AuthRequest, @Query('status') status?: string) {
    return this.svc.listAdjustments(req.user.tenantId, status);
  }

  @Post('adjustments')
  createAdjustment(
    @Request() req: AuthRequest,
    @Body() dto: {
      productId: string;
      warehouseId?: string;
      oldUnitCost: number;
      newUnitCost: number;
      qty: number;
      reason: string;
    },
  ) {
    return this.svc.createAdjustment(req.user.tenantId, req.user.userId, dto);
  }

  @Get('adjustments/:id')
  getAdjustment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getAdjustment(req.user.tenantId, id);
  }

  @Patch('adjustments/:id/approve')
  approveAdjustment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveAdjustment(req.user.tenantId, id, req.user.userId);
  }

  @Patch('adjustments/:id/post')
  postAdjustment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.postAdjustment(req.user.tenantId, id);
  }

  @Patch('adjustments/:id/reject')
  rejectAdjustment(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.rejectAdjustment(req.user.tenantId, id);
  }

  // Revaluations
  @Get('revaluations')
  listRevaluations(@Request() req: AuthRequest) {
    return this.svc.listRevaluations(req.user.tenantId);
  }

  @Post('revaluations')
  createRevaluation(
    @Request() req: AuthRequest,
    @Body() dto: {
      description?: string;
      revaluationDate: string;
      currency?: string;
      lines: { productId: string; warehouseId?: string; currentQty: number; currentUnitCost: number; newUnitCost: number }[];
    },
  ) {
    return this.svc.createRevaluation(req.user.tenantId, req.user.userId, dto);
  }

  @Get('revaluations/:id')
  getRevaluation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getRevaluation(req.user.tenantId, id);
  }

  @Patch('revaluations/:id/post')
  postRevaluation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.postRevaluation(req.user.tenantId, id);
  }

  @Delete('revaluations/:id')
  cancelRevaluation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelRevaluation(req.user.tenantId, id);
  }
}
