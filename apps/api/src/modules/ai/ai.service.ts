import { Injectable, BadRequestException } from '@nestjs/common';

interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AiResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

/** Ollama's native /api/chat tool definition shape (OpenAI-function-style). */
export interface OllamaTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** A single tool call as returned inside an Ollama assistant message. */
export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

/** A chat message in Ollama's /api/chat format, including tool round-trips. */
export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

function isOllamaChatResponse(value: unknown): value is OllamaChatResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.model === 'string' && typeof v.message === 'object' && v.message !== null;
}

/**
 * AiService wraps a self-hosted Ollama server (https://ollama.com) instead of
 * a paid LLM API. UniERP deliberately swapped off the Anthropic API to
 * eliminate per-token cost, accepting a quality/reliability tradeoff for a
 * free, self-hosted model. Requires `ollama serve` running locally/on the
 * configured host with the target model already pulled
 * (`ollama pull llama3.2:3b`).
 */
@Injectable()
export class AiService {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  /**
   * There's no API key to gate on with a self-hosted model — Ollama is
   * either reachable or it isn't, and that's discovered per-request so a
   * transient outage doesn't block the whole app. Always returns true;
   * failures surface as a friendly BadRequestException from chat().
   */
  isConfigured(): boolean {
    return true;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Low-level accessor for callers (e.g. AiAgentService) that need Ollama's
   * tool-calling support, which chat() does not expose. Performs a single
   * (non-streaming) POST to /api/chat with optional tool definitions and
   * returns the raw assistant message, including any tool_calls.
   */
  async rawChat(
    messages: OllamaChatMessage[],
    options: { model?: string; temperature?: number; tools?: OllamaTool[]; format?: 'json' } = {},
  ): Promise<OllamaChatMessage> {
    const model = options.model || this.defaultModel;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: { temperature: options.temperature ?? 0.3 },
          ...(options.tools ? { tools: options.tools } : {}),
          ...(options.format ? { format: options.format } : {}),
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(
        `Could not reach the local Ollama server at ${this.baseUrl}. Make sure Ollama is installed and running (\`ollama serve\`). Details: ${message}`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadRequestException(`Ollama request failed (${response.status}): ${body || response.statusText}`);
    }

    const json: unknown = await response.json();
    if (!isOllamaChatResponse(json)) {
      throw new BadRequestException('Ollama returned an unexpected response shape.');
    }

    return json.message;
  }

  async chat(
    messages: AiMessage[],
    options: { model?: string; maxTokens?: number; temperature?: number; tenantId?: string } = {},
  ): Promise<AiResponse> {
    const ollamaMessages: OllamaChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));

    const message = await this.rawChat(ollamaMessages, {
      model: options.model,
      temperature: options.temperature,
    });

    return {
      content: message.content ?? '',
      model: options.model || this.defaultModel,
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  async summarize(text: string, options: { maxLength?: number; tenantId?: string } = {}): Promise<string> {
    const result = await this.chat([
      { role: 'system', content: 'You are a concise business summarizer. Output only the summary, no preamble.' },
      { role: 'user', content: `Summarize the following in ${options.maxLength || 100} words or fewer:\n\n${text}` },
    ], { maxTokens: 300, tenantId: options.tenantId });

    return result.content;
  }

  async classify(text: string, categories: string[], tenantId?: string): Promise<{ category: string; confidence: number }> {
    void tenantId; // reserved for future tenant-scoped logging/rate-limiting; not needed by Ollama itself
    const ollamaMessages: OllamaChatMessage[] = [
      { role: 'system', content: `Classify the input into exactly one of these categories: ${categories.join(', ')}. Respond with JSON: {"category": "...", "confidence": 0.0-1.0}` },
      { role: 'user', content: text },
    ];

    const message = await this.rawChat(ollamaMessages, { temperature: 0, format: 'json' });

    try {
      return JSON.parse(message.content) as { category: string; confidence: number };
    } catch {
      return { category: categories[0] || 'UNKNOWN', confidence: 0.5 };
    }
  }

  async extractFields(text: string, fields: string[], tenantId?: string): Promise<Record<string, string>> {
    void tenantId; // reserved for future tenant-scoped logging/rate-limiting; not needed by Ollama itself
    const ollamaMessages: OllamaChatMessage[] = [
      { role: 'system', content: `Extract these fields from the text: ${fields.join(', ')}. Respond with JSON object mapping field names to extracted values. Use null for missing fields.` },
      { role: 'user', content: text },
    ];

    const message = await this.rawChat(ollamaMessages, { temperature: 0, format: 'json' });

    try {
      return JSON.parse(message.content) as Record<string, string>;
    } catch {
      return {};
    }
  }
}
