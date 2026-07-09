import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { TENANT_TOKEN_HEADER, REQUEST_ID_HEADER } from '@unerp/service-kit';
import { ResolvedService } from './service-registry.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { extRequestsTotal, extRequestDuration } from './ext-metrics';

/** Hop-by-hop / core-auth headers never forwarded to extension services. */
const STRIP_HEADERS = new Set([
  'host', 'connection', 'content-length', 'authorization', 'cookie',
  'keep-alive', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'proxy-authorization',
]);

@Injectable()
export class ExtProxyService {
  constructor(private readonly breaker: CircuitBreakerService) {}

  /**
   * Forwards the request to the resolved service and streams the response back.
   * Guarded by a per-app circuit breaker; connection failures surface as a
   * friendly 503 envelope. All outcomes are recorded to /metrics (#3).
   */
  async forward(opts: {
    req: Request;
    res: Response;
    service: ResolvedService;
    path: string; // path on the service (already stripped of /ext/<slug>)
    tenantToken: string;
  }): Promise<void> {
    const { req, res, service, path, tenantToken } = opts;
    const app = service.appSlug;
    const requestId = String(req.headers[REQUEST_ID_HEADER] || `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    // Circuit open → fast-fail without touching the dead service.
    if (this.breaker.isOpen(app)) {
      extRequestsTotal.inc({ app, status: '503', outcome: 'breaker_open' });
      throw new ServiceUnavailableException({
        statusCode: 503, error: 'AppServiceUnavailable',
        message: `The "${app}" app service is temporarily unavailable (circuit open). Try again shortly.`,
        app, requestId,
      });
    }

    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    const url = `${service.baseUrl}${path.startsWith('/') ? path : `/${path}`}${qs}`;

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!STRIP_HEADERS.has(k.toLowerCase()) && typeof v === 'string') headers[k] = v;
    }
    headers[TENANT_TOKEN_HEADER] = tenantToken;
    headers[REQUEST_ID_HEADER] = requestId;

    const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    let body: string | undefined;
    if (hasBody && req.body !== undefined) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      headers['content-type'] = headers['content-type'] || 'application/json';
      delete headers['content-length'];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), service.timeoutMs);
    const endTimer = extRequestDuration.startTimer({ app });
    try {
      const upstream = await fetch(url, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
        redirect: 'manual',
      });
      this.breaker.recordSuccess(app);
      res.status(upstream.status);
      upstream.headers.forEach((v, k) => {
        if (!STRIP_HEADERS.has(k) && k !== 'content-encoding' && k !== 'content-length') res.setHeader(k, v);
      });
      // Stream the body through instead of buffering it whole (handles large
      // payloads / file downloads without holding them in memory).
      if (upstream.body) {
        await new Promise<void>((resolve, reject) => {
          const nodeStream = Readable.fromWeb(upstream.body as any);
          nodeStream.on('error', reject);
          res.on('finish', resolve);
          res.on('error', reject);
          nodeStream.pipe(res);
        });
      } else {
        res.end();
      }
      extRequestsTotal.inc({ app, status: String(upstream.status), outcome: 'ok' });
    } catch (e: any) {
      this.breaker.recordFailure(app);
      const timedOut = e?.name === 'AbortError';
      extRequestsTotal.inc({ app, status: '503', outcome: timedOut ? 'unavailable' : 'upstream_error' });
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'AppServiceUnavailable',
        message: timedOut
          ? `The "${app}" app service timed out after ${service.timeoutMs}ms`
          : `The "${app}" app service is unreachable. It may still be starting — try again shortly.`,
        app,
        requestId,
      });
    } finally {
      clearTimeout(timer);
      endTimer();
    }
  }

  /** Install-time health probe. */
  async healthCheck(service: ResolvedService): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const r = await fetch(`${service.baseUrl}${service.healthcheck}`, { signal: controller.signal });
      clearTimeout(timer);
      return r.ok;
    } catch {
      return false;
    }
  }
}
