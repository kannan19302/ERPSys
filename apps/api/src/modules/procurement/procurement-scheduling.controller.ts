import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { PaymentSchedulesService } from './payment-schedules.service';
import { ProcurementApprovalsService } from './procurement-approvals.service';

interface AuthRequest extends Request { user: { tenantId: string; userId: string; orgId?: string; email: string; roles: string[] } }

@ApiTags('Procurement Scheduling')
@ApiBearerAuth()
@Controller('procurement/scheduling')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProcurementSchedulingController {
  constructor(
    private readonly paymentSchedulesService: PaymentSchedulesService,
    private readonly procurementApprovalsService: ProcurementApprovalsService,
  ) {}

  // ── Payment Schedules ───────────────────────────────────────

  @Get('payment-schedules')
  @Permissions('procurement.purchase-order.read')
  async listPaymentSchedules(@Req() req: AuthRequest, @Query() q: any) {
    return this.paymentSchedulesService.list(req.user.tenantId, q);
  }

  @Get('payment-schedules/:id')
  @Permissions('procurement.purchase-order.read')
  async getPaymentSchedule(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.paymentSchedulesService.getById(req.user.tenantId, id);
  }

  @Post('payment-schedules')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentSchedule')
  @Permissions('procurement.purchase-order.create')
  async createPaymentSchedule(@Req() req: AuthRequest, @Body() dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.paymentSchedulesService.create(req.user.tenantId, orgId, dto);
  }

  @Patch('payment-schedules/:id/status')
  @Permissions('procurement.purchase-order.update')
  async updatePaymentScheduleStatus(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.paymentSchedulesService.updateStatus(req.user.tenantId, id, dto.status);
  }

  @Post('payment-schedules/bulk-from-po/:purchaseOrderId')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentSchedule')
  @Permissions('procurement.purchase-order.create')
  async bulkCreateFromPo(@Req() req: AuthRequest, @Param('purchaseOrderId') poId: string, @Body() dto: { milestones: Array<{ dueDate: string; amount: number }> }) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.paymentSchedulesService.bulkCreateFromPo(req.user.tenantId, orgId, poId, dto.milestones);
  }

  @Get('payment-schedules/upcoming')
  @Permissions('procurement.purchase-order.read')
  async getUpcomingPayments(@Req() req: AuthRequest, @Query('days') days?: string) {
    return this.paymentSchedulesService.getUpcoming(req.user.tenantId, days ? parseInt(days, 10) : 30);
  }

  @Get('payment-schedules/by-po/:purchaseOrderId')
  @Permissions('procurement.purchase-order.read')
  async getPaymentSchedulesByPo(@Req() req: AuthRequest, @Param('purchaseOrderId') poId: string) {
    return this.paymentSchedulesService.getSchedulesByPurchaseOrder(req.user.tenantId, poId);
  }

  @Get('payment-schedules/by-date-range')
  @Permissions('procurement.purchase-order.read')
  async getPaymentSchedulesByDateRange(@Req() req: AuthRequest, @Query() q: any) {
    return this.paymentSchedulesService.getSchedulesByDateRange(req.user.tenantId, q.startDate, q.endDate, q);
  }

  @Patch('payment-schedules/:id/mark-overdue')
  @Permissions('procurement.payment-schedule.manage')
  async markPaymentOverdue(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.paymentSchedulesService.markOverdue(req.user.tenantId, id);
  }

  @Get('payment-schedules/forecast')
  @Permissions('procurement.payment-schedule.forecast')
  async getPaymentForecast(@Req() req: AuthRequest, @Query('months') months?: string) {
    return this.paymentSchedulesService.getPaymentForecast(req.user.tenantId, months ? parseInt(months, 10) : 6);
  }

  @Get('payment-schedules/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async paymentScheduleStats(@Req() req: AuthRequest) {
    return this.paymentSchedulesService.getStats(req.user.tenantId);
  }

  // ── Approval Workflow ───────────────────────────────────────

  @Get('approvals/pending')
  @Permissions('procurement.purchase-order.read')
  async getPendingApprovals(@Req() req: AuthRequest) {
    return this.procurementApprovalsService.getPendingApprovals(req.user.tenantId);
  }

  @Post('approvals/requisition/:id/approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PurchaseRequisition')
  @Permissions('procurement.purchase-order.approve')
  async approveRequisition(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.procurementApprovalsService.approveRequisition(req.user.tenantId, id);
  }

  @Post('approvals/requisition/:id/reject')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PurchaseRequisition')
  @Permissions('procurement.purchase-order.approve')
  async rejectRequisition(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason: string }) {
    return this.procurementApprovalsService.rejectRequisition(req.user.tenantId, id, dto.reason);
  }

  @Post('approvals/purchase-order/:id/approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PurchaseOrder')
  @Permissions('procurement.purchase-order.approve')
  async approvePurchaseOrder(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.procurementApprovalsService.approvePurchaseOrder(req.user.tenantId, id);
  }

  @Post('approvals/purchase-order/:id/reject')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PurchaseOrder')
  @Permissions('procurement.purchase-order.approve')
  async rejectPurchaseOrder(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: { reason: string }) {
    return this.procurementApprovalsService.rejectPurchaseOrder(req.user.tenantId, id, dto.reason);
  }

  @Get('approvals/policy')
  @Permissions('procurement.purchase-order.read')
  async getApprovalPolicy(@Req() req: AuthRequest) {
    return this.procurementApprovalsService.getApprovalPolicy(req.user.tenantId);
  }

  @Post('approvals/policy')
  @Permissions('procurement.purchase-order.update')
  async setApprovalPolicy(@Req() req: AuthRequest, @Body() dto: any) {
    return this.procurementApprovalsService.setApprovalPolicy(req.user.tenantId, dto);
  }

  @Get('approvals/history')
  @Permissions('procurement.approval.history')
  async getApprovalHistory(@Req() req: AuthRequest, @Query() q: any) {
    return this.procurementApprovalsService.getApprovalHistory(req.user.tenantId, q);
  }

  @Post('approvals/delegate')
  @Permissions('procurement.approval.delegate')
  async delegateApproval(@Req() req: AuthRequest, @Body() dto: any) {
    return this.procurementApprovalsService.delegateApproval(req.user.tenantId, req.user.userId || 'system', dto);
  }

  @Get('approvals/my-pending')
  @Permissions('procurement.purchase-order.read')
  async getMyPendingApprovals(@Req() req: AuthRequest) {
    return this.procurementApprovalsService.getMyPendingApprovals(req.user.tenantId, req.user.userId || 'system');
  }

  @Get('approvals/statistics')
  @Permissions('procurement.purchase-order.read')
  async getApprovalStatistics(@Req() req: AuthRequest) {
    return this.procurementApprovalsService.getApprovalStatistics(req.user.tenantId);
  }

  @Get('approvals/stats/summary')
  @Permissions('procurement.purchase-order.read')
  async approvalStats(@Req() req: AuthRequest) {
    return this.procurementApprovalsService.getApprovalStats(req.user.tenantId);
  }
}
