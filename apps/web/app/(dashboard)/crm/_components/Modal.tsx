'use client';

import React from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ title, onClose, children, maxWidth = '520px' }: ModalProps) {
  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-flex-between mb-4">
          <h3 className="m-0 font-semibold">{title}</h3>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Kept as CSSProperties for existing CRM modal consumers. Those consumers are
// migrated independently; changing this public helper to a class string would
// break their `style={...}` contracts.
export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-sm)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--color-text-secondary)',
  marginBottom: 'var(--space-1)',
};
