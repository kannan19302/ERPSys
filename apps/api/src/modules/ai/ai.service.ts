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

@Injectable()
export class AiService {
  private apiKey: string | undefined;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.defaultModel = process.env.AI_MODEL || 'claude-sonnet-4-6';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async chat(
    messages: AiMessage[],
    options: { model?: string; maxTokens?: number; temperature?: number; tenantId?: string } = {},
  ): Promise<AiResponse> {
    if (!this.apiKey) {
      throw new BadRequestException('AI is not configured. Set ANTHROPIC_API_KEY environment variable.');
    }

    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || 1024;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: options.temperature ?? 0.3,
        messages: messages.filter((m) => m.role !== 'system').map((m) => ({
          role: m.role,
          content: m.content,
        })),
        system: messages.find((m) => m.role === 'system')?.content || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`AI request failed: ${error}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: any) => c.type === 'text');

    return {
      content: textBlock?.text || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
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
    const result = await this.chat([
      { role: 'system', content: `Classify the input into exactly one of these categories: ${categories.join(', ')}. Respond with JSON: {"category": "...", "confidence": 0.0-1.0}` },
      { role: 'user', content: text },
    ], { maxTokens: 100, temperature: 0, tenantId });

    try {
      return JSON.parse(result.content);
    } catch {
      return { category: categories[0] || 'UNKNOWN', confidence: 0.5 };
    }
  }

  async extractFields(text: string, fields: string[], tenantId?: string): Promise<Record<string, string>> {
    const result = await this.chat([
      { role: 'system', content: `Extract these fields from the text: ${fields.join(', ')}. Respond with JSON object mapping field names to extracted values. Use null for missing fields.` },
      { role: 'user', content: text },
    ], { maxTokens: 500, temperature: 0, tenantId });

    try {
      return JSON.parse(result.content);
    } catch {
      return {};
    }
  }
}
