import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmCasesService } from '../crm-cases.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    case: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    caseComment: {
      create: vi.fn(),
    },
    organization: {
      findFirst: vi.fn().mockResolvedValue({ id: 'org-1' }),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmCasesService', () => {
  let service: CrmCasesService;

  let mockSla: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org-1' });
    mockSla = { applyToCase: vi.fn().mockResolvedValue(undefined) };
    service = new CrmCasesService(mockSla);
  });

  describe('createCase', () => {
    it('rejects a case with no subject', async () => {
      await expect(service.createCase(TENANT, '', { subject: '' })).rejects.toThrow(BadRequestException);
    });

    it('assigns a sequential case number and a priority-based SLA deadline', async () => {
      (prisma.case.count as ReturnType<typeof vi.fn>).mockResolvedValue(4);
      (prisma.case.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const before = Date.now();
      const result = await service.createCase(TENANT, '', { subject: 'Login broken', priority: 'URGENT' });

      expect(result.caseNumber).toBe('CASE-00005');
      expect(result.priority).toBe('URGENT');
      // URGENT defaults to a 4-hour SLA window.
      const deadlineMs = new Date(result.slaDeadline).getTime();
      expect(deadlineMs).toBeGreaterThan(before + 3.9 * 60 * 60 * 1000);
      expect(deadlineMs).toBeLessThan(before + 4.1 * 60 * 60 * 1000);
    });

    it('defaults to MEDIUM priority and a 24h SLA when none is given', async () => {
      (prisma.case.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.case.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const before = Date.now();
      const result = await service.createCase(TENANT, '', { subject: 'General question' });

      expect(result.priority).toBe('MEDIUM');
      const deadlineMs = new Date(result.slaDeadline).getTime();
      expect(deadlineMs).toBeGreaterThan(before + 23.9 * 60 * 60 * 1000);
      expect(deadlineMs).toBeLessThan(before + 24.1 * 60 * 60 * 1000);
    });

    it('respects an explicit slaHours override', async () => {
      (prisma.case.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.case.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const before = Date.now();
      const result = await service.createCase(TENANT, '', { subject: 'Custom SLA', slaHours: 1 });

      const deadlineMs = new Date(result.slaDeadline).getTime();
      expect(deadlineMs).toBeLessThan(before + 1.1 * 60 * 60 * 1000);
    });
  });

  describe('updateCase', () => {
    it('throws if the case does not exist', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.updateCase(TENANT, 'missing', { status: 'RESOLVED' })).rejects.toThrow(NotFoundException);
    });

    it('stamps resolvedAt when transitioning to RESOLVED for the first time', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'OPEN', resolvedAt: null });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const result = await service.updateCase(TENANT, 'case-1', { status: 'RESOLVED' });
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('does not overwrite an existing resolvedAt', async () => {
      const existingResolvedAt = new Date('2026-01-01');
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'RESOLVED', resolvedAt: existingResolvedAt });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      await service.updateCase(TENANT, 'case-1', { status: 'CLOSED' });
      const updateCallData = (prisma.case.update as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
      expect(updateCallData.resolvedAt).toBeUndefined();
    });
  });

  describe('updateCase (status transition guard)', () => {
    it('allows a valid forward transition (OPEN -> IN_PROGRESS)', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'OPEN', resolvedAt: null });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const result = await service.updateCase(TENANT, 'case-1', { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('rejects CLOSED -> OPEN via a plain status update, with a message pointing at the reopen endpoint', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'CLOSED', resolvedAt: new Date() });
      await expect(service.updateCase(TENANT, 'case-1', { status: 'OPEN' })).rejects.toThrow(/reopen/i);
      expect(prisma.case.update).not.toHaveBeenCalled();
    });

    it('rejects CLOSED -> any other status', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'CLOSED', resolvedAt: new Date() });
      await expect(service.updateCase(TENANT, 'case-1', { status: 'IN_PROGRESS' })).rejects.toThrow(BadRequestException);
    });

    it('allows re-setting the same status as a no-op', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'OPEN', resolvedAt: null });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const result = await service.updateCase(TENANT, 'case-1', { status: 'OPEN' });
      expect(result.status).toBe('OPEN');
    });

    it('does not run the transition guard when no status is included in the update', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'CLOSED', resolvedAt: new Date() });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const result = await service.updateCase(TENANT, 'case-1', { subject: 'Updated subject' });
      expect(result.subject).toBe('Updated subject');
    });
  });

  describe('reopenCase', () => {
    it('throws if the case does not exist', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.reopenCase(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('rejects reopening a case that is not CLOSED', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'OPEN' });
      await expect(service.reopenCase(TENANT, 'case-1')).rejects.toThrow(BadRequestException);
    });

    it('reopens a CLOSED case to OPEN and clears resolvedAt', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, status: 'CLOSED', resolvedAt: new Date() });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const result = await service.reopenCase(TENANT, 'case-1');
      expect(result.status).toBe('OPEN');
      expect(result.resolvedAt).toBeNull();
    });
  });

  describe('addComment', () => {
    it('throws if the case does not exist', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.addComment(TENANT, 'missing', { body: 'hi' })).rejects.toThrow(NotFoundException);
    });

    it('rejects an empty comment body', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', firstResponseAt: null });
      await expect(service.addComment(TENANT, 'case-1', { body: '' })).rejects.toThrow(BadRequestException);
    });

    it('sets firstResponseAt on the first non-internal comment', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', firstResponseAt: null });
      (prisma.caseComment.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'comment-1' });

      await service.addComment(TENANT, 'case-1', { body: 'We are looking into it' });
      expect(prisma.case.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'case-1' } }));
    });

    it('does not touch firstResponseAt for an internal note', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', firstResponseAt: null });
      (prisma.caseComment.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'comment-1' });

      await service.addComment(TENANT, 'case-1', { body: 'internal note', isInternal: true });
      expect(prisma.case.update).not.toHaveBeenCalled();
    });

    it('does not overwrite firstResponseAt if already set', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', firstResponseAt: new Date('2026-01-01') });
      (prisma.caseComment.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'comment-1' });

      await service.addComment(TENANT, 'case-1', { body: 'follow up' });
      expect(prisma.case.update).not.toHaveBeenCalled();
    });
  });

  describe('getSlaStatus', () => {
    it('classifies open cases into breached, at-risk, and on-track buckets', async () => {
      const now = Date.now();
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: '1', caseNumber: 'CASE-1', status: 'OPEN', slaDeadline: new Date(now - 60 * 60 * 1000) }, // breached (1h ago)
        { id: '2', caseNumber: 'CASE-2', status: 'OPEN', slaDeadline: new Date(now + 60 * 60 * 1000) }, // at risk (1h from now)
        { id: '3', caseNumber: 'CASE-3', status: 'OPEN', slaDeadline: new Date(now + 48 * 60 * 60 * 1000) }, // on track (2 days out)
      ]);

      const result = await service.getSlaStatus(TENANT);
      expect(result.totalOpen).toBe(3);
      expect(result.breached).toBe(1);
      expect(result.atRisk).toBe(1);
      expect(result.onTrack).toBe(1);
    });

    it('only considers cases not yet RESOLVED/CLOSED', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.getSlaStatus(TENANT);
      const call = (prisma.case.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.status.notIn).toEqual(['RESOLVED', 'CLOSED']);
    });
  });

  describe('getCases', () => {
    it('always scopes by tenant and applies optional filters', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.getCases(TENANT, { status: 'OPEN', priority: 'HIGH', customerId: 'cust-1' });
      const call = (prisma.case.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where).toEqual({ tenantId: TENANT, status: 'OPEN', priority: 'HIGH', customerId: 'cust-1' });
    });

    it('supports pagination with page and limit', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'case-1' }]);
      (prisma.case.count as ReturnType<typeof vi.fn>).mockResolvedValue(25);

      const result = await service.getCases(TENANT, { page: 2, limit: 10 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('totalCount', 25);
      expect(result).toHaveProperty('page', 2);
      expect(result).toHaveProperty('totalPages', 3);

      const call = (prisma.case.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
    });

    it('supports sorting by valid fields', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.getCases(TENANT, { sortBy: 'createdAt', sortOrder: 'asc' });

      const call = (prisma.case.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'asc' });
    });
  });

  describe('bulkUpdateCaseStatus', () => {
    it('rejects invalid status values', async () => {
      await expect(service.bulkUpdateCaseStatus(TENANT, ['case-1'], 'INVALID')).rejects.toThrow(BadRequestException);
    });

    it('updates multiple cases with a valid status', async () => {
      (prisma.case.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

      const result = await service.bulkUpdateCaseStatus(TENANT, ['case-1', 'case-2', 'case-3'], 'RESOLVED');
      expect(result).toEqual({ updated: 3, status: 'RESOLVED' });

      const call = (prisma.case.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.id.in).toEqual(['case-1', 'case-2', 'case-3']);
      expect(call.where.tenantId).toBe(TENANT);
      expect(call.data.status).toBe('RESOLVED');
    });
  });

  describe('exportCases', () => {
    it('returns cases with relevant fields for export', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'case-1',
          caseNumber: 'CASE-00001',
          subject: 'Login issue',
          priority: 'HIGH',
          status: 'OPEN',
        },
      ]);

      const result = await service.exportCases(TENANT);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('caseNumber');
      expect(result[0]).toHaveProperty('subject');
      expect(result[0]).toHaveProperty('priority');
      expect(result[0]).toHaveProperty('status');
    });

    it('filters by status when provided', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.exportCases(TENANT, { status: 'RESOLVED' });

      const call = (prisma.case.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.status).toBe('RESOLVED');
    });

    it('filters by priority when provided', async () => {
      (prisma.case.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.exportCases(TENANT, { priority: 'URGENT' });

      const call = (prisma.case.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.priority).toBe('URGENT');
    });
  });

  describe('getCaseSummary', () => {
    it('throws if the case does not exist', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getCaseSummary(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('reports a breached SLA for an open case past its deadline', async () => {
      const now = Date.now();
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'case-1',
        status: 'OPEN',
        createdAt: new Date(now - 10 * 60 * 60 * 1000),
        slaDeadline: new Date(now - 60 * 60 * 1000), // 1h ago -> breached
        slaFirstResponseAt: null,
        slaResolveBy: null,
        slaBreached: false,
        firstResponseAt: null,
        resolvedAt: null,
        comments: [],
      });

      const result = await service.getCaseSummary(TENANT, 'case-1');
      expect(result.sla.isOpen).toBe(true);
      expect(result.sla.slaBreached).toBe(true);
    });

    it('computes time-to-first-response and marks the SLA met when responded before the deadline', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const slaFirstResponseAt = new Date('2026-01-01T04:00:00Z');
      const firstResponseAt = new Date('2026-01-01T02:00:00Z'); // responded within window

      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'case-1',
        status: 'IN_PROGRESS',
        createdAt,
        slaDeadline: new Date('2026-01-02T00:00:00Z'),
        slaFirstResponseAt,
        slaResolveBy: null,
        slaBreached: false,
        firstResponseAt,
        resolvedAt: null,
        comments: [{ id: 'c1', isInternal: false }, { id: 'c2', isInternal: true }],
      });

      const result = await service.getCaseSummary(TENANT, 'case-1');
      expect(result.sla.firstResponseMet).toBe(true);
      expect(result.sla.timeToFirstResponseMs).toBe(2 * 60 * 60 * 1000);
      expect(result.metrics.commentCount).toBe(2);
      expect(result.metrics.internalCommentCount).toBe(1);
    });

    it('computes time-to-resolution and marks resolution missed when resolved after the deadline', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const slaResolveBy = new Date('2026-01-01T08:00:00Z');
      const resolvedAt = new Date('2026-01-01T10:00:00Z'); // resolved late

      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'case-1',
        status: 'RESOLVED',
        createdAt,
        slaDeadline: new Date('2026-01-01T08:00:00Z'),
        slaFirstResponseAt: null,
        slaResolveBy,
        slaBreached: false,
        firstResponseAt: null,
        resolvedAt,
        comments: [],
      });

      const result = await service.getCaseSummary(TENANT, 'case-1');
      expect(result.sla.resolutionMet).toBe(false);
      expect(result.sla.timeToResolutionMs).toBe(10 * 60 * 60 * 1000);
      expect(result.sla.isOpen).toBe(false); // RESOLVED is not "open" for breach purposes
    });

    it('includes customer/contact context and comments', async () => {
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'case-1',
        status: 'OPEN',
        createdAt: new Date(),
        slaDeadline: null,
        slaFirstResponseAt: null,
        slaResolveBy: null,
        slaBreached: false,
        firstResponseAt: null,
        resolvedAt: null,
        customer: { id: 'cust-1', name: 'Acme', email: 'a@acme.com', phone: null },
        contact: null,
        comments: [{ id: 'c1', body: 'hello', isInternal: false }],
      });

      const result = await service.getCaseSummary(TENANT, 'case-1');
      expect(result.case.customer.name).toBe('Acme');
      expect(result.comments).toHaveLength(1);
    });
  });
});
