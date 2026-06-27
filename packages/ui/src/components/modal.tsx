'use client';

import { useEffect, useRef, useCallback, type FC, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

const SIZE_MAP: Record<string, string> = { sm: '420px', md: '560px', lg: '760px', xl: '960px' };

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  children?: ReactNode;
  closeOnOverlay?: boolean;
}

/** Accessible modal dialog: ESC to close, focus-trapped overlay, token-styled, animated. */
export const Modal: FC<ModalProps> = ({ open, onClose, title, description, size = 'md', footer, children, closeOnOverlay = true }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      trapFocus(e);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }, 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose, trapFocus]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => { if (closeOnOverlay && e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}
    >
      <div
        ref={dialogRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        style={{ width: SIZE_MAP[size], maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
      >
        {(title || description) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              {title && <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>{title}</h2>}
              {description && <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{description}</p>}
            </div>
            <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
}

/** Confirmation dialog — error prevention (Nielsen #5) for destructive/irreversible actions. */
export const ConfirmDialog: FC<ConfirmDialogProps> = ({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'primary', loading }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </>
    }
  >
    {message && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</div>}
  </Modal>
);
