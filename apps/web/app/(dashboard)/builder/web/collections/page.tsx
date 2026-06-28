'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import {
  Database, Plus, Search, Trash2, Edit3, Star, ArrowLeft, X, Sparkles, Layers,
  CheckCircle, Circle, Eye, Wand2, Globe, FileText, GripVertical,
} from 'lucide-react';

const FIELD_TYPES = [
  'Text', 'Textarea', 'RichText', 'Number', 'Price', 'Boolean', 'Date',
  'Image', 'Gallery', 'Select', 'Color', 'URL', 'Email', 'Tags', 'Reference',
];

const api = (path: string, opts: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(`/api/v1/builder/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...(opts.headers || {}) },
  });
};

// ════════════════════════════════════════════════
// Dynamic entry field renderer
// ════════════════════════════════════════════════
function EntryField({ field, value, onChange }: { field: any; value: any; onChange: (v: any) => void }) {
  const label = (
    <label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
      {field.label}{field.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
    </label>
  );
  const base: React.CSSProperties = { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' };

  switch (field.type) {
    case 'Boolean':
      return (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}
          </label>
        </div>
      );
    case 'Textarea': case 'RichText':
      return <div>{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ ...base, minHeight: field.type === 'RichText' ? 140 : 70, resize: 'vertical', fontFamily: field.type === 'RichText' ? 'inherit' : undefined }} placeholder={field.type === 'RichText' ? 'Rich content (HTML/markdown supported at render time)…' : ''} /></div>;
    case 'Number': case 'Price':
      return <div>{label}<input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} style={base} placeholder={field.type === 'Price' ? '0.00' : '0'} /></div>;
    case 'Date':
      return <div>{label}<input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} style={base} /></div>;
    case 'Color':
      return <div>{label}<div style={{ display: 'flex', gap: 8 }}><input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} style={{ width: 44, height: 36, padding: 2, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} /><input value={value || ''} onChange={(e) => onChange(e.target.value)} style={base} placeholder="#000000" /></div></div>;
    case 'Select':
      return <div>{label}<select value={value || ''} onChange={(e) => onChange(e.target.value)} style={base}><option value="">Select…</option>{String(field.options || '').split(/\n|,/).map((o: string) => o.trim()).filter(Boolean).map((o: string) => <option key={o} value={o}>{o}</option>)}</select></div>;
    case 'Gallery':
      return <div>{label}<textarea value={Array.isArray(value) ? value.join('\n') : (value || '')} onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} style={{ ...base, minHeight: 70, fontFamily: 'monospace', fontSize: 'var(--text-xs)' }} placeholder="One image URL per line" /></div>;
    case 'Tags':
      return <div>{label}<input value={Array.isArray(value) ? value.join(', ') : (value || '')} onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} style={base} placeholder="comma, separated, tags" /></div>;
    case 'Image':
      return (
        <div>{label}
          <input value={value || ''} onChange={(e) => onChange(e.target.value)} style={base} placeholder="https://… image URL" />
          {value && <img src={value} alt="" style={{ marginTop: 8, maxHeight: 80, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />}
        </div>
      );
    default: // Text, URL, Email, Reference (basic)
      return <div>{label}<input type={field.type === 'Email' ? 'email' : field.type === 'URL' ? 'url' : 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} style={base} placeholder={field.helpText || ''} /></div>;
  }
}

// ════════════════════════════════════════════════
// Entry editor drawer
// ════════════════════════════════════════════════
function EntryEditor({ collection, item, onClose, onSaved }: { collection: any; item: any | null; onClose: () => void; onSaved: () => void }) {
  const fields: any[] = Array.isArray(collection.fields) ? collection.fields : [];
  const [data, setData] = useState<Record<string, any>>(item?.data || {});
  const [status, setStatus] = useState(item?.status || 'DRAFT');
  const [featured, setFeatured] = useState(!!item?.featured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    // Required validation
    const missing = fields.filter((f) => f.required && (data[f.name] === undefined || data[f.name] === '' || data[f.name] === null));
    if (missing.length) { setError(`Missing required: ${missing.map((f) => f.label).join(', ')}`); return; }
    setSaving(true); setError('');
    const body = JSON.stringify({ data, status, featured });
    const res = item
      ? await api(`web-collections/${collection.id}/items/${item.id}`, { method: 'PATCH', body })
      : await api(`web-collections/${collection.id}/items`, { method: 'POST', body });
    setSaving(false);
    if (res.ok) onSaved();
    else { const d = await res.json().catch(() => ({})); setError(d.message || 'Failed to save'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: 520, maxWidth: '100%', background: 'var(--color-bg)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', borderLeft: '1px solid var(--color-border)' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' }}>{item ? 'Edit' : 'New'} {collection.singular || 'Entry'}</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{collection.name}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>{error}</div>}
          {fields.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>This collection has no fields yet. Add fields in collection settings.</div>}
          {fields.map((f) => (
            <EntryField key={f.name} field={f} value={data[f.name]} onChange={(v) => setData((p) => ({ ...p, [f.name]: v }))} />
          ))}
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg-subtle)', padding: 4, borderRadius: 'var(--radius-md)' }}>
            {['DRAFT', 'PUBLISHED'].map((s) => (
              <button key={s} onClick={() => setStatus(s)} style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, background: status === s ? (s === 'PUBLISHED' ? '#16a34a' : 'var(--color-text-secondary)') : 'transparent', color: status === s ? '#fff' : 'var(--color-text-secondary)' }}>{s === 'PUBLISHED' ? 'Published' : 'Draft'}</button>
            ))}
          </div>
          <button onClick={() => setFeatured(!featured)} title="Featured" style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 6, cursor: 'pointer', color: featured ? '#f59e0b' : 'var(--color-text-muted)' }}>
            <Star size={16} fill={featured ? '#f59e0b' : 'none'} />
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={handleSave} disabled={saving} style={{ padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// Create-collection modal (presets + custom field builder)
// ════════════════════════════════════════════════
function CreateCollectionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [tab, setTab] = useState<'preset' | 'custom'>('preset');
  const [presets, setPresets] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [fields, setFields] = useState<any[]>([{ name: 'title', label: 'Title', type: 'Text', required: true }]);
  const [error, setError] = useState('');

  useEffect(() => { api('web-collections/presets').then(async (r) => { if (r.ok) setPresets(await r.json()); }); }, []);

  const seedPreset = async (preset: string) => {
    setBusy(preset);
    const res = await api('web-collections/seed', { method: 'POST', body: JSON.stringify({ preset }) });
    setBusy(null);
    if (res.ok) onCreated();
  };

  const addField = () => setFields([...fields, { name: '', label: '', type: 'Text', required: false }]);
  const updateField = (i: number, key: string, val: any) => { const n = [...fields]; (n[i] as any)[key] = val; if (key === 'label' && !n[i].name) n[i].name = String(val).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''); setFields(n); };
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));

  const createCustom = async () => {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required'); return; }
    setBusy('custom');
    const res = await api('web-collections', { method: 'POST', body: JSON.stringify({ name, slug, singular: name, fields, settings: { titleField: fields[0]?.name || 'title' } }) });
    setBusy(null);
    if (res.ok) onCreated();
    else { const d = await res.json().catch(() => ({})); setError(d.message || 'Failed to create'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', width: 720, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>New Collection</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 'var(--space-3) var(--space-6) 0' }}>
          {([['preset', 'Start from preset', Sparkles], ['custom', 'Build custom', Wand2]] as const).map(([v, lbl, Icon]) => (
            <button key={v} onClick={() => setTab(v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 'var(--space-2) var(--space-4)', border: 'none', borderBottom: tab === v ? '2px solid var(--color-primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', color: tab === v ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}><Icon size={15} /> {lbl}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5) var(--space-6)' }}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>{error}</div>}

          {tab === 'preset' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {presets.map((p) => (
                <button key={p.preset} onClick={() => seedPreset(p.preset)} disabled={!!busy}
                  style={{ textAlign: 'left', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = p.color)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                  <div style={{ fontSize: 26 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 6px' }}>{p.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{busy === p.preset ? 'Creating…' : `${p.fieldCount} fields · ${p.sampleCount} samples`}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Name</label><input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} placeholder="e.g. Case Studies" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} /></div>
                <div><label style={{ display: 'block', marginBottom: 4, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Slug</label><input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'monospace' }} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Fields</label>
                  <button onClick={addField} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}><Plus size={14} /> Add Field</button>
                </div>
                {fields.map((f, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 40px 30px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input value={f.label} onChange={(e) => updateField(i, 'label', e.target.value)} placeholder="Label" style={{ padding: 6, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
                    <input value={f.name} onChange={(e) => updateField(i, 'name', e.target.value)} placeholder="field_name" style={{ padding: 6, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'monospace' }} />
                    <select value={f.type} onChange={(e) => updateField(i, 'type', e.target.value)} style={{ padding: 6, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)' }}>{FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--color-text-muted)' }}><input type="checkbox" checked={f.required} onChange={(e) => updateField(i, 'required', e.target.checked)} />Req</label>
                    <button onClick={() => removeField(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={createCustom} disabled={busy === 'custom'} style={{ padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{busy === 'custom' ? 'Creating…' : 'Create Collection'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════════
export default function WebCollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingItem, setEditingItem] = useState<any | null | undefined>(undefined); // undefined=closed, null=new

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const res = await api('web-collections');
    if (res.ok) setCollections(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const fetchItems = useCallback(async (col: any) => {
    const qp = new URLSearchParams();
    if (itemSearch) qp.set('search', itemSearch);
    if (statusFilter !== 'ALL') qp.set('status', statusFilter);
    const res = await api(`web-collections/${col.id}/items?${qp}`);
    if (res.ok) { const d = await res.json(); setItems(d.data || []); }
  }, [itemSearch, statusFilter]);

  useEffect(() => { if (active) fetchItems(active); }, [active, fetchItems]);

  const openCollection = async (col: any) => { setActive(col); setStatusFilter('ALL'); setItemSearch(''); };

  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<string | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<string | null>(null);

  const deleteCollection = async (id: string) => {
    await api(`web-collections/${id}`, { method: 'DELETE' });
    fetchCollections();
  };

  const deleteItem = async (id: string) => {
    await api(`web-collections/${active.id}/items/${id}`, { method: 'DELETE' });
    fetchItems(active);
  };

  const titleOf = (col: any, item: any) => {
    const tf = (col.settings && (col.settings as any).titleField) || 'title';
    const d = item.data || {};
    return d[tf] || d.name || d.title || item.slug;
  };

  // ── Items view ──
  if (active) {
    const fieldCount = Array.isArray(active.fields) ? active.fields.length : 0;
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <button onClick={() => setActive(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 6, padding: 0 }}><ArrowLeft size={14} /> All Collections</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 24 }}>{active.icon || '📦'}</span>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{active.name}</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }}>{active.kind}</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{items.length} entries · {fieldCount} fields · <span style={{ fontFamily: 'monospace' }}>/{active.slug}</span></p>
          </div>
          <button className="frappe-btn frappe-btn-primary" onClick={() => setEditingItem(null)}><Plus size={15} /> New {active.singular || 'Entry'}</button>
        </div>

        <div className="frappe-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} placeholder="Search entries…" style={{ width: '100%', padding: '6px 6px 6px 30px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
            </div>
            {['ALL', 'PUBLISHED', 'DRAFT'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '4px 12px', borderRadius: 'var(--radius-md)', border: statusFilter === s ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: statusFilter === s ? 'var(--color-primary-bg)' : 'transparent', color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>{s.toLowerCase()}</button>
            ))}
          </div>
          <table className="frappe-table" style={{ width: '100%' }}>
            <thead><tr><th>Title</th><th style={{ width: 110 }}>Status</th><th style={{ width: 70 }}>Featured</th><th style={{ width: 160 }}>Slug</th><th style={{ width: 90 }}></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} style={{ cursor: 'pointer' }} onClick={() => setEditingItem(it)}>
                  <td style={{ fontWeight: 'var(--weight-medium)' }}>{titleOf(active, it)}</td>
                  <td><span className={`frappe-badge ${it.status === 'PUBLISHED' ? 'frappe-badge-success' : 'frappe-badge-warning'}`}>{it.status}</span></td>
                  <td>{it.featured ? <Star size={14} fill="#f59e0b" style={{ color: '#f59e0b' }} /> : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{it.slug}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingItem(it)}><Edit3 size={13} /></button>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: '4px 8px', color: 'var(--color-danger)' }} onClick={() => setDeleteItemTarget(it.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>No entries yet. Click “New {active.singular || 'Entry'}”.</td></tr>}
            </tbody>
          </table>
        </div>

        {editingItem !== undefined && (
          <EntryEditor collection={active} item={editingItem} onClose={() => setEditingItem(undefined)} onSaved={() => { setEditingItem(undefined); fetchItems(active); fetchCollections(); }} />
        )}
        <ConfirmDialog
          open={!!deleteItemTarget}
          onClose={() => setDeleteItemTarget(null)}
          onConfirm={() => { if (deleteItemTarget) { deleteItem(deleteItemTarget); setDeleteItemTarget(null); } }}
          title="Delete Entry"
          message="Are you sure you want to delete this entry?"
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    );
  }

  // ── Collections list view ──
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="CMS Collections"
        description="Model dynamic content — products, projects, team, testimonials — for your website"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Studio</button>
            <button className="frappe-btn frappe-btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> New Collection</button>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 'var(--space-4)' }}>{[1, 2, 3].map((i) => <div key={i} className="frappe-card" style={{ height: 130, animation: 'pulse 1.5s ease-in-out infinite' }} />)}</div>
      ) : collections.length === 0 ? (
        <div className="frappe-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Layers size={44} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }} />
          <h3 style={{ margin: '0 0 var(--space-2)', fontWeight: 700 }}>No collections yet</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>Start from a ready-made preset (Products, Projects, Team…) or build your own.</p>
          <button className="frappe-btn frappe-btn-primary" style={{ margin: '0 auto' }} onClick={() => setShowCreate(true)}><Sparkles size={15} /> Create your first collection</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 'var(--space-4)' }}>
          {collections.map((c) => (
            <div key={c.id} onClick={() => openCollection(c)} className="frappe-card" style={{ padding: 'var(--space-4)', cursor: 'pointer', borderTop: `3px solid ${c.color || 'var(--color-primary)'}` }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-lg)', background: `${c.color || '#6366f1'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{c.icon || '📦'}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{c.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>/{c.slug}</div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDeleteCollectionTarget(c.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Trash2 size={15} /></button>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                <span><strong style={{ color: 'var(--color-text)' }}>{c.itemCount ?? 0}</strong> entries</span>
                <span><strong style={{ color: 'var(--color-text)' }}>{Array.isArray(c.fields) ? c.fields.length : 0}</strong> fields</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: c.color }}>{c.kind}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateCollectionModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchCollections(); }} />}
      <ConfirmDialog
        open={!!deleteCollectionTarget}
        onClose={() => setDeleteCollectionTarget(null)}
        onConfirm={() => { if (deleteCollectionTarget) { deleteCollection(deleteCollectionTarget); setDeleteCollectionTarget(null); } }}
        title="Delete Collection"
        message="Are you sure you want to delete this collection and all its entries? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
      <style>{`@keyframes pulse {0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
