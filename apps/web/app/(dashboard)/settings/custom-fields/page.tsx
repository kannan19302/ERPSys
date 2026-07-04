'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings2, Plus, Pencil, Trash2, RefreshCw, CheckCircle, AlertCircle,
  X, ChevronDown, GripVertical,
} from 'lucide-react';

/* ───────── types ───────── */
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
  entityType,
  fieldName: '',
  label: '',
  fieldType: 'TEXT',
  description: '',
  isRequired: false,
  defaultValue: '',
  section: '',
  sortOrder: 0,
  options: [],
});

/* ───────── api helpers ───────── */
const API_BASE = '/api/v1/admin/custom-fields';
function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

/* ───────── shared inline styles ───────── */
const th: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' };
const btnPrimary: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--color-border)',
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)',
};
const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
  color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)',
};
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)', width: '100%', maxWidth: 560,
  maxHeight: '90vh', overflow: 'auto', padding: 'var(--space-6)',
};

/* ───────── component ───────── */
export default function CustomFieldsPage() {
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

  /* fetch */
  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}?entityType=${entityType}`, { headers: authHeaders() });
      if (res.ok) { setFields(await res.json()); }
      else { setFields([]); }
    } catch { setFields([]); }
    finally { setLoading(false); }
  }, [entityType]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  /* create / update */
  const handleSave = async () => {
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      if (res.ok) {
        showToast(editingId ? 'Field updated' : 'Field created');
        setShowModal(false);
        fetchFields();
      } else { showToast('Save failed', 'error'); }
    } catch { showToast('Network error', 'error'); }
  };

  /* delete */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) { showToast('Field deleted'); fetchFields(); }
      else { showToast('Delete failed', 'error'); }
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
    if (v && !form.options.includes(v)) { setForm({ ...form, options: [...form.options, v] }); }
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
  };

  const needsOptions = form.fieldType === 'SELECT' || form.fieldType === 'MULTI_SELECT';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Settings2 style={{ color: 'var(--color-primary)' }} /> Custom Fields
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Define custom field schemas for each entity type.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={entityType}
              onChange={e => setEntityType(e.target.value as EntityType)}
              style={{ ...inputStyle, width: 180, appearance: 'none', paddingRight: 'var(--space-8)' }}
            >
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-secondary)' }} />
          </div>
          <button onClick={fetchFields} disabled={loading} style={btnGhost}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={openCreate} style={btnPrimary}>
            <Plus size={14} /> Add Field
          </button>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          background: toast.type === 'success' ? 'rgba(var(--color-success-rgb),0.1)' : 'rgba(var(--color-danger-rgb),0.1)',
          border: `1px solid var(--color-${toast.type === 'success' ? 'success' : 'danger'})`,
          color: `var(--color-${toast.type === 'success' ? 'success' : 'danger'})`,
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={th}>Field Name</th>
                <th style={th}>Label</th>
                <th style={th}>Type</th>
                <th style={{ ...th, textAlign: 'center' }}>Required</th>
                <th style={th}>Section</th>
                <th style={{ ...th, textAlign: 'center' }}>Sort</th>
                <th style={{ ...th, textAlign: 'center' }}>Active</th>
                <th style={{ ...th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 ? (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>No custom fields defined for {entityType}.</td></tr>
              ) : fields.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ ...td, fontWeight: 'var(--weight-semibold)' }}>{f.fieldName}</td>
                  <td style={td}>{f.label}</td>
                  <td style={td}>
                    <span style={{
                      padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-bg)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                    }}>{f.fieldType}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>{f.isRequired ? 'Yes' : 'No'}</td>
                  <td style={td}>{f.section || '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{f.sortOrder}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <span style={{
                      padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                      background: f.isActive ? 'rgba(var(--color-success-rgb),0.1)' : 'rgba(var(--color-danger-rgb),0.1)',
                      color: f.isActive ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>{f.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(f)} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)' }}><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDeleteId(f.id)} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* delete confirm */}
      {confirmDeleteId && (
        <div style={overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ ...modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Delete Field?</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              This will permanently remove this custom field definition and all associated data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} style={{ ...btnPrimary, background: 'var(--color-danger)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* create/edit modal */}
      {showModal && (
        <div style={overlay} onClick={() => setShowModal(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {editingId ? 'Edit Field' : 'Add Custom Field'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* fieldName & label */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <div style={labelStyle}>Field Name</div>
                  <input style={inputStyle} value={form.fieldName} onChange={e => setForm({ ...form, fieldName: e.target.value })} placeholder="e.g. custom_region" />
                </div>
                <div>
                  <div style={labelStyle}>Label</div>
                  <input style={inputStyle} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Region" />
                </div>
              </div>

              {/* type & section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <div style={labelStyle}>Field Type</div>
                  <select style={inputStyle} value={form.fieldType} onChange={e => setForm({ ...form, fieldType: e.target.value as FieldType })}>
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Section</div>
                  <input style={inputStyle} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. Additional Info" />
                </div>
              </div>

              {/* description */}
              <div>
                <div style={labelStyle}>Description</div>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* defaultValue & sortOrder */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <div style={labelStyle}>Default Value</div>
                  <input style={inputStyle} value={form.defaultValue} onChange={e => setForm({ ...form, defaultValue: e.target.value })} />
                </div>
                <div>
                  <div style={labelStyle}>Sort Order</div>
                  <input type="number" style={inputStyle} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
              </div>

              {/* isRequired */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isRequired} onChange={e => setForm({ ...form, isRequired: e.target.checked })} />
                Required field
              </label>

              {/* options editor for SELECT / MULTI_SELECT */}
              {needsOptions && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                  <div style={{ ...labelStyle, marginBottom: 'var(--space-2)' }}>Options</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    {form.options.map((opt, idx) => (
                      <span key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                        background: 'var(--color-bg)', padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)',
                      }}>
                        {opt}
                        <button onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={newOption}
                      onChange={e => setNewOption(e.target.value)}
                      placeholder="Add option..."
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                    />
                    <button onClick={addOption} style={btnGhost}><Plus size={14} /></button>
                  </div>
                </div>
              )}
            </div>

            {/* footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
              <button onClick={() => setShowModal(false)} style={btnGhost}>Cancel</button>
              <button onClick={handleSave} style={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
