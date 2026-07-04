import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmPipelineStagesService } from '../crm-pipeline-stages.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    salesPipeline: { findFirst: vi.fn() },
    pipelineStage: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmPipelineStagesService', () => {
  let service: CrmPipelineStagesService;

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.salesPipeline.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'p1', tenantId: TENANT });
    service = new CrmPipelineStagesService();
  });

  it('creates a stage under a pipeline', async () => {
    (prisma.pipelineStage.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({ id: 's1', ...data }),
    );
    const stage = await service.createStage(TENANT, 'p1', { name: 'Qualification', order: 0, probability: 20 });
    expect(stage.name).toBe('Qualification');
    expect(stage.isWon).toBe(false);
  });

  it('reorders stages by updating each order in a transaction', async () => {
    (prisma.pipelineStage.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
      .mockResolvedValueOnce([
        { id: 'c', order: 0 }, { id: 'a', order: 1 }, { id: 'b', order: 2 },
      ]);
    (prisma.pipelineStage.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.reorder(TENANT, 'p1', [
      { id: 'c', name: 'Stage C', position: 0, probability: 50 },
      { id: 'a', name: 'Stage A', position: 1, probability: 10 },
      { id: 'b', name: 'Stage B', position: 2, probability: 30 },
    ]);
    expect(result.length).toBe(3);
    expect((prisma.pipelineStage.update as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
  });
});
