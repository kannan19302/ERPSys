'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { Plus, X, Save, Trash2, Edit3, Settings, ToggleLeft, ToggleRight } from 'lucide-react';

const ENTITIES = ['CUSTOMER', 'CONTACT', 'LEAD', 'OPPORTUNITY', 'QUOTATION', 'VENDOR'] as const;
type Entity = typeof ENTITIES[number];

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DECIMAL', 'DATE', 'BOOLEAN', 'PICKLIST', 'URL', 'EMAIL', 'PHONE', 'TEXTAREA'] as const;

interface PicklistOption {
  value: string;
  label: string;
  color: string;
}

interface CustomField {
  id: string;
  entity: Entity;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  isActive: boolean;
  defaultValue: string | null;
  section: string | null;
  sortOrder: number;
  options: PicklistOption[];
}

interface FieldForm {
  entity: Entity;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue: string;
  section: string;
  sortOrder: number;
  options: PicklistOption[];
}

const MOCK_FIELDS: CustomField[] = [
  { id: '1', entity: 'CUSTOMER', fieldName: 'industry_code', label: 'Industry Code', fieldType: 'TEXT', isRequired: false, isActive: true, defaultValue: null, section: 'General', sortOrder: 1, options: [] },
  { id: '2', entity: 'CUSTOMER', fieldName: 'annual_revenue', label: 'Annual Revenue', fieldType: 'DECIMAL', isRequired: false, isActive: true, defaultValue: null, section: 'Financial', sortOrder: 2, options: [] },
  { id: '3', entity: 'LEAD', fieldName: 'lead_source_detail', label: 'Lead Source Detail', fieldType: 'PICKLIST', isRequired: true, isActive: true, defaultValue: null, section: 'Source', sortOrder: 1, options: [{ value: 'webinar', label: 'Webinar', color: '#3b82f6' }, { value: 'referral', label: 'Referral', color: '#10b981' }] },
  { id: '4', entity: 'OPPORTUNITY', fieldName: 'competitor', label: 'Competitor', fieldType: 'TEXT', isRequired: false, isActive: false, defaultValue: null, section: 'Details', sortOrder: 1, options: [] },
  { id: '5', entity: 'CONTACT', fieldName: 'linkedin_url', label: 'LinkedIn URL', fieldType: 'URL', isRequired: false, isActive: true, defaultValue: null, section: 'Social', sortOrder: 1, options: [] },
];

const emptyForm = (entity: Entity): FieldForm => ({
  entity, fieldName: '', label: '', fieldType: 'TEXT', isRequired: false, defaultValue: '', section: '', sortOrder: 0, options: [],
});

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntity, setActiveEntity] = useState<Entity>('CUSTOMER');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FieldForm>(emptyForm('CUSTOMER'));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchFields(); }, []);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/custom-fields', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) { setFields(await res.json()); } else { setFields(MOCK_FIELDS); }
    } catch { setFields(MOCK_FIELDS); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ ...form, options: form.fieldType === 'PICKLIST' ? form.options : undefined }),
      });
      if (res.ok) {
        const created = await res.json();
        setFields(prev => [...prev, created]);
      } else {
        setFields(prev => [...prev, { ...form, id: `local-${Date.now()}`, isActive: true, defaultValue: form.defaultValue || null, section: form.section || null, options: form.options }]);
      }
      setShowModal(false);
      setForm(emptyForm(activeEntity));
    } catch {
      setFields(prev => [...prev, { ...form, id: `local-${Date.now()}`, isActive: true, defaultValue: form.defaultValue || null, section: form.section || null, options: form.options }]);
      setShowModal(false);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/crm/custom-fields/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` } });
    } catch { /* proceed with local removal */ }
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const addOption = () => setForm(prev => ({ ...prev, options: [...prev.options, { value: '', label: '', color: '#6b7280' }] }));
  const removeOption = (idx: number) => setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  const updateOption = (idx: number, key: keyof PicklistOption, val: string) => setForm(prev => ({ ...prev, options: prev.options.map((o, i) => i === idx ? { ...o, [key]: val } : o) }));

  const filtered = fields.filter(f => f.entity === activeEntity);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' };
  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' };
  const headStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader title="Custom Fields" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Custom Fields' }]} />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {ENTITIES.map(e => (
          <button key={e} onClick={() => setActiveEntity(e)} style={{ padding: '8px 16px', borderRadius: '6px', border: activeEntity === e ? '2px solid var(--color-primary)' : '1px solid var(--border-primary)', backgroundColor: activeEntity === e ? 'var(--color-primary)' : 'var(--bg-secondary)', color: activeEntity === e ? '#fff' : 'var(--text-primary)', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>
            {e}
          </button>
        ))}
      </div>

      <Card>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{activeEntity} Fields ({filtered.length})</div>
          <Button onClick={() => { setForm(emptyForm(activeEntity)); setShowModal(true); }}><Plus size={16} style={{ marginRight: 4 }} /> Add Field</Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Label', 'Field Name', 'Type', 'Required', 'Section', 'Active', 'Actions'].map(h => <th key={h} style={headStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>No custom fields for {activeEntity}. Click "Add Field" to create one.</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id}>
                <td style={cellStyle}>{f.label}</td>
                <td style={cellStyle}><code style={{ fontSize: '13px', backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{f.fieldName}</code></td>
                <td style={cellStyle}><Badge>{f.fieldType}</Badge></td>
                <td style={cellStyle}>{f.isRequired ? <Badge variant="info">Yes</Badge> : <span style={{ color: 'var(--text-tertiary)' }}>No</span>}</td>
                <td style={cellStyle}>{f.section || '-'}</td>
                <td style={cellStyle}>{f.isActive ? <ToggleRight size={20} style={{ color: 'var(--color-success)' }} /> : <ToggleLeft size={20} style={{ color: 'var(--text-tertiary)' }} />}</td>
                <td style={cellStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', width: '560px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create Custom Field</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div><label style={labelStyle}>Entity</label><input style={inputStyle} value={form.entity} disabled /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={labelStyle}>Label</label><input style={inputStyle} value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }))} required /></div>
                  <div><label style={labelStyle}>Field Name</label><input style={inputStyle} value={form.fieldName} onChange={e => setForm(p => ({ ...p, fieldName: e.target.value }))} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Field Type</label>
                    <select style={inputStyle} value={form.fieldType} onChange={e => setForm(p => ({ ...p, fieldType: e.target.value }))}>
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Section</label><input style={inputStyle} value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. General, Financial" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={labelStyle}>Default Value</label><input style={inputStyle} value={form.defaultValue} onChange={e => setForm(p => ({ ...p, defaultValue: e.target.value }))} /></div>
                  <div><label style={labelStyle}>Sort Order</label><input style={inputStyle} type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isRequired" checked={form.isRequired} onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))} />
                  <label htmlFor="isRequired" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Required Field</label>
                </div>

                {form.fieldType === 'PICKLIST' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={labelStyle}>Picklist Options</label>
                      <button type="button" onClick={addOption} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 500 }}><Plus size={14} /> Add Option</button>
                    </div>
                    {form.options.map((opt, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input style={inputStyle} placeholder="Value" value={opt.value} onChange={e => updateOption(idx, 'value', e.target.value)} />
                        <input style={inputStyle} placeholder="Label" value={opt.label} onChange={e => updateOption(idx, 'label', e.target.value)} />
                        <input type="color" value={opt.color} onChange={e => updateOption(idx, 'color', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer' }} />
                        <button type="button" onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : <><Save size={16} style={{ marginRight: 4 }} /> Create Field</>}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
