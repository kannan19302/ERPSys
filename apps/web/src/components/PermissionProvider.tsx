'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PermissionContext } from '@unerp/ui';
import { apiGet } from '@/lib/api';

interface MeResponse {
  permissions?: string[];
}

/**
 * App-wide permission provider.
 *
 * Feeds `PermissionContext` (defined in `@unerp/ui`'s protected-component.tsx)
 * with the logged-in user's effective permissions, so `usePermission()` /
 * `<ProtectedComponent>` reflect real RBAC instead of always resolving to
 * `false` (the context's default value is `permissions: []`).
 *
 * Source of truth:
 *  - Immediately hydrates from the `user` object already stored in
 *    localStorage by the login flow (`/auth/login`, `/auth/login-demo`,
 *    SSO callback, passkey login) — that payload already includes
 *    `permissions: string[]` computed server-side from the user's roles.
 *  - Refreshes from `/auth/me` in the background, which recomputes
 *    permissions from the DB (same logic as `RbacGuard`), so role changes
 *    made elsewhere are picked up without a re-login.
 *
 * Deliberately generic — no module-specific logic lives here.
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return [];
      const parsed = JSON.parse(stored) as { permissions?: string[] };
      return Array.isArray(parsed.permissions) ? parsed.permissions : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;

    apiGet<MeResponse>('/auth/me')
      .then((me) => {
        if (mounted && Array.isArray(me.permissions)) {
          setPermissions(me.permissions);
        }
      })
      .catch(() => {
        // Not authenticated / request failed — keep whatever was hydrated
        // from localStorage (or the empty default). Layout-level auth
        // redirects handle the unauthenticated case.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ permissions, resolvedAccess: null }),
    [permissions],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
