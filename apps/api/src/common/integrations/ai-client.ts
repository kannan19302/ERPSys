/**
 * Stable application-facing contract for AI capabilities.
 *
 * Feature modules depend on this port rather than on the AI module's
 * implementation. The integration module binds it to the configured provider.
 */
export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface AiChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tenantId?: string;
}

export abstract class AiClient {
  abstract isConfigured(): boolean;

  abstract chat(messages: AiChatMessage[], options?: AiChatOptions): Promise<AiChatResponse>;
}
