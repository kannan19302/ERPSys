'use client';

import React, { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

const baseFieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 38,
  padding: '0 var(--space-3)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color var(--duration-fast) var(--ease-default), box-shadow var(--duration-fast) var(--ease-default)',
};

function applyFocus(e: React.FocusEvent<HTMLElement>, invalid?: boolean) {
  e.currentTarget.style.borderColor = invalid ? 'var(--color-danger)' : 'var(--color-border-focus)';
  e.currentTarget.style.boxShadow = `0 0 0 3px ${invalid ? 'var(--color-danger-light)' : 'var(--color-primary-light)'}`;
}
function clearFocus(e: React.FocusEvent<HTMLElement>, invalid?: boolean) {
  e.currentTarget.style.borderColor = invalid ? 'var(--color-danger)' : 'var(--color-border)';
  e.currentTarget.style.boxShadow = 'none';
}

export interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}

/** Label + control + inline error/hint. Recognition over recall; clear error prevention. */
export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, required, error, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label htmlFor={htmlFor} style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
        {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
    )}
    {children}
    {error ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-danger-text)' }}>
        <AlertCircle size={12} /> {error}
      </span>
    ) : hint ? (
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{hint}</span>
    ) : null}
  </div>
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { invalid?: boolean; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, style, onFocus, onBlur, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    style={{ ...baseFieldStyle, borderColor: invalid ? 'var(--color-danger)' : 'var(--color-border)', ...style }}
    onFocus={(e) => { applyFocus(e, invalid); onFocus?.(e); }}
    onBlur={(e) => { clearFocus(e, invalid); onBlur?.(e); }}
    {...props}
  />
));
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { invalid?: boolean; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ invalid, style, onFocus, onBlur, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    style={{ ...baseFieldStyle, minHeight: 88, padding: 'var(--space-2) var(--space-3)', resize: 'vertical', borderColor: invalid ? 'var(--color-danger)' : 'var(--color-border)', ...style }}
    onFocus={(e) => { applyFocus(e, invalid); onFocus?.(e); }}
    onBlur={(e) => { clearFocus(e, invalid); onBlur?.(e); }}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { invalid?: boolean; }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ invalid, style, onFocus, onBlur, children, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={invalid || undefined}
    style={{ ...baseFieldStyle, cursor: 'pointer', borderColor: invalid ? 'var(--color-danger)' : 'var(--color-border)', ...style }}
    onFocus={(e) => { applyFocus(e, invalid); onFocus?.(e); }}
    onBlur={(e) => { clearFocus(e, invalid); onBlur?.(e); }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

/** Convenience: labeled text input bound to FormField, with a generated id. */
export const TextField: React.FC<InputProps & { label?: ReactNode; error?: string | null; hint?: ReactNode }> = ({ label, error, hint, required, id, ...props }) => {
  const gid = useId();
  const fieldId = id || gid;
  return (
    <FormField label={label} htmlFor={fieldId} required={required} error={error} hint={hint}>
      <Input id={fieldId} required={required} invalid={!!error} {...props} />
    </FormField>
  );
};
