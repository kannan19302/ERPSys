import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import type {
  CreateAiModelInput,
  UpdateAiModelInput,
  CreateAiDeploymentInput,
  CreateAiPromptInput,
  UpdateAiPromptInput,
  CreateAiConversationInput,
  SendAiMessageInput,
  CreateAiDocumentInput,
  CreateAiAgentInput,
  UpdateAiAgentInput,
  CreateAiTrainingJobInput,
} from '@unerp/shared';

@Injectable()
export class AiExpansionService {
  // ── Models ──

  async getModels(tenantId: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { modelId: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.aiModel.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.aiModel.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getModel(tenantId: string, id: string) {
    const model = await prisma.aiModel.findFirst({ where: { id, tenantId } });
    if (!model) throw new NotFoundException('AI model not found');
    return model;
  }

  async createModel(tenantId: string, dto: CreateAiModelInput) {
    return prisma.aiModel.create({ data: { tenantId, ...dto } });
  }

  async updateModel(tenantId: string, id: string, dto: UpdateAiModelInput) {
    const existing = await prisma.aiModel.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('AI model not found');
    return prisma.aiModel.update({ where: { id }, data: dto });
  }

  async deleteModel(tenantId: string, id: string) {
    const existing = await prisma.aiModel.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('AI model not found');
    return prisma.aiModel.delete({ where: { id } });
  }

  // ── Deployments ──

  async getDeployments(tenantId: string, modelId: string) {
    return prisma.aiModelDeployment.findMany({ where: { tenantId, modelId }, orderBy: { createdAt: 'desc' } });
  }

  async createDeployment(tenantId: string, modelId: string, dto: CreateAiDeploymentInput) {
    const model = await prisma.aiModel.findFirst({ where: { id: modelId, tenantId } });
    if (!model) throw new NotFoundException('AI model not found');
    return prisma.aiModelDeployment.create({ data: { tenantId, modelId, ...dto } });
  }

  // ── Prompts ──

  async getPrompts(tenantId: string, params: { page?: number; limit?: number; search?: string; category?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { prompt: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.category) where.category = params.category;
    const [data, total] = await Promise.all([
      prisma.aiPrompt.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.aiPrompt.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createPrompt(tenantId: string, dto: CreateAiPromptInput) {
    return prisma.aiPrompt.create({ data: { tenantId, ...dto } });
  }

  async updatePrompt(tenantId: string, id: string, dto: UpdateAiPromptInput) {
    const existing = await prisma.aiPrompt.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Prompt not found');
    return prisma.aiPrompt.update({ where: { id }, data: dto });
  }

  async deletePrompt(tenantId: string, id: string) {
    const existing = await prisma.aiPrompt.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Prompt not found');
    return prisma.aiPrompt.delete({ where: { id } });
  }

  // ── Conversations ──

  async getConversations(tenantId: string, userId: string) {
    return prisma.aiConversation.findMany({ where: { tenantId, userId }, orderBy: { updatedAt: 'desc' }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } } });
  }

  async createConversation(tenantId: string, userId: string, dto: CreateAiConversationInput) {
    return prisma.aiConversation.create({ data: { tenantId, userId, ...dto } });
  }

  async sendMessage(tenantId: string, conversationId: string, userId: string, dto: SendAiMessageInput) {
    const conv = await prisma.aiConversation.findFirst({ where: { id: conversationId, tenantId, userId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return prisma.aiConversationMessage.create({ data: { tenantId, conversationId, role: 'user', content: dto.content, metadata: dto.metadata } });
  }

  async deleteConversation(tenantId: string, id: string) {
    const existing = await prisma.aiConversation.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Conversation not found');
    return prisma.aiConversation.delete({ where: { id } });
  }

  // ── Documents ──

  async getDocuments(tenantId: string, params: { page?: number; limit?: number } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where = { tenantId };
    const [data, total] = await Promise.all([
      prisma.aiDocument.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.aiDocument.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createDocument(tenantId: string, dto: CreateAiDocumentInput) {
    return prisma.aiDocument.create({ data: { tenantId, ...dto } });
  }

  async deleteDocument(tenantId: string, id: string) {
    const existing = await prisma.aiDocument.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Document not found');
    return prisma.aiDocument.delete({ where: { id } });
  }

  // ── Agents ──

  async getAgents(tenantId: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.aiAgent.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { tools: true } }),
      prisma.aiAgent.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createAgent(tenantId: string, dto: CreateAiAgentInput) {
    return prisma.aiAgent.create({ data: { tenantId, ...dto } });
  }

  async updateAgent(tenantId: string, id: string, dto: UpdateAiAgentInput) {
    const existing = await prisma.aiAgent.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Agent not found');
    return prisma.aiAgent.update({ where: { id }, data: dto });
  }

  async deleteAgent(tenantId: string, id: string) {
    const existing = await prisma.aiAgent.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Agent not found');
    return prisma.aiAgent.delete({ where: { id } });
  }

  // ── Training Jobs ──

  async getTrainingJobs(tenantId: string) {
    return prisma.aiTrainingJob.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, include: { runs: true } });
  }

  async createTrainingJob(tenantId: string, dto: CreateAiTrainingJobInput) {
    return prisma.aiTrainingJob.create({ data: { tenantId, ...dto } });
  }

  async deleteTrainingJob(tenantId: string, id: string) {
    const existing = await prisma.aiTrainingJob.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Training job not found');
    return prisma.aiTrainingJob.delete({ where: { id } });
  }
}
