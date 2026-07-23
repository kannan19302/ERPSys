import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class ProcurementApprovalsService {
  async getPendingApprovals(tenantId: string) {
    const where: any = { tenantId, status: { in: ['PENDING_APPROVAL', 'SUBMITTED'] } };

    const [requisitions, purchaseOrders] = await Promise.all([
      prisma.purchaseRequisition.findMany({ where: { ...where, status: 'PENDING_APPROVAL' }, include: { department: { select: { name: true } }, _count: { select: { lineItems: true } } }, orderBy: { createdAt: 'desc' as const } }),
      prisma.purchaseOrder.findMany({ where: { ...where, status: 'SUBMITTED' }, include: { vendor: { select: { name: true } } }, orderBy: { createdAt: 'desc' as const } }),
    ]);

    return { requisitions, purchaseOrders, total: requisitions.length + purchaseOrders.length };
  }

  async approveRequisition(tenantId: string, id: string) {
    const req = await prisma.purchaseRequisition.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException('Requisition not found');
    if (req.status !== 'PENDING_APPROVAL') throw new BadRequestException('Requisition is not pending approval');

    return prisma.purchaseRequisition.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async rejectRequisition(tenantId: string, id: string, _reason?: string) {
    const req = await prisma.purchaseRequisition.findFirst({ where: { id, tenantId } });
    if (!req) throw new NotFoundException('Requisition not found');
    if (req.status !== 'PENDING_APPROVAL') throw new BadRequestException('Requisition is not pending approval');

    return prisma.purchaseRequisition.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  async approvePurchaseOrder(tenantId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');

    if (!['SUBMITTED', 'PENDING_APPROVAL'].includes(po.status)) {
      throw new BadRequestException(`Purchase order status ${po.status} cannot be approved`);
    }

    return prisma.purchaseOrder.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async rejectPurchaseOrder(tenantId: string, id: string, _reason?: string) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (!['SUBMITTED', 'PENDING_APPROVAL'].includes(po.status)) {
      throw new BadRequestException(`Purchase order status ${po.status} cannot be rejected`);
    }

    return prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async setApprovalPolicy(tenantId: string, dto: { minAmount?: number; maxAmount?: number; requiresApproval: boolean; approverRoles?: string[] }) {
    return { tenantId, policy: dto };
  }

  async getApprovalPolicy(_tenantId: string) {
    return { requiresApproval: true, approverRoles: ['procurement_manager'] };
  }

  async getApprovalStats(tenantId: string) {
    const [requisitions, purchaseOrders] = await Promise.all([
      prisma.purchaseRequisition.findMany({ where: { tenantId } }),
      prisma.purchaseOrder.findMany({ where: { tenantId } }),
    ]);

    return {
      requisitions: {
        total: requisitions.length,
        pending: requisitions.filter(r => r.status === 'PENDING_APPROVAL').length,
        approved: requisitions.filter(r => r.status === 'APPROVED').length,
        rejected: requisitions.filter(r => r.status === 'REJECTED').length,
      },
      purchaseOrders: {
        total: purchaseOrders.length,
        pending: purchaseOrders.filter(p => p.status === 'SUBMITTED' || p.status === 'PENDING_APPROVAL').length,
        approved: purchaseOrders.filter(p => p.status === 'APPROVED').length,
      },
    };
  }

  async getApprovalHistory(tenantId: string, params: PaginationParams & { type?: string } = {}): Promise<PaginatedResult<any>> {
    const whereReqs: any = { tenantId };
    const wherePos: any = { tenantId };
    if (params.type === 'requisition') whereReqs.status = { in: ['APPROVED', 'REJECTED'] };
    if (params.type === 'purchase-order') wherePos.status = { in: ['APPROVED', 'CANCELLED'] };

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    if (params.type === 'requisition' || !params.type) {
      const [requisitions, total] = await Promise.all([
        prisma.purchaseRequisition.findMany({
          where: whereReqs,
          skip, take, orderBy: orderBy as any,
          include: { department: { select: { name: true } } },
        }),
        prisma.purchaseRequisition.count({ where: whereReqs }),
      ]);

      if (params.type === 'requisition') {
        return paginatedResult(requisitions.map(r => ({ ...r, type: 'requisition' })), total, params);
      }
    }

    const [purchaseOrders, totalPo] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: wherePos,
        skip, take, orderBy: orderBy as any,
        include: { vendor: { select: { name: true } } },
      }),
      prisma.purchaseOrder.count({ where: wherePos }),
    ]);

    return paginatedResult(purchaseOrders.map(po => ({ ...po, type: 'purchase-order' })), totalPo, params);
  }

  async delegateApproval(tenantId: string, userId: string, dto: { delegateToUserId: string; fromDate: string; toDate: string }) {
    return {
      tenantId,
      delegatedBy: userId,
      delegatedTo: dto.delegateToUserId,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      status: 'ACTIVE',
    };
  }

  async getMyPendingApprovals(tenantId: string, _userId: string) {
    const whereReqs: any = { tenantId, status: 'PENDING_APPROVAL' };
    const wherePos: any = { tenantId, status: 'SUBMITTED' };

    const [requisitions, purchaseOrders] = await Promise.all([
      prisma.purchaseRequisition.findMany({
        where: whereReqs,
        include: { department: { select: { name: true } }, _count: { select: { lineItems: true } } },
        orderBy: { createdAt: 'desc' as const },
        take: 50,
      }),
      prisma.purchaseOrder.findMany({
        where: wherePos,
        include: { vendor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' as const },
        take: 50,
      }),
    ]);

    return {
      requisitions: requisitions.map(r => ({ ...r, type: 'requisition' })),
      purchaseOrders: purchaseOrders.map(po => ({ ...po, type: 'purchase-order' })),
      total: requisitions.length + purchaseOrders.length,
      pendingSince: new Date().toISOString(),
    };
  }

  async getApprovalStatistics(tenantId: string) {
    const [requisitions, purchaseOrders] = await Promise.all([
      prisma.purchaseRequisition.findMany({ where: { tenantId } }),
      prisma.purchaseOrder.findMany({ where: { tenantId } }),
    ]);

    const approvedReqs = requisitions.filter(r => r.status === 'APPROVED');
    const rejectedReqs = requisitions.filter(r => r.status === 'REJECTED');
    const approvedPos = purchaseOrders.filter(p => p.status === 'APPROVED');

    const avgRequisitionApprovalTime = approvedReqs
      .filter(r => r.approvedAt)
      .reduce((sum, r) => sum + (new Date(r.approvedAt!).getTime() - new Date(r.createdAt).getTime()), 0) / (1000 * 60 * 60 * 24);

    return {
      requisitions: {
        total: requisitions.length,
        pending: requisitions.filter(r => r.status === 'PENDING_APPROVAL').length,
        approved: approvedReqs.length,
        rejected: rejectedReqs.length,
        approvalRate: requisitions.length > 0 && requisitions.filter(r => r.status !== 'DRAFT').length > 0
          ? Math.round((approvedReqs.length / requisitions.filter(r => r.status !== 'DRAFT').length) * 10000) / 100
          : 0,
        avgApprovalDays: Math.round(avgRequisitionApprovalTime * 10) / 10 || 0,
      },
      purchaseOrders: {
        total: purchaseOrders.length,
        pending: purchaseOrders.filter(p => p.status === 'SUBMITTED' || p.status === 'PENDING_APPROVAL').length,
        approved: approvedPos.length,
        approvalRate: purchaseOrders.length > 0
          ? Math.round((approvedPos.length / purchaseOrders.length) * 10000) / 100
          : 0,
      },
    };
  }
}
