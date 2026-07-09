import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { signWebhook, WEBHOOK_SIGNATURE_HEADER, WEBHOOK_TIMESTAMP_HEADER, REQUEST_ID_HEADER } from '@unerp/service-kit';
import { ServiceRegistryService } from './service-registry.service';
import { secretForApp } from './ext-secret.util';
import { extEventsTotal } from './ext-metrics';

/** Core domain events forwarded to extension services as signed webhooks (#6). */
@Injectable()
export class ExtEventDispatcherService implements OnModuleInit {
  private readonly logger = new Logger('ExtEventDispatcher');

  constructor(
    private readonly registry: ServiceRegistryService,
    private readonly emitter: EventEmitter2,
  ) {}

  onModuleInit() {
    // Forward any tenant-scoped domain event (payload carries tenantId) to
    // subscribed services. Best-effort: services opt in via manifest events.
    this.emitter.onAny((event: string | string[], payload: any) => {
      const name = Array.isArray(event) ? event.join('.') : String(event);
      const tenantId = payload?.tenantId || payload?.tenant?.id;
      if (!tenantId || name.startsWith('__')) return;
      void this.dispatch(tenantId, name, payload);
    });
  }

  private matches(pattern: string, event: string): boolean {
    if (pattern === event) return true;
    if (pattern.endsWith('.*')) return event.startsWith(pattern.slice(0, -1));
    if (pattern === '*') return true;
    return false;
  }

  /** Deliver an event to every installed service subscribed to it for this tenant. */
  async dispatch(tenantId: string, event: string, payload: any): Promise<void> {
    let services;
    try {
      services = await this.registry.listServiceApps(tenantId);
    } catch {
      return;
    }
    const rawBody = JSON.stringify({ event, tenantId, occurredAt: new Date().toISOString(), payload });
    const ts = Math.floor(Date.now() / 1000);

    for (const svc of services) {
      const subs = (svc.events || []).filter((s) => this.matches(s.event, event));
      for (const sub of subs) {
        const url = `${svc.baseUrl}${sub.deliverTo.startsWith('/') ? sub.deliverTo : `/${sub.deliverTo}`}`;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), svc.timeoutMs);
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              [WEBHOOK_SIGNATURE_HEADER]: signWebhook(rawBody, secretForApp(svc.appSlug), ts),
              [WEBHOOK_TIMESTAMP_HEADER]: String(ts),
              [REQUEST_ID_HEADER]: `evt-${ts}-${Math.random().toString(36).slice(2, 8)}`,
            },
            body: rawBody,
            signal: controller.signal,
          });
          clearTimeout(timer);
          extEventsTotal.inc({ app: svc.appSlug, event, outcome: res.ok ? 'ok' : 'failed' });
        } catch {
          extEventsTotal.inc({ app: svc.appSlug, event, outcome: 'failed' });
          this.logger.warn(`Event "${event}" delivery to ${svc.appSlug} (${url}) failed`);
        }
      }
    }
  }
}
