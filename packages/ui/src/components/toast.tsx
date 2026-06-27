'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms; 0 = sticky
}

interface ToastItem extends Required<Pick<ToastOptions, 'variant'>> {
  id: string;
  title?: string;
  description?: string;
  duration: number;
  leaving?: boolean;
}

interface ToastApi {
  toast: (opts: ToastOptions) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_META: Record<ToastVariant, { color: string; bg: string; Icon: typeof Info }> = {
  success: { color: 'var(--color-success)', bg: 'var(--color-success-light)', Icon: CheckCircle2 },
  error: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', Icon: XCircle },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', Icon: AlertCircle },
  info: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)', Icon: Info },
};

/**
 * App-wide toast provider — gives every action immediate, visible feedback
 * (Nielsen #1: visibility of system status). Wrap the app once near the root.
 */
export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200);
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  }, []);

  const push = useCallback((opts: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    const item: ToastItem = {
      id, title: opts.title, description: opts.description,
      variant: opts.variant ?? 'info', duration: opts.duration ?? 4000,
    };
    setToasts((prev) => [...prev, item]);
    if (item.duration > 0) timers.current[id] = setTimeout(() => dismiss(id), item.duration);
    return id;
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    toast: push,
    success: (title, description) => push({ title, description, variant: 'success' }),
    error: (title, description) => push({ title, description, variant: 'error', duration: 6000 }),
    warning: (title, description) => push({ title, description, variant: 'warning' }),
    info: (title, description) => push({ title, description, variant: 'info' }),
    dismiss,
  }), [push, dismiss]);

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        style={{ position: 'fixed', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: 'min(92vw, 400px)', pointerEvents: 'none' }}
      >
        {toasts.map((t) => {
          const meta = VARIANT_META[t.variant];
          const { Icon } = meta;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              style={{
                pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)', borderLeft: `3px solid ${meta.color}`,
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                animation: `${t.leaving ? 'toastSlideOut' : 'toastSlideIn'} 200ms var(--ease-out) forwards`,
              }}
            >
              <Icon size={18} style={{ color: meta.color, flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{t.title}</div>}
                {t.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: t.title ? 2 : 0 }}>{t.description}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0, flexShrink: 0 }}>
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/** Access the toast API. Falls back to console if no provider is mounted (never throws). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  const noop = (_o: ToastOptions) => '';
  return {
    toast: noop,
    success: (title, description) => noop({ title, description }),
    error: (title, description) => noop({ title, description }),
    warning: (title, description) => noop({ title, description }),
    info: (title, description) => noop({ title, description }),
    dismiss: () => {},
  };
}
