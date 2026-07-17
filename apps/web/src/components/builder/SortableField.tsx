import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilderStore, FormField } from '@/stores/builderStore';
import { Trash2, MoreVertical } from 'lucide-react';
import { FieldRenderer } from './FieldRenderer';

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableField({ field, isSelected, onClick }: SortableFieldProps) {
  const { previewMode, removeField } = useBuilderStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${field.columnSpan || 12}`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const isLayoutBreak = field.type === 'Section Break' || field.type === 'Column Break';

  if (previewMode) {
    return (
      <div style={{ gridColumn: `span ${field.columnSpan || 12}` }}>
        {isLayoutBreak ? (
          field.type === 'Section Break' ? (
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', margin: 'var(--space-4) 0 var(--space-2) 0' }}>
              {field.label}
            </h3>
          ) : null // Column breaks don't render visually in pure grid preview unless needed
        ) : (
          <div className="ui-form-group" style={{ marginBottom: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {field.type !== 'Button' && field.type !== 'HTML' && (
              <label className="ui-label" style={{ marginBottom: 'var(--space-1.5)' }}>
                {field.label} {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              </label>
            )}
            <div style={{ flex: 1 }}>
               <FieldRenderer field={field} previewMode={true} />
            </div>
            {field.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 'var(--space-1) 0 0 0' }}>{field.description}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div
        className="builder-field-box"
        style={{
          padding: 'var(--space-3)', 
          background: isLayoutBreak ? '#f8fafc' : 'white', 
          border: isLayoutBreak 
            ? `2px dashed ${isSelected ? '#3b82f6' : '#cbd5e1'}` 
            : `2px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
          borderRadius: 'var(--radius-md)', 
          cursor: 'pointer',
          boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          position: 'relative', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderLeftWidth: field.type === 'Section Break' ? '4px' : undefined,
          borderLeftColor: field.type === 'Section Break' ? 'var(--color-primary)' : undefined,
        }}
      >
        <div style={{ position: 'absolute', right: '4px', top: '4px', display: 'flex', gap: '4px', zIndex: 5 }}>
           <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }} className="ui-btn ui-btn-icon" style={{ padding: '4px', height: 'auto', background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', border: 'none' }}><Trash2 size={12} /></button>
           <div {...attributes} {...listeners} style={{ padding: '4px', background: 'var(--color-bg-sunken)', borderRadius: '4px', color: 'var(--color-text-tertiary)', cursor: 'grab' }}>
             <MoreVertical size={12} />
           </div>
        </div>
        
        {isLayoutBreak ? (
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} {...attributes} {...listeners}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{field.label}</span>
              <span style={{ fontSize: '10px', background: 'var(--color-bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>{field.type}</span>
           </div>
        ) : (
          <div style={{ opacity: 0.8, pointerEvents: 'none', flex: 1 }}>
            <label className="ui-label" style={{ marginBottom: 'var(--space-1.5)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '40px' }}>
              {field.label} 
              {field.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-hover)', padding: '1px 4px', borderRadius: '4px' }}>{field.type}</span>
            </label>
            <FieldRenderer field={field} previewMode={false} />
            {field.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 'var(--space-1) 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
