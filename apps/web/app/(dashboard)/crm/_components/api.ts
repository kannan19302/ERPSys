'use client';

const BASE = '/api/v1';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  const json = await res.json();
  return (json?.data ?? json) as T;
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed`);
  const text = await res.text();
  if (!text) return null as T;
  const json = JSON.parse(text);
  return (json?.data ?? json) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiSend<T>(path, 'POST', body);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiSend<T>(path, 'PUT', body);
}

