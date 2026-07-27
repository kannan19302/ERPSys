import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiDeepService } from '../ai-deep.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    aiIntentTrainingExample: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    aiNluEntity: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    aiModel: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    aiModelAccuracyMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    aiPrompt: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('AiDeepService', () => {
  let service: AiDeepService;

  beforeEach(() => {
    service = new AiDeepService();
    vi.clearAllMocks();
  });

  it('should classify intent from training examples', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findMany).mockResolvedValue([
      { id: '1', intent: 'greeting', text: 'hello', language: 'en', entities: [{ entity: 'name', value: 'world' }], tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', intent: 'goodbye', text: 'bye', language: 'en', entities: [], tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
    ] as any);
    const result = await service.classifyIntent('t1', { text: 'hello world' });
    expect(result.intent).toBe('greeting');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.entities.length).toBe(1);
  });

  it('should throw BadRequestException when no training data', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findMany).mockResolvedValue([]);
    await expect(service.classifyIntent('t1', { text: 'test' })).rejects.toThrow(BadRequestException);
  });

  it('should get intent training data', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findMany).mockResolvedValue([
      { id: '1', intent: 'greeting', text: 'hi', language: 'en', entities: [], tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
    ] as any);
    vi.mocked(prisma.aiIntentTrainingExample.count).mockResolvedValue(1);
    const result = await service.getIntentTrainingData('t1');
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should create intent training data', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.create).mockResolvedValue({ id: 'new-1', intent: 'test', text: 'testing', language: 'en', tenantId: 't1', entities: [], createdAt: new Date(), updatedAt: new Date() } as any);
    const result = await service.createIntentTrainingData('t1', { intent: 'test', text: 'testing', language: 'en' });
    expect(result.id).toBe('new-1');
  });

  it('should update intent training data', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findFirst).mockResolvedValue({ id: '1', tenantId: 't1' } as any);
    vi.mocked(prisma.aiIntentTrainingExample.update).mockResolvedValue({ id: '1', intent: 'updated', text: 'updated text', language: 'en', tenantId: 't1', createdAt: new Date(), updatedAt: new Date() } as any);
    const result = await service.updateIntentTrainingData('t1', '1', { intent: 'updated', text: 'updated text' });
    expect(result.intent).toBe('updated');
  });

  it('should throw NotFoundException when updating nonexistent training data', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findFirst).mockResolvedValue(null);
    await expect(service.updateIntentTrainingData('t1', 'nonexistent', { intent: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('should delete intent training data', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findFirst).mockResolvedValue({ id: '1', tenantId: 't1' } as any);
    await service.deleteIntentTrainingData('t1', '1');
    expect(prisma.aiIntentTrainingExample.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should get NLU training data (delegates to intent training)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiIntentTrainingExample.findMany).mockResolvedValue([
      { id: 'nlu1', intent: 'greeting', text: 'hello', language: 'en', entities: [], tenantId: 't1', createdAt: new Date(), updatedAt: new Date() },
    ] as any);
    vi.mocked(prisma.aiIntentTrainingExample.count).mockResolvedValue(1);
    const result = await service.getNluTrainingData('t1');
    expect(result.data).toHaveLength(1);
  });

  it('should get models with metrics', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiModel.findMany).mockResolvedValue([
      { id: 'm1', name: 'Model A', modelType: 'CLASSIFIER', provider: 'openai', version: '1.0', isActive: true, accuracyMetrics: [{ id: 'met1', metricName: 'accuracy', metricValue: 0.95, modelRegistryId: 'm1', recordedAt: new Date() }], tenantId: 't1', createdAt: new Date(), updatedAt: new Date(), config: {} },
    ] as any);
    vi.mocked(prisma.aiModel.count).mockResolvedValue(1);
    const result = await service.getModelsWithMetrics('t1');
    expect(result.data).toHaveLength(1);
  });

  it('should record model accuracy metric', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiModel.findFirst).mockResolvedValue({ id: 'm1', tenantId: 't1' } as any);
    vi.mocked(prisma.aiModelAccuracyMetric.create).mockResolvedValue({ id: 'met1', metric: 'f1', value: 0.88, modelId: 'm1', recordedAt: new Date() } as any);
    const result = await service.recordModelAccuracy('t1', { modelId: 'm1', metric: 'f1', value: 0.88 });
    expect(result.metric).toBe('f1');
  });

  it('should get prompts with variables', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiPrompt.findMany).mockResolvedValue([
      { id: 'p1', name: 'Sales Summary', prompt: 'Summarize {data}', variables: ['data'], category: 'SALES', isActive: true, tenantId: 't1', modelConfig: {}, createdAt: new Date(), updatedAt: new Date() },
    ] as any);
    vi.mocked(prisma.aiPrompt.count).mockResolvedValue(1);
    const result = await service.getPromptsWithVariables('t1');
    expect(result.data).toHaveLength(1);
  });

  it('should create prompt', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.aiPrompt.create).mockResolvedValue({ id: 'p1', name: 'Test', prompt: 'Hello', variables: [], category: 'GENERAL', isActive: true, modelConfig: {}, tenantId: 't1', createdAt: new Date(), updatedAt: new Date() } as any);
    const result = await service.createPrompt('t1', { name: 'Test', prompt: 'Hello', category: 'GENERAL' });
    expect(result.name).toBe('Test');
  });
});
