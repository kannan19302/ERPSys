'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Code2, PlusCircle, Edit3, Trash2, Eye, Copy } from 'lucide-react';

const TEMPLATES = [
  { id: 1, name: 'Sales Invoice PDF', category: 'Finance', type: 'PDF', usedIn: ['Finance', 'Sales'], lastEdited: '1 day ago', status: 'Published' },
  { id: 2, name: 'Purchase Order PDF', category: 'Procurement', type: 'PDF', usedIn: ['Procurement'], lastEdited: '3 days ago', status: 'Published' },
  { id: 3, name: 'Payslip Template', category: 'HR', type: 'PDF', usedIn: ['HR'], lastEdited: '1 week ago', status: 'Published' },
  { id: 4, name: 'Delivery Note', category: 'Sales', type: 'PDF', usedIn: ['Sales'], lastEdited: '2 days ago', status: 'Draft' },
  { id: 5, name: 'Welcome Email', category: 'Communication', type: 'Email', usedIn: ['HR', 'Admin'], lastEdited: '4 days ago', status: 'Published' },
  { id: 6, name: 'Password Reset Email', category: 'Auth', type: 'Email', usedIn: ['Auth'], lastEdited: '2 weeks ago', status: 'Published' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Finance: '#059669',
  Procurement: '#d97706',
  HR: 'var(--color-primary)',
  Sales: '#7c3aed',
  Communication: '#0891b2',
  Auth: '#dc2626',
};

export default function WebTemplatesPage() {
  const router = useRouter();
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Code2 size={20} style={{ color: '#d97706' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>Templates</h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>Manage PDF document templates, email templates, and page layouts</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Builder</button>
          <button className="frappe-btn frappe-btn-primary"><PlusCircle size={15} /><span>New Template</span></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Create New */}
        <div className="frappe-card" style={{ padding: 'var(--space-5)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', minHeight: '160px' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.background = 'rgba(217,119,6,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}>
          <PlusCircle size={28} style={{ color: '#d97706' }} />
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>New Template</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, textAlign: 'center' }}>Create PDF, Email, or Page template</p>
        </div>

        {TEMPLATES.map(template => (
          <div key={template.id} className="frappe-card" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
            {/* Preview */}
            <div style={{ height: '80px', background: `${CATEGORY_COLORS[template.category] || '#d97706'}10`, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px', padding: 'var(--space-3)', overflow: 'hidden' }}>
              <div style={{ height: '12px', background: `${CATEGORY_COLORS[template.category] || '#d97706'}40`, borderRadius: '2px', width: '70%' }} />
              <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '2px', width: '90%' }} />
              <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '2px', width: '60%' }} />
              <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '2px', width: '80%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{template.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', marginTop: 'var(--space-1)' }}>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: `${CATEGORY_COLORS[template.category] || '#d97706'}20`, color: CATEGORY_COLORS[template.category] || '#d97706', fontWeight: 'var(--weight-semibold)' }}>{template.type}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{template.category}</span>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: template.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: template.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {template.status}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>
              Used in: {template.usedIn.join(', ')} · Edited {template.lastEdited}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
              <button className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1.5)' }}><Edit3 size={12} /><span>Edit</span></button>
              <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Eye size={12} /></button>
              <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Copy size={12} /></button>
              <button className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
