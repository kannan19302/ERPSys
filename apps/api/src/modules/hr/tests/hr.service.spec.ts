import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HrService } from '../hr.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      employee: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('HrService', () => {
  let hrService: HrService;

  beforeEach(() => {
    hrService = new HrService();
    vi.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should return all employees in the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      const mockEmployees = [
        {
          id: 'emp-1',
          employeeCode: 'EMP-001',
          firstName: 'Tony',
          lastName: 'Stark',
          email: 'tony@stark.com',
          phone: '123456789',
          designation: 'Engineer',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          dateOfJoining: new Date(),
          department: { name: 'Engineering', code: 'ENG' },
        },
      ];

      vi.mocked(prisma.employee.findMany).mockResolvedValue(mockEmployees as unknown as Awaited<ReturnType<typeof prisma.employee.findMany>>);

      const result = await hrService.getEmployees('tenant-123');

      expect(result).toBeDefined();
      expect(result[0]?.employeeCode).toBe('EMP-001');
      expect(result[0]?.departmentName).toBe('Engineering');
    });
  });
});
