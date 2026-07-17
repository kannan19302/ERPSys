'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@unerp/ui-components';

export interface ColumnPickerOption {
  key: string;
  label: ReactNode;
}

export interface ColumnPickerProps {
  options: ColumnPickerOption[];
  /** Keys currently visible */
  visible: string[];
  onChange: (visible: string[]) => void;
  label?: string;
}

/** Dropdown checklist to show/hide table columns. Controlled. */
export function ColumnPicker({ options, visible, onChange, label = 'Columns' }: ColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (key: string) => {
    const next = visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key];
    // Never allow hiding every column
    if (next.length === 0) return;
    onChange(next);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">
        {label}
      </Button>
      {open && (
        <div
          role="menu"
          style={{ position: 'absolute', right: 0, top: 'calc(100% + var(--space-1))', zIndex: 20, minWidth: 200, padding: 'var(--space-2)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}
        >
          {options.map((o) => (
            <label
              key={o.key}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
            >
              <input type="checkbox" checked={visible.includes(o.key)} onChange={() => toggle(o.key)} />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
