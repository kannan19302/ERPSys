import { Counter, Histogram } from 'prom-client';
import { metricsRegistry } from '../../common/middleware/metrics.middleware';

/** Per-app extension-gateway metrics, exposed on the existing /metrics endpoint (#3). */
export const extRequestsTotal = new Counter({
  name: 'ext_gateway_requests_total',
  help: 'Extension gateway proxied requests',
  labelNames: ['app', 'status', 'outcome'] as const, // outcome: ok | upstream_error | breaker_open | unavailable
  registers: [metricsRegistry],
});

export const extRequestDuration = new Histogram({
  name: 'ext_gateway_request_duration_seconds',
  help: 'Extension gateway proxy round-trip duration',
  labelNames: ['app'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 15],
  registers: [metricsRegistry],
});

export const extEventsTotal = new Counter({
  name: 'ext_gateway_events_total',
  help: 'Core→service event webhook deliveries',
  labelNames: ['app', 'event', 'outcome'] as const, // outcome: ok | failed
  registers: [metricsRegistry],
});
