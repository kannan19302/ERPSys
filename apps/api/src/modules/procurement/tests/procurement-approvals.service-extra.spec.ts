import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementApprovalsService } from '../procurement-approvals.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    purchaseRequisition: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    purchaseOrder: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('ProcurementApprovalsService (extra)', () => {
  let service: ProcurementApprovalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [ProcurementApprovalsService] }).compile();
    service = module.get<ProcurementApprovalsService>(ProcurementApprovalsService);
    vi.clearAllMocks();
  });

  it('should reject purchase order', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', status: 'SUBMITTED' });
    prisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'CANCELLED' });

    const result = await service.rejectPurchaseOrder('tenant-1', 'po-1', 'Budget constraints');
    expect(result.status).toBe('CANCELLED');
  });

  it('should throw BadRequestException when rejecting PO in wrong status', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue({ id: 'po-1', status: 'DRAFT' });
    await expect(service.rejectPurchaseOrder('tenant-1', 'po-1')).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when rejecting missing PO', async () => {
    prisma.purchaseOrder.findFirst.mockResolvedValue(null);
    await expect(service.rejectPurchaseOrder('tenant-1', 'x')).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException for missing requisition on approve', async () => {
    prisma.purchaseRequisition.findFirst.mockResolvedValue(null);
    await expect(service.approveRequisition('tenant-1', 'x')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when approving already approved requisition', async () => {
    prisma.purchaseRequisition.findFirst.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });
    await expect(service.approveRequisition('tenant-1', 'req-1')).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException for missing requisition on reject', async () => {
    prisma.purchaseRequisition.findFirst.mockResolvedValue(null);
    await expect(service.rejectRequisition('tenant-1', 'x')).rejects.toThrow(NotFoundException);
  });

  it('should get approval history for requisition type only', async () => {
    prisma.purchaseRequisition.findMany.mockResolvedValue([
      { id: 'req-1', status: 'APPROVED', department: { name: 'Engineering' } },
    ]);
    prisma.purchaseRequisition.count.mockResolvedValue(1);

    const result = await service.getApprovalHistory('tenant-1', { type: 'requisition', page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.data[0].type).toBe('requisition');
    expect(prisma.purchaseOrder.findMany).not.toHaveBeenCalled();
  });

  it('should get approval history for purchase-order type only', async () => {
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', status: 'APPROVED', vendor: { name: 'Vendor A' } },
    ]);
    prisma.purchaseOrder.count.mockResolvedValue(1);

    const result = await service.getApprovalHistory('tenant-1', { type: 'purchase-order', page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.data[0].type).toBe('purchase-order');
  });

  it('should get approval history for all types (defaults to purchase-order fallback)', async () => {
    prisma.purchaseRequisition.findMany.mockResolvedValue([]);
    prisma.purchaseRequisition.count.mockResolvedValue(0);
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', status: 'APPROVED', vendor: { name: 'Vendor A' } },
    ]);
    prisma.purchaseOrder.count.mockResolvedValue(1);

    const result = await service.getApprovalHistory('tenant-1', { page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.data[0].type).toBe('purchase-order');
  });

  it('should get my pending approvals', async () => {
    prisma.purchaseRequisition.findMany.mockResolvedValue([
      { id: 'req-1', status: 'PENDING_APPROVAL', department: { name: 'Engineering' }, _count: { lineItems: 3 } },
    ]);
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', status: 'SUBMITTED', vendor: { name: 'Vendor A' } },
    ]);

    const result = await service.getMyPendingApprovals('tenant-1', 'user-1');
    expect(result.total).toBe(2);
    expect(result.requisitions[0].type).toBe('requisition');
    expect(result.purchaseOrders[0].type).toBe('purchase-order');
    expect(result.pendingSince).toBeDefined();
  });

  it('should get approval statistics with approval rate and avg days', async () => {
    const pastDate = new Date('2026-01-01');
    const laterDate = new Date('2026-01-05');
    prisma.purchaseRequisition.findMany.mockResolvedValue([
      { id: 'req-1', status: 'APPROVED', createdAt: pastDate, approvedAt: laterDate },
      { id: 'req-2', status: 'REJECTED', createdAt: pastDate, approvedAt: null },
      { id: 'req-3', status: 'PENDING_APPROVAL', createdAt: pastDate, approvedAt: null },
    ]);
    prisma.purchaseOrder.findMany.mockResolvedValue([
      { id: 'po-1', status: 'APPROVED' },
      { id: 'po-2', status: 'SUBMITTED' },
    ]);

    const stats = await service.getApprovalStatistics('tenant-1');
    expect(stats.requisitions.total).toBe(3);
    expect(stats.requisitions.pending).toBe(1);
    expect(stats.requisitions.approved).toBe(1);
    expect(stats.requisitions.rejected).toBe(1);
    expect(stats.requisitions.approvalRate).toBeGreaterThan(0);
    expect(stats.requisitions.avgApprovalDays).toBe(4);
    expect(stats.purchaseOrders.total).toBe(2);
    expect(stats.purchaseOrders.pending).toBe(1);
    expect(stats.purchaseOrders.approved).toBe(1);
    expect(stats.purchaseOrders.approvalRate).toBe(50);
  });

  it('should set approval policy', async () => {
    const result = await service.setApprovalPolicy('tenant-1', { requiresApproval: true, minAmount: 1000, maxAmount: 50000, approverRoles: ['manager'] });
    expect(result.tenantId).toBe('tenant-1');
    expect(result.policy.requiresApproval).toBe(true);
  });

  it('should get default approval policy', async () => {
    const result = await service.getApprovalPolicy('tenant-1');
    expect(result.requiresApproval).toBe(true);
    expect(result.approverRoles).toContain('procurement_manager');
  });

  it('should delegate approval', async () => {
    const result = await service.delegateApproval('tenant-1', 'user-1', { delegateToUserId: 'user-2', fromDate: '2026-07-01', toDate: '2026-07-31' });
    expect(result.delegatedBy).toBe('user-1');
    expect(result.delegatedTo).toBe('user-2');
    expect(result.status).toBe('ACTIVE');
  });

  it('should enforce tenant isolation on approveRequisition', async () => {
    prisma.purchaseRequisition.findFirst.mockResolvedValue(null);
    await expect(service.approveRequisition('tenant-2', 'req-1')).rejects.toThrow(NotFoundException);
    expect(prisma.purchaseRequisition.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'req-1', tenantId: 'tenant-2' } })
    );
  });
});
