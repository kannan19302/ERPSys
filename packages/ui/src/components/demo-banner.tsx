'use client';

import { type FC, useState } from 'react';

export interface DemoBannerProps {
  currentModule?: string;
  apiBase?: string;
  onRemoved?: () => void;
}

export const DemoBanner: FC<DemoBannerProps> = ({
  currentModule,
  apiBase = '/api/v1',
  onRemoved,
}) => {
  const [removing, setRemoving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleRemove = async (module?: string) => {
    if (!confirm(module
      ? `Remove demo data from ${module}? This cannot be undone.`
      : 'Remove ALL demo data from the entire ERP? This cannot be undone.'
    )) return;

    setRemoving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const url = module
        ? `${apiBase}/admin/demo/remove/${module}`
        : `${apiBase}/admin/demo/remove`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setDismissed(true);
        onRemoved?.();
      }
    } catch {
      // silently fail
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-2) var(--space-4)',
      background: 'var(--color-warning-bg, #fef3c7)',
      borderBottom: '1px solid var(--color-warning-border, #fcd34d)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-warning-text, #92400e)',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontWeight: 500 }}>
        Using demo data
      </span>

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button
          onClick={() => handleRemove()}
          disabled={removing}
          style={{
            padding: '2px var(--space-3)',
            fontSize: 'var(--text-xs)',
            background: 'var(--color-warning-text, #92400e)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: removing ? 'not-allowed' : 'pointer',
            opacity: removing ? 0.6 : 1,
          }}
        >
          Remove all demo data
        </button>

        {currentModule && (
          <button
            onClick={() => handleRemove(currentModule)}
            disabled={removing}
            style={{
              padding: '2px var(--space-3)',
              fontSize: 'var(--text-xs)',
              background: 'transparent',
              color: 'var(--color-warning-text, #92400e)',
              border: '1px solid var(--color-warning-text, #92400e)',
              borderRadius: 'var(--radius-sm)',
              cursor: removing ? 'not-allowed' : 'pointer',
              opacity: removing ? 0.6 : 1,
            }}
          >
            Remove from this app
          </button>
        )}
      </div>
    </div>
  );
};
