'use client';

import { FrameworkProvider } from '@unerp/framework';
import type { ReactNode } from 'react';
import { inventoryModule } from '@/modules/inventory';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

function getTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user) as { tenantId?: string };
      if (parsed.tenantId) return parsed.tenantId;
    }
  } catch {
    // corrupt localStorage — treat as no tenant
  }
  return null;
}

/** Registered framework modules; add each module here as it's migrated. */
const modules = [inventoryModule];

export function AppFrameworkProvider({ children }: { children: ReactNode }) {
  return (
    <FrameworkProvider
      api={{
        baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
        getToken: () => (typeof window === 'undefined' ? null : localStorage.getItem('token')),
        getCsrfToken: () => readCookie('csrf_token'),
        getTenantId,
      }}
      modules={modules}
    >
      {children}
    </FrameworkProvider>
  );
}
