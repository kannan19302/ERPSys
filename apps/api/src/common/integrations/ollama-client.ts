export class OllamaClient {
  private baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private model = process.env.OLLAMA_MODEL || 'llama3';

  async translate(text: string, targetLang: string): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `Translate the following text to ${targetLang}. Reply with only the translated text, no explanation.\n\n${text}`,
          stream: false,
        }),
      });
      const data = await res.json() as { response?: string };
      return data.response?.trim() || text;
    } catch {
      throw new Error('Ollama unavailable');
    }
  }

  async summarize(text: string): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: `Summarize the following meeting transcript concisely. Include key points and action items.\n\n${text}`,
          stream: false,
        }),
      });
      const data = await res.json() as { response?: string };
      return data.response?.trim() || text.slice(0, 500);
    } catch {
      throw new Error('Ollama unavailable');
    }
  }
}
