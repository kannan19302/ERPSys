import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { AiService } from './ai.service';

export interface AiConfig {
  enabled: boolean;
  model: string;
  baseUrl: string;
}

const SETTING_KEY = 'ai.config';

/**
 * Tenant-scoped AI kill switch and (read-only, for now) engine display info.
 * Follows the same generic-Setting JSON-blob pattern as
 * PlatformService's feature flags (`platform.feature-flags`) — no new
 * migration, one row per tenant under `Setting.key = 'ai.config'`.
 *
 * Only `enabled` is stored/editable in this pass. `model` and `baseUrl` are
 * always sourced live from AiService (env-configured), never persisted —
 * per-tenant model override is explicitly out of scope.
 */
@Injectable()
export class AiConfigService {
  constructor(private readonly aiService: AiService) {}

  async getConfig(tenantId: string): Promise<AiConfig> {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: SETTING_KEY } },
    });

    const stored = (setting?.value as Record<string, unknown> | undefined) ?? {};
    const enabled = typeof stored.enabled === 'boolean' ? stored.enabled : true;

    return {
      enabled,
      model: this.aiService.getDefaultModel(),
      baseUrl: this.aiService.getBaseUrl(),
    };
  }

  async setEnabled(tenantId: string, enabled: boolean): Promise<AiConfig> {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: SETTING_KEY } },
    });
    const existing = (setting?.value as Record<string, unknown> | undefined) ?? {};
    const updated = { ...existing, enabled };

    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: SETTING_KEY } },
      update: { value: updated as any, category: 'ai' },
      create: { tenantId, key: SETTING_KEY, value: updated as any, category: 'ai' },
    });

    return this.getConfig(tenantId);
  }

  async isEnabled(tenantId: string): Promise<boolean> {
    const config = await this.getConfig(tenantId);
    return config.enabled;
  }
}
