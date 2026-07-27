import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  CreateIntentTrainingDataInput,
  UpdateIntentTrainingDataInput,
  CreateNluTrainingDataInput,
  UpdateNluTrainingDataInput,
  RecordAiModelAccuracyInput,
  CreateAiPromptInput,
  UpdateAiPromptInput,
  ClassifyIntentInput,
} from "@unerp/shared";

@Injectable()
export class AiDeepService {
  async classifyIntent(tenantId: string, dto: ClassifyIntentInput) {
    const examples = await prisma.aiIntentTrainingExample.findMany({
      where: { tenantId },
      include: { entities: true },
    });
    if (examples.length === 0) {
      throw new BadRequestException("No training data available for intent classification");
    }
    const text = dto.text.toLowerCase();
    const scores: Record<string, { count: number; confidence: number }> = {};
    for (const ex of examples) {
      const exText = ex.text.toLowerCase();
      let score = 0;
      if (text.includes(exText) || exText.includes(text)) {
        score = 0.8;
      } else {
        const words = exText.split(/\s+/);
        const matchCount = words.filter((w) => text.includes(w)).length;
        score = words.length > 0 ? matchCount / words.length : 0;
      }
      if (!scores[ex.intent]) {
        scores[ex.intent] = { count: 0, confidence: 0 };
      }
      scores[ex.intent].count++;
      scores[ex.intent].confidence += score;
    }
    let bestIntent = "";
    let bestConfidence = 0;
    for (const [intent, data] of Object.entries(scores)) {
      const avg = data.confidence / data.count;
      if (avg > bestConfidence) {
        bestConfidence = avg;
        bestIntent = intent;
      }
    }
    const entities = examples
      .filter((ex) => ex.intent === bestIntent)
      .flatMap((ex) => ex.entities)
      .map((e) => ({ entity: e.entity, value: e.value }))
      .filter((e, i, arr) => arr.findIndex((x) => x.entity === e.entity && x.value === e.value) === i);
    return {
      intent: bestIntent,
      confidence: Math.round(bestConfidence * 100) / 100,
      entities,
      allScores: Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, Math.round((v.confidence / v.count) * 100) / 100]),
      ),
    };
  }

  async getIntentTrainingData(
    tenantId: string,
    params: { page?: number; limit?: number; intent?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.intent) where.intent = params.intent;
    const [data, total] = await Promise.all([
      prisma.aiIntentTrainingExample.findMany({
        where,
        skip,
        take: limit,
        include: { entities: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiIntentTrainingExample.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createIntentTrainingData(tenantId: string, dto: CreateIntentTrainingDataInput) {
    const { entities, ...rest } = dto;
    return prisma.aiIntentTrainingExample.create({
      data: {
        tenantId,
        ...rest,
        entities: entities
          ? { create: entities.map((e) => ({ tenantId, ...e })) }
          : undefined,
      },
      include: { entities: true },
    });
  }

  async updateIntentTrainingData(
    tenantId: string,
    id: string,
    dto: UpdateIntentTrainingDataInput,
  ) {
    const existing = await prisma.aiIntentTrainingExample.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Training example not found");
    const { entities, ...rest } = dto;
    if (entities) {
      await prisma.aiNluEntity.deleteMany({ where: { trainingExampleId: id } });
    }
    return prisma.aiIntentTrainingExample.update({
      where: { id },
      data: {
        ...rest,
        entities: entities
          ? { create: entities.map((e) => ({ tenantId, ...e })) }
          : undefined,
      },
      include: { entities: true },
    });
  }

  async deleteIntentTrainingData(tenantId: string, id: string) {
    const existing = await prisma.aiIntentTrainingExample.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Training example not found");
    return prisma.aiIntentTrainingExample.delete({ where: { id } });
  }

  async searchConversations(tenantId: string, q: string) {
    if (!q || q.length < 2) throw new BadRequestException("Search query must be at least 2 characters");
    return prisma.aiConversation.findMany({
      where: {
        tenantId,
        messages: {
          some: { content: { contains: q, mode: "insensitive" } },
        },
      },
      include: {
        messages: {
          where: { content: { contains: q, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
  }

  async getNluTrainingData(
    tenantId: string,
    params: { page?: number; limit?: number; intent?: string } = {},
  ) {
    return this.getIntentTrainingData(tenantId, params);
  }

  async createNluTrainingData(tenantId: string, dto: CreateNluTrainingDataInput) {
    return this.createIntentTrainingData(tenantId, dto);
  }

  async updateNluTrainingData(tenantId: string, id: string, dto: UpdateNluTrainingDataInput) {
    return this.updateIntentTrainingData(tenantId, id, dto);
  }

  async deleteNluTrainingData(tenantId: string, id: string) {
    return this.deleteIntentTrainingData(tenantId, id);
  }

  async getModelsWithMetrics(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { modelId: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.aiModel.findMany({
        where,
        skip,
        take: limit,
        include: {
          deployments: true,
          accuracyMetrics: { orderBy: { recordedAt: "desc" }, take: 20 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiModel.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async recordModelAccuracy(tenantId: string, dto: RecordAiModelAccuracyInput) {
    const model = await prisma.aiModel.findFirst({ where: { id: dto.modelId, tenantId } });
    if (!model) throw new NotFoundException("AI model not found");
    return prisma.aiModelAccuracyMetric.create({
      data: {
        tenantId,
        modelId: dto.modelId,
        metric: dto.metric,
        value: dto.value,
        metadata: (dto.metadata as any) || undefined,
        recordedAt: new Date(),
      },
    });
  }

  async getModelAccuracyMetrics(tenantId: string, modelId: string) {
    const model = await prisma.aiModel.findFirst({ where: { id: modelId, tenantId } });
    if (!model) throw new NotFoundException("AI model not found");
    return prisma.aiModelAccuracyMetric.findMany({
      where: { tenantId, modelId },
      orderBy: { recordedAt: "desc" },
    });
  }

  async getPromptsWithVariables(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string; category?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { prompt: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.category) where.category = params.category;
    const [data, total] = await Promise.all([
      prisma.aiPrompt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiPrompt.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createPrompt(tenantId: string, dto: CreateAiPromptInput) {
    return prisma.aiPrompt.create({ data: { tenantId, ...dto } as any });
  }

  async updatePrompt(tenantId: string, id: string, dto: UpdateAiPromptInput) {
    const existing = await prisma.aiPrompt.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Prompt not found");
    return prisma.aiPrompt.update({ where: { id }, data: dto as any });
  }

  async deletePrompt(tenantId: string, id: string) {
    const existing = await prisma.aiPrompt.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Prompt not found");
    return prisma.aiPrompt.delete({ where: { id } });
  }
}
