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

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org-1' });
    service = new CrmCasesService();
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
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, resolvedAt: null });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      const result = await service.updateCase(TENANT, 'case-1', { status: 'RESOLVED' });
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('does not overwrite an existing resolvedAt', async () => {
      const existingResolvedAt = new Date('2026-01-01');
      (prisma.case.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'case-1', tenantId: TENANT, resolvedAt: existingResolvedAt });
      (prisma.case.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'case-1', ...data }));

      await service.updateCase(TENANT, 'case-1', { status: 'CLOSED' });
      const updateCallData = (prisma.case.update as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
      expect(updateCallData.resolvedAt).toBeUndefined();
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
  });
});
