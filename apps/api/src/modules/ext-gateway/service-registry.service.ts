import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

export interface ResolvedService {
  appSlug: string;
  baseUrl: string;
  scopes: string[];
  timeoutMs: number;
  healthcheck: string;
  events?: { event: string; deliverTo: string }[];
}

interface CacheEntry {
  value: ResolvedService | null; // null = app not installed / no service
  expires: number;
}

const CACHE_TTL_MS = 15_000;

/**
 * Resolves an app slug to its out-of-process service endpoint for a tenant.
 * Gated on InstalledApp state so uninstall takes effect on the next request —
 * the short TTL cache is also invalidated explicitly on install/uninstall.
 */
@Injectable()
export class ServiceRegistryService {
  private cache = new Map<string, CacheEntry>();

  invalidate(tenantId: string, appSlug: string) {
    this.cache.delete(`${tenantId}:${appSlug}`);
  }

  /** Throws NotFoundException when the app is not installed or has no service. */
  async resolve(tenantId: string, appSlug: string): Promise<ResolvedService> {
    const key = `${tenantId}:${appSlug}`;
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) {
      if (!hit.value) throw new NotFoundException(`App "${appSlug}" is not installed or has no service`);
      return hit.value;
    }

    const installed = await prisma.installedApp.findFirst({
      where: { tenantId, appSlug, status: 'ACTIVE' },
    });
    const serviceConfig = (installed?.serviceConfig ?? null) as any;
    let value: ResolvedService | null = null;
    if (installed && serviceConfig) {
      const baseUrl =
        (serviceConfig.baseUrlEnv && process.env[serviceConfig.baseUrlEnv]) ||
        process.env[`${appSlug.replace(/-/g, '_').toUpperCase()}_SERVICE_URL`] ||
        serviceConfig.defaultBaseUrl;
      if (baseUrl) {
        value = {
          appSlug,
          baseUrl: String(baseUrl).replace(/\/+$/, ''),
          scopes: Array.isArray(serviceConfig.scopes) ? serviceConfig.scopes : [],
          timeoutMs: Number(serviceConfig.timeoutMs) || 15_000,
          healthcheck: serviceConfig.healthcheck || '/svc/health',
          events: Array.isArray(serviceConfig.events) ? serviceConfig.events : [],
        };
      }
    }

    this.cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
    if (!value) throw new NotFoundException(`App "${appSlug}" is not installed or has no service`);
    return value;
  }

  /** Like resolve() but returns null instead of throwing (used by the event dispatcher). */
  async resolveOrNull(tenantId: string, appSlug: string): Promise<ResolvedService | null> {
    try {
      return await this.resolve(tenantId, appSlug);
    } catch {
      return null;
    }
  }

  /** All service-backed apps installed for a tenant (for event fan-out). */
  async listServiceApps(tenantId: string): Promise<ResolvedService[]> {
    const rows = await prisma.installedApp.findMany({
      where: { tenantId, status: 'ACTIVE', NOT: { serviceConfig: { equals: null as any } } },
      select: { appSlug: true },
    });
    const out: ResolvedService[] = [];
    for (const r of rows) {
      if (!r.appSlug) continue;
      const svc = await this.resolveOrNull(tenantId, r.appSlug);
      if (svc) out.push(svc);
    }
    return out;
  }
}
