import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../ai.service';

describe('AiService coverage', () => {
  let service: AiService;

  beforeEach(() => {
    service = new AiService();
    vi.clearAllMocks();
  });

  it('isConfigured returns false without API key', () => {
    expect(service.isConfigured()).toBe(false);
  });

  it('chat throws when not configured', async () => {
    await expect(service.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow('AI is not configured');
  });

  it('summarize throws when not configured', async () => {
    await expect(service.summarize('some text')).rejects.toThrow('AI is not configured');
  });

  it('classify throws when not configured', async () => {
    await expect(service.classify('text', ['A', 'B'])).rejects.toThrow('AI is not configured');
  });

  it('extractFields throws when not configured', async () => {
    await expect(service.extractFields('text', ['name'])).rejects.toThrow('AI is not configured');
  });
});
