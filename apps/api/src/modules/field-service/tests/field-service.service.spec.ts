import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldServiceService } from '../field-service.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      serviceTicket: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      serviceDispatch: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      technicianChecklist: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      preventativeMaintenance: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('FieldServiceService', () => {
  let service: FieldServiceService;

  beforeEach(() => {
    service = new FieldServiceService();
    vi.clearAllMocks();
  });

  it('should get service tickets list', async () => {
    const { prisma } = await import('@unerp/database');
    const mockTickets = [{ id: 't-1', title: 'AC Leak' }];
    vi.mocked(prisma.serviceTicket.findMany).mockResolvedValue(mockTickets as any);

    const res = await service.getTickets('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.title).toBe('AC Leak');
  });
});
