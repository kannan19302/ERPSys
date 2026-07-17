import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiCopilotService } from '../ai-copilot.service';
import { AiService } from '../ai.service';
import { ReportingEngineService } from '../../reporting/reporting-engine.service';

describe('AiCopilotService.askData — natural-language-to-report', () => {
  let ai: AiService;
  let reportingEngine: ReportingEngineService;
  let service: AiCopilotService;
  let chatSpy: ReturnType<typeof vi.spyOn>;
  let executeQuerySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ai = new AiService();
    reportingEngine = new ReportingEngineService();
    service = new AiCopilotService(ai, reportingEngine);
    vi.spyOn(ai, 'isConfigured').mockReturnValue(true);
    chatSpy = vi.spyOn(ai, 'chat');
    executeQuerySpy = vi.spyOn(reportingEngine, 'executeQuery');
  });

  it('reports not configured without ever calling the AI or the query engine', async () => {
    vi.spyOn(ai, 'isConfigured').mockReturnValue(false);
    const result = await service.askData('t1', 'How many invoices are overdue?');
    expect(result.answer).toContain('not configured');
    expect(result.data).toEqual([]);
    expect(chatSpy).not.toHaveBeenCalled();
  });

  it('actually executes the reporting engine and grounds the answer in its real output (regression: previous version hallucinated an answer without querying anything)', async () => {
    chatSpy
      .mockResolvedValueOnce({
        content: JSON.stringify({ entity: 'invoices', aggregations: [{ field: 'totalAmount', fn: 'SUM' }] }),
        model: 'test-model',
        usage: { inputTokens: 0, outputTokens: 0 },
      })
      .mockResolvedValueOnce({
        content: 'Total invoiced amount is $12,500 across the returned records.',
        model: 'test-model',
        usage: { inputTokens: 0, outputTokens: 0 },
      });
    executeQuerySpy.mockResolvedValue({ data: [{ totalAmount_sum: 12500 }] } as never);

    const result = await service.askData('t1', 'What is our total invoiced amount?');

    // The query that was actually run must be the tenant-scoped, semantic-layer
    // validated one — not a freeform string the model made up.
    expect(executeQuerySpy).toHaveBeenCalledWith('t1', 'invoices', expect.objectContaining({
      aggregations: [{ field: 'totalAmount', fn: 'SUM' }],
    }));

    // The narration call (second chat call) must have been given the real
    // query result as context, not just the raw question.
    const narrationCallArgs = chatSpy.mock.calls[1][0];
    const narrationUserMessage = narrationCallArgs.find((m: { role: string }) => m.role === 'user')?.content;
    expect(narrationUserMessage).toContain('12500');

    expect(result.answer).toBe('Total invoiced amount is $12,500 across the returned records.');
    expect(result.data).toEqual([{ totalAmount_sum: 12500 }]);
    expect(result.query).toMatchObject({ entity: 'invoices' });
  });

  it('refuses to run a query for an entity outside the semantic layer, instead of guessing', async () => {
    chatSpy.mockResolvedValueOnce({
      content: JSON.stringify({ entity: 'some_made_up_table' }),
      model: 'test-model',
      usage: { inputTokens: 0, outputTokens: 0 },
    });

    const result = await service.askData('t1', 'Show me data from a table that does not exist');

    expect(executeQuerySpy).not.toHaveBeenCalled();
    expect(result.data).toEqual([]);
    expect(result.answer).toContain("don't have");
  });

  it('fails gracefully (not a crash, not a fabricated answer) when the model returns non-JSON', async () => {
    chatSpy.mockResolvedValueOnce({
      content: 'Sure! Let me help with that...',
      model: 'test-model',
      usage: { inputTokens: 0, outputTokens: 0 },
    });

    const result = await service.askData('t1', 'How many open sales orders do we have?');

    expect(executeQuerySpy).not.toHaveBeenCalled();
    expect(result.data).toEqual([]);
    expect(result.query).toBeNull();
  });
});
