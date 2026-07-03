import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiAgentService } from '../ai-agent.service';
import { AiService } from '../ai.service';
import { AiCopilotService } from '../ai-copilot.service';
import { ReportingEngineService } from '../../reporting/reporting-engine.service';

function ollamaResponse(message: Record<string, unknown>) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ model: 'llama3.1', message, done: true }),
    text: async () => '',
  } as Response;
}

describe('AiAgentService', () => {
  let ai: AiService;
  let copilot: AiCopilotService;
  let agent: AiAgentService;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    ai = new AiService();
    const reportingEngine = new ReportingEngineService();
    copilot = new AiCopilotService(ai, reportingEngine);
    agent = new AiAgentService(ai, copilot);
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('short-circuits with a friendly error when the Ollama server is unreachable, without executing any tools', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const askDataSpy = vi.spyOn(copilot, 'askData');

    const result = await agent.converse('t1', 'u1', [{ role: 'user', content: 'What are my open invoices?' }]);

    expect(result.actions).toEqual([]);
    expect(result.reply).toContain('unavailable');
    expect(askDataSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('executes a tool call then returns the final text reply and recorded action', async () => {
    const askDataSpy = vi.spyOn(copilot, 'askData').mockResolvedValue({
      answer: 'You have 3 overdue invoices totaling $4,200.',
      query: { entity: 'invoices' } as never,
      data: [{ count: 3 }],
    });

    fetchSpy
      // Turn 1: model decides to call the query_erp_data tool
      .mockResolvedValueOnce(
        ollamaResponse({
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              function: {
                name: 'query_erp_data',
                arguments: { question: 'How many overdue invoices do we have?' },
              },
            },
          ],
        }),
      )
      // Turn 2: model produces the final answer after seeing the tool result
      .mockResolvedValueOnce(
        ollamaResponse({
          role: 'assistant',
          content: 'You have 3 overdue invoices totaling $4,200.',
        }),
      );

    const result = await agent.converse(
      't1',
      'u1',
      [{ role: 'user', content: 'How many overdue invoices do we have?' }],
      { path: '/finance/invoices', module: 'finance' },
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(askDataSpy).toHaveBeenCalledWith('t1', 'How many overdue invoices do we have?');

    expect(result.reply).toBe('You have 3 overdue invoices totaling $4,200.');
    expect(result.actions).toEqual([
      {
        tool: 'query_erp_data',
        input: { question: 'How many overdue invoices do we have?' },
        result: {
          answer: 'You have 3 overdue invoices totaling $4,200.',
          query: { entity: 'invoices' },
          data: [{ count: 3 }],
        },
      },
    ]);
  });
});
