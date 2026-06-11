import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthcareService } from '../healthcare.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      patient: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      practitioner: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      appointment: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      prescription: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      drugRegister: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      medicalEncounter: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('HealthcareService', () => {
  let service: HealthcareService;

  beforeEach(() => {
    service = new HealthcareService();
    vi.clearAllMocks();
  });

  it('should get patients list', async () => {
    const { prisma } = await import('@unerp/database');
    const mockPatients = [{ id: 'p-1', firstName: 'John', lastName: 'Doe' }];
    vi.mocked(prisma.patient.findMany).mockResolvedValue(mockPatients as any);

    const res = await service.getPatients('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.firstName).toBe('John');
  });

  it('should get practitioner list', async () => {
    const { prisma } = await import('@unerp/database');
    const mockPracts = [{ id: 'pract-1', specialty: 'Cardiology' }];
    vi.mocked(prisma.practitioner.findMany).mockResolvedValue(mockPracts as any);

    const res = await service.getPractitioners('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.specialty).toBe('Cardiology');
  });
});
