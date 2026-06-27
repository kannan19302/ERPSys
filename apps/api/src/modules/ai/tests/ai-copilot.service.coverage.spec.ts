import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiCopilotService } from '../ai-copilot.service';
import { AiService } from '../ai.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([]),
    invoice: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

describe('AiCopilotService coverage', () => {
  let service: AiCopilotService;

  beforeEach(() => {
    const ai = new AiService();
    service = new AiCopilotService(ai);
    vi.clearAllMocks();
  });

  it('askData returns not-configured', async () => {
    const result = await service.askData('t1', 'How many invoices?');
    expect(result.answer).toContain('not configured');
    expect(result.query).toBeNull();
  });

  it('summarizeRecord returns not-configured', async () => {
    const result = await service.summarizeRecord('t1', 'Invoice', 'inv-1');
    expect(result.summary).toContain('not configured');
  });

  it('draftEmail returns not-configured', async () => {
    const result = await service.draftEmail('t1', { to: 'test@t.com', regarding: 'PO' });
    expect(result.body).toContain('not configured');
  });

  it('generateFormFromPrompt returns not-configured', async () => {
    const result = await service.generateFormFromPrompt('t1', 'create leave request form');
    expect(result.error).toContain('not configured');
    expect(result.form).toBeNull();
  });

  it('generateWorkflowFromPrompt returns not-configured', async () => {
    const result = await service.generateWorkflowFromPrompt('t1', 'approval workflow');
    expect(result.error).toContain('not configured');
    expect(result.workflow).toBeNull();
  });

  it('processInvoiceDocument returns not-configured', async () => {
    const result = await service.processInvoiceDocument('t1', 'Invoice #123');
    expect(result.error).toContain('not configured');
    expect(result.extracted).toBeNull();
  });
});
