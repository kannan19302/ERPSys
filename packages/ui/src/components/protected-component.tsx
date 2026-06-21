'use client';

import { type FC, type ReactNode, createContext, useContext } from 'react';

export type FieldAccessLevel = 'hidden' | 'readonly' | 'editable';

export interface ResolvedAccess {
  endpoints: string[];
  pages: string[];
  components: string[];
  fields: Record<string, Record<string, FieldAccessLevel>>;
  recordFilters: Record<string, Record<string, unknown>>;
}

interface PermissionContextValue {
  permissions: string[];
  resolvedAccess: ResolvedAccess | null;
}

export const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  resolvedAccess: null,
});

export const usePermission = (code: string): boolean => {
  const { permissions } = useContext(PermissionContext);
  return permissions.some((p) => {
    if (p === code) return true;
    if (p === '*') return true;
    if (p.endsWith('.*') && code.startsWith(p.slice(0, -2))) return true;
    return false;
  });
};

export const useFieldAccess = (entity: string, field: string): FieldAccessLevel => {
  const { resolvedAccess } = useContext(PermissionContext);
  if (!resolvedAccess) return 'editable';
  return resolvedAccess.fields?.[entity]?.[field] || 'editable';
};

export interface ProtectedComponentProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const ProtectedComponent: FC<ProtectedComponentProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const hasAccess = usePermission(permission);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export interface ProtectedFieldProps {
  entity: string;
  field: string;
  children: ReactNode;
}

export const ProtectedField: FC<ProtectedFieldProps> = ({
  entity,
  field,
  children,
}) => {
  const access = useFieldAccess(entity, field);
  if (access === 'hidden') return null;
  if (access === 'readonly') {
    return <div style={{ pointerEvents: 'none', opacity: 0.7 }}>{children}</div>;
  }
  return <>{children}</>;
};
