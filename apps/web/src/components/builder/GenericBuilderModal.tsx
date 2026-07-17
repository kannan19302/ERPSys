/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean';
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface GenericBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  title: string;
  fields: FieldConfig[];
  initialData?: Record<string, unknown> | null;
}

export function GenericBuilderModal({ isOpen, onClose, onSubmit, title, fields, initialData }: GenericBuilderModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setError(null);
    }
  }, [isOpen, initialData]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [formData, onClose, onSubmit]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--color-bg-overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        className="ui-card modal-card"
        style={{
          width: '440px', maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
          padding: 'var(--space-6)', backgroundColor: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="ui-btn ui-btn-icon"
            style={{
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-3)', marginBottom: 'var(--space-4)',
            background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-danger)',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {fields.map(field => (
            <div key={field.name} className="ui-form-group" style={{ marginBottom: 0 }}>
              <label className="ui-label" style={{ marginBottom: 'var(--space-1.5)' }}>
                {field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="ui-input"
                  required={field.required}
                  value={(formData[field.name] as string) || ''}
                  onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  style={{ minHeight: '80px', width: '100%', resize: 'vertical' }}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              ) : field.type === 'select' ? (
                <select
                  className="ui-input"
                  required={field.required}
                  value={(formData[field.name] as string) || ''}
                  onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">Select {field.label.toLowerCase()}...</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'boolean' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <div
                    onClick={() => setFormData({ ...formData, [field.name]: !formData[field.name] })}
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px',
                      background: formData[field.name] ? 'var(--color-primary)' : 'var(--color-border)',
                      position: 'relative', cursor: 'pointer',
                      transition: 'background var(--duration-fast)',
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '9px', background: 'white',
                      position: 'absolute', top: '2px',
                      left: formData[field.name] ? '20px' : '2px',
                      transition: 'left var(--duration-fast)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    {formData[field.name] ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              ) : (
                <input
                  type={field.type}
                  className="ui-input"
                  required={field.required}
                  value={(formData[field.name] as string | number) || ''}
                  onChange={e => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  style={{ width: '100%' }}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}

          {/* Footer Actions */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)',
            marginTop: 'var(--space-2)', paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
          }}>
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ui-btn ui-btn-primary"
              disabled={loading}
              style={{ minWidth: '100px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                  Saving...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle size={14} />
                  Save
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
