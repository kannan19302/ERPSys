import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('ai')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly copilot: AiCopilotService,
  ) {}

  @Get('status')
  getStatus() {
    return { configured: this.aiService.isConfigured() };
  }

  @Post('ask')
  async askData(@Req() req: AuthReq, @Body() body: { question: string }) {
    return this.copilot.askData(req.user.tenantId, body.question);
  }

  @Post('summarize/:entityType/:entityId')
  async summarizeRecord(@Req() req: AuthReq, @Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.copilot.summarizeRecord(req.user.tenantId, entityType, entityId);
  }

  @Post('draft-email')
  async draftEmail(@Req() req: AuthReq, @Body() body: { to: string; regarding: string; tone?: string }) {
    return this.copilot.draftEmail(req.user.tenantId, body);
  }

  @Post('generate-form')
  async generateForm(@Req() req: AuthReq, @Body() body: { prompt: string }) {
    return this.copilot.generateFormFromPrompt(req.user.tenantId, body.prompt);
  }

  @Post('generate-workflow')
  async generateWorkflow(@Req() req: AuthReq, @Body() body: { prompt: string }) {
    return this.copilot.generateWorkflowFromPrompt(req.user.tenantId, body.prompt);
  }

  @Post('process-invoice')
  async processInvoice(@Req() req: AuthReq, @Body() body: { documentText: string }) {
    return this.copilot.processInvoiceDocument(req.user.tenantId, body.documentText);
  }
}
