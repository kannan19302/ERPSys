'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Code2, PlusCircle, Edit3, Trash2, Eye, Copy } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Finance: '#059669',
  Procurement: '#d97706',
  HR: 'var(--color-primary)',
  Sales: '#7c3aed',
  Communication: '#0891b2',
  Auth: '#dc2626',
};

function WebTemplatesPageContent() {

  const { data: TEMPLATES_DB, createItem, updateItem, deleteItem } = useBuilderData<any>("web-templates", []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);


  const handleSave = async (data: any) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteItem(id);
    }
  };

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
          <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
            <PlusCircle size={15} /><span>New Template</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Create New */}
        <div className="frappe-card" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} style={{ padding: 'var(--space-5)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', minHeight: '160px' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d97706'; e.currentTarget.style.background = 'rgba(217,119,6,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}>
          <PlusCircle size={28} style={{ color: '#d97706' }} />
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>New Template</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', margin: 0, textAlign: 'center' }}>Create PDF, Email, or Page template</p>
        </div>

        {TEMPLATES_DB.map((template: any) => {
          const category = 'General';
          const type = 'HTML';
          return (
          <div key={template.id} className="frappe-card" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
            {/* Preview */}
            <div style={{ height: '80px', background: `${CATEGORY_COLORS[category] || '#d97706'}10`, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px', padding: 'var(--space-3)', overflow: 'hidden' }}>
              <div style={{ height: '12px', background: `${CATEGORY_COLORS[category] || '#d97706'}40`, borderRadius: '2px', width: '70%' }} />
              <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '2px', width: '90%' }} />
              <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '2px', width: '60%' }} />
              <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '2px', width: '80%' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{template.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', marginTop: 'var(--space-1)' }}>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: `${CATEGORY_COLORS[category] || '#d97706'}20`, color: CATEGORY_COLORS[category] || '#d97706', fontWeight: 'var(--weight-semibold)' }}>{type}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{template.description || category}</span>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: template.status === 'PUBLISHED' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: template.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {template.status || 'DRAFT'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>
              Edited {new Date(template.updatedAt).toLocaleDateString()}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
              <button onClick={() => { setEditingItem(template); setIsModalOpen(true); }} className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1.5)' }}><Edit3 size={12} /><span>Edit</span></button>
              <button onClick={() => { /* Preview */ }} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Eye size={12} /></button>
              <button onClick={() => { setEditingItem({...template, id: undefined, name: template.name + ' (Copy)'}); setIsModalOpen(true); }} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Copy size={12} /></button>
              <button onClick={() => handleDelete(template.id)} className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}><Trash2 size={12} /></button>
            </div>
          </div>
          );
        })}
      </div>
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Template" : "Create New Template"}
        fields={[ 
          { name: 'name', label: 'Template Name', type: 'text', required: true }, 
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'status', label: 'Status (DRAFT/PUBLISHED)', type: 'text' },
          { name: 'htmlContent', label: 'HTML Content', type: 'textarea' },
          { name: 'cssContent', label: 'CSS Content', type: 'textarea' }
        ]}
        initialData={editingItem}
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function WebTemplatesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading Templates...</div>}>
      <WebTemplatesPageContent />
    </Suspense>
  );
}
