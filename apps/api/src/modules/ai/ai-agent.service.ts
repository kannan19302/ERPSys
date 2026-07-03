import { Injectable } from '@nestjs/common';
import { AiService, OllamaChatMessage, OllamaTool, OllamaToolCall } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';

export interface AgentConverseMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentAction {
  tool: string;
  input: unknown;
  result: unknown;
}

export interface AgentConverseResult {
  reply: string;
  actions: AgentAction[];
}

interface AgentContext {
  path?: string;
  module?: string;
}

const MAX_TOOL_LOOP_ITERATIONS = 6;

/**
 * Agentic tool-use loop for the global AI Copilot widget, backed by a
 * self-hosted Ollama model instead of the Anthropic API. Ollama's
 * /api/chat exposes OpenAI-style function calling (`tools` request field,
 * `message.tool_calls` response field) rather than Anthropic's
 * content-block format, so the loop shape differs from the old
 * implementation even though the business logic underneath (AiCopilotService)
 * is unchanged and still fully tenant-scoped.
 */
@Injectable()
export class AiAgentService {
  constructor(
    private readonly ai: AiService,
    private readonly copilot: AiCopilotService,
  ) {}

  private buildTools(): OllamaTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'query_erp_data',
          description:
            'Answer a natural-language question about the business by running a real, tenant-scoped query against the ERP reporting engine. Use this for any question about counts, totals, balances, or records in the system.',
          parameters: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'The natural-language business question to answer.' },
            },
            required: ['question'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'summarize_record',
          description: 'Summarize a specific ERP record (e.g. an invoice, purchase order, customer) given its entity type and ID.',
          parameters: {
            type: 'object',
            properties: {
              entityType: { type: 'string', description: 'The entity/model name, e.g. "Invoice", "PurchaseOrder".' },
              entityId: { type: 'string', description: 'The record ID to summarize.' },
            },
            required: ['entityType', 'entityId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'draft_email',
          description: 'Draft a professional business email to a recipient about a given subject.',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'The email recipient (name or address).' },
              regarding: { type: 'string', description: 'What the email should be about.' },
              tone: { type: 'string', description: 'Optional tone, e.g. "professional", "friendly", "formal".' },
            },
            required: ['to', 'regarding'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'generate_form',
          description: 'Generate a data-collection form definition for the ERP Builder from a plain-language description.',
          parameters: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Description of the form to generate.' },
            },
            required: ['prompt'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'generate_workflow',
          description: 'Generate an approval workflow definition for the ERP system from a plain-language description.',
          parameters: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Description of the workflow to generate.' },
            },
            required: ['prompt'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'process_invoice_text',
          description: 'Extract structured fields (vendor, amount, dates, line items, etc.) from raw invoice document text, optionally creating a draft purchase order.',
          parameters: {
            type: 'object',
            properties: {
              documentText: { type: 'string', description: 'The raw text content of the invoice document.' },
              createDraft: { type: 'boolean', description: 'Whether to create a draft purchase order from the extracted data.' },
            },
            required: ['documentText'],
          },
        },
      },
    ];
  }

  private async executeTool(tenantId: string, name: string, input: unknown): Promise<unknown> {
    const args = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

    switch (name) {
      case 'query_erp_data': {
        const question = typeof args.question === 'string' ? args.question : '';
        return this.copilot.askData(tenantId, question);
      }
      case 'summarize_record': {
        const entityType = typeof args.entityType === 'string' ? args.entityType : '';
        const entityId = typeof args.entityId === 'string' ? args.entityId : '';
        return this.copilot.summarizeRecord(tenantId, entityType, entityId);
      }
      case 'draft_email': {
        const to = typeof args.to === 'string' ? args.to : '';
        const regarding = typeof args.regarding === 'string' ? args.regarding : '';
        const tone = typeof args.tone === 'string' ? args.tone : undefined;
        return this.copilot.draftEmail(tenantId, { to, regarding, tone });
      }
      case 'generate_form': {
        const prompt = typeof args.prompt === 'string' ? args.prompt : '';
        return this.copilot.generateFormFromPrompt(tenantId, prompt);
      }
      case 'generate_workflow': {
        const prompt = typeof args.prompt === 'string' ? args.prompt : '';
        return this.copilot.generateWorkflowFromPrompt(tenantId, prompt);
      }
      case 'process_invoice_text': {
        const documentText = typeof args.documentText === 'string' ? args.documentText : '';
        const createDraft = typeof args.createDraft === 'boolean' ? args.createDraft : false;
        return this.copilot.processInvoiceDocument(tenantId, documentText, createDraft);
      }
      default:
        return { error: 'Unknown tool' };
    }
  }

  async converse(
    tenantId: string,
    _userId: string,
    history: AgentConverseMessage[],
    context?: AgentContext,
  ): Promise<AgentConverseResult> {
    if (!this.ai.isConfigured()) {
      return { reply: 'AI is not configured.', actions: [] };
    }

    const tools = this.buildTools();
    const actions: AgentAction[] = [];

    const systemPrompt =
      'You are the UniERP AI assistant, embedded across every page of the ERP system. ' +
      "Answer any question the user has, or perform any of the actions available to you via tools. " +
      "If the user's request doesn't match a tool, just answer directly and conversationally. " +
      `Current page context: ${context?.module ?? 'unknown'} module, path ${context?.path ?? 'unknown'}.`;

    let messages: OllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    let iterations = 0;
    let lastMessage: OllamaChatMessage | undefined;

    while (iterations < MAX_TOOL_LOOP_ITERATIONS) {
      iterations += 1;

      let assistantMessage: OllamaChatMessage;
      try {
        assistantMessage = await this.ai.rawChat(messages, { tools });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { reply: `Sorry, the AI assistant is unavailable right now. (${message})`, actions };
      }

      lastMessage = assistantMessage;

      const toolCalls: OllamaToolCall[] = assistantMessage.tool_calls ?? [];

      if (toolCalls.length === 0) {
        return { reply: assistantMessage.content?.trim() ?? '', actions };
      }

      // Preserve the assistant turn (including tool_calls) before appending results.
      messages = [...messages, assistantMessage];

      for (const call of toolCalls) {
        try {
          const result = await this.executeTool(tenantId, call.function.name, call.function.arguments);
          actions.push({ tool: call.function.name, input: call.function.arguments, result });
          messages = [...messages, { role: 'tool', content: JSON.stringify(result ?? null) }];
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          messages = [...messages, { role: 'tool', content: JSON.stringify({ error: message }) }];
        }
      }
    }

    // Loop cap exceeded — fall back to whatever text is available on the last message.
    const fallbackText = lastMessage?.content?.trim() ?? '';
    return {
      reply: fallbackText || 'I was unable to finish processing that request within the allotted steps. Please try rephrasing or breaking it into smaller requests.',
      actions,
    };
  }
}
