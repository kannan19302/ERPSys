import { Controller, Get, Post, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';
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
  ) {}

  @ApiOperation({ summary: 'Handle request' })
  @Permissions('ai.read')
  @Get('status')
  getStatus() {
    return { configured: this.aiService.isConfigured() };
  }

  @ApiOperation({ summary: 'Ask data' })
  @Permissions('ai.create')
  @Post('ask')
  async askData(@Req() req: AuthReq, @ZodBody(z.any()) body: { question: string }) {
    return this.copilot.askData(req.user.tenantId, body.question);
  }

  @ApiOperation({ summary: 'Summarize record' })
  @Permissions('ai.create')
  @Post('summarize/:entityType/:entityId')
  async summarizeRecord(@Req() req: AuthReq, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.copilot.summarizeRecord(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Draft email' })
  @Permissions('ai.create')
  @Post('draft-email')
  async draftEmail(@Req() req: AuthReq, @ZodBody(z.any()) body: { to: string; regarding: string; tone?: string }) {
    return this.copilot.draftEmail(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Generate form' })
  @Permissions('ai.create')
  @Post('generate-form')
  async generateForm(@Req() req: AuthReq, @ZodBody(z.any()) body: { prompt: string }) {
    return this.copilot.generateFormFromPrompt(req.user.tenantId, body.prompt);
  }

  @ApiOperation({ summary: 'Generate workflow' })
  @Permissions('ai.create')
  @Post('generate-workflow')
  async generateWorkflow(@Req() req: AuthReq, @ZodBody(z.any()) body: { prompt: string }) {
    return this.copilot.generateWorkflowFromPrompt(req.user.tenantId, body.prompt);
  }

  @ApiOperation({ summary: 'Process invoice' })
  @Permissions('ai.create')
  @Post('process-invoice')
  async processInvoice(@Req() req: AuthReq, @ZodBody(z.any()) body: { documentText: string }) {
    return this.copilot.processInvoiceDocument(req.user.tenantId, body.documentText);
  }
}
