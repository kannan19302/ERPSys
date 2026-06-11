import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealEstateService } from '../real-estate.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      property: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      lease: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      propertyMaintenance: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      agentCommission: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('RealEstateService', () => {
  let service: RealEstateService;

  beforeEach(() => {
    service = new RealEstateService();
    vi.clearAllMocks();
  });

  it('should get properties list', async () => {
    const { prisma } = await import('@unerp/database');
    const mockProps = [{ id: 'prop-1', name: 'Apartment 4B' }];
    vi.mocked(prisma.property.findMany).mockResolvedValue(mockProps as any);

    const res = await service.getProperties('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Apartment 4B');
  });
});
