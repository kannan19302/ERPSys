import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response } from 'express';
import { TENANT_TOKEN_HEADER, REQUEST_ID_HEADER } from '@unerp/service-kit';
import { ResolvedService } from './service-registry.service';

/** Hop-by-hop / core-auth headers never forwarded to extension services. */
const STRIP_HEADERS = new Set([
  'host', 'connection', 'content-length', 'authorization', 'cookie',
  'keep-alive', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'proxy-authorization',
]);

@Injectable()
export class ExtProxyService {
  /**
   * Forwards the request to the resolved service and pipes the response back.
   * Connection failures surface as a friendly 503 envelope instead of a crash.
   */
  async forward(opts: {
    req: Request;
    res: Response;
    service: ResolvedService;
    path: string; // path on the service (already stripped of /ext/<slug>)
    tenantToken: string;
  }): Promise<void> {
    const { req, res, service, path, tenantToken } = opts;
    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    const url = `${service.baseUrl}${path.startsWith('/') ? path : `/${path}`}${qs}`;

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!STRIP_HEADERS.has(k.toLowerCase()) && typeof v === 'string') headers[k] = v;
    }
    headers[TENANT_TOKEN_HEADER] = tenantToken;
    headers[REQUEST_ID_HEADER] = String(req.headers[REQUEST_ID_HEADER] || `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());
    let body: string | undefined;
    if (hasBody && req.body !== undefined) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      headers['content-type'] = headers['content-type'] || 'application/json';
      delete headers['content-length'];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), service.timeoutMs);
    try {
      const upstream = await fetch(url, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
        redirect: 'manual',
      });
      res.status(upstream.status);
      upstream.headers.forEach((v, k) => {
        if (!STRIP_HEADERS.has(k) && k !== 'content-encoding' && k !== 'content-length') res.setHeader(k, v);
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.send(buf);
    } catch (e: any) {
      const timedOut = e?.name === 'AbortError';
      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'AppServiceUnavailable',
        message: timedOut
          ? `The "${service.appSlug}" app service timed out after ${service.timeoutMs}ms`
          : `The "${service.appSlug}" app service is unreachable. It may still be starting — try again shortly.`,
        app: service.appSlug,
        requestId: headers[REQUEST_ID_HEADER],
      });
    } finally {
      clearTimeout(timer);
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
