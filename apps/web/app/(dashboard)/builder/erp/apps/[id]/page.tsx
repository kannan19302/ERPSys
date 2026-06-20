/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  FileCode2,
  Database,
  Workflow,
  BarChart3,
  Layers,
  Play,
  Rocket,
  Plus,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Globe,
  Lock,
  Activity,
  Eye,
  Clock,
  Copy,
  Search,
  ChevronRight,
  Zap,
  ShieldCheck,
  RefreshCw,
  Package,
  History,
  RotateCcw,
  Tag,
  ExternalLink,
  MonitorPlay,
  List as ListIcon,
} from 'lucide-react';
import { DynamicFormRenderer } from '@/components/builder/DynamicFormRenderer';
import { FormBuilderWorkspace } from '@/components/builder/FormBuilderWorkspace';
import { PageBuilderWorkspace } from '@/components/builder/PageBuilderWorkspace';
import { WorkflowEditorWorkspace } from '@/components/builder/WorkflowEditorWorkspace';
import { DashboardEditorWorkspace } from '@/components/builder/DashboardEditorWorkspace';
import { Pencil, Wand2 } from 'lucide-react';

interface AppModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  scope: string;
  version: string;
  components: any[];
  pages: any[];
  dataModels: any[];
  testResults: any;
  entities: any[];
  relationships: any[];
  permissions: any;
  publishedAt: string | null;
  resolvedComponents?: { forms: any[]; workflows: any[]; dashboards: any[]; automations: any[] };
  createdAt: string;
  updatedAt: string;
}

type Section = 'overview' | 'pages' | 'forms' | 'data-models' | 'workflows' | 'dashboards' | 'automations' | 'preview' | 'test' | 'publish';

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'pages', label: 'Pages', icon: Layers },
  { id: 'forms', label: 'Forms', icon: FileCode2 },
  { id: 'data-models', label: 'Data Models', icon: Database },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'dashboards', label: 'Dashboards', icon: BarChart3 },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'preview', label: 'Preview', icon: MonitorPlay },
  { id: 'test', label: 'Test Engine', icon: Play },
  { id: 'publish', label: 'Publish', icon: Rocket },
];

// ═══════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<any>; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-10)', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}>
      <Icon size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }} />
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: action ? 'var(--space-4)' : 0 }}>{description}</p>
      {action}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: 'var(--space-2) var(--space-4)',
      borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: '#fff',
      cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
    }}>
      <Plus size={16} /> {label}
    </button>
  );
}

// ═══════════════════════════════════════════════
// Add Component Modal (Link existing or create new)
// ═══════════════════════════════════════════════

function AddComponentModal({ isOpen, onClose, type, appId, onSuccess }: {
  isOpen: boolean; onClose: () => void; type: 'form' | 'workflow' | 'dashboard' | 'automation'; appId: string; onSuccess: () => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [linking, setLinking] = useState<string | null>(null);

  const endpoints: Record<string, string> = {
    form: 'forms', workflow: 'workflows', dashboard: 'dashboards', automation: 'automation-rules',
  };

  useEffect(() => {
    if (!isOpen) return;
    const fetchItems = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/${endpoints[type]}`, { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.data || []);
      }
      setLoading(false);
    };
    fetchItems();
  }, [isOpen, type]);

  const handleLink = async (item: any) => {
    setLinking(item.id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/builder/modules/${appId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ type, refId: item.id, name: item.name || item.title || 'Untitled' }),
      });
      if (res.ok) onSuccess();
    } catch { /* ignore */ }
    setLinking(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const token = localStorage.getItem('token');
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let body: any;
    if (type === 'form') body = { name: newName, slug };
    else if (type === 'workflow') body = { name: newName };
    else if (type === 'dashboard') body = { name: newName };
    else body = { name: newName, trigger: 'record.created' };

    try {
      const res = await fetch(`/api/v1/builder/${endpoints[type]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        // Auto-link the new component
        await fetch(`/api/v1/builder/modules/${appId}/components`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
          body: JSON.stringify({ type, refId: data.id, name: newName }),
        });
        onSuccess();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const filtered = items.filter(i => {
    const name = (i.name || i.title || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (!isOpen) return null;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 540, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' }}>Add {typeLabel}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        {/* Quick create */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Create New</div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`New ${typeLabel} name...`}
              style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
            <button onClick={handleCreate} disabled={creating || !newName.trim()}
              style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: creating || !newName.trim() ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              {creating ? 'Creating...' : 'Create & Link'}
            </button>
          </div>
        </div>

        {/* Search existing */}
        <div style={{ padding: 'var(--space-3) var(--space-6)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search existing..."
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) 32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--space-6) var(--space-4)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No existing {typeLabel.toLowerCase()}s found. Create a new one above.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filtered.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{item.name || item.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {item.status || 'DRAFT'} · {item.slug || item.docType || ''}
                    </div>
                  </div>
                  <button onClick={() => handleLink(item)} disabled={linking === item.id}
                    style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                    {linking === item.id ? 'Linking...' : 'Link'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Add Page Modal
// ═══════════════════════════════════════════════

function AddPageModal({ isOpen, onClose, appId, onSuccess, forms, onLaunchFormBuilder }: { isOpen: boolean; onClose: () => void; appId: string; onSuccess: () => void; forms: any[]; onLaunchFormBuilder: (draft: { name: string; slug: string; type: string }) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'form' | 'list' | 'dashboard' | 'custom'>('form');
  const [dataSource, setDataSource] = useState<'existing' | 'build'>('existing');
  const [formId, setFormId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsForm = type === 'form' || type === 'list';

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) return;

    // Build-new path: hand off to the embedded form builder, which will create
    // the form, link it, and create this page bound to it on save.
    if (needsForm && dataSource === 'build') {
      onLaunchFormBuilder({ name, slug, type });
      setName(''); setSlug(''); setFormId('');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${appId}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ name, slug, type, ...(needsForm && formId ? { formId } : {}) }),
    });
    setSubmitting(false);
    setName(''); setSlug(''); setFormId('');
    onSuccess();
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-5)' }}>Add Page</h3>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Page Name</label>
          <input value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)' }} />
        </div>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontFamily: 'monospace' }} />
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Type</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['form', 'list', 'dashboard', 'custom'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: type === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: type === t ? 'var(--color-primary-bg)' : 'var(--color-bg)', cursor: 'pointer', fontWeight: type === t ? 600 : 400, fontSize: 'var(--text-sm)', color: type === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Data source — link an existing form or build one inline */}
        {needsForm && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Form / Data Source</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              {([['existing', 'Link Existing'], ['build', 'Build New']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setDataSource(v)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: dataSource === v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: dataSource === v ? 'var(--color-primary-bg)' : 'var(--color-bg)', cursor: 'pointer', fontWeight: dataSource === v ? 600 : 400, fontSize: 'var(--text-sm)', color: dataSource === v ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {v === 'build' ? <Wand2 size={14} /> : <FileCode2 size={14} />} {label}
                </button>
              ))}
            </div>
            {dataSource === 'existing' ? (
              <select value={formId} onChange={e => setFormId(e.target.value)}
                style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
                <option value="">Select a form…</option>
                {forms.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                The form builder will open. On save, your form is linked and this page is created bound to it.
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim() || (needsForm && dataSource === 'existing' && !formId)}
            style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {needsForm && dataSource === 'build' ? <><Wand2 size={15} /> Build Form & Add Page</> : (submitting ? 'Adding...' : 'Add Page')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Add Data Model Modal
// ═══════════════════════════════════════════════

function AddDataModelModal({ isOpen, onClose, appId, onSuccess }: { isOpen: boolean; onClose: () => void; appId: string; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState<{ name: string; type: string; required: boolean; label: string }[]>([
    { name: 'title', type: 'Data', required: true, label: 'Title' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addField = () => setFields([...fields, { name: '', type: 'Data', required: false, label: '' }]);
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: string, val: any) => {
    const next = [...fields];
    (next[i] as any)[key] = val;
    setFields(next);
  };

  const FIELD_TYPES = ['Data', 'Int', 'Float', 'Currency', 'Date', 'Time', 'Datetime', 'Select', 'Textarea', 'Check', 'Link', 'Email', 'Phone', 'URL', 'Color', 'JSON'];

  const handleSubmit = async () => {
    if (!name.trim() || fields.length === 0) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${appId}/data-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ name, fields }),
    });
    setSubmitting(false);
    setName(''); setFields([{ name: 'title', type: 'Data', required: true, label: 'Title' }]);
    onSuccess();
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-5)' }}>Add Data Model</h3>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Model Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer"
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)' }} />
        </div>

        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Fields</label>
            <button onClick={addField} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              <Plus size={14} /> Add Field
            </button>
          </div>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 40px 32px', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
              <input value={f.name} onChange={e => updateField(i, 'name', e.target.value)} placeholder="field_name"
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontFamily: 'monospace' }} />
              <input value={f.label} onChange={e => updateField(i, 'label', e.target.value)} placeholder="Label"
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
              <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)}
                style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)' }}>
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} /> Req
              </label>
              <button onClick={() => removeField(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <button onClick={onClose} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim()}
            style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {submitting ? 'Adding...' : 'Add Data Model'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Section Renderers
// ═══════════════════════════════════════════════

function OverviewSection({ app, onUpdate }: { app: AppModule; onUpdate: (data: any) => void }) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description || '');
  const [version, setVersion] = useState(app.version || '1.0.0');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/modules/${app.id}/stats`, { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) setStats(await res.json());
    };
    fetchStats();
  }, [app.id]);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ name, description, version });
    setSaving(false);
  };

  const lifecycleCards = stats ? [
    { label: 'Installs', value: stats.installCount ?? 0, icon: Eye, color: '#3b82f6' },
    { label: 'Releases', value: stats.releaseCount ?? 0, icon: Tag, color: '#8b5cf6' },
    { label: 'Automation Runs', value: stats.automationRuns ?? 0, icon: Zap, color: '#f59e0b' },
    { label: 'Test Score', value: stats.testScore != null ? `${stats.testScore}%` : '—', icon: ShieldCheck, color: '#10b981' },
  ] : [];

  return (
    <div>
      <SectionHeader title="App Overview" subtitle="Configure your application's basic information" />

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          {lifecycleCards.map((c, i) => (
            <div key={i} style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <c.icon size={18} style={{ color: c.color }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{c.value}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>App Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Version</label>
            <input value={version} onChange={e => setVersion(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontFamily: 'monospace' }} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', minHeight: 100, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>Slug</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{app.slug}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>Status</div>
            <div style={{ fontSize: 'var(--text-sm)', color: app.status === 'ACTIVE' ? '#16a34a' : '#d97706' }}>{app.status}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>Scope</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{app.scope}</div>
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-5)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComponentListSection({ app, type, typeLabel, icon: Icon, onRefresh, onBuildNew, onEditItem }: { app: AppModule; type: string; typeLabel: string; icon: React.ComponentType<any>; onRefresh: () => void; onBuildNew?: () => void; onEditItem?: (refId: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const components = (Array.isArray(app.components) ? app.components : []).filter(c => c.type === type);

  const handleRemove = async (componentId: string) => {
    if (!confirm(`Remove this ${typeLabel.toLowerCase()} from the app?`)) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${app.id}/components/${componentId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` },
    });
    onRefresh();
  };

  const headerAction = (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {onBuildNew && (
        <button onClick={onBuildNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
          <Wand2 size={16} /> Build New
        </button>
      )}
      <AddButton onClick={() => setShowAdd(true)} label={`Add ${typeLabel}`} />
    </div>
  );

  return (
    <div>
      <SectionHeader title={typeLabel + 's'} subtitle={`Manage ${typeLabel.toLowerCase()} components linked to this app`} action={headerAction} />
      {components.length === 0 ? (
        <EmptyState icon={Icon} title={`No ${typeLabel.toLowerCase()}s yet`} description={`Link or create ${typeLabel.toLowerCase()} components for your app.`}
          action={<AddButton onClick={() => setShowAdd(true)} label={`Add ${typeLabel}`} />} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {components.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{c.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ID: {c.refId?.slice(0, 12)}...</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {onEditItem && (
                  <button onClick={() => onEditItem(c.refId)} title={`Edit ${typeLabel.toLowerCase()}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                    <Pencil size={15} />
                  </button>
                )}
                <button onClick={() => handleRemove(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddComponentModal isOpen={showAdd} onClose={() => setShowAdd(false)} type={type as any} appId={app.id} onSuccess={() => { setShowAdd(false); onRefresh(); }} />
    </div>
  );
}

function PagesSection({ app, onRefresh, forms, onLaunchFormBuilder, onDesignLayout }: { app: AppModule; onRefresh: () => void; forms: any[]; onLaunchFormBuilder: (draft: { name: string; slug: string; type: string }) => void; onDesignLayout: (page: any) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const pages = Array.isArray(app.pages) ? app.pages : [];

  const handleRemove = async (pageId: string) => {
    if (!confirm('Remove this page?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${app.id}/pages/${pageId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` },
    });
    onRefresh();
  };

  const typeColors: Record<string, string> = { form: '#3b82f6', list: '#10b981', dashboard: '#8b5cf6', custom: '#ec4899' };

  return (
    <div>
      <SectionHeader title="Pages" subtitle="Define the pages and navigation for your app" action={<AddButton onClick={() => setShowAdd(true)} label="Add Page" />} />
      {pages.length === 0 ? (
        <EmptyState icon={Layers} title="No pages yet" description="Add pages to define how users navigate your app."
          action={<AddButton onClick={() => setShowAdd(true)} label="Add Page" />} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {pages.map((p: any) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${typeColors[p.type] || '#3b82f6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={18} style={{ color: typeColors[p.type] || '#3b82f6' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontFamily: 'monospace' }}>/{p.slug}</span>
                    <span style={{ padding: '1px 6px', borderRadius: 'var(--radius-full)', background: `${typeColors[p.type] || '#3b82f6'}15`, color: typeColors[p.type] || '#3b82f6', fontWeight: 600, textTransform: 'capitalize' }}>{p.type}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {p.type === 'custom' && (
                  <button onClick={() => onDesignLayout(p)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                    <Pencil size={12} /> Design Layout
                  </button>
                )}
                <button onClick={() => handleRemove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddPageModal isOpen={showAdd} onClose={() => setShowAdd(false)} appId={app.id} forms={forms}
        onLaunchFormBuilder={(draft) => { setShowAdd(false); onLaunchFormBuilder(draft); }}
        onSuccess={() => { setShowAdd(false); onRefresh(); }} />
    </div>
  );
}

function DataModelsSection({ app, onRefresh }: { app: AppModule; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const dataModels = Array.isArray(app.dataModels) ? app.dataModels : [];

  const handleRemove = async (dmId: string) => {
    if (!confirm('Remove this data model?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${app.id}/data-models/${dmId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` },
    });
    onRefresh();
  };

  return (
    <div>
      <SectionHeader title="Data Models" subtitle="Define custom data structures for your app" action={<AddButton onClick={() => setShowAdd(true)} label="Add Data Model" />} />
      {dataModels.length === 0 ? (
        <EmptyState icon={Database} title="No data models yet" description="Define the data structures that power your app."
          action={<AddButton onClick={() => setShowAdd(true)} label="Add Data Model" />} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {dataModels.map((dm: any) => (
            <div key={dm.id} style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Database size={18} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{dm.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{(dm.fields || []).length} fields</div>
                  </div>
                </div>
                <button onClick={() => handleRemove(dm.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Trash2 size={16} /></button>
              </div>
              {dm.fields && dm.fields.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-subtle)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {dm.fields.map((f: any, i: number) => (
                      <span key={i} style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                        {f.name}: {f.type}{f.required ? ' *' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <AddDataModelModal isOpen={showAdd} onClose={() => setShowAdd(false)} appId={app.id} onSuccess={() => { setShowAdd(false); onRefresh(); }} />
    </div>
  );
}

function TestEngineSection({ app, onRefresh }: { app: AppModule; onRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(
    app.testResults && typeof app.testResults === 'object' && !Array.isArray(app.testResults) && (app.testResults as any).score != null ? app.testResults : null
  );

  const runTests = async () => {
    setRunning(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/builder/modules/${app.id}/test`, {
      method: 'POST', headers: { Authorization: `Bearer ${token || ''}` },
    });
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
    setRunning(false);
    onRefresh();
  };

  const severityConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
    error: { icon: XCircle, color: '#dc2626', bg: '#fef2f2' },
    warning: { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb' },
    info: { icon: Info, color: '#3b82f6', bg: '#eff6ff' },
  };

  return (
    <div>
      <SectionHeader title="Test Engine" subtitle="Validate your app before publishing"
        action={
          <button onClick={runTests} disabled={running}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', background: running ? 'var(--color-bg-subtle)' : '#10b981', color: running ? 'var(--color-text-muted)' : '#fff', cursor: running ? 'wait' : 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {running ? <><RefreshCw size={16} className="spin" /> Running Tests...</> : <><Play size={16} /> Run All Tests</>}
          </button>
        } />

      {results ? (
        <div>
          {/* Score Card */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                background: results.score >= 80 ? '#dcfce7' : results.score >= 50 ? '#fef3c7' : '#fee2e2',
                border: `4px solid ${results.score >= 80 ? '#16a34a' : results.score >= 50 ? '#d97706' : '#dc2626'}`,
              }}>
                <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: results.score >= 80 ? '#16a34a' : results.score >= 50 ? '#d97706' : '#dc2626' }}>{results.score}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>/ 100</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                  {results.score >= 80 ? '✅ Ready to Publish' : results.score >= 50 ? '⚠️ Needs Improvement' : '❌ Not Ready'}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span><strong>{results.passed}</strong> passed</span>
                  <span><strong>{results.failed}</strong> failed</span>
                  <span><strong>{results.totalTests}</strong> total tests</span>
                </div>
                {results.lastRunAt && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>Last tested: {new Date(results.lastRunAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>

          {/* Score trend */}
          {Array.isArray(results.history) && results.history.length > 1 && (
            <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>Score Trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
                {[...results.history].reverse().map((h: any, i: number) => (
                  <div key={i} title={`${h.score}% · ${new Date(h.runAt).toLocaleString()}`}
                    style={{ flex: 1, maxWidth: 28, height: `${Math.max(6, h.score)}%`, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      background: h.score >= 80 ? '#16a34a' : h.score >= 50 ? '#d97706' : '#dc2626', opacity: 0.5 + (0.5 * (i + 1) / results.history.length) }} />
                ))}
              </div>
            </div>
          )}

          {/* Sandbox simulations */}
          {Array.isArray(results.simulations) && results.simulations.length > 0 && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>Sandbox Simulations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {results.simulations.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    {s.status === 'pass' ? <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} /> : <XCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>{s.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 6 }}>({s.type})</span>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error List */}
          {results.errors && results.errors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {results.errors.map((err: any, i: number) => {
                const sev = severityConfig[err.severity] ?? severityConfig.info!;
                const SevIcon = sev.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: sev.bg, border: `1px solid ${sev.color}22` }}>
                    <SevIcon size={18} style={{ color: sev.color, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: sev.color }}>{err.message}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>💡 {err.suggestion}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={ShieldCheck} title="No tests run yet" description="Run the test engine to validate your app's components, pages, and data integrity." />
      )}
    </div>
  );
}

function PreviewSection({ app }: { app: AppModule }) {
  const pages = Array.isArray(app.pages) ? app.pages : [];
  const forms = app.resolvedComponents?.forms || [];
  const dataModels = Array.isArray(app.dataModels) ? app.dataModels : [];
  const [activePageId, setActivePageId] = useState<string | null>(pages[0]?.id ?? null);
  const [lastPayload, setLastPayload] = useState<Record<string, any> | null>(null);

  const activePage = pages.find((p: any) => p.id === activePageId) || pages[0];
  const isInstalledRoute = app.status === 'ACTIVE';
  const moduleSlug = (app.slug || '').toLowerCase();

  const formForPage = (page: any) => {
    if (!page) return null;
    if (page.formId) return forms.find((f: any) => f.id === page.formId) || null;
    // Fall back to the first linked form so single-form apps still preview.
    return forms[0] || null;
  };

  const parseFields = (form: any): any[] => {
    if (!form) return [];
    const raw = form.fields;
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  };

  if (pages.length === 0) {
    return (
      <div>
        <SectionHeader title="Preview" subtitle="Run your app in a simulated shell before publishing" />
        <EmptyState icon={MonitorPlay} title="No pages to preview" description="Add pages to your app to preview the runtime experience." />
      </div>
    );
  }

  const activeForm = formForPage(activePage);
  const fields = parseFields(activeForm);

  return (
    <div>
      <SectionHeader title="Preview" subtitle="A simulated runtime shell — form submissions are captured locally, not saved"
        action={isInstalledRoute && activePage ? (
          <a href={`/app/${moduleSlug}/${activePage.slug}`} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
            <ExternalLink size={15} /> Open Live
          </a>
        ) : undefined} />

      <div style={{ display: 'flex', gap: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--color-bg)', minHeight: 420 }}>
        {/* App nav (simulated) */}
        <div style={{ width: 200, borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-md)', background: `${app.color || '#3b82f6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{app.icon || '📦'}</div>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{app.name}</span>
          </div>
          {pages.map((p: any) => {
            const Icon = p.type === 'dashboard' ? BarChart3 : p.type === 'list' ? ListIcon : FileCode2;
            const isActive = (activePage?.id) === p.id;
            return (
              <button key={p.id} onClick={() => { setActivePageId(p.id); setLastPayload(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                  background: isActive ? 'var(--color-primary-bg)' : 'transparent', color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: isActive ? 600 : 400, fontSize: 'var(--text-sm)' }}>
                <Icon size={15} /> <span style={{ flex: 1 }}>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Render area */}
        <div style={{ flex: 1, padding: 'var(--space-6)', overflow: 'auto' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>{activePage?.name}</h3>
          {activePage?.type === 'custom' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)' }}>
              {(() => {
                const layout = Array.isArray(activePage.layout) ? activePage.layout : [];
                if (layout.length === 0) {
                  return (
                    <div style={{ gridColumn: 'span 12' }}>
                      <EmptyState icon={Layers} title="Empty Page Layout" description="Go to the Pages tab and click Design Layout to build this page." />
                    </div>
                  );
                }
                return layout.map((w: any) => (
                  <div key={w.id} style={{ gridColumn: `span ${w.gridSpan || 12}`, padding: 'var(--space-4)', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-lg)', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>{w.title}</div>
                    {w.type === 'header' && (
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700 }}>{w.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{w.config.subtitle}</div>
                      </div>
                    )}
                    {w.type === 'stats' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        {(w.config.items || []).map((item: any, idx: number) => (
                          <div key={idx} style={{ flex: 1, padding: 8, background: 'white', border: '1px solid #e2e8f0', borderRadius: 4 }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{item.value}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {w.type === 'alert' && (
                      <div style={{ fontSize: '12px', color: '#d97706', padding: 8, background: '#fffbeb', borderRadius: 4 }}>{w.config.text}</div>
                    )}
                    {w.type === 'form' && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>[Form Embed: {forms.find((f: any) => f.id === w.config.formId)?.name || 'Select in layout'}]</div>
                    )}
                    {w.type === 'table' && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>[Table Listing: {dataModels.find((dm: any) => dm.id === w.config.dataModelId)?.name || 'Select in layout'}]</div>
                    )}
                    {w.type === 'chart' && (
                      <div style={{ height: 40, background: '#3b82f615', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#3b82f6' }}>[Chart Embed]</div>
                    )}
                  </div>
                ));
              })()}
            </div>
          ) : activePage?.type === 'form' || !activePage?.type ? (
            fields.length > 0 ? (
              <>
                <DynamicFormRenderer schema={fields} submitLabel="Submit (simulated)" onSubmit={(d) => setLastPayload(d)} />
                {lastPayload && (
                  <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Captured payload (not saved)</div>
                    <pre style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(lastPayload, null, 2)}</pre>
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={FileCode2} title="No form linked" description="Link a form to this page (Pages tab) and add fields to preview it." />
            )
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-10)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)' }}>
              {activePage?.type === 'dashboard' ? <BarChart3 size={36} style={{ marginBottom: 8 }} /> : <ListIcon size={36} style={{ marginBottom: 8 }} />}
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>{activePage?.type === 'dashboard' ? 'Dashboard' : 'List'} page</div>
              <div style={{ fontSize: 'var(--text-xs)' }}>{isInstalledRoute ? 'Renders live record data once installed — use “Open Live”.' : 'Renders live record data at runtime after publish + install.'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PublishSection({ app, onRefresh }: { app: AppModule; onRefresh: () => void }) {
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [scope, setScope] = useState<'ORGANIZATION' | 'GLOBAL'>(app.scope === 'GLOBAL' ? 'GLOBAL' : 'ORGANIZATION');
  const [bump, setBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [changelog, setChangelog] = useState('');
  const [category, setCategory] = useState((app as any).category || 'Operations');
  const [publisher, setPublisher] = useState((app as any).publisher || '');
  const [longDescription, setLongDescription] = useState((app as any).longDescription || '');
  const [releases, setReleases] = useState<any[]>([]);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [error, setError] = useState('');

  const testResults = app.testResults && typeof app.testResults === 'object' && !Array.isArray(app.testResults) ? app.testResults as any : {};
  const testScore = testResults.score ?? null;
  const isPublished = app.status === 'ACTIVE';

  const fetchReleases = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/builder/modules/${app.id}/releases`, { headers: { Authorization: `Bearer ${token || ''}` } });
    if (res.ok) setReleases(await res.json());
  }, [app.id]);

  useEffect(() => { fetchReleases(); }, [fetchReleases]);

  const nextVersion = (() => {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(app.version || '1.0.0');
    let [maj, min, pat] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [1, 0, 0];
    if (bump === 'major') { maj += 1; min = 0; pat = 0; }
    else if (bump === 'minor') { min += 1; pat = 0; }
    else pat += 1;
    return `${maj}.${min}.${pat}`;
  })();

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/builder/modules/${app.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ scope, bump, changelog, category, publisher, longDescription }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.message || 'Failed to publish');
    } else {
      setChangelog('');
    }
    setPublishing(false);
    fetchReleases();
    onRefresh();
  };

  const handleUnpublish = async () => {
    if (!confirm('Unpublish this app? It will be removed from the App Store but existing installs stay intact.')) return;
    setUnpublishing(true);
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${app.id}/unpublish`, { method: 'POST', headers: { Authorization: `Bearer ${token || ''}` } });
    setUnpublishing(false);
    onRefresh();
  };

  const handleRollback = async (releaseId: string, version: string) => {
    if (!confirm(`Roll the live app back to v${version}? This restores that release's components, pages and data models.`)) return;
    setRollingBack(releaseId);
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${app.id}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ releaseId }),
    });
    setRollingBack(null);
    fetchReleases();
    onRefresh();
  };

  const components = Array.isArray(app.components) ? app.components : [];
  const pages = Array.isArray(app.pages) ? app.pages : [];

  const checks = [
    { label: 'App has components', pass: components.length > 0 },
    { label: 'App has pages', pass: pages.length > 0 },
    { label: 'Description provided', pass: !!app.description && app.description.length >= 10 },
    { label: 'Test score ≥ 70%', pass: testScore !== null && testScore >= 70 },
  ];
  const allChecksPassed = checks.every(c => c.pass);

  const inputStyle: React.CSSProperties = { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' };

  return (
    <div>
      <SectionHeader title="Publish & Releases" subtitle="Cut an immutable release and deploy it to the App Store" />

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>
      )}

      {/* Current Status */}
      <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isPublished ? '#dcfce7' : '#fef3c7' }}>
            {isPublished ? <CheckCircle size={24} style={{ color: '#16a34a' }} /> : <Clock size={24} style={{ color: '#d97706' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' }}>{isPublished ? `Published · v${app.version}` : 'Draft'}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {isPublished ? `Live on ${app.scope === 'GLOBAL' ? 'App Store (Global)' : 'Organization Only'}` : 'This app is not yet published'}
              {app.publishedAt && ` · ${new Date(app.publishedAt).toLocaleDateString()}`}
            </div>
          </div>
          {isPublished && (
            <button onClick={handleUnpublish} disabled={unpublishing}
              style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
              {unpublishing ? 'Unpublishing...' : 'Unpublish'}
            </button>
          )}
        </div>

        {/* Pre-publish Checklist */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>Pre-publish Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {checks.map((check, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: check.pass ? '#f0fdf4' : '#fefce8' }}>
                {check.pass ? <CheckCircle size={16} style={{ color: '#16a34a' }} /> : <AlertTriangle size={16} style={{ color: '#d97706' }} />}
                <span style={{ fontSize: 'var(--text-sm)', color: check.pass ? '#16a34a' : '#92400e' }}>{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Release configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Version Bump → <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>v{nextVersion}</span></label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {(['patch', 'minor', 'major'] as const).map(b => (
                <button key={b} onClick={() => setBump(b)}
                  style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: bump === b ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: bump === b ? 'var(--color-primary-bg)' : 'var(--color-bg)', cursor: 'pointer', fontWeight: bump === b ? 600 : 400, fontSize: 'var(--text-xs)', textTransform: 'capitalize', color: bump === b ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Access Scope</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {([{ v: 'ORGANIZATION' as const, label: 'Organization', icon: Lock }, { v: 'GLOBAL' as const, label: 'App Store', icon: Globe }]).map(s => (
                <button key={s.v} onClick={() => setScope(s.v)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: scope === s.v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: scope === s.v ? 'var(--color-primary-bg)' : 'var(--color-bg)', cursor: 'pointer', fontWeight: scope === s.v ? 600 : 400, fontSize: 'var(--text-xs)', color: scope === s.v ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  <s.icon size={13} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Store listing metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Store Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {['Operations', 'Finance', 'HR', 'Sales', 'Marketing', 'Industry', 'Integration', 'Intelligence', 'Custom'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Publisher</label>
            <input value={publisher} onChange={e => setPublisher(e.target.value)} placeholder="e.g. Operations Team" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Store Description</label>
          <textarea value={longDescription} onChange={e => setLongDescription(e.target.value)} placeholder="Detailed description shown on the App Store listing..." style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
        </div>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Changelog (this release)</label>
          <textarea value={changelog} onChange={e => setChangelog(e.target.value)} placeholder="What changed in this version?" style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handlePublish} disabled={publishing || !allChecksPassed}
            style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-lg)', border: 'none', background: allChecksPassed ? '#10b981' : 'var(--color-bg-subtle)', color: allChecksPassed ? '#fff' : 'var(--color-text-muted)', cursor: allChecksPassed ? 'pointer' : 'not-allowed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Rocket size={16} /> {publishing ? 'Publishing...' : `Publish v${nextVersion}`}
          </button>
        </div>
      </div>

      {/* Release history */}
      <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <History size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Release History</h3>
        </div>
        {releases.length === 0 ? (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: 'var(--space-4)', textAlign: 'center' }}>No releases yet. Publish to cut your first release.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {releases.map((r: any) => {
              const isCurrent = r.id === (app as any).currentReleaseId;
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: isCurrent ? 'var(--color-primary-bg)' : 'var(--color-bg)' }}>
                  <Tag size={15} style={{ color: r.status === 'ROLLED_BACK' ? 'var(--color-text-muted)' : 'var(--color-primary)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'monospace', color: 'var(--color-text)' }}>v{r.version}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: r.channel === 'GLOBAL' ? '#ede9fe' : '#e0f2fe', color: r.channel === 'GLOBAL' ? '#7c3aed' : '#0369a1' }}>{r.channel === 'GLOBAL' ? 'App Store' : 'Org'}</span>
                      {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: '#dcfce7', color: '#16a34a' }}>CURRENT</span>}
                      {r.status === 'ROLLED_BACK' && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: '#f3f4f6', color: '#6b7280' }}>SUPERSEDED</span>}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {r.changelog || 'No changelog'} · {new Date(r.publishedAt).toLocaleDateString()}{r.testScore != null ? ` · score ${r.testScore}%` : ''}
                    </div>
                  </div>
                  {!isCurrent && (
                    <button onClick={() => handleRollback(r.id, r.version)} disabled={rollingBack === r.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)' }}>
                      <RotateCcw size={12} /> {rollingBack === r.id ? 'Restoring...' : 'Rollback'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main App Studio Page
// ═══════════════════════════════════════════════

export default function AppStudioPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.id as string;

  const [app, setApp] = useState<AppModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [forms, setForms] = useState<any[]>([]);
  // Embedded form builder overlay state.
  const [formBuilder, setFormBuilder] = useState<{ formId: string; pendingLink: boolean; pageDraft?: { name: string; slug: string; type: string } } | null>(null);
  // Embedded page builder layout canvas state.
  const [pageBuilder, setPageBuilder] = useState<{ pageId: string; pageName: string; initialLayout: any[] } | null>(null);
  // Embedded workflow + dashboard editor overlays.
  const [workflowBuilder, setWorkflowBuilder] = useState<{ workflowId: string; pendingLink: boolean } | null>(null);
  const [dashboardBuilder, setDashboardBuilder] = useState<{ dashboardId: string; pendingLink: boolean } | null>(null);

  // Generic link-on-save for workflow/dashboard so users never leave the studio.
  const linkComponentToApp = useCallback(async (type: 'workflow' | 'dashboard', refId: string, name: string) => {
    const already = (Array.isArray(app?.components) ? app!.components : []).some((c: any) => c.type === type && c.refId === refId);
    if (already) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${appId}/components`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ type, refId, name }),
    });
  }, [appId, app]);

  const fetchApp = useCallback(async () => {
    if (!appId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/builder/modules/${appId}/full`, { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) setApp(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [appId]);

  const fetchForms = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/v1/builder/forms', { headers: { Authorization: `Bearer ${token || ''}` } });
    if (res.ok) { const d = await res.json(); setForms(Array.isArray(d) ? d : d.data || []); }
  }, []);

  useEffect(() => { fetchApp(); fetchForms(); }, [fetchApp, fetchForms]);

  const handleUpdate = async (data: any) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify(data),
    });
    fetchApp();
  };

  // Called by the embedded form builder after each save. On first save of a new
  // form, links it to the app and (if launched from the page composer) creates
  // the bound page — all without leaving the studio.
  const handleFormSaved = useCallback(async (form: { id: string; name: string }) => {
    const token = localStorage.getItem('token');
    const current = formBuilder;
    if (current?.pendingLink) {
      const already = (Array.isArray(app?.components) ? app!.components : []).some((c: any) => c.type === 'form' && c.refId === form.id);
      if (!already) {
        await fetch(`/api/v1/builder/modules/${appId}/components`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
          body: JSON.stringify({ type: 'form', refId: form.id, name: form.name }),
        });
      }
    }
    if (current?.pageDraft) {
      await fetch(`/api/v1/builder/modules/${appId}/pages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ ...current.pageDraft, type: 'form', formId: form.id }),
      });
    }
    // Clear one-shot intents but keep the overlay open on the now-saved form.
    setFormBuilder((prev) => prev ? { formId: form.id, pendingLink: false } : prev);
    fetchApp();
    fetchForms();
  }, [appId, app, formBuilder, fetchApp, fetchForms]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Package size={48} style={{ color: 'var(--color-text-muted)' }} />
        <h2 style={{ color: 'var(--color-text)' }}>App not found</h2>
        <button onClick={() => router.push('/builder/erp')}
          style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
          Back to Apps
        </button>
      </div>
    );
  }

  const components = Array.isArray(app.components) ? app.components : [];
  const pages = Array.isArray(app.pages) ? app.pages : [];
  const dataModels = Array.isArray(app.dataModels) ? app.dataModels : [];

  const sectionBadges: Partial<Record<Section, number>> = {
    pages: pages.length,
    forms: components.filter(c => c.type === 'form').length,
    'data-models': dataModels.length,
    workflows: components.filter(c => c.type === 'workflow').length,
    dashboards: components.filter(c => c.type === 'dashboard').length,
    automations: components.filter(c => c.type === 'automation').length,
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Left Sidebar */}
      <div style={{ width: 240, borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* App header */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={() => router.push('/builder/erp')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)', padding: 0 }}>
            <ArrowLeft size={14} /> Back to Apps
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${app.color || '#3b82f6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {app.icon || '📦'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.2 }}>{app.name}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>v{app.version}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: 'var(--space-3)', overflow: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            const badge = sectionBadges[item.id];
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%', padding: 'var(--space-3) var(--space-3)',
                  borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                  background: isActive ? 'var(--color-primary-bg)' : 'transparent', color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400, fontSize: 'var(--text-sm)', transition: 'all 0.1s ease',
                }}>
                <item.icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge !== undefined && badge > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--radius-full)', background: isActive ? 'var(--color-primary)' : 'var(--color-border)', color: isActive ? '#fff' : 'var(--color-text-muted)' }}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6) var(--space-8)' }}>
        {activeSection === 'overview' && <OverviewSection app={app} onUpdate={handleUpdate} />}
        {activeSection === 'pages' && (
          <PagesSection
            app={app}
            onRefresh={fetchApp}
            forms={forms}
            onLaunchFormBuilder={(draft) => setFormBuilder({ formId: 'new', pendingLink: true, pageDraft: draft })}
            onDesignLayout={(page) => setPageBuilder({ pageId: page.id, pageName: page.name, initialLayout: page.layout || [] })}
          />
        )}
        {activeSection === 'forms' && <ComponentListSection app={app} type="form" typeLabel="Form" icon={FileCode2} onRefresh={fetchApp}
          onBuildNew={() => setFormBuilder({ formId: 'new', pendingLink: true })}
          onEditItem={(refId) => setFormBuilder({ formId: refId, pendingLink: false })} />}
        {activeSection === 'data-models' && <DataModelsSection app={app} onRefresh={fetchApp} />}
        {activeSection === 'workflows' && <ComponentListSection app={app} type="workflow" typeLabel="Workflow" icon={Workflow} onRefresh={fetchApp}
          onBuildNew={() => setWorkflowBuilder({ workflowId: 'new', pendingLink: true })}
          onEditItem={(refId) => setWorkflowBuilder({ workflowId: refId, pendingLink: false })} />}
        {activeSection === 'dashboards' && <ComponentListSection app={app} type="dashboard" typeLabel="Dashboard" icon={BarChart3} onRefresh={fetchApp}
          onBuildNew={() => setDashboardBuilder({ dashboardId: 'new', pendingLink: true })}
          onEditItem={(refId) => setDashboardBuilder({ dashboardId: refId, pendingLink: false })} />}
        {activeSection === 'automations' && <ComponentListSection app={app} type="automation" typeLabel="Automation" icon={Zap} onRefresh={fetchApp} />}
        {activeSection === 'preview' && <PreviewSection app={app} />}
        {activeSection === 'test' && <TestEngineSection app={app} onRefresh={fetchApp} />}
        {activeSection === 'publish' && <PublishSection app={app} onRefresh={fetchApp} />}
      </div>

      {/* Embedded full-screen form builder — keeps you in build mode */}
      {formBuilder && (
        <FormBuilderWorkspace
          formId={formBuilder.formId}
          embedded
          defaultModule={app.slug}
          onSaved={handleFormSaved}
          onBack={() => { setFormBuilder(null); fetchApp(); fetchForms(); }}
        />
      )}

      {/* Embedded page builder layout canvas */}
      {pageBuilder && (
        <PageBuilderWorkspace
          appId={app.id}
          pageId={pageBuilder.pageId}
          pageName={pageBuilder.pageName}
          initialLayout={pageBuilder.initialLayout}
          forms={app.resolvedComponents?.forms || forms}
          dataModels={app.dataModels || []}
          dashboards={app.resolvedComponents?.dashboards || []}
          onBack={() => setPageBuilder(null)}
          onSaved={() => {
            setPageBuilder(null);
            fetchApp();
          }}
        />
      )}

      {/* Embedded workflow editor */}
      {workflowBuilder && (
        <WorkflowEditorWorkspace
          workflowId={workflowBuilder.workflowId}
          embedded
          defaultName={`${app.name} Workflow`}
          onSaved={async (wf: { id: string; name: string }) => {
            if (workflowBuilder.pendingLink) await linkComponentToApp('workflow', wf.id, wf.name);
            setWorkflowBuilder((prev) => prev ? { workflowId: wf.id, pendingLink: false } : prev);
            fetchApp();
          }}
          onBack={() => { setWorkflowBuilder(null); fetchApp(); }}
        />
      )}

      {/* Embedded dashboard editor */}
      {dashboardBuilder && (
        <DashboardEditorWorkspace
          dashboardId={dashboardBuilder.dashboardId}
          embedded
          defaultName={`${app.name} Dashboard`}
          onSaved={async (d: { id: string; name: string }) => {
            if (dashboardBuilder.pendingLink) await linkComponentToApp('dashboard', d.id, d.name);
            setDashboardBuilder((prev) => prev ? { dashboardId: d.id, pendingLink: false } : prev);
            fetchApp();
          }}
          onBack={() => { setDashboardBuilder(null); fetchApp(); }}
        />
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
