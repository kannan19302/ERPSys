'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { Plus, X, Save, Trash2, Edit3, Layers, Star, FileText, Search, Copy } from 'lucide-react';

const ENTITIES = ['CUSTOMER', 'CONTACT', 'LEAD', 'OPPORTUNITY', 'QUOTATION', 'VENDOR'] as const;
type Entity = typeof ENTITIES[number];

interface RecordType {
  id: string;
  entity: Entity;
  name: string;
  description: string | null;
  isDefault: boolean;
  fieldCount: number;
  createdAt: string;
}

interface RecordTypeForm {
  entity: Entity;
  name: string;
  description: string;
  isDefault: boolean;
}

const MOCK_RECORD_TYPES: RecordType[] = [
  { id: '1', entity: 'CUSTOMER', name: 'Standard Customer', description: 'Default customer record layout with all standard fields.', isDefault: true, fieldCount: 24, createdAt: '2026-06-01T10:00:00Z' },
  { id: '2', entity: 'CUSTOMER', name: 'Enterprise Customer', description: 'Extended layout for enterprise accounts with additional compliance fields.', isDefault: false, fieldCount: 32, createdAt: '2026-06-05T14:00:00Z' },
  { id: '3', entity: 'LEAD', name: 'Inbound Lead', description: 'Layout for leads generated from website and marketing campaigns.', isDefault: true, fieldCount: 18, createdAt: '2026-06-02T09:00:00Z' },
  { id: '4', entity: 'LEAD', name: 'Outbound Lead', description: 'Layout for outbound prospecting leads with call tracking.', isDefault: false, fieldCount: 20, createdAt: '2026-06-08T11:00:00Z' },
  { id: '5', entity: 'OPPORTUNITY', name: 'Standard Deal', description: 'Default opportunity layout for standard sales processes.', isDefault: true, fieldCount: 22, createdAt: '2026-06-03T10:00:00Z' },
  { id: '6', entity: 'CONTACT', name: 'Standard Contact', description: 'Default contact record type.', isDefault: true, fieldCount: 16, createdAt: '2026-06-01T10:00:00Z' },
];

const emptyForm = (entity: Entity): RecordTypeForm => ({ entity, name: '', description: '', isDefault: false });

export default function RecordTypesPage() {
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntity, setActiveEntity] = useState<Entity>('CUSTOMER');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<RecordTypeForm>(emptyForm('CUSTOMER'));
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchRecordTypes(); }, []);

  const fetchRecordTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/record-types', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) { setRecordTypes(await res.json()); } else { setRecordTypes(MOCK_RECORD_TYPES); }
    } catch { setRecordTypes(MOCK_RECORD_TYPES); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/record-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setRecordTypes(prev => [...prev, created]);
      } else {
        setRecordTypes(prev => [...prev, { ...form, id: `local-${Date.now()}`, fieldCount: 0, description: form.description || null, createdAt: new Date().toISOString() }]);
      }
      setShowModal(false);
      setForm(emptyForm(activeEntity));
    } catch {
      setRecordTypes(prev => [...prev, { ...form, id: `local-${Date.now()}`, fieldCount: 0, description: form.description || null, createdAt: new Date().toISOString() }]);
      setShowModal(false);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/crm/record-types/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` } });
    } catch { /* proceed */ }
    setRecordTypes(prev => prev.filter(r => r.id !== id));
    setDeleteConfirm(null);
  };

  const handleDuplicate = (rt: RecordType) => {
    setForm({ entity: rt.entity, name: `${rt.name} (Copy)`, description: rt.description || '', isDefault: false });
    setShowModal(true);
  };

  const filtered = recordTypes.filter(r => {
    const matchesEntity = r.entity === activeEntity;
    const matchesSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEntity && matchesSearch;
  });

  const entityCounts = ENTITIES.reduce((acc, e) => {
    acc[e] = recordTypes.filter(r => r.entity === e).length;
    return acc;
  }, {} as Record<string, number>);
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader title="Record Types" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Record Types' }]} />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {ENTITIES.map(e => (
          <button key={e} onClick={() => setActiveEntity(e)} style={{ padding: '8px 16px', borderRadius: '6px', border: activeEntity === e ? '2px solid var(--color-primary)' : '1px solid var(--border-primary)', backgroundColor: activeEntity === e ? 'var(--color-primary)' : 'var(--bg-secondary)', color: activeEntity === e ? '#fff' : 'var(--text-primary)', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>
            {e} {entityCounts[e] > 0 && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({entityCounts[e]})</span>}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{activeEntity} Record Types ({filtered.length})</div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input style={{ ...inputStyle, paddingLeft: '32px', width: '200px' }} placeholder="Search record types..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => { setForm(emptyForm(activeEntity)); setShowModal(true); }}><Plus size={16} style={{ marginRight: 4 }} /> New Record Type</Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Layers size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <div>No record types for {activeEntity}. Create one to customize field layouts.</div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(rt => (
            <Card key={rt.id}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-primary-light, #eff6ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{rt.name}</div>
                      {rt.isDefault && <Badge variant="success" style={{ marginTop: '2px' }}>Default</Badge>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }} title="Edit"><Edit3 size={16} /></button>
                    <button onClick={() => handleDuplicate(rt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }} title="Duplicate"><Copy size={16} /></button>
                    {!rt.isDefault && <button onClick={() => setDeleteConfirm(rt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px' }} title="Delete"><Trash2 size={16} /></button>}
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>{rt.description || 'No description provided.'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    <Layers size={14} /> {rt.fieldCount} fields
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Created {new Date(rt.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create Record Type</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div><label style={labelStyle}>Entity</label><input style={inputStyle} value={form.entity} disabled /></div>
                <div><label style={labelStyle}>Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Enterprise Customer" /></div>
                <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the purpose of this record type..." /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                  <label htmlFor="isDefault" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Set as default record type</label>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : <><Save size={16} style={{ marginRight: 4 }} /> Create</>}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} style={{ color: 'var(--color-danger)' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>Delete Record Type</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  This action cannot be undone. Records using this type will be reassigned to the default type.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
