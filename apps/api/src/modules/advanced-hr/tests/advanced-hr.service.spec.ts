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
      appraisal: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      training: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      employee: {
        findMany: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
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
    vi.mocked(prisma.leavePolicy.findMany).mockResolvedValue(mockPolicies as never);

    const res = await service.getLeavePolicies('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.annualAllocation).toBe(20);
  });

  it('should get shifts', async () => {
    const { prisma } = await import('@unerp/database');
    const mockShifts = [{ id: 's-1', note: 'Morning Shift' }];
    vi.mocked(prisma.shiftSchedule.findMany).mockResolvedValue(mockShifts as never);

    const res = await service.getShiftSchedules('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.note).toBe('Morning Shift');
  });

  it('should get appraisals and map employee/reviewer names', async () => {
    const { prisma } = await import('@unerp/database');
    const mockAppraisals = [
      { id: 'a-1', employeeId: 'emp-1', reviewerId: 'rev-1', score: 4.5, appraisalPeriod: 'Q1', status: 'COMPLETED', createdAt: new Date() }
    ];
    const mockEmployees = [{ id: 'emp-1', firstName: 'John', lastName: 'Doe' }];
    const mockUsers = [{ id: 'rev-1', firstName: 'Admin', lastName: 'User' }];

    vi.mocked(prisma.appraisal.findMany).mockResolvedValue(mockAppraisals as never);
    vi.mocked(prisma.employee.findMany).mockResolvedValue(mockEmployees as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as never);

    const res = await service.getAppraisals('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.employeeName).toBe('John Doe');
    expect(res[0]?.reviewerName).toBe('Admin User');
    expect(res[0]?.score).toBe(4.5);
  });

  it('should create an appraisal', async () => {
    const { prisma } = await import('@unerp/database');
    const mockAppraisal = { id: 'a-1', score: 4.5 };
    vi.mocked(prisma.appraisal.create).mockResolvedValue(mockAppraisal as never);

    const res = await service.createAppraisal('tenant-123', {
      employeeId: 'emp-1',
      reviewerId: 'rev-1',
      appraisalPeriod: 'Q1',
      score: 4.5,
      feedback: 'Good'
    });
    expect(res).toBeDefined();
  });

  it('should get trainings', async () => {
    const { prisma } = await import('@unerp/database');
    const mockTrainings = [{ id: 't-1', name: 'Cybersecurity' }];
    vi.mocked(prisma.training.findMany).mockResolvedValue(mockTrainings as never);

    const res = await service.getTrainings('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Cybersecurity');
  });

  it('should create a training', async () => {
    const { prisma } = await import('@unerp/database');
    const mockTraining = { id: 't-1', name: 'Cybersecurity' };
    vi.mocked(prisma.training.create).mockResolvedValue(mockTraining as never);

    const res = await service.createTraining('tenant-123', {
      name: 'Cybersecurity',
      startDate: '2026-07-10',
      endDate: '2026-07-12'
    });
    expect(res).toBeDefined();
  });
});
