import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiService } from '../ai.service';

describe('AiService coverage', () => {
  let service: AiService;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new AiService();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isConfigured always returns true — Ollama is self-hosted, reachability is checked per-request', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('defaults baseUrl and model when env vars are unset', () => {
    expect(service.getBaseUrl()).toBe('http://localhost:11434');
    expect(service.getDefaultModel()).toBe('llama3.2:3b');
  });

  it('chat throws a friendly error when the Ollama server is unreachable', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(service.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow('Could not reach the local Ollama server');
  });

  it('chat throws when Ollama responds with a non-OK status', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'model not found',
    } as Response);

    await expect(service.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow('Ollama request failed (500)');
  });

  it('chat returns the assistant content on success', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ model: 'llama3.1', message: { role: 'assistant', content: 'Hello!' }, done: true }),
    } as Response);

    const result = await service.chat([{ role: 'user', content: 'hi' }]);
    expect(result.content).toBe('Hello!');
  });

  it('summarize throws a friendly error when Ollama is unreachable', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(service.summarize('some text')).rejects.toThrow('Could not reach the local Ollama server');
  });

  it('classify falls back to the first category on unparsable JSON', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ model: 'llama3.1', message: { role: 'assistant', content: 'not json' }, done: true }),
    } as Response);

    const result = await service.classify('text', ['A', 'B']);
    expect(result).toEqual({ category: 'A', confidence: 0.5 });
  });

  it('extractFields falls back to an empty object on unparsable JSON', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ model: 'llama3.1', message: { role: 'assistant', content: 'not json' }, done: true }),
    } as Response);

    const result = await service.extractFields('text', ['name']);
    expect(result).toEqual({});
  });
});
