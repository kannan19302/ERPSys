import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerPortalService } from '../customer-portal.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    customer: { findFirst: vi.fn() },
    contact: { findFirst: vi.fn() },
    customerPortalUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    case: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    caseComment: { create: vi.fn(), findMany: vi.fn() },
    quotation: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    salesOrder: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    invoice: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@unerp/auth', () => ({
  hashPassword: vi.fn(async (pw: string) => `hashed:${pw}`),
  comparePassword: vi.fn(async (pw: string, hash: string) => hash === `hashed:${pw}`),
  signToken: vi.fn(() => 'signed-jwt-token'),
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const CUSTOMER = 'cust-1';

describe('CustomerPortalService', () => {
  let service: CustomerPortalService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerPortalService();
  });

  describe('inviteUser', () => {
    it('throws when the customer does not exist', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        service.inviteUser(TENANT, CUSTOMER, { email: 'a@b.com' }),
      ).rejects.toThrow('Customer not found');
    });

    it('rejects a duplicate email within the tenant', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: CUSTOMER });
      (prisma.customerPortalUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' });
      await expect(
        service.inviteUser(TENANT, CUSTOMER, { email: 'dup@b.com' }),
      ).rejects.toThrow('already exists');
    });

    it('creates a portal user with a hashed temp password', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: CUSTOMER });
      (prisma.customerPortalUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.customerPortalUser.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pu1', ...data }),
      );
      const result = await service.inviteUser(TENANT, CUSTOMER, { email: 'new@b.com' });
      expect(result.email).toBe('new@b.com');
      expect(result.status).toBe('INVITED');
      expect(result.tempPassword).toBeDefined();
    });
  });

  describe('login', () => {
    it('rejects invalid credentials', async () => {
      (prisma.customerPortalUser.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await expect(service.login({ email: 'x@y.com', password: 'bad' })).rejects.toThrow('Invalid portal credentials');
    });

    it('issues a portal-scoped token on success', async () => {
      (prisma.customerPortalUser.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'pu1', tenantId: TENANT, customerId: CUSTOMER, email: 'ok@y.com', passwordHash: 'hashed:secret', status: 'ACTIVE' },
      ]);
      (prisma.customerPortalUser.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
      const result = await service.login({ email: 'ok@y.com', password: 'secret' });
      expect(result.token).toBe('signed-jwt-token');
      expect(result.customerId).toBe(CUSTOMER);
    });
  });

  describe('quotation self-service', () => {
    it('accepts a SENT quotation', async () => {
      (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'q1', status: 'SENT' });
      (prisma.quotation.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'q1', status: 'ACCEPTED' });
      const result = await service.acceptQuotation(TENANT, CUSTOMER, 'q1');
      expect(result.status).toBe('ACCEPTED');
    });

    it('refuses to accept a quotation not in SENT status', async () => {
      (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'q1', status: 'DRAFT' });
      await expect(service.acceptQuotation(TENANT, CUSTOMER, 'q1')).rejects.toThrow('Cannot accept');
    });

    it('rejects a quotation and appends the reason to notes', async () => {
      (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'q1', status: 'SENT', notes: null });
      (prisma.quotation.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'q1', ...data }),
      );
      const result = await service.rejectQuotation(TENANT, CUSTOMER, 'q1', { reason: 'too expensive' });
      expect(result.status).toBe('REJECTED');
      expect(result.notes).toContain('too expensive');
    });

    it('throws when the quotation does not belong to this customer', async () => {
      (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getMyQuotationDetail(TENANT, CUSTOMER, 'q-other')).rejects.toThrow('not found');
    });
  });

  describe('support cases', () => {
    it('creates a case with WEB channel and an auto-generated case number', async () => {
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: CUSTOMER, orgId: 'org-1' });
      (prisma.case.count as ReturnType<typeof vi.fn>).mockResolvedValue(4);
      (prisma.case.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'c1', ...data }));
      const result = await service.createCase(TENANT, CUSTOMER, 'pu1', { subject: 'Help', priority: 'MEDIUM' });
      expect(result.channel).toBe('WEB');
      expect(result.caseNumber).toBe('CASE-00005');
      expect(result.status).toBe('OPEN');
    });

    it('scopes case detail lookup to the caller customerId', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getMyCaseDetail(TENANT, CUSTOMER, 'not-mine')).rejects.toThrow('Case not found');
    });

    it('adds a portal-authored, non-internal comment', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'c1', tenantId: TENANT, customerId: CUSTOMER });
      (prisma.caseComment.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'cc1', ...data }),
      );
      const result = await service.addCaseComment(TENANT, CUSTOMER, 'pu1', 'c1', { body: 'Any update?' });
      expect(result.authorType).toBe('PORTAL');
      expect(result.isInternal).toBe(false);
      expect(result.authorId).toBe('pu1');
    });
  });

  describe('dashboard summary', () => {
    it('aggregates counts scoped to the customer', async () => {
      (prisma.case.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
      (prisma.quotation.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      (prisma.invoice.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);
      (prisma.salesOrder.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: CUSTOMER, name: 'Acme', email: 'a@acme.com' });
      const summary = await service.getDashboardSummary(TENANT, CUSTOMER);
      expect(summary.openCases).toBe(2);
      expect(summary.pendingQuotes).toBe(1);
      expect(summary.unpaidInvoices).toBe(3);
      expect(summary.recentOrders).toBe(5);
      expect(summary.customer?.name).toBe('Acme');
    });
  });
});
