import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import {
  createAiModelSchema,
  updateAiModelSchema,
  createAiDeploymentSchema,
  createAiPromptSchema,
  updateAiPromptSchema,
  createAiConversationSchema,
  sendAiMessageSchema,
  createAiDocumentSchema,
  createAiAgentSchema,
  updateAiAgentSchema,
  createAiTrainingJobSchema,
  type CreateAiModelInput,
  type UpdateAiModelInput,
  type CreateAiDeploymentInput,
  type CreateAiPromptInput,
  type UpdateAiPromptInput,
  type CreateAiConversationInput,
  type SendAiMessageInput,
  type CreateAiDocumentInput,
  type CreateAiAgentInput,
  type UpdateAiAgentInput,
  type CreateAiTrainingJobInput,
} from '@unerp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { AiExpansionService } from './ai-expansion.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('ai-expansion')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AiExpansionController {
  constructor(private readonly svc: AiExpansionService) {}

  // ── Models ──

  @ApiOperation({ summary: 'List AI models' })
  @Permissions('ai.model.read')
  @Get('models')
  async getModels(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getModels(req.user.tenantId, { page, limit, search: query.search });
  }

  @ApiOperation({ summary: 'Get AI model' })
  @Permissions('ai.model.read')
  @Get('models/:id')
  async getModel(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.getModel(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create AI model' })
  @Permissions('ai.model.create')
  @Post('models')
  async createModel(@Req() req: AuthReq, @ZodBody(createAiModelSchema) body: CreateAiModelInput) {
    return this.svc.createModel(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update AI model' })
  @Permissions('ai.model.update')
  @Patch('models/:id')
  async updateModel(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateAiModelSchema) body: UpdateAiModelInput) {
    return this.svc.updateModel(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete AI model' })
  @Permissions('ai.model.delete')
  @Delete('models/:id')
  async deleteModel(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteModel(req.user.tenantId, id);
  }

  // ── Deployments ──

  @ApiOperation({ summary: 'List deployments' })
  @Permissions('ai.deployment.read')
  @Get('models/:modelId/deployments')
  async getDeployments(@Req() req: AuthReq, @Param('modelId') modelId: string) {
    return this.svc.getDeployments(req.user.tenantId, modelId);
  }

  @ApiOperation({ summary: 'Create deployment' })
  @Permissions('ai.deployment.create')
  @Post('models/:modelId/deployments')
  async createDeployment(@Req() req: AuthReq, @Param('modelId') modelId: string, @ZodBody(createAiDeploymentSchema) body: CreateAiDeploymentInput) {
    return this.svc.createDeployment(req.user.tenantId, modelId, body);
  }

  // ── Prompts ──

  @ApiOperation({ summary: 'List prompts' })
  @Permissions('ai.prompt.read')
  @Get('prompts')
  async getPrompts(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getPrompts(req.user.tenantId, { page, limit, search: query.search, category: query.category });
  }

  @ApiOperation({ summary: 'Create prompt' })
  @Permissions('ai.prompt.create')
  @Post('prompts')
  async createPrompt(@Req() req: AuthReq, @ZodBody(createAiPromptSchema) body: CreateAiPromptInput) {
    return this.svc.createPrompt(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update prompt' })
  @Permissions('ai.prompt.update')
  @Patch('prompts/:id')
  async updatePrompt(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateAiPromptSchema) body: UpdateAiPromptInput) {
    return this.svc.updatePrompt(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete prompt' })
  @Permissions('ai.prompt.delete')
  @Delete('prompts/:id')
  async deletePrompt(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deletePrompt(req.user.tenantId, id);
  }

  // ── Conversations ──

  @ApiOperation({ summary: 'List conversations' })
  @Permissions('ai.conversation.read')
  @Get('conversations')
  async getConversations(@Req() req: AuthReq) {
    return this.svc.getConversations(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Create conversation' })
  @Permissions('ai.conversation.create')
  @Post('conversations')
  async createConversation(@Req() req: AuthReq, @ZodBody(createAiConversationSchema) body: CreateAiConversationInput) {
    return this.svc.createConversation(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Send message' })
  @Permissions('ai.conversation.create')
  @Post('conversations/:id/messages')
  async sendMessage(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(sendAiMessageSchema) body: SendAiMessageInput) {
    return this.svc.sendMessage(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Delete conversation' })
  @Permissions('ai.conversation.delete')
  @Delete('conversations/:id')
  async deleteConversation(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteConversation(req.user.tenantId, id);
  }

  // ── Documents ──

  @ApiOperation({ summary: 'List AI documents' })
  @Permissions('ai.document.read')
  @Get('documents')
  async getDocuments(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getDocuments(req.user.tenantId, { page, limit });
  }

  @ApiOperation({ summary: 'Create AI document' })
  @Permissions('ai.document.create')
  @Post('documents')
  async createDocument(@Req() req: AuthReq, @ZodBody(createAiDocumentSchema) body: CreateAiDocumentInput) {
    return this.svc.createDocument(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Delete AI document' })
  @Permissions('ai.document.delete')
  @Delete('documents/:id')
  async deleteDocument(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteDocument(req.user.tenantId, id);
  }

  // ── Agents ──

  @ApiOperation({ summary: 'List AI agents' })
  @Permissions('ai.agent.read')
  @Get('agents')
  async getAgents(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getAgents(req.user.tenantId, { page, limit, search: query.search });
  }

  @ApiOperation({ summary: 'Create AI agent' })
  @Permissions('ai.agent.create')
  @Post('agents')
  async createAgent(@Req() req: AuthReq, @ZodBody(createAiAgentSchema) body: CreateAiAgentInput) {
    return this.svc.createAgent(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update AI agent' })
  @Permissions('ai.agent.update')
  @Patch('agents/:id')
  async updateAgent(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateAiAgentSchema) body: UpdateAiAgentInput) {
    return this.svc.updateAgent(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete AI agent' })
  @Permissions('ai.agent.delete')
  @Delete('agents/:id')
  async deleteAgent(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteAgent(req.user.tenantId, id);
  }

  // ── Training Jobs ──

  @ApiOperation({ summary: 'List training jobs' })
  @Permissions('ai.training-job.read')
  @Get('training-jobs')
  async getTrainingJobs(@Req() req: AuthReq) {
    return this.svc.getTrainingJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create training job' })
  @Permissions('ai.training-job.create')
  @Post('training-jobs')
  async createTrainingJob(@Req() req: AuthReq, @ZodBody(createAiTrainingJobSchema) body: CreateAiTrainingJobInput) {
    return this.svc.createTrainingJob(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Delete training job' })
  @Permissions('ai.training-job.delete')
  @Delete('training-jobs/:id')
  async deleteTrainingJob(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteTrainingJob(req.user.tenantId, id);
  }
}
