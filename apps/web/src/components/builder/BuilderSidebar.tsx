import React, { useState } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { 
  Type, List, CheckSquare, Hash, Calendar, Link2, AlignLeft, 
  Grid, LayoutTemplate, MousePointerClick, Code, Image as ImageIcon, 
  Upload, Key, PenTool, DollarSign 
} from 'lucide-react';

const FIELD_GROUPS = [
  {
    name: 'Layout & Actions',
    items: [
      { type: 'Section Break', label: 'Section', icon: LayoutTemplate, color: '#3b82f6' },
      { type: 'Column Break', label: 'Column', icon: LayoutTemplate, color: '#3b82f6' },
      { type: 'Button', label: 'Action Button', icon: MousePointerClick, color: '#3b82f6' }
    ]
  },
  {
    name: 'Basic Inputs',
    items: [
      { type: 'Data', label: 'Short Text', icon: Type, color: '#10b981' },
      { type: 'Int', label: 'Number', icon: Hash, color: '#10b981' },
      { type: 'Currency', label: 'Currency', icon: DollarSign, color: '#10b981' },
      { type: 'Select', label: 'Dropdown', icon: List, color: '#10b981' },
      { type: 'Radio', label: 'Radio Group', icon: List, color: '#10b981' },
      { type: 'Check', label: 'Checkbox', icon: CheckSquare, color: '#10b981' },
      { type: 'Date', label: 'Date', icon: Calendar, color: '#10b981' },
      { type: 'Time', label: 'Time', icon: Calendar, color: '#10b981' }
    ]
  },
  {
    name: 'Advanced & Media',
    items: [
      { type: 'Text Editor', label: 'Rich Text', icon: AlignLeft, color: '#8b5cf6' },
      { type: 'Password', label: 'Password', icon: Key, color: '#8b5cf6' },
      { type: 'File', label: 'File Upload', icon: Upload, color: '#8b5cf6' },
      { type: 'Image', label: 'Image', icon: ImageIcon, color: '#8b5cf6' },
      { type: 'Signature', label: 'Signature', icon: PenTool, color: '#8b5cf6' },
      { type: 'Link', label: 'Record Link', icon: Link2, color: '#8b5cf6' },
      { type: 'Table', label: 'Child Table', icon: Grid, color: '#8b5cf6' },
      { type: 'HTML', label: 'Custom HTML', icon: Code, color: '#8b5cf6' },
    ]
  }
];

export function BuilderSidebar() {
  const [tab, setTab] = useState<'palette' | 'tree'>('palette');
  const { fields, selectedFieldId, setSelectedFieldId, addField } = useBuilderStore();

  const generateId = () => 'f_' + Math.random().toString(36).substr(2, 9);
  const generateName = (label: string) => label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');

  const handleAddField = (type: string) => {
    addField({
      id: generateId(),
      type: type,
      label: `New ${type}`,
      name: generateName(`New ${type}`),
      required: false,
      readOnly: false,
      columnSpan: type === 'Section Break' ? 12 : 6,
      weight: 1
    });
  };

  return (
    <div style={{ width: '260px', borderRight: '1px solid rgba(255, 255, 255, 0.05)', background: '#1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0, color: '#e2e8f0' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', padding: 'var(--space-2)' }}>
        <button 
          onClick={() => setTab('palette')}
          style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: tab === 'palette' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === 'palette' ? '600' : '400', color: tab === 'palette' ? 'white' : '#94a3b8', transition: 'all 0.2s' }}
        >
          Components
        </button>
        <button 
          onClick={() => setTab('tree')}
          style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: tab === 'tree' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === 'tree' ? '600' : '400', color: tab === 'tree' ? 'white' : '#94a3b8', transition: 'all 0.2s' }}
        >
          Tree View
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-3)', paddingBottom: 'var(--space-10)' }}>
        {tab === 'palette' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {FIELD_GROUPS.map(group => (
              <div key={group.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', paddingLeft: '4px' }}>
                  {group.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {group.items.map(ft => (
                    <div 
                      key={ft.type}
                      onClick={() => handleAddField(ft.type)}
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                        padding: '12px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', textAlign: 'center'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = ft.color; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <ft.icon size={20} style={{ color: ft.color }} />
                      <span style={{ fontSize: '11px', fontWeight: '500', color: '#cbd5e1' }}>{ft.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {fields.map((f) => {
              const isSection = f.type === 'Section Break';
              return (
                <div 
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    paddingLeft: isSection ? 'var(--space-2)' : 'var(--space-6)',
                    background: selectedFieldId === f.id ? 'var(--color-bg-hover)' : 'transparent',
                    borderLeft: selectedFieldId === f.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}
                >
                  {isSection ? <LayoutTemplate size={12} style={{ color: 'var(--color-text-secondary)' }} /> : <Type size={12} style={{ color: 'var(--color-text-tertiary)' }} />}
                  <span style={{ fontSize: 'var(--text-xs)', color: selectedFieldId === f.id ? 'var(--color-text)' : 'var(--color-text-secondary)', fontWeight: isSection ? 'bold' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
