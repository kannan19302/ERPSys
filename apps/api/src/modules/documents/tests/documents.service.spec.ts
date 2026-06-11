import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentsService } from '../documents.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      folder: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      document: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      documentVersion: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      documentTemplate: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      signature: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(require('@unerp/database').prisma)),
    },
  };
});

describe('DocumentsService', () => {
  let documentsService: DocumentsService;

  beforeEach(() => {
    documentsService = new DocumentsService();
    vi.clearAllMocks();
  });

  it('should fetch folders', async () => {
    const { prisma } = await import('@unerp/database');
    const mockFolders = [{ id: 'f-1', name: 'Billing' }];
    vi.mocked(prisma.folder.findMany).mockResolvedValue(mockFolders as any);

    const res = await documentsService.getFolders('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Billing');
  });

  it('should fetch documents', async () => {
    const { prisma } = await import('@unerp/database');
    const mockDocs = [{ id: 'd-1', name: 'Contract.pdf' }];
    vi.mocked(prisma.document.findMany).mockResolvedValue(mockDocs as any);

    const res = await documentsService.getDocuments('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Contract.pdf');
  });
});
