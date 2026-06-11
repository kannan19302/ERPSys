import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../storage.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      storedFile: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      generatedDocument: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    vi.clearAllMocks();
  });

  it('should get stored files', async () => {
    const { prisma } = await import('@unerp/database');
    const mockFiles = [{ id: 'file-1', name: 'Invoice.pdf', bucket: 'tenant-bucket' }];
    vi.mocked(prisma.storedFile.findMany).mockResolvedValue(mockFiles as any);

    const res = await service.getFiles('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Invoice.pdf');
  });
});
