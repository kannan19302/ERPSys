import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

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
}
