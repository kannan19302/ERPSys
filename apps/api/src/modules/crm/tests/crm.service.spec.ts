import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmService } from '../crm.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      customer: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      vendor: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('CrmService', () => {
  let crmService: CrmService;

  beforeEach(() => {
    crmService = new CrmService();
    vi.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return all customers in the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      const mockCustomers = [
        {
          id: 'cust-1',
          name: 'Stark Industries',
          type: 'COMPANY',
          email: 'tony@stark.com',
          phone: '12345678',
          status: 'ACTIVE',
        },
      ];

      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Awaited<ReturnType<typeof prisma.customer.findMany>>);

      const result = await crmService.getCustomers('tenant-123');

      expect(result).toBeDefined();
      expect(result[0]?.name).toBe('Stark Industries');
    });
  });

  describe('getVendors', () => {
    it('should return all vendors in the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      const mockVendors = [
        {
          id: 'vend-1',
          name: 'Pym Particles Inc.',
          email: 'hank@pym.com',
          phone: '87654321',
          status: 'ACTIVE',
        },
      ];

      vi.mocked(prisma.vendor.findMany).mockResolvedValue(mockVendors as unknown as Awaited<ReturnType<typeof prisma.vendor.findMany>>);

      const result = await crmService.getVendors('tenant-123');

      expect(result).toBeDefined();
      expect(result[0]?.name).toBe('Pym Particles Inc.');
    });
  });
});
