import { Controller, Get, Post, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { z } from 'zod';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiConfigService } from './ai-config.service';
import { OllamaProcessService } from './ollama-process.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const setConfigSchema = z.object({ enabled: z.boolean() });

/**
 * Dedicated AI admin console surface. Distinct from `AiController` (`/ai/*`,
 * used by any user with `ai.*` to actually use the assistant) — every route
 * here requires the admin-only `ai.admin.manage` permission, including reads,
 * since this is configuration/control, not day-to-day usage.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AiAdminController {
  constructor(
    private readonly aiConfigService: AiConfigService,
    private readonly ollamaProcessService: OllamaProcessService,
  ) {}

  @ApiOperation({ summary: 'Get AI assistant configuration (kill switch + read-only model info)' })
  @Permissions('ai.admin.manage')
  @Get('config')
  async getConfig(@Req() req: AuthenticatedRequest) {
    return this.aiConfigService.getConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Enable/disable the AI assistant for this tenant' })
  @Permissions('ai.admin.manage')
  @Post('config')
  async setConfig(@Req() req: AuthenticatedRequest, @ZodBody(setConfigSchema) body: { enabled: boolean }) {
    return this.aiConfigService.setEnabled(req.user.tenantId, body.enabled);
  }

  // Relocated from OperationsController (`admin/operations/ai-engine/*`) — see
  // that controller's history for the same "same host as Ollama" caveat.
  @ApiOperation({ summary: 'Get local Ollama (AI engine) live status' })
  @Permissions('ai.admin.manage')
  @Get('engine/status')
  async getEngineStatus() {
    return this.ollamaProcessService.getStatus();
  }

  @ApiOperation({ summary: 'Start the local Ollama (AI engine) process' })
  @Permissions('ai.admin.manage')
  @Post('engine/start')
  async startEngine() {
    return this.ollamaProcessService.start();
  }

  @ApiOperation({ summary: 'Stop the local Ollama (AI engine) process' })
  @Permissions('ai.admin.manage')
  @Post('engine/stop')
  async stopEngine() {
    return this.ollamaProcessService.stop();
  }
}
