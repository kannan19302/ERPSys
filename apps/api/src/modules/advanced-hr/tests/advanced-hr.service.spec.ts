import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedHrService } from '../advanced-hr.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      salaryStructure: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      payrollRun: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      payrollSlip: {
        create: vi.fn(),
      },
      leavePolicy: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      leaveRequest: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      shiftSchedule: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(require('@unerp/database').prisma)),
    },
  };
});

describe('AdvancedHrService', () => {
  let service: AdvancedHrService;

  beforeEach(() => {
    service = new AdvancedHrService();
    vi.clearAllMocks();
  });

  it('should get leave policies', async () => {
    const { prisma } = await import('@unerp/database');
    const mockPolicies = [{ id: 'p-1', name: 'Annual Leave', annualAllocation: 20 }];
    vi.mocked(prisma.leavePolicy.findMany).mockResolvedValue(mockPolicies as any);

    const res = await service.getLeavePolicies('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.annualAllocation).toBe(20);
  });

  it('should get shifts', async () => {
    const { prisma } = await import('@unerp/database');
    const mockShifts = [{ id: 's-1', note: 'Morning Shift' }];
    vi.mocked(prisma.shiftSchedule.findMany).mockResolvedValue(mockShifts as any);

    const res = await service.getShiftSchedules('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.note).toBe('Morning Shift');
  });
});
