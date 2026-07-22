import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { SupplierScorecardService } from './supplier-scorecard.service';
import { RfqAuctionsService } from './rfq-auctions.service';
import { ProcurementAnalyticsService } from './procurement-analytics.service';

interface AuthRequest extends Request { user: { tenantId: string; userId: string; orgId?: string; email: string; roles: string[] } }

@ApiTags('Procurement Intelligence')
@ApiBearerAuth()
@Controller('procurement/intelligence')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementIntelligenceController {
  constructor(
    private readonly supplierScorecardService: SupplierScorecardService,
    private readonly rfqAuctionsService: RfqAuctionsService,
    private readonly procurementAnalyticsService: ProcurementAnalyticsService,
  ) {}

  // ── Supplier Scorecards ─────────────────────────────────────

  @Get('scorecards')
  @Permissions('procurement.purchase-order.read')
  async listScorecards(@Req() req: AuthRequest, @Query() q: any) {
    return this.supplierScorecardService.list(req.user.tenantId, q);
  }

  @Get('scorecards/:id')
  @Permissions('procurement.purchase-order.read')
  async getScorecard(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.supplierScorecardService.getById(req.user.tenantId, id);
  }

  @Post('scorecards/compute')
  @Permissions('procurement.purchase-order.create')
  async computeScorecard(@Req() req: AuthRequest, @Body() dto: { vendorId: string; periodStart: string; periodEnd: string; notes?: string }) {
    return this.supplierScorecardService.computeAndSave(req.user.tenantId, dto.vendorId, dto.periodStart, dto.periodEnd, dto.notes);
  }

  @Get('scorecards/trend/:vendorId')
  @Permissions('procurement.purchase-order.read')
  async getScorecardTrend(@Req() req: AuthRequest, @Param('vendorId') vendorId: string, @Query('lastN') lastN?: string) {
    return this.supplierScorecardService.getVendorTrend(req.user.tenantId, vendorId, lastN ? parseInt(lastN, 10) : 6);
  }

  @Get('scorecards/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async scorecardStats(@Req() req: AuthRequest) {
    return this.supplierScorecardService.getStats(req.user.tenantId);
  }

  // ── RFQ Auctions ────────────────────────────────────────────

  @Get('auctions')
  @Permissions('procurement.purchase-order.read')
  async listAuctions(@Req() req: AuthRequest, @Query() q: any) {
    return this.rfqAuctionsService.listAuctions(req.user.tenantId, q);
  }

  @Get('auctions/:id')
  @Permissions('procurement.purchase-order.read')
  async getAuction(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.rfqAuctionsService.getAuctionById(req.user.tenantId, id);
  }

  @Post('auctions')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('RFQAuction')
  @Permissions('procurement.purchase-order.create')
  async createAuction(@Req() req: AuthRequest, @Body() dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.rfqAuctionsService.createAuction(req.user.tenantId, orgId, dto);
  }

  @Post('auctions/:id/bids')
  @Permissions('procurement.purchase-order.create')
  async placeBid(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { vendorId: string; bidAmount: number; notes?: string }) {
    return this.rfqAuctionsService.placeBid(req.user.tenantId, id, dto.vendorId, dto.bidAmount, dto.notes);
  }

  @Get('auctions/:id/bids')
  @Permissions('procurement.purchase-order.read')
  async listBids(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.rfqAuctionsService.listBids(req.user.tenantId, id);
  }

  @Post('auctions/:id/select-bid/:bidId')
  @Permissions('procurement.purchase-order.update')
  async selectWinningBid(@Req() req: AuthRequest, @Param('id') id: string, @Param('bidId') bidId: string) {
    return this.rfqAuctionsService.selectWinningBid(req.user.tenantId, id, bidId);
  }

  @Patch('auctions/:id/status')
  @Permissions('procurement.purchase-order.update')
  async updateAuctionStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.rfqAuctionsService.updateAuctionStatus(req.user.tenantId, id, dto.status);
  }

  @Get('auctions/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async auctionStats(@Req() req: AuthRequest) {
    return this.rfqAuctionsService.getStats(req.user.tenantId);
  }

  // ── Analytics ───────────────────────────────────────────────

  @Get('analytics/spend-by-vendor')
  @Permissions('procurement.purchase-order.read')
  async spendByVendor(@Req() req: AuthRequest, @Query() q: { startDate?: string; endDate?: string }) {
    return this.procurementAnalyticsService.getSpendByVendor(req.user.tenantId, q.startDate, q.endDate);
  }

  @Get('analytics/spend-by-status')
  @Permissions('procurement.purchase-order.read')
  async spendByStatus(@Req() req: AuthRequest) {
    return this.procurementAnalyticsService.getSpendByStatus(req.user.tenantId);
  }

  @Get('analytics/monthly-trend')
  @Permissions('procurement.purchase-order.read')
  async monthlyTrend(@Req() req: AuthRequest, @Query('months') months?: string) {
    return this.procurementAnalyticsService.getMonthlySpendTrend(req.user.tenantId, months ? parseInt(months, 10) : 12);
  }

  @Get('analytics/spend-by-category')
  @Permissions('procurement.purchase-order.read')
  async spendByCategory(@Req() req: AuthRequest) {
    return this.procurementAnalyticsService.getSpendByCategory(req.user.tenantId);
  }

  @Get('analytics/budget-overview')
  @Permissions('procurement.purchase-order.read')
  async budgetOverview(@Req() req: AuthRequest) {
    return this.procurementAnalyticsService.getBudgetOverview(req.user.tenantId);
  }

  @Get('analytics/vendor-performance')
  @Permissions('procurement.purchase-order.read')
  async vendorPerformance(@Req() req: AuthRequest) {
    return this.procurementAnalyticsService.getVendorPerformanceSummary(req.user.tenantId);
  }

  @Get('analytics/dashboard')
  @Permissions('procurement.purchase-order.read')
  async analyticsDashboard(@Req() req: AuthRequest) {
    return this.procurementAnalyticsService.getDashboard(req.user.tenantId);
  }
}
