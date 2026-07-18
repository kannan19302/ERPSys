import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    dataErasureRequest: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    contact: { deleteMany: vi.fn() },
    lead: { deleteMany: vi.fn() },
    user: { findMany: vi.fn(), update: vi.fn() },
    customer: { findMany: vi.fn(), update: vi.fn() },
    vendor: { findMany: vi.fn(), update: vi.fn() },
    organization: { findMany: vi.fn(), update: vi.fn() },
    employee: { deleteMany: vi.fn(), findMany: vi.fn() },
    applicant: { deleteMany: vi.fn() },
    poSLoyaltyMember: { deleteMany: vi.fn() },
    customerPortalUser: { deleteMany: vi.fn() },
    vendorPortalUser: { deleteMany: vi.fn() },
  },
}));

const { TEST_REGISTRY } = vi.hoisted(() => ({
  TEST_REGISTRY: {
    comment: 'Test PII registry',
    models: {
      User: {
        treatment: 'anonymize' as const,
        rationale: 'Referenced as author/actor across audit trails',
        reviewed: '2026-07-18',
      },
      Organization: {
        treatment: 'anonymize' as const,
        rationale: 'Tenant org contact data',
        reviewed: '2026-07-18',
      },
      Employee: {
        treatment: 'retain-legal-hold' as const,
        rationale: 'Labor/tax law mandates multi-year retention',
        reviewed: '2026-07-18',
      },
      Customer: {
        treatment: 'anonymize' as const,
        rationale: 'Counterparty on legally retained documents',
        reviewed: '2026-07-18',
      },
      Vendor: {
        treatment: 'anonymize' as const,
        rationale: 'Counterparty on procurement documents',
        reviewed: '2026-07-18',
      },
      Contact: {
        treatment: 'erase' as const,
        rationale: 'CRM person record',
        reviewed: '2026-07-18',
      },
      Lead: {
        treatment: 'erase' as const,
        rationale: 'Prospect data',
        reviewed: '2026-07-18',
      },
      POSLoyaltyMember: {
        treatment: 'erase' as const,
        rationale: 'Loyalty membership PII',
        reviewed: '2026-07-18',
      },
      Applicant: {
        treatment: 'erase' as const,
        rationale: 'Recruitment data; short-lived',
        reviewed: '2026-07-18',
      },
      CustomerPortalUser: {
        treatment: 'erase' as const,
        rationale: 'Portal login identity',
        reviewed: '2026-07-18',
      },
      VendorPortalUser: {
        treatment: 'erase' as const,
        rationale: 'Portal login identity',
        reviewed: '2026-07-18',
      },
    },
  },
}));

vi.mock('@unerp/database', () => ({ prisma: mockPrisma }));

import { GdprService } from '../gdpr.service';

describe('GdprService', () => {
  let service: GdprService;

  beforeEach(() => {
    service = new GdprService();
    vi.clearAllMocks();

    vi.spyOn(service, 'loadPiiRegistry').mockReturnValue(TEST_REGISTRY);
  });

  describe('loadPiiRegistry', () => {
    it('should cache the registry after first load', () => {
      const first = service.loadPiiRegistry();
      const second = service.loadPiiRegistry();
      expect(first).toBe(second);
    });

    it('should contain all 11 PII models', () => {
      const registry = service.loadPiiRegistry();
      expect(Object.keys(registry.models)).toHaveLength(11);
    });
  });

  describe('executeErasure', () => {
    const defaultRequest = {
      id: 'req-1',
      tenantId: 't1',
      requestedBy: 'user-1',
      subjectEmail: 'data@subject.com',
      entityTypes: [] as string[],
      status: 'PENDING' as const,
    };

    it('should throw when request not found', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue(null);
      await expect(service.executeErasure('t1', 'not-found')).rejects.toThrow(
        'Erasure request not found',
      );
    });

    it('should throw when already completed', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        status: 'COMPLETED',
      });
      await expect(service.executeErasure('t1', 'req-1')).rejects.toThrow(
        'Already executed',
      );
    });

    it('should erase Contact records (treatment: erase)', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Contact'],
      });
      mockPrisma.contact.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.contact.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', email: 'data@subject.com' },
      });
      expect(result.results).toContainEqual({
        entityType: 'Contact',
        treatment: 'erased',
        count: 3,
      });
    });

    it('should erase Lead records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Lead'],
      });
      mockPrisma.lead.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.lead.deleteMany).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'Lead',
        treatment: 'erased',
        count: 2,
      });
    });

    it('should erase Applicant records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Applicant'],
      });
      mockPrisma.applicant.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.applicant.deleteMany).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'Applicant',
        treatment: 'erased',
        count: 1,
      });
    });

    it('should erase POSLoyaltyMember records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['POSLoyaltyMember'],
      });
      mockPrisma.poSLoyaltyMember.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.poSLoyaltyMember.deleteMany).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'POSLoyaltyMember',
        treatment: 'erased',
        count: 5,
      });
    });

    it('should erase CustomerPortalUser records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['CustomerPortalUser'],
      });
      mockPrisma.customerPortalUser.deleteMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.customerPortalUser.deleteMany).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'CustomerPortalUser',
        treatment: 'erased',
        count: 2,
      });
    });

    it('should erase VendorPortalUser records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['VendorPortalUser'],
      });
      mockPrisma.vendorPortalUser.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.vendorPortalUser.deleteMany).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'VendorPortalUser',
        treatment: 'erased',
        count: 1,
      });
    });

    it('should anonymize User records replacing PII fields', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        subjectEmail: 'jane@example.com',
        entityTypes: ['User'],
      });
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1' },
        { id: 'u2' },
      ]);

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', email: 'jane@example.com' },
        select: { id: true },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          email: '[redacted-u1]@erased.local',
          firstName: '[redacted]',
          lastName: '[redacted]',
          avatar: '[redacted]',
        },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u2' },
        data: {
          email: '[redacted-u2]@erased.local',
          firstName: '[redacted]',
          lastName: '[redacted]',
          avatar: '[redacted]',
        },
      });
      expect(result.results).toContainEqual({
        entityType: 'User',
        treatment: 'anonymized',
        count: 2,
      });
    });

    it('should anonymize Customer records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Customer'],
      });
      mockPrisma.customer.findMany.mockResolvedValue([{ id: 'c1' }]);

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.customer.findMany).toHaveBeenCalled();
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          name: '[redacted]',
          email: '[redacted-c1]@erased.local',
          phone: '[redacted]',
        },
      });
      expect(result.results).toContainEqual({
        entityType: 'Customer',
        treatment: 'anonymized',
        count: 1,
      });
    });

    it('should anonymize Vendor records', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Vendor'],
      });
      mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v1' }]);

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.vendor.findMany).toHaveBeenCalled();
      expect(mockPrisma.vendor.update).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'Vendor',
        treatment: 'anonymized',
        count: 1,
      });
    });

    it('should skip Employee records (retain-legal-hold)', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Employee'],
      });

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.employee.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.employee.findMany).not.toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'Employee',
        treatment: 'retained-legal-hold',
        count: 0,
      });
    });

    it('should support legacy plural aliases (e.g. "customers")', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['customers'],
      });
      mockPrisma.customer.findMany.mockResolvedValue([{ id: 'c1' }]);

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.customer.findMany).toHaveBeenCalled();
      expect(result.results).toContainEqual({
        entityType: 'Customer',
        treatment: 'anonymized',
        count: 1,
      });
    });

    it('should handle multiple entity types in one request', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Contact', 'User', 'Employee'],
      });
      mockPrisma.contact.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);

      const result = await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.contact.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.employee.findMany).not.toHaveBeenCalled();
      expect(result.results).toHaveLength(3);
      expect(result.results).toContainEqual({
        entityType: 'Contact',
        treatment: 'erased',
        count: 2,
      });
      expect(result.results).toContainEqual({
        entityType: 'User',
        treatment: 'anonymized',
        count: 1,
      });
      expect(result.results).toContainEqual({
        entityType: 'Employee',
        treatment: 'retained-legal-hold',
        count: 0,
      });
    });

    it('should mark the request as COMPLETED and record erasedAt', async () => {
      const now = new Date('2026-07-18T12:00:00Z');
      vi.useFakeTimers().setSystemTime(now);

      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Contact'],
      });
      mockPrisma.contact.deleteMany.mockResolvedValue({ count: 1 });

      await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.dataErasureRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: 'COMPLETED', erasedAt: now },
      });

      vi.useRealTimers();
    });

    it('should create an audit log entry with results', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['Contact'],
      });
      mockPrisma.contact.deleteMany.mockResolvedValue({ count: 1 });

      await service.executeErasure('t1', 'req-1');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tenantId: 't1',
          userId: 'user-1',
          action: 'GDPR_ERASURE',
          entityType: 'GDPR',
          entityId: 'req-1',
          changes: {
            email: 'data@subject.com',
            results: [
              { entityType: 'Contact', treatment: 'erased', count: 1 },
            ],
            executedAt: expect.any(String),
          },
        },
      });
    });

    it('should skip unrecognized entity types with a warning', async () => {
      mockPrisma.dataErasureRequest.findFirst.mockResolvedValue({
        ...defaultRequest,
        entityTypes: ['UnknownType'],
      });

      const result = await service.executeErasure('t1', 'req-1');

      expect(result.results).toHaveLength(0);
    });
  });
});
