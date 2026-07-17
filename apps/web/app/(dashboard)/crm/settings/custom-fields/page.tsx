'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, X, Save, Trash2, Edit3, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

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
  { id: '3', entity: 'LEAD', fieldName: 'lead_source_detail', label: 'Lead Source Detail', fieldType: 'PICKLIST', isRequired: true, isActive: true, defaultValue: null, section: 'Source', sortOrder: 1, options: [{ value: 'webinar', label: 'Webinar', color: 'var(--color-primary)' }, { value: 'referral', label: 'Referral', color: 'var(--color-success)' }] },
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
  const client = useApiClient();

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const d = await client.get<any>('/crm/custom-fields');
      setFields(d || []);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await client.post<any>('/crm/custom-fields', { ...form, options: form.fieldType === 'PICKLIST' ? form.options : undefined });
      setFields(prev => [...prev, created]);
      setShowModal(false);
      setForm(emptyForm(activeEntity));
    } catch {
      setFields(prev => [...prev, { ...form, id: `local-${Date.now()}`, isActive: true, defaultValue: form.defaultValue || null, section: form.section || null, options: form.options }]);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/crm/custom-fields/${id}`);
    } catch { /* proceed with local removal */ }
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const addOption = () => setForm(prev => ({ ...prev, options: [...prev.options, { value: '', label: '', color: 'var(--color-text-tertiary)' }] }));
  const removeOption = (idx: number) => setForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  const updateOption = (idx: number, key: keyof PicklistOption, val: string) => setForm(prev => ({ ...prev, options: prev.options.map((o, i) => i === idx ? { ...o, [key]: val } : o) }));

  const filtered = fields.filter(f => f.entity === activeEntity);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' };
  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' };
  const headStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

  if (loading) {
    return (
      <RouteGuard permission="crm.read">
        <div className={styles.style0}><Spinner size="lg" /></div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="crm.read">
      <div className={styles.style1}>
        <PageHeader title="Custom Fields" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Custom Fields' }]} />

        <div className={styles.style2}>
          {ENTITIES.map(e => (
            <button key={e} onClick={() => setActiveEntity(e)} style={{ border: activeEntity === e ? '2px solid var(--color-primary)' : '1px solid var(--border-primary)', backgroundColor: activeEntity === e ? 'var(--color-primary)' : 'var(--bg-secondary)', color: activeEntity === e ? 'var(--color-primary-text)' : 'var(--text-primary)' }} className={styles.s1}>
              {e}
            </button>
          ))}
        </div>

        <Card>
          <div className={styles.style3}>
            <div className={styles.style4}>{activeEntity} Fields ({filtered.length})</div>
            <Button onClick={() => { setForm(emptyForm(activeEntity)); setShowModal(true); }}><Plus size={16} className="mr-1" /> Add Field</Button>
          </div>
          <ListPageTemplate
            columns={[
              { key: 'label', header: 'Label' },
              { key: 'fieldName', header: 'Field Name', render: (v) => <code className={styles.style5}>{String(v)}</code> },
              { key: 'fieldType', header: 'Type', render: (v) => <Badge>{String(v)}</Badge> },
              { key: 'isRequired', header: 'Required', render: (v) => v ? <Badge variant="info">Yes</Badge> : <span className={styles.style6}>No</span> },
              { key: 'section', header: 'Section', render: (v) => String(v || '-') },
              { key: 'isActive', header: 'Active', render: (v) => v ? <ToggleRight size={20} className="ui-text-success" /> : <ToggleLeft size={20} className={styles.style7} /> },
              { key: 'id', header: 'Actions', render: (v) => (
                <div className={styles.style8}>
                  <button className={styles.style9}><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(String(v))} className="ui-btn-icon ui-text-danger"><Trash2 size={16} /></button>
                </div>
              ) },
            ] as ListColumn[]}
            data={filtered as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No custom fields"
            emptyDescription={`No custom fields for ${activeEntity}. Click "Add Field" to create one.`}
          />
        </Card>

        {showModal && (
          <div className={styles.style10}>
            <div className={styles.style11}>
              <div className={styles.style12}>
                <h3 className={styles.style13}>Create Custom Field</h3>
                <button onClick={() => setShowModal(false)} className={styles.style14}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className={styles.style15}>
                  <div><label style={labelStyle}>Entity</label><input style={inputStyle} value={form.entity} disabled /></div>
                  <div className={styles.style16}>
                    <div><label style={labelStyle}>Label</label><input style={inputStyle} value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }))} required /></div>
                    <div><label style={labelStyle}>Field Name</label><input style={inputStyle} value={form.fieldName} onChange={e => setForm(p => ({ ...p, fieldName: e.target.value }))} required /></div>
                  </div>
                  <div className={styles.style17}>
                    <div>
                      <label style={labelStyle}>Field Type</label>
                      <select style={inputStyle} value={form.fieldType} onChange={e => setForm(p => ({ ...p, fieldType: e.target.value }))}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><label style={labelStyle}>Section</label><input style={inputStyle} value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. General, Financial" /></div>
                  </div>
                  <div className={styles.style18}>
                    <div><label style={labelStyle}>Default Value</label><input style={inputStyle} value={form.defaultValue} onChange={e => setForm(p => ({ ...p, defaultValue: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Sort Order</label><input style={inputStyle} type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></div>
                  </div>
                  <div className={styles.style19}>
                    <input type="checkbox" id="isRequired" checked={form.isRequired} onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))} />
                    <label htmlFor="isRequired" className={styles.style20}>Required Field</label>
                  </div>

                  {form.fieldType === 'PICKLIST' && (
                    <div>
                      <div className={styles.style21}>
                        <label style={labelStyle}>Picklist Options</label>
                        <button type="button" onClick={addOption} className={styles.style22}><Plus size={14} /> Add Option</button>
                      </div>
                      {form.options.map((opt, idx) => (
                        <div key={idx} className={styles.style23}>
                          <input style={inputStyle} placeholder="Value" value={opt.value} onChange={e => updateOption(idx, 'value', e.target.value)} />
                          <input style={inputStyle} placeholder="Label" value={opt.label} onChange={e => updateOption(idx, 'label', e.target.value)} />
                          <input type="color" value={opt.color} onChange={e => updateOption(idx, 'color', e.target.value)} className={styles.style24} />
                          <button type="button" onClick={() => removeOption(idx)} className="ui-btn-icon ui-text-danger"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.style25}>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : <><Save size={16} className="mr-1" /> Create Field</>}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
