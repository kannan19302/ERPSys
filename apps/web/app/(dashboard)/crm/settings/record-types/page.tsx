'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { Plus, X, Save, Trash2, Edit3, Layers, Star, FileText, Search, Copy } from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

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
  const client = useApiClient();

  const fetchRecordTypes = useCallback(async () => {
    setLoading(true);
    try {
      const d = await client.get<any>('/crm/record-types');
      setRecordTypes(d || []);
    } catch {
      setRecordTypes([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchRecordTypes();
  }, [fetchRecordTypes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await client.post<any>('/crm/record-types', form);
      setRecordTypes(prev => [...prev, created]);
      setShowModal(false);
      setForm(emptyForm(activeEntity));
    } catch {
      setRecordTypes(prev => [...prev, { ...form, id: `local-${Date.now()}`, fieldCount: 0, description: form.description || null, createdAt: new Date().toISOString() }]);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/crm/record-types/${id}`);
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
        <PageHeader title="Record Types" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Record Types' }]} />

        <div className={styles.style2}>
          {ENTITIES.map(e => (
            <button key={e} onClick={() => setActiveEntity(e)} style={{ border: activeEntity === e ? '2px solid var(--color-primary)' : '1px solid var(--border-primary)', backgroundColor: activeEntity === e ? 'var(--color-primary)' : 'var(--bg-secondary)', color: activeEntity === e ? 'var(--color-primary-text)' : 'var(--text-primary)' }} className={styles.s1}>
              {e} {(entityCounts[e] ?? 0) > 0 && <span className={styles.s2}>({entityCounts[e] ?? 0})</span>}
            </button>
          ))}
        </div>

        <div className={styles.style3}>
          <div className={styles.style4}>
            <div className={styles.style5}>{activeEntity} Record Types ({filtered.length})</div>
            <div className="relative">
              <Search size={14} className={styles.style6} />
              <input style={{ ...inputStyle }} className={styles.s3} placeholder="Search record types..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <Button onClick={() => { setForm(emptyForm(activeEntity)); setShowModal(true); }}><Plus size={16} className="mr-1" /> New Record Type</Button>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <div className={styles.style7}>
              <Layers size={40} className={styles.s6} />
              <div>No record types for {activeEntity}. Create one to customize field layouts.</div>
            </div>
          </Card>
        ) : (
          <div className={styles.style8}>
            {filtered.map(rt => (
              <Card key={rt.id}>
                <div className="p-5">
                  <div className={styles.style9}>
                    <div className={styles.style10}>
                      <div className={styles.style11}>
                        <FileText size={18} className="ui-text-primary" />
                      </div>
                      <div>
                        <div className={styles.style12}>{rt.name}</div>
                        {rt.isDefault && <span className={styles.style13}><Badge variant="success">Default</Badge></span>}
                      </div>
                    </div>
                    <div className={styles.style14}>
                      <button className={styles.style15} title="Edit"><Edit3 size={16} /></button>
                      <button onClick={() => handleDuplicate(rt)} className={styles.style16} title="Duplicate"><Copy size={16} /></button>
                      {!rt.isDefault && <button onClick={() => setDeleteConfirm(rt.id)} className={styles.style17} title="Delete"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                  <p className={styles.s4}>{rt.description || 'No description provided.'}</p>
                  <div className={styles.style18}>
                    <div className={styles.style19}>
                      <Layers size={14} /> {rt.fieldCount} fields
                    </div>
                    <div className={styles.style20}>Created {new Date(rt.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showModal && (
          <div className={styles.style21}>
            <div className={styles.style22}>
              <div className={styles.style23}>
                <h3 className={styles.style24}>Create Record Type</h3>
                <button onClick={() => setShowModal(false)} className={styles.style25}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className={styles.style26}>
                  <div><label style={labelStyle}>Entity</label><input style={inputStyle} value={form.entity} disabled /></div>
                  <div><label style={labelStyle}>Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Enterprise Customer" /></div>
                  <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle }} className={styles.s5} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the purpose of this record type..." /></div>
                  <div className={styles.style27}>
                    <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
                    <label htmlFor="isDefault" className={styles.style28}>Set as default record type</label>
                  </div>
                </div>
                <div className={styles.style29}>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : <><Save size={16} className="mr-1" /> Create</>}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className={styles.style30}>
            <div className={styles.style31}>
              <div className={styles.style32}>
                <div className={styles.style33}>
                  <Trash2 size={20} className="ui-text-danger" />
                </div>
                <div>
                  <h3 className={styles.style34}>Delete Record Type</h3>
                  <p className={styles.style35}>
                    This action cannot be undone. Records using this type will be reassigned to the default type.
                  </p>
                </div>
              </div>
              <div className={styles.style36}>
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
