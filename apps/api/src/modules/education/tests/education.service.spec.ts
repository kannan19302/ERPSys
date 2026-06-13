import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EducationService } from '../education.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      student: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      course: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      timetable: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      feeStructure: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      studentFee: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      bookRegister: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      bookTransaction: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('EducationService', () => {
  let service: EducationService;

  beforeEach(() => {
    service = new EducationService();
    vi.clearAllMocks();
  });

  it('should get students list', async () => {
    const { prisma } = await import('@unerp/database');
    const mockStudents = [{ id: 'stu-1', firstName: 'Alice', lastName: 'Smith' }];
    vi.mocked(prisma.student.findMany).mockResolvedValue(mockStudents as never);

    const res = await service.getStudents('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.firstName).toBe('Alice');
  });
});
