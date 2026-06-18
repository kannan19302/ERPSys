'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface DynamicField {
    id: string;
    type: string;
    name: string;
    label: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
    readOnly?: boolean;
    description?: string;
    options?: string;
    columnSpan?: number;
    minLength?: number;
    maxLength?: number;
    regexPattern?: string;
    formula?: string;
    visibilityRule?: string;
    dataSource?: string;
    dataFilter?: string;
    height?: number;
    cssClass?: string;
}

interface DynamicFormProps {
    fields: DynamicField[];
    data?: Record<string, any>;
    onChange?: (data: Record<string, any>) => void;
    onSubmit?: (data: Record<string, any>) => void;
    readOnly?: boolean;
}

export function DynamicForm({ fields, data = {}, onChange, onSubmit, readOnly = false }: DynamicFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>(data);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        // Initialize defaults
        const init: Record<string, any> = { ...data };
        (fields || []).forEach((f) => {
            if (init[f.name] === undefined && f.defaultValue !== undefined) {
                init[f.name] = f.defaultValue;
            }
        });
        setFormData(init);
    }, [(fields || []).map((f) => f.name).join(',')]);

    const updateField = useCallback(
        (name: string, value: any) => {
            const next = { ...formData, [name]: value };

            // Compute formulas
            (fields || []).forEach((f) => {
                if (f.formula) {
                    try {
                        const computed = f.formula.replace(/\{(\w+)\}/g, (_, key) => String(next[key] ?? 0));
                        // eslint-disable-next-line no-eval
                        next[f.name] = Function(`"use strict"; return (${computed})`)();
                    } catch { /* ignore formula errors */ }
                }
            });

            setFormData(next);
            onChange?.(next);
        },
        [formData, fields, onChange],
    );

    const validate = useCallback((): boolean => {
        const errs: Record<string, string> = {};
        (fields || []).forEach((f) => {
            const val = formData[f.name];
            if (f.required && (val === undefined || val === '' || val === null)) {
                errs[f.name] = `${f.label} is required`;
            }
            if (f.minLength && typeof val === 'string' && val.length < f.minLength) {
                errs[f.name] = `Minimum ${f.minLength} characters`;
            }
            if (f.maxLength && typeof val === 'string' && val.length > f.maxLength) {
                errs[f.name] = `Maximum ${f.maxLength} characters`;
            }
            if (f.regexPattern && typeof val === 'string' && val && !new RegExp(f.regexPattern).test(val)) {
                errs[f.name] = `Invalid format`;
            }
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [fields, formData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit?.(formData);
        }
    };

    const isVisible = (field: DynamicField): boolean => {
        if (!field.visibilityRule) return true;
        try {
            const rule = field.visibilityRule.replace(/eval:\s*/i, '');
            const fn = new Function(...Object.keys(formData), `return (${rule})`);
            return fn(...Object.values(formData));
        } catch {
            return true;
        }
    };

    const renderField = (field: DynamicField) => {
        const val = formData[field.name] ?? '';
        const error = errors[field.name];
        const commonProps = {
            id: field.name,
            name: field.name,
            value: val,
            onChange: (e: any) => updateField(field.name, e.target.value),
            placeholder: field.placeholder || '',
            disabled: readOnly || field.readOnly,
            className: `frappe-input ${field.cssClass || ''}`,
            style: { width: '100%' } as React.CSSProperties,
        };

        const inputStyle: React.CSSProperties = { width: '100%' };

        switch (field.type) {
            case 'Text Editor':
            case 'Text':
            case 'Data':
                return <input type="text" {...commonProps} minLength={field.minLength} maxLength={field.maxLength} />;
            case 'Int':
                return <input type="number" {...commonProps} step="1" min={field.minLength} max={field.maxLength} />;
            case 'Float':
                return <input type="number" {...commonProps} step="0.01" />;
            case 'Currency':
                return <input type="number" {...commonProps} step="0.01" style={{ ...inputStyle, textAlign: 'right' as const }} />;
            case 'Password':
                return <input type="password" {...commonProps} />;
            case 'Date':
                return <input type="date" {...commonProps} />;
            case 'Time':
                return <input type="time" {...commonProps} />;
            case 'Check':
                return (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={!!val}
                            onChange={(e) => updateField(field.name, e.target.checked)}
                            disabled={readOnly || field.readOnly}
                            style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{field.label}</span>
                    </label>
                );
            case 'Select':
                return (
                    <select {...commonProps} style={{ ...inputStyle, minHeight: '36px' }}>
                        <option value="">{field.placeholder || 'Select...'}</option>
                        {(field.options || '').split('\n').filter(Boolean).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'Radio':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        {(field.options || '').split('\n').filter(Boolean).map((opt) => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={opt}
                                    checked={val === opt}
                                    onChange={(e) => updateField(field.name, e.target.value)}
                                    disabled={readOnly || field.readOnly}
                                />
                                <span style={{ fontSize: 'var(--text-sm)' }}>{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'Textarea':
                return <textarea {...commonProps} rows={4} />;
            case 'HTML':
                return <div dangerouslySetInnerHTML={{ __html: field.options || '' }} />;
            case 'Signature':
                return (
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            height: field.height || 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-tertiary)',
                            fontSize: 'var(--text-sm)',
                            background: 'var(--color-bg-elevated)',
                        }}
                    >
                        {readOnly ? (val ? '✓ Signed' : 'No signature') : 'Click to sign'}
                    </div>
                );
            case 'Button':
                return (
                    <button
                        type="button"
                        className="frappe-btn frappe-btn-primary"
                        onClick={() => onSubmit?.(formData)}
                        style={{ width: '100%' }}
                    >
                        {field.label}
                    </button>
                );
            case 'Image':
                return val ? <img src={val} alt={field.label} style={{ maxWidth: '100%', height: field.height || 'auto', borderRadius: 'var(--radius-md)' }} /> : null;
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)' }}>
                {(fields || [])
                    .filter((f) => f.type !== 'Section Break' && f.type !== 'Column Break' && isVisible(f))
                    .map((field) => (
                        <div
                            key={field.id}
                            style={{ gridColumn: `span ${Math.min(field.columnSpan || 12, 12)}` }}
                            className="frappe-form-group"
                        >
                            {field.type !== 'Check' && field.type !== 'Button' && field.type !== 'HTML' && field.type !== 'Image' && (
                                <label className="frappe-label" htmlFor={field.name}>
                                    {field.label}
                                    {field.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                                </label>
                            )}
                            {renderField(field)}
                            {field.description && (
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 'var(--space-1) 0 0 0' }}>
                                    {field.description}
                                </p>
                            )}
                            {errors[field.name] && (
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', margin: 'var(--space-1) 0 0 0' }}>
                                    {errors[field.name]}
                                </p>
                            )}
                            {field.formula && (
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 'var(--space-1) 0 0 0', fontFamily: 'monospace' }}>
                                    = {field.formula}
                                </p>
                            )}
                        </div>
                    ))}
            </div>
            {!readOnly && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <button type="submit" className="frappe-btn frappe-btn-primary">
                        Submit
                    </button>
                </div>
            )}
        </form>
    );
}