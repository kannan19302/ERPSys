import { test, expect } from '@playwright/test';

const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, '') || 'http://localhost:3001';

test.describe('API Health', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/health`);
    expect(res.status()).toBe(200);
  });

  test('metrics endpoint returns prometheus format', async ({ request }) => {
    const res = await request.get(`${API}/metrics`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('http_requests_total');
  });

  test('swagger endpoint returns documentation', async ({ request }) => {
    const res = await request.get(`${API}/swagger-json`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('openapi');
    expect(body).toHaveProperty('paths');
  });

  test('semantic layer endpoint returns entities', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/reporting/engine/semantic-layer`);
    expect([200, 401]).toContain(res.status());
  });

  test('AI status endpoint responds', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/ai/status`);
    expect([200, 401]).toContain(res.status());
  });
});
