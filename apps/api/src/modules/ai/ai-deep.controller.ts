import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import {
  classifyIntentSchema,
  createIntentTrainingDataSchema,
  updateIntentTrainingDataSchema,
  createNluTrainingDataSchema,
  updateNluTrainingDataSchema,
  recordAiModelAccuracySchema,
  createAiPromptSchema,
  updateAiPromptSchema,
  type ClassifyIntentInput,
  type CreateIntentTrainingDataInput,
  type UpdateIntentTrainingDataInput,
  type CreateNluTrainingDataInput,
  type UpdateNluTrainingDataInput,
  type RecordAiModelAccuracyInput,
  type CreateAiPromptInput,
  type UpdateAiPromptInput,
} from '@unerp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { AiDeepService } from './ai-deep.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('ai-deep')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AiDeepController {
  constructor(private readonly svc: AiDeepService) {}

  @ApiOperation({ summary: 'Classify text intent' })
  @Permissions('ai.intent.classify')
  @Post('intent/classify')
  async classifyIntent(@Req() req: AuthReq, @ZodBody(classifyIntentSchema) body: ClassifyIntentInput) {
    return this.svc.classifyIntent(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get intent training data' })
  @Permissions('ai.intent-training.read')
  @Get('intent/training-data')
  async getIntentTrainingData(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getIntentTrainingData(req.user.tenantId, { page, limit, intent: query.intent });
  }

  @ApiOperation({ summary: 'Create intent training example' })
  @Permissions('ai.intent-training.create')
  @Post('intent/training-data')
  async createIntentTrainingData(@Req() req: AuthReq, @ZodBody(createIntentTrainingDataSchema) body: CreateIntentTrainingDataInput) {
    return this.svc.createIntentTrainingData(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update intent training example' })
  @Permissions('ai.intent-training.update')
  @Patch('intent/training-data/:id')
  async updateIntentTrainingData(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateIntentTrainingDataSchema) body: UpdateIntentTrainingDataInput) {
    return this.svc.updateIntentTrainingData(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete intent training example' })
  @Permissions('ai.intent-training.delete')
  @Delete('intent/training-data/:id')
  async deleteIntentTrainingData(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteIntentTrainingData(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Search conversation history' })
  @Permissions('ai.conversation.search')
  @Get('conversations/search')
  async searchConversations(@Req() req: AuthReq, @Query('q') q: string) {
    return this.svc.searchConversations(req.user.tenantId, q);
  }

  @ApiOperation({ summary: 'Get NLU training data' })
  @Permissions('ai.nlu-training.read')
  @Get('nlu/training-data')
  async getNluTrainingData(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getNluTrainingData(req.user.tenantId, { page, limit, intent: query.intent });
  }

  @ApiOperation({ summary: 'Create NLU training example' })
  @Permissions('ai.nlu-training.create')
  @Post('nlu/training-data')
  async createNluTrainingData(@Req() req: AuthReq, @ZodBody(createNluTrainingDataSchema) body: CreateNluTrainingDataInput) {
    return this.svc.createNluTrainingData(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update NLU training example' })
  @Permissions('ai.nlu-training.update')
  @Put('nlu/training-data/:id')
  async updateNluTrainingData(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateNluTrainingDataSchema) body: UpdateNluTrainingDataInput) {
    return this.svc.updateNluTrainingData(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete NLU training example' })
  @Permissions('ai.nlu-training.delete')
  @Delete('nlu/training-data/:id')
  async deleteNluTrainingData(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deleteNluTrainingData(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List models with metrics' })
  @Permissions('ai.model.read')
  @Get('models-deep')
  async getModelsWithMetrics(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getModelsWithMetrics(req.user.tenantId, { page, limit, search: query.search });
  }

  @ApiOperation({ summary: 'Record model accuracy metric' })
  @Permissions('ai.model-accuracy.create')
  @Post('model-accuracy')
  async recordModelAccuracy(@Req() req: AuthReq, @ZodBody(recordAiModelAccuracySchema) body: RecordAiModelAccuracyInput) {
    return this.svc.recordModelAccuracy(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get model accuracy metrics' })
  @Permissions('ai.model-accuracy.read')
  @Get('models/:modelId/accuracy')
  async getModelAccuracyMetrics(@Req() req: AuthReq, @Param('modelId') modelId: string) {
    return this.svc.getModelAccuracyMetrics(req.user.tenantId, modelId);
  }

  @ApiOperation({ summary: 'List prompts with variables' })
  @Permissions('ai.prompt.read')
  @Get('prompts-deep')
  async getPromptsWithVariables(@Req() req: AuthReq, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.svc.getPromptsWithVariables(req.user.tenantId, { page, limit, search: query.search, category: query.category });
  }

  @ApiOperation({ summary: 'Create prompt template' })
  @Permissions('ai.prompt.create')
  @Post('prompts-deep')
  async createPrompt(@Req() req: AuthReq, @ZodBody(createAiPromptSchema) body: CreateAiPromptInput) {
    return this.svc.createPrompt(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update prompt template' })
  @Permissions('ai.prompt.update')
  @Patch('prompts-deep/:id')
  async updatePrompt(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(updateAiPromptSchema) body: UpdateAiPromptInput) {
    return this.svc.updatePrompt(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete prompt template' })
  @Permissions('ai.prompt.delete')
  @Delete('prompts-deep/:id')
  async deletePrompt(@Req() req: AuthReq, @Param('id') id: string) {
    return this.svc.deletePrompt(req.user.tenantId, id);
  }
}
