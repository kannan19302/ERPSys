import React from 'react';
import { DollarSign } from 'lucide-react';
import { FormField } from '@/stores/builderStore';

interface FieldRendererProps {
  field: FormField;
  previewMode?: boolean;
}

export function FieldRenderer({ field, previewMode = false }: FieldRendererProps) {
  const customHeight = field.height ? `${field.height}px` : undefined;
  
  const baseClassName = `frappe-input ${field.cssClass || ''}`.trim();
  const commonProps = {
    className: baseClassName,
    style: { width: '100%', height: customHeight },
    disabled: previewMode && field.readOnly,
    placeholder: field.placeholder || undefined,
    defaultValue: field.defaultValue || undefined
  };

  switch (field.type) {
    case 'Select':
    case 'Link': {
      const opts = Array.isArray(field.options)
        ? field.options
        : typeof field.options === 'string'
        ? field.options.split('\n').filter(Boolean)
        : [];
      return (
        <select {...commonProps}>
          {opts.map((opt: string, i: number) => <option key={i}>{opt}</option>)}
        </select>
      );
    }
    case 'Radio': {
      const opts = Array.isArray(field.options)
        ? field.options
        : typeof field.options === 'string'
        ? field.options.split('\n').filter(Boolean)
        : [];
      return (
        <div className={`frappe-radio-group ${field.cssClass || ''}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {opts.map((opt: string, i: number) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="radio" name={field.name} disabled={previewMode && field.readOnly} defaultChecked={field.defaultValue === opt} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    case 'Check':
      return <input type="checkbox" style={{ width: '16px', height: '16px' }} disabled={previewMode && field.readOnly} defaultChecked={field.defaultValue === 'true' || field.defaultValue === '1'} className={field.cssClass} />;
    case 'Text Editor':
      return <textarea {...commonProps} style={{ ...commonProps.style, minHeight: customHeight || '120px' }} placeholder={field.placeholder || `Enter ${field.label}...`} />;
    case 'File':
    case 'Image':
      return <input type="file" {...commonProps} style={{ ...commonProps.style, padding: 'var(--space-1)' }} />;
    case 'Signature':
      return <div className={field.cssClass} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', height: customHeight || '100px', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>Signature Area</div>;
    case 'Table':
      return <div className={field.cssClass} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', minHeight: customHeight || '100px', background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>[ Child Table Rendered Here ]</div>;
    case 'HTML':
      return <div className={field.cssClass} style={{ padding: 'var(--space-2)', background: 'var(--color-bg-hover)', border: '1px dashed var(--color-border)', minHeight: customHeight, height: customHeight, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: field.options || '<em>Custom HTML Content</em>' }} />;
    case 'Button':
      return <button className={`frappe-btn frappe-btn-secondary ${field.cssClass || ''}`.trim()} style={{ width: '100%', height: customHeight }} disabled={previewMode && field.readOnly}>{field.label}</button>;
    case 'Date':
      return <input type="date" {...commonProps} />;
    case 'Time':
      return <input type="time" {...commonProps} />;
    case 'Int':
    case 'Currency':
      return (
        <div style={{ position: 'relative', height: customHeight }}>
          {field.type === 'Currency' && <DollarSign size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />}
          <input type="number" {...commonProps} style={{ ...commonProps.style, height: '100%', paddingLeft: field.type === 'Currency' ? '28px' : 'var(--space-2)' }} placeholder={field.placeholder || `0${field.type === 'Currency' ? '.00' : ''}`} />
        </div>
      );
    case 'Password':
      return <input type="password" {...commonProps} />;
    default:
      return <input type="text" {...commonProps} placeholder={field.placeholder || `Enter ${field.label}...`} />;
  }
}
