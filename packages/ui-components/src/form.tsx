'use client';

import React, { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './form.module.css';

export interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, required, error, hint, children }) => (
  <div className={styles.field_container}>
    {label && (
      <label htmlFor={htmlFor} className={styles.label}>
        {label}{required && <span className={styles.required_star}> *</span>}
      </label>
    )}
    {children}
    {error ? (
      <span className={styles.error_msg}>
        <AlertCircle size={12} /> {error}
      </span>
    ) : hint ? (
      <span className={styles.hint_msg}>{hint}</span>
    ) : null}
  </div>
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, className = '', style, ...props }, ref) => {
  const inputClass = [
    styles.control,
    invalid && styles.invalid,
    className,
  ].filter(Boolean).join(' ');

  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={inputClass || undefined}
      style={style}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ invalid, className = '', style, ...props }, ref) => {
  const textareaClass = [
    styles.control,
    styles.textarea,
    invalid && styles.invalid,
    className,
  ].filter(Boolean).join(' ');

  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={textareaClass || undefined}
      style={style}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ invalid, className = '', children, style, ...props }, ref) => {
  const selectClass = [
    styles.control,
    styles.select,
    invalid && styles.invalid,
    className,
  ].filter(Boolean).join(' ');

  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={selectClass || undefined}
      style={style}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

/** Convenience: labeled text input bound to FormField, with a generated id. */
export const TextField: React.FC<InputProps & { label?: ReactNode; error?: string | null; hint?: ReactNode }> = ({
  label, error, hint, required, id, ...props
}) => {
  const gid = useId();
  const fieldId = id || gid;
  return (
    <FormField label={label} htmlFor={fieldId} required={required} error={error} hint={hint}>
      <Input id={fieldId} required={required} invalid={!!error} {...props} />
    </FormField>
  );
};

