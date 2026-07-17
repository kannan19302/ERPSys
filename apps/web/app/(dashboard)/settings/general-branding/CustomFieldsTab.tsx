'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button, Modal, FormField, Select, TextField, Textarea, ListPageTemplate, type ListColumn,
} from '@unerp/ui';
import {
  Settings2, Plus, Pencil, Trash2, RefreshCw, CheckCircle, AlertCircle,
  X, ChevronDown,
} from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './CustomFieldsTab.module.css';

const ENTITY_TYPES = [
  'Customer', 'Vendor', 'Product', 'Invoice', 'Employee', 'Lead', 'PurchaseOrder', 'SalesOrder',
] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const FIELD_TYPES = [
  'TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTI_SELECT',
  'LOOKUP', 'FORMULA', 'EMAIL', 'PHONE', 'URL', 'CURRENCY',
] as const;
type FieldType = (typeof FIELD_TYPES)[number];

interface CustomField {
  id: string;
  entityType: EntityType;
  fieldName: string;
  label: string;
  fieldType: FieldType;
  description: string;
  isRequired: boolean;
  defaultValue: string;
  section: string;
  sortOrder: number;
  isActive: boolean;
  options?: string[];
}

type FieldFormData = Omit<CustomField, 'id' | 'isActive'> & { options: string[] };

const blankForm = (entityType: EntityType): FieldFormData => ({
  entityType, fieldName: '', label: '', fieldType: 'TEXT', description: '',
  isRequired: false, defaultValue: '', section: '', sortOrder: 0, options: [],
});

const API_BASE = '/admin/custom-fields';

const btnGhost: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--color-border)',
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
};
const th: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' };

export default function CustomFieldsTab() {
  const client = useApiClient();
  const [entityType, setEntityType] = useState<EntityType>('Customer');
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FieldFormData>(blankForm(entityType));
  const [newOption, setNewOption] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      setFields(await client.get<CustomField[]>(`${API_BASE}?entityType=${entityType}`));
    } catch { setFields([]); }
    finally { setLoading(false); }
  }, [client, entityType]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const handleSave = async () => {
    try {
      if (editingId) await client.patch(`${API_BASE}/${editingId}`, form);
      else await client.post(API_BASE, form);
      showToast(editingId ? 'Field updated' : 'Field created');
      setShowModal(false);
      fetchFields();
    } catch { showToast('Network error', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`${API_BASE}/${id}`);
      showToast('Field deleted');
      fetchFields();
    } catch { showToast('Network error', 'error'); }
    finally { setConfirmDeleteId(null); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm(entityType));
    setNewOption('');
    setShowModal(true);
  };

  const openEdit = (f: CustomField) => {
    setEditingId(f.id);
    setForm({
      entityType: f.entityType, fieldName: f.fieldName, label: f.label, fieldType: f.fieldType,
      description: f.description, isRequired: f.isRequired, defaultValue: f.defaultValue,
      section: f.section, sortOrder: f.sortOrder, options: f.options ?? [],
    });
    setNewOption('');
    setShowModal(true);
  };

  const addOption = () => {
    const v = newOption.trim();
    if (v && !form.options.includes(v)) setForm({ ...form, options: [...form.options, v] });
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
  };

  const needsOptions = form.fieldType === 'SELECT' || form.fieldType === 'MULTI_SELECT';

  return (
    <div className="ui-stack-6">
      <div className={styles.s1}>
        <div className="relative">
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
            className={styles.s2}
          >
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} className={styles.s3} />
        </div>
        <div className="ui-flex ui-gap-2">
          <button onClick={fetchFields} disabled={loading} style={btnGhost}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={14} className="mr-2" /> Add Field
          </Button>
        </div>
      </div>

      {toast && (
        <div className={styles.s4} style={{background: toast.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)', border: `1px solid ${toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`, color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="ui-flex-center p-8">
          <RefreshCw size={24} className="spin ui-text-muted" />
        </div>
      ) : (
        <ListPageTemplate
          columns={[
            { key: 'fieldName', header: 'Field Name', render: (v) => <span className="font-semibold">{String(v)}</span> },
            { key: 'label', header: 'Label' },
            { key: 'fieldType', header: 'Type', render: (v) => <span className={styles.s5}>{String(v)}</span> },
            { key: 'isRequired', header: 'Required', render: (v) => (v ? 'Yes' : 'No') },
            { key: 'section', header: 'Section', render: (v) => (v ? String(v) : '—') },
            { key: 'sortOrder', header: 'Sort' },
            { key: 'isActive', header: 'Active', render: (v) => (
              <span className={styles.s6} style={{background: v ? 'var(--color-success-light)' : 'var(--color-danger-light)', color: v ? 'var(--color-success)' : 'var(--color-danger)'}}
              >{v ? 'Active' : 'Inactive'}
              </span>
            ) },
            { key: 'id', header: 'Actions', render: (v, row) => (
              <div className="ui-flex-end ui-gap-2">
                <button onClick={() => openEdit(row as unknown as CustomField)} className={styles.s7}><Pencil size={14} /></button>
                <button onClick={() => setConfirmDeleteId(String(v))} className={styles.s8}><Trash2 size={14} /></button>
              </div>
            ) },
          ] as ListColumn[]}
          data={fields as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No custom fields"
          emptyDescription={`No custom fields defined for ${entityType}.`}
        />
      )}

      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Field?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>Delete</Button>
          </>
        }
      >
        <p className="ui-text-sm-muted">
          This will permanently remove this custom field definition and all associated data. This action cannot be undone.
        </p>
      </Modal>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Field' : 'Add Custom Field'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="ui-stack-4">
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Field Name" value={form.fieldName} onChange={(e) => setForm({ ...form, fieldName: e.target.value })} placeholder="e.g. custom_region" />
            <TextField label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Region" />
          </div>

          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Field Type">
              <Select value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value as FieldType })}>
                {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <TextField label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. Additional Info" />
          </div>

          <FormField label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>

          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Default Value" value={form.defaultValue} onChange={(e) => setForm({ ...form, defaultValue: e.target.value })} />
            <TextField label="Sort Order" type="number" value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>

          <label className={styles.s9}>
            <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} />
            Required field
          </label>

          {needsOptions && (
            <div className={styles.s10}>
              <div className={styles.s11}>Options</div>
              <div className={styles.s12}>
                {form.options.map((opt, idx) => (
                  <span key={idx} className={styles.s13}
                  >
                    {opt}
                    <button onClick={() => removeOption(idx)} className={styles.s14}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="ui-flex ui-gap-2">
                <input
                  className={styles.s15}
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add option..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                />
                <button onClick={addOption} style={btnGhost}><Plus size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
