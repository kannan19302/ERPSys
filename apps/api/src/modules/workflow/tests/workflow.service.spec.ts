import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowService } from '../workflow.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      workflow: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      workflowStep: {
        create: vi.fn(),
      },
      approvalChain: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(require('@unerp/database').prisma)),
    },
  };
});

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    service = new WorkflowService();
    vi.clearAllMocks();
  });

  it('should get workflows', async () => {
    const { prisma } = await import('@unerp/database');
    const mockWorkflows = [{ id: 'wf-1', name: 'PO Approval Workflow' }];
    vi.mocked(prisma.workflow.findMany).mockResolvedValue(mockWorkflows as any);

    const res = await service.getWorkflows('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('PO Approval Workflow');
  });
});
