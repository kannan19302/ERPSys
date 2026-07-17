import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CrmContractsService } from '../crm-contracts.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
    },
    contractBillingMilestone: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      count: vi.fn(),
      create: vi.fn(),
    },
    customer: { findFirst: vi.fn() },
    vendor: { findFirst: vi.fn() },
    organization: { findFirst: vi.fn() },
    salesOrder: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    salesOrderItem: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';

describe('CrmContractsService', () => {
  let service: CrmContractsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmContractsService();
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: ORG });
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        const tx = {
          contract: prisma.contract,
          contractLineItem: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          salesOrder: {
            create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'so-1', ...args.data })),
          },
          salesOrderItem: {
            createMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          invoice: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'inv-1', invoiceNumber: 'INV-2026-00001', ...args.data })),
          },
          contractBillingMilestone: {
            update: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'ms-1', ...args.data })),
          },
        };
        return callback(tx);
      }
      return callback;
    });
  });

  describe('createContract', () => {
    it('creates a contract linked to a customer', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cust-1' });
      (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.contract.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'con-1', ...data }),
      );

      const result = await service.createContract(TENANT, ORG, {
        title: 'Annual Support Agreement',
        customerId: 'cust-1',
        type: 'SALES',
        value: 12000,
        currency: 'USD',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        autoRenew: false,
      } as any);

      expect(result.contractNumber).toBe('CON-00001');
      expect(result.customerId).toBe('cust-1');
    });

    it('rejects when linked customerId does not belong to tenant', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        service.createContract(TENANT, ORG, {
          title: 'Bad',
          customerId: 'nope',
          type: 'SALES',
          value: 100,
          currency: 'USD',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects endDate before startDate', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cust-1' });
      await expect(
        service.createContract(TENANT, ORG, {
          title: 'Bad dates',
          customerId: 'cust-1',
          type: 'SALES',
          value: 100,
          currency: 'USD',
          startDate: new Date('2026-12-31'),
          endDate: new Date('2026-01-01'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('allows DRAFT -> ACTIVE', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'DRAFT' });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', status: 'ACTIVE' });

      const result = await service.updateStatus(TENANT, 'con-1', { status: 'ACTIVE' });
      expect(result.status).toBe('ACTIVE');
    });

    it('rejects illegal transition DRAFT -> EXPIRED', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'DRAFT' });
      await expect(service.updateStatus(TENANT, 'con-1', { status: 'EXPIRED' })).rejects.toThrow(BadRequestException);
    });

    it('rejects setting RENEWED directly (must go through renew action)', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'ACTIVE' });
      await expect(service.updateStatus(TENANT, 'con-1', { status: 'RENEWED' })).rejects.toThrow(
        /use POST \/crm\/contracts\/:id\/renew/,
      );
    });

    it('rejects any transition out of terminal TERMINATED', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'TERMINATED' });
      await expect(service.updateStatus(TENANT, 'con-1', { status: 'ACTIVE' })).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for missing contract', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.updateStatus(TENANT, 'missing', { status: 'ACTIVE' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('renewContract', () => {
    it('creates a follow-on contract by default, marks original RENEWED', async () => {
      const existing = {
        id: 'con-1',
        tenantId: TENANT,
        status: 'ACTIVE',
        title: 'Support',
        customerId: 'cust-1',
        vendorId: null,
        type: 'SALES',
        value: 1000,
        currency: 'USD',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        renewalTermMonths: 12,
        autoRenew: true,
        terms: null,
        ownerId: null,
      };
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
      (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (ops: any[]) => {
        return [{ id: 'con-1', status: 'RENEWED' }, { id: 'con-2', contractNumber: 'CON-00002', status: 'ACTIVE', renewedFromId: 'con-1' }];
      });

      const result = await service.renewContract(TENANT, ORG, 'con-1', { extendInPlace: false } as any);
      expect(result.id).toBe('con-2');
      expect(result.renewedFromId).toBe('con-1');
    });

    it('extends in place when extendInPlace=true', async () => {
      const existing = {
        id: 'con-1',
        tenantId: TENANT,
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        renewalTermMonths: 12,
      };
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'con-1', ...data }),
      );

      const result = await service.renewContract(TENANT, ORG, 'con-1', { extendInPlace: true } as any);
      expect(result.status).toBe('ACTIVE');
      expect(prisma.contract.update).toHaveBeenCalled();
    });

    it('rejects renewing a TERMINATED contract', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, status: 'TERMINATED' });
      await expect(service.renewContract(TENANT, ORG, 'con-1', {} as any)).rejects.toThrow(BadRequestException);
    });

    it('rejects renewal with no renewalTermMonths available', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'con-1', tenantId: TENANT, status: 'ACTIVE', renewalTermMonths: null,
      });
      await expect(service.renewContract(TENANT, ORG, 'con-1', {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('tenant isolation', () => {
    it('getContractById scopes by tenantId and returns not found for another tenant', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockImplementation(({ where }) => {
        if (where.tenantId !== TENANT) return Promise.resolve(null);
        return Promise.resolve(null); // not found either way in this mock, assert call args instead
      });
      await expect(service.getContractById('other-tenant', 'con-1')).rejects.toThrow(NotFoundException);
      expect(prisma.contract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'other-tenant' }) }),
      );
    });
  });

  describe('deleteContract', () => {
    it('soft-deletes by setting deletedAt', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.deleteContract(TENANT, 'con-1');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('scanRenewals', () => {
    it('marks contracts within 30 days as EXPIRING_SOON and past-due as EXPIRED', async () => {
      (prisma.contract.updateMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ count: 2 })
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.scanRenewals(TENANT);
      expect(result).toEqual({ markedExpiringSoon: 2, markedExpired: 1 });
    });
  });

  describe('approval flows', () => {
    it('submits a contract for approval', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, approvalStatus: 'DRAFT', value: 15000, lineItems: [] });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.submitForApproval(TENANT, 'con-1');
      expect(result.approvalStatus).toBe('PENDING_APPROVAL');
    });

    it('approves a pending contract', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, approvalStatus: 'PENDING_APPROVAL' });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.approveContract(TENANT, 'con-1', 'user-1');
      expect(result.approvalStatus).toBe('APPROVED');
      expect(result.signatureStatus).toBe('UNSIGNED');
    });

    it('rejects a pending contract', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, approvalStatus: 'PENDING_APPROVAL' });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.rejectContract(TENANT, 'con-1', 'user-1');
      expect(result.approvalStatus).toBe('REJECTED');
    });
  });

  describe('signature flows', () => {
    it('invites a signer to sign', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, approvalStatus: 'APPROVED', signatureStatus: 'UNSIGNED' });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.inviteToSign(TENANT, 'con-1', 'Alice', 'alice@company.com');
      expect(result.signatureStatus).toBe('PENDING_SIGNATURE');
      expect(result.signerName).toBe('Alice');
      expect(result.signerEmail).toBe('alice@company.com');
    });

    it('signs a pending signature contract and transitions it to ACTIVE status', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'con-1', tenantId: TENANT, approvalStatus: 'APPROVED', signatureStatus: 'PENDING_SIGNATURE' });
      (prisma.contract.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'con-1', ...data }));

      const result = await service.signContract(TENANT, 'con-1');
      expect(result.signatureStatus).toBe('SIGNED');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('reviseContract', () => {
    it('clones a contract into a new draft revision', async () => {
      const mockLineItems = [{ id: 'li-1', productId: 'prod-1', quantity: 2, unitPrice: 100, discount: 0 }];
      const mockContract = {
        id: 'con-1',
        tenantId: TENANT,
        orgId: 'org-1',
        contractNumber: 'CON-00001',
        title: 'Original Contract',
        customerId: 'cust-1',
        vendorId: null,
        type: 'SALES',
        contractType: 'ONE_TIME',
        value: 200,
        currency: 'USD',
        startDate: new Date(),
        endDate: new Date(),
        renewalDate: null,
        autoRenew: false,
        renewalTermMonths: null,
        terms: null,
        ownerId: 'user-1',
        status: 'ACTIVE',
        lineItems: mockLineItems,
      };

      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockContract);
      (prisma.contract.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const result = await service.reviseContract(TENANT, 'org-1', 'con-1');
      expect(result.title).toBe('Original Contract (Amended)');
      expect(result.status).toBe('DRAFT');
      expect(result.approvalStatus).toBe('DRAFT');
      expect(result.revisedFromId).toBe('con-1');
    });
  });

  describe('convertToSalesOrder', () => {
    it('converts an approved contract into a draft SalesOrder', async () => {
      const mockLineItems = [{ id: 'li-1', productId: 'prod-1', quantity: 2, unitPrice: 100, discount: 0, product: { name: 'Widget' } }];
      const mockContract = {
        id: 'con-1',
        tenantId: TENANT,
        orgId: 'org-1',
        contractNumber: 'CON-00001',
        title: 'Approved Contract',
        customerId: 'cust-1',
        vendorId: null,
        type: 'SALES',
        contractType: 'ONE_TIME',
        value: 200,
        currency: 'USD',
        startDate: new Date(),
        endDate: new Date(),
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        lineItems: mockLineItems,
      };

      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockContract);
      (prisma.salesOrder.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.salesOrder.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await service.convertToSalesOrder(TENANT, 'org-1', 'con-1', 'user-1');
      expect(result.customerId).toBe('cust-1');
      expect(result.status).toBe('DRAFT');
      expect(result.notes).toContain('CON-00001');
    });

    it('throws BadRequestException if contract is already converted to a sales order', async () => {
      const mockContract = {
        id: 'con-1',
        tenantId: TENANT,
        orgId: 'org-1',
        contractNumber: 'CON-00001',
        type: 'SALES',
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
      };
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockContract);
      (prisma.salesOrder.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'so-existing' });

      await expect(
        service.convertToSalesOrder(TENANT, 'org-1', 'con-1', 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('billingMilestones', () => {
    const mockContract = {
      id: 'con-1',
      tenantId: TENANT,
      orgId: 'org-1',
      contractNumber: 'CON-00001',
      customerId: 'cust-1',
      value: 10000,
      currency: 'USD',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    };

    it('adds a billing milestone and computes the amount', async () => {
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockContract);
      (prisma.contractBillingMilestone.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'ms-1', ...data }),
      );

      const result = await service.addBillingMilestone(TENANT, 'con-1', {
        title: 'Initial Milestone',
        percentage: 30,
        dueDate: '2026-06-01',
      });

      expect(result.contractId).toBe('con-1');
      expect(result.title).toBe('Initial Milestone');
      expect(result.percentage).toBe(30);
      expect(result.amount).toBe(3000);
    });

    it('deletes a billing milestone if status is pending', async () => {
      const mockMilestone = {
        id: 'ms-1',
        contractId: 'con-1',
        tenantId: TENANT,
        status: 'PENDING',
      };
      (prisma.contractBillingMilestone.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMilestone);
      (prisma.contractBillingMilestone.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockMilestone);

      const result = await service.deleteBillingMilestone(TENANT, 'con-1', 'ms-1');
      expect(result.id).toBe('ms-1');
    });

    it('throws BadRequestException when deleting an invoiced milestone', async () => {
      const mockMilestone = {
        id: 'ms-1',
        contractId: 'con-1',
        tenantId: TENANT,
        status: 'INVOICED',
      };
      (prisma.contractBillingMilestone.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMilestone);

      await expect(
        service.deleteBillingMilestone(TENANT, 'con-1', 'ms-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('triggers a draft invoice generation from a milestone', async () => {
      const mockMilestone = {
        id: 'ms-1',
        contractId: 'con-1',
        tenantId: TENANT,
        title: 'Initial Milestone',
        percentage: 30,
        amount: 3000,
        status: 'PENDING',
      };
      (prisma.contract.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockContract);
      (prisma.contractBillingMilestone.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockMilestone);

      const invoice = await service.triggerMilestoneInvoice(TENANT, 'org-1', 'con-1', 'ms-1', 'user-1');
      expect(invoice.id).toBe('inv-1');
      expect(invoice.totalAmount).toBe(3000);
      expect(invoice.notes).toContain('Initial Milestone');
    });
  });
});
