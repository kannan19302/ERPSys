import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiCopilotService } from '../ai-copilot.service';
import { AiService } from '../ai.service';
import { ReportingEngineService } from '../../reporting/reporting-engine.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([]),
    invoice: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

const okChatResult = { model: 'llama3.1', usage: { inputTokens: 0, outputTokens: 0 } };

describe('AiCopilotService coverage', () => {
  let ai: AiService;
  let service: AiCopilotService;
  let chatSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ai = new AiService();
    const reportingEngine = new ReportingEngineService();
    service = new AiCopilotService(ai, reportingEngine);
    chatSpy = vi.spyOn(ai, 'chat');
    vi.clearAllMocks();
  });

  // AiService.isConfigured() always returns true for the self-hosted Ollama
  // backend (no API key to gate on) — these tests exercise the real success
  // path instead of the old "not configured" short-circuit, and confirm a
  // downstream Ollama failure surfaces as a friendly error, not a crash.

  it('summarizeRecord returns a not-found message when no record exists', async () => {
    const result = await service.summarizeRecord('t1', 'Invoice', 'inv-1');
    expect(result.summary).toContain('not found');
  });

  it('draftEmail returns a parsed subject/body on success', async () => {
    chatSpy.mockResolvedValue({
      ...okChatResult,
      content: JSON.stringify({ subject: 'Re: PO', body: 'Hello, following up on the PO.' }),
    });

    const result = await service.draftEmail('t1', { to: 'test@t.com', regarding: 'PO' });

    expect(result).toEqual({ subject: 'Re: PO', body: 'Hello, following up on the PO.' });
  });

  it('draftEmail falls back to raw content when the model does not return JSON', async () => {
    chatSpy.mockResolvedValue({ ...okChatResult, content: 'Just some prose reply' });

    const result = await service.draftEmail('t1', { to: 'test@t.com', regarding: 'PO' });

    expect(result).toEqual({ subject: 'Re: PO', body: 'Just some prose reply' });
  });

  it('generateFormFromPrompt returns a parsed form definition on success', async () => {
    const form = { name: 'Leave Request', description: 'x', fields: [] };
    chatSpy.mockResolvedValue({ ...okChatResult, content: JSON.stringify(form) });

    const result = await service.generateFormFromPrompt('t1', 'create leave request form');

    expect(result).toEqual({ form, error: null });
  });

  it('generateFormFromPrompt returns a parse error when the model does not return JSON', async () => {
    chatSpy.mockResolvedValue({ ...okChatResult, content: 'not json' });

    const result = await service.generateFormFromPrompt('t1', 'create leave request form');

    expect(result).toEqual({ form: null, error: 'Failed to parse AI response' });
  });

  it('generateWorkflowFromPrompt returns a parsed workflow definition on success', async () => {
    const workflow = { name: 'PO Approval', triggerType: 'PO_CREATED', steps: [] };
    chatSpy.mockResolvedValue({ ...okChatResult, content: JSON.stringify(workflow) });

    const result = await service.generateWorkflowFromPrompt('t1', 'approval workflow');

    expect(result).toEqual({ workflow, error: null });
  });

  it('processInvoiceDocument returns extracted fields without creating a draft PO by default', async () => {
    const extractFieldsSpy = vi.spyOn(ai, 'extractFields').mockResolvedValue({
      vendorName: 'Acme Corp',
      totalAmount: '500',
      currency: 'USD',
    });

    const result = await service.processInvoiceDocument('t1', 'Invoice #123');

    expect(extractFieldsSpy).toHaveBeenCalled();
    expect(result.extracted).toEqual({ vendorName: 'Acme Corp', totalAmount: '500', currency: 'USD' });
    expect(result).not.toHaveProperty('draftPoId');
  });

  it('propagates a friendly error when the underlying AI call fails (e.g. Ollama unreachable)', async () => {
    chatSpy.mockRejectedValue(new Error('Could not reach the local Ollama server'));

    await expect(service.draftEmail('t1', { to: 'test@t.com', regarding: 'PO' })).rejects.toThrow(
      'Could not reach the local Ollama server',
    );
  });
});
