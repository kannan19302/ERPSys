'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ title, onClose, children, maxWidth = '520px' }: ModalProps) {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--color-bg-overlay, rgba(0,0,0,0.5))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg-elevated, var(--bg-primary))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
          padding: 'var(--space-5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
