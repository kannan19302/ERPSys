'use client';

import { useEffect, useId, useState, type FC, type ReactNode, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import styles from './navigation.module.css';

// ── Tabs ──────────────────────────────────────────────
export interface TabItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Short "what does this tab show?" hint, surfaced as a hover tooltip. */
  description?: string;
}
export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
}

const TabButton: FC<{ tab: TabItem; active: boolean; onClick: () => void }> = ({ tab, active, onClick }) => {
  const btnClass = [
    styles.tab_btn,
    active && styles.tab_btn_active,
  ].filter(Boolean).join(' ');

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={btnClass}
      title={tab.description}
    >
      {tab.icon}{tab.label}
    </button>
  );
};

export const Tabs: FC<TabsProps> = ({ tabs, value, onChange }) => (
  <div role="tablist" className={styles.tablist}>
    {tabs.map((t) => (
      <TabButton key={t.key} tab={t} active={t.key === value} onClick={() => onChange(t.key)} />
    ))}
  </div>
);

// ── Tooltip ───────────────────────────────────────────
export interface TooltipProps { content: ReactNode; children: ReactNode; }
export const Tooltip: FC<TooltipProps> = ({ content, children }) => {
  return (
    <span className={styles.tooltip_container}>
      {children}
      <span role="tooltip" className={styles.tooltip_content}>
        {content}
      </span>
    </span>
  );
};

// ── Pagination ────────────────────────────────────────
export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

const PageBtn: FC<{ label: ReactNode; target: number; disabled: boolean; active?: boolean; onClick: (target: number) => void }> = ({ label, target, disabled, active = false, onClick }) => {
  const btnClass = [
    styles.page_btn,
    active && styles.page_btn_active,
  ].filter(Boolean).join(' ');

  return (
    <button
      disabled={disabled}
      aria-current={active || undefined}
      onClick={() => onClick(target)}
      className={btnClass}
    >
      {label}
    </button>
  );
};

export const Pagination: FC<PaginationProps> = ({ page, pageCount, onChange }) => {
  if (pageCount <= 1) return null;
  const pages: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pageCount, page + 2);
  for (let p = from; p <= to; p++) pages.push(p);
  return (
    <div className={styles.pagination_container}>
      <PageBtn label={<ChevronLeft size={15} />} target={page - 1} disabled={page <= 1} onClick={onChange} />
      {from > 1 && <PageBtn label={1} target={1} disabled={false} onClick={onChange} />}
      {from > 2 && <span className={styles.ellipsis}>…</span>}
      {pages.map((p) => (
        <PageBtn key={p} label={p} target={p} disabled={false} active={p === page} onClick={onChange} />
      ))}
      {to < pageCount - 1 && <span className={styles.ellipsis}>…</span>}
      {to < pageCount && <PageBtn label={pageCount} target={pageCount} disabled={false} onClick={onChange} />}
      <PageBtn label={<ChevronRight size={15} />} target={page + 1} disabled={page >= pageCount} onClick={onChange} />
    </div>
  );
};

// ── Drawer ────────────────────────────────────────────
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Legacy numeric width — prefer `size`. */
  width?: number;
  children?: ReactNode;
  footer?: ReactNode;
}

const DRAWER_WIDTH: Record<NonNullable<DrawerProps['size']>, number> = {
  sm: 360, md: 480, lg: 640,
};

export const Drawer: FC<DrawerProps> = ({ open, onClose, title, size = 'md', width, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const contentStyle: CSSProperties = {
    width: width ?? DRAWER_WIDTH[size],
  };

  return (
    <div
      className={styles.drawer_overlay}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={styles.drawer_content}
        style={contentStyle}
      >
        <div className={styles.drawer_header}>
          <h2 className={styles.drawer_title}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className={styles.drawer_close_btn}
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.drawer_body}>{children}</div>
        {footer && (
          <div className={styles.drawer_footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Disclosure ────────────────────────────────────────
export interface DisclosureProps {
  summary: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}
export const Disclosure: FC<DisclosureProps> = ({
  summary, children, defaultOpen = false, open: openProp, onToggle,
}) => {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : openState;
  const panelId = useId();

  const toggle = () => {
    const next = !open;
    if (onToggle) onToggle(next);
    if (openProp === undefined) setOpenState(next);
  };

  const chevronStyle: CSSProperties = {
    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={styles.disclosure_trigger}
      >
        <span className={styles.summary_content}>
          {summary}
        </span>
        <ChevronDown
          size={14}
          className={styles.chevron_down}
          style={chevronStyle}
        />
      </button>
      {open && <div id={panelId}>{children}</div>}
    </div>
  );
};

