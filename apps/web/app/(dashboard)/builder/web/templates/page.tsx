'use client';
import styles from './page.module.css';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';
import { useBuilderData } from '@/lib/hooks/useBuilderData';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
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

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleDelete = async (id: any) => {
    await deleteItem(id);
  };

  const router = useRouter();
  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Templates"
        description="Manage PDF document templates, email templates, and page layouts"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Studio</button>
            <button className="ui-btn ui-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              <PlusCircle size={15} /><span>New Template</span>
            </button>
          </div>
        }
      />

      <div className={styles.s1}>
        {/* Create New */}
        <div className={`ui-card ${styles.s2} ${styles.createCard}`} onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
          <PlusCircle size={28} className={styles.s3} />
          <p className={styles.s4}>New Template</p>
          <p className={styles.s5}>Create PDF, Email, or Page template</p>
        </div>

        {TEMPLATES_DB.map((template: any) => {
          const category = 'General';
          const type = 'HTML';
          return (
          <div key={template.id} className={`ui-card ${styles.s6} ${styles.templateCard}`}>
            {/* Preview */}
            <div style={{ background: `${CATEGORY_COLORS[category] || '#d97706'}10` }} className={styles.s7}>
              <div style={{ background: `${CATEGORY_COLORS[category] || '#d97706'}40` }} className={styles.s8} />
              <div className={styles.s9} />
              <div className={styles.s10} />
              <div className={styles.s11} />
            </div>
            <div className={styles.s12}>
              <div>
                <p className={styles.s13}>{template.name}</p>
                <div className={styles.s14}>
                  <span style={{ background: `${CATEGORY_COLORS[category] || '#d97706'}20`, color: CATEGORY_COLORS[category] || '#d97706' }} className={styles.s15}>{type}</span>
                  <span className="ui-text-micro ui-text-muted">{template.description || category}</span>
                </div>
              </div>
              <span style={{ background: template.status === 'PUBLISHED' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: template.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s16}>
                {template.status || 'DRAFT'}
              </span>
            </div>
            <p className={styles.s17}>
              Edited {new Date(template.updatedAt).toLocaleDateString()}
            </p>
            <div className={styles.s18}>
              <button onClick={() => { setEditingItem(template); setIsModalOpen(true); }} className={`ui-btn ui-btn-secondary ${styles.s19}`} ><Edit3 size={12} /><span>Edit</span></button>
              <button onClick={() => { /* Preview */ }} className={`ui-btn ui-btn-secondary ${styles.s20}`} ><Eye size={12} /></button>
              <button onClick={() => { setEditingItem({...template, id: undefined, name: template.name + ' (Copy)'}); setIsModalOpen(true); }} className={`ui-btn ui-btn-secondary ${styles.s20}`} ><Copy size={12} /></button>
              <button onClick={() => setDeleteTarget(template.id)} className={`ui-btn ${styles.s21}`} ><Trash2 size={12} /></button>
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
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { handleDelete(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

import { Suspense } from 'react';

export default function WebTemplatesPage() {
  return (
    <Suspense fallback={<div className={styles.s22}>Loading Templates...</div>}>
      <WebTemplatesPageContent />
    </Suspense>
  );
}
