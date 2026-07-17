import { Controller, Get, Post, Param, UseGuards, UseInterceptors, Req, ServiceUnavailableException } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';
import { AiAgentService } from './ai-agent.service';
import { AiConfigService } from './ai-config.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly copilot: AiCopilotService,
    private readonly agent: AiAgentService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  /**
   * Throws a 503 if the tenant admin has disabled the AI assistant via the
   * kill switch (`admin/ai/config`). Called at the top of every AI-invoking
   * handler in this controller — `status` is exempt since it's just a
   * read of configuration state (the frontend needs it to decide whether
   * to render the floating widget at all, even when AI is disabled).
   */
  private async assertAiEnabled(tenantId: string): Promise<void> {
    const enabled = await this.aiConfigService.isEnabled(tenantId);
    if (!enabled) {
      throw new ServiceUnavailableException('AI is disabled by your administrator.');
    }
  }

  @ApiOperation({ summary: 'Handle request' })
  @Permissions('ai.read')
  @Get('status')
  async getStatus(@Req() req: AuthReq) {
    const enabled = await this.aiConfigService.isEnabled(req.user.tenantId);
    return { configured: this.aiService.isConfigured(), enabled };
  }

  @ApiOperation({ summary: 'Ask data' })
  @Permissions('ai.create')
  @Post('ask')
  async askData(@Req() req: AuthReq, @ZodBody(z.any()) body: { question: string }) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.copilot.askData(req.user.tenantId, body.question);
  }

  @ApiOperation({ summary: 'Summarize record' })
  @Permissions('ai.create')
  @Post('summarize/:entityType/:entityId')
  async summarizeRecord(@Req() req: AuthReq, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.copilot.summarizeRecord(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Draft email' })
  @Permissions('ai.create')
  @Post('draft-email')
  async draftEmail(@Req() req: AuthReq, @ZodBody(z.any()) body: { to: string; regarding: string; tone?: string }) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.copilot.draftEmail(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Generate form' })
  @Permissions('ai.create')
  @Post('generate-form')
  async generateForm(@Req() req: AuthReq, @ZodBody(z.any()) body: { prompt: string }) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.copilot.generateFormFromPrompt(req.user.tenantId, body.prompt);
  }

  @ApiOperation({ summary: 'Generate workflow' })
  @Permissions('ai.create')
  @Post('generate-workflow')
  async generateWorkflow(@Req() req: AuthReq, @ZodBody(z.any()) body: { prompt: string }) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.copilot.generateWorkflowFromPrompt(req.user.tenantId, body.prompt);
  }

  @ApiOperation({ summary: 'Process invoice' })
  @Permissions('ai.create')
  @Post('process-invoice')
  async processInvoice(@Req() req: AuthReq, @ZodBody(z.any()) body: { documentText: string; createDraft?: boolean }) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.copilot.processInvoiceDocument(req.user.tenantId, body.documentText, body.createDraft ?? false);
  }

  @ApiOperation({ summary: 'Converse with the AI copilot agent (tool-use loop)' })
  @Permissions('ai.create')
  @Post('converse')
  async converse(
    @Req() req: AuthReq,
    @ZodBody(z.any()) body: { messages: Array<{ role: 'user' | 'assistant'; content: string }>; context?: { path?: string; module?: string } },
  ) {
    await this.assertAiEnabled(req.user.tenantId);
    return this.agent.converse(req.user.tenantId, req.user.userId, body.messages, body.context);
  }
}
