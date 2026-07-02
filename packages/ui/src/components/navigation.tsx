'use client';

import { useEffect, useId, useState, type FC, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

// ── Tabs ──────────────────────────────────────────────
export interface TabItem { key: string; label: ReactNode; icon?: ReactNode; }
export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
}

/** Underline tabs — chunking related content (Miller's Law) without page reloads. */
export const Tabs: FC<TabsProps> = ({ tabs, value, onChange }) => (
  <div role="tablist" style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)' }}>
    {tabs.map((t) => {
      const active = t.key === value;
      return (
        <button
          key={t.key}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(t.key)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 'var(--text-sm)', fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
            color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: `2px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
            marginBottom: -1, transition: 'color var(--duration-fast) var(--ease-default)',
          }}
        >
          {t.icon}{t.label}
        </button>
      );
    })}
  </div>
);

// ── Tooltip ───────────────────────────────────────────
export interface TooltipProps { content: ReactNode; children: ReactNode; }
/** Lightweight hover/focus tooltip for progressive disclosure of detail. */
export const Tooltip: FC<TooltipProps> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span role="tooltip" style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          padding: '4px 8px', background: 'var(--color-text)', color: 'var(--color-text-inverse)',
          fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', zIndex: 1100,
          boxShadow: 'var(--shadow-md)', pointerEvents: 'none',
        }}>{content}</span>
      )}
    </span>
  );
};

// ── Pagination ────────────────────────────────────────
export interface PaginationProps {
  page: number; // 1-based
  pageCount: number;
  onChange: (page: number) => void;
}
/** Compact pager — keeps result sets digestible and reduces cognitive load. */
export const Pagination: FC<PaginationProps> = ({ page, pageCount, onChange }) => {
  if (pageCount <= 1) return null;
  const btn = (label: ReactNode, target: number, disabled: boolean, active = false) => (
    <button
      key={`${label}-${target}`}
      disabled={disabled}
      aria-current={active || undefined}
      onClick={() => onChange(target)}
      style={{
        minWidth: 32, height: 32, padding: '0 8px', cursor: disabled ? 'default' : 'pointer',
        background: active ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
        color: active ? 'var(--color-primary-text)' : disabled ? 'var(--color-text-tertiary)' : 'var(--color-text)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{label}</button>
  );
  const pages: number[] = [];
  const from = Math.max(1, page - 2), to = Math.min(pageCount, page + 2);
  for (let p = from; p <= to; p++) pages.push(p);
  return (
    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', justifyContent: 'flex-end' }}>
      {btn(<ChevronLeft size={15} />, page - 1, page <= 1)}
      {from > 1 && btn(1, 1, false)}
      {from > 2 && <span style={{ color: 'var(--color-text-tertiary)', padding: '0 4px' }}>…</span>}
      {pages.map((p) => btn(p, p, false, p === page))}
      {to < pageCount - 1 && <span style={{ color: 'var(--color-text-tertiary)', padding: '0 4px' }}>…</span>}
      {to < pageCount && btn(pageCount, pageCount, false)}
      {btn(<ChevronRight size={15} />, page + 1, page >= pageCount)}
    </div>
  );
};

// ── Drawer ────────────────────────────────────────────
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  width?: number;
  children?: ReactNode;
  footer?: ReactNode;
}
/** Right-side slide-over panel for detail/inspection without losing list context. */
export const Drawer: FC<DrawerProps> = ({ open, onClose, title, width = 460, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--color-bg-overlay)', display: 'flex', justifyContent: 'flex-end' }}>
      <div role="dialog" aria-modal="true"
        style={{ width, maxWidth: '100vw', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-xl)', borderLeft: '1px solid var(--color-border)', animation: 'slideInLeft var(--duration-normal) var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>{children}</div>
        {footer && <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>{footer}</div>}
      </div>
    </div>
  );
};

// ── Disclosure ────────────────────────────────────────
export interface DisclosureProps {
  /** Header content — typically a label + count/progress indicator. */
  summary: ReactNode;
  children?: ReactNode;
  /** Uncontrolled initial state. Ignored if `open`/`onToggle` are provided. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
}
/**
 * Minimal collapsible section — a real `<button>` toggle (not a `<div onClick>`)
 * with `aria-expanded`/`aria-controls`, for one extra level of grouping beneath
 * an existing header+list pattern (e.g. category groups inside a module section).
 * Not a full accordion system: no single-open-at-a-time coordination, no
 * animation — kept intentionally small per the Access Control UI spec
 * (.ai/ADMIN_UI_ACCESS_CONTROL_SPEC.md Section 2.4), extend only if a second
 * real caller needs more.
 */
export const Disclosure: FC<DisclosureProps> = ({ summary, children, defaultOpen = false, open: openProp, onToggle }) => {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : openState;
  const panelId = useId();

  const toggle = () => {
    const next = !open;
    if (onToggle) onToggle(next);
    if (openProp === undefined) setOpenState(next);
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          gap: 'var(--space-2)', padding: 0, border: 'none', background: 'none', cursor: 'pointer',
          font: 'inherit', color: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>{summary}</span>
        <ChevronDown size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform var(--duration-fast) var(--ease-default)' }} />
      </button>
      {open && <div id={panelId}>{children}</div>}
    </div>
  );
};
