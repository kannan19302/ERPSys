'use client';
import styles from './page.module.css';
// Temporary eslint run

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
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { useApiClient, RouteGuard } from '@unerp/framework';
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
    <div className={styles.s1}>
      <div>
        <h2 className={styles.s2}>{title}</h2>
        {subtitle && <p className={styles.s3}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<any>; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className={styles.s4}>
      <Icon size={40} className={styles.s5} />
      <h3 className={styles.s6}>{title}</h3>
      <p style={{ marginBottom: action ? 'var(--space-4)' : 0 }} className={styles.s7}>{description}</p>
      {action}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={styles.s8}>
      <Plus size={16} /> {label}
    </button>
  );
}

// ═══════════════════════════════════════════════
// Add Component Modal (Link existing or create new)
// ═══════════════════════════════════════════════

const ADD_COMPONENT_ENDPOINTS: Record<string, string> = {
  form: 'forms', workflow: 'workflows', dashboard: 'dashboards', automation: 'automation-rules',
};

function AddComponentModal({ isOpen, onClose, type, appId, onSuccess }: {
  isOpen: boolean; onClose: () => void; type: 'form' | 'workflow' | 'dashboard' | 'automation'; appId: string; onSuccess: () => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [linking, setLinking] = useState<string | null>(null);
  const client = useApiClient();

  useEffect(() => {
    if (!isOpen) return;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const data = await client.get<any[] | { data?: any[] }>(`/builder/${ADD_COMPONENT_ENDPOINTS[type]}`);
        setItems(Array.isArray(data) ? data : data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchItems();
  }, [isOpen, type, client]);

  const handleLink = async (item: any) => {
    setLinking(item.id);
    try {
      await client.post(`/builder/modules/${appId}/components`, {
        type,
        refId: item.id,
        name: item.name || item.title || 'Untitled',
      });
      onSuccess();
    } catch { /* ignore */ }
    setLinking(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let body: any;
    if (type === 'form') body = { name: newName, slug };
    else if (type === 'workflow') body = { name: newName };
    else if (type === 'dashboard') body = { name: newName };
    else body = { name: newName, trigger: 'record.created' };

    try {
      const data = await client.post<any>(`/builder/${ADD_COMPONENT_ENDPOINTS[type]}`, body);
      if (data && data.id) {
        // Auto-link the new component
        await client.post(`/builder/modules/${appId}/components`, {
          type,
          refId: data.id,
          name: newName,
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
    <div className={styles.s9}>
      <div className={styles.s10} onClick={onClose} />
      <div className={styles.s11}>
        <div className={styles.s12}>
          <h3 className={styles.s13}>Add {typeLabel}</h3>
          <button onClick={onClose} className={styles.s14}><X size={20} /></button>
        </div>

        {/* Quick create */}
        <div className={styles.s15}>
          <div className={styles.s16}>Create New</div>
          <div className="ui-flex ui-gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`New ${typeLabel} name...`}
              className={styles.s17} />
            <button onClick={handleCreate} disabled={creating || !newName.trim()}
              style={{ opacity: creating || !newName.trim() ? 0.6 : 1 }} className={styles.s18}>
              {creating ? 'Creating...' : 'Create & Link'}
            </button>
          </div>
        </div>

        {/* Search existing */}
        <div className={styles.s19}>
          <div className="relative">
            <Search size={14} className={styles.s20} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search existing..."
              className={styles.s21} />
          </div>
        </div>

        {/* List */}
        <div className={styles.s22}>
          {loading ? (
            <div className={styles.s23}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.s24}>No existing {typeLabel.toLowerCase()}s found. Create a new one above.</div>
          ) : (
            <div className="ui-stack-2">
              {filtered.map(item => (
                <div key={item.id} className={styles.s25}>
                  <div>
                    <div className={styles.s26}>{item.name || item.title}</div>
                    <div className="ui-text-xs-soft">
                      {item.status || 'DRAFT'} · {item.slug || item.docType || ''}
                    </div>
                  </div>
                  <button onClick={() => handleLink(item)} disabled={linking === item.id}
                    className={styles.s27}>
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
  const client = useApiClient();

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
    try {
      await client.post(`/builder/modules/${appId}/pages`, {
        name,
        slug,
        type,
        ...(needsForm && formId ? { formId } : {}),
      });
    } catch { /* ignore */ }
    setSubmitting(false);
    setName(''); setSlug(''); setFormId('');
    onSuccess();
  };

  if (!isOpen) return null;
  return (
    <div className={styles.s9}>
      <div className={styles.s10} onClick={onClose} />
      <div className={styles.s28}>
        <h3 className={styles.s29}>Add Page</h3>
        <div className="mb-4">
          <label className="ui-label">Page Name</label>
          <input value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }}
            className={styles.s30} />
        </div>
        <div className="mb-4">
          <label className="ui-label">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            className={styles.s31} />
        </div>
        <div className={styles.s32}>
          <label className="ui-label">Type</label>
          <div className="ui-flex ui-gap-2">
            {(['form', 'list', 'dashboard', 'custom'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ border: type === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: type === t ? 'var(--color-primary-bg)' : 'var(--color-bg)', fontWeight: type === t ? 600 : 400, color: type === t ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s33}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Data source — link an existing form or build one inline */}
        {needsForm && (
          <div className={styles.s32}>
            <label className="ui-label">Form / Data Source</label>
            <div className={styles.s34}>
              {([['existing', 'Link Existing'], ['build', 'Build New']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setDataSource(v)}
                  style={{ border: dataSource === v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: dataSource === v ? 'var(--color-primary-bg)' : 'var(--color-bg)', fontWeight: dataSource === v ? 600 : 400, color: dataSource === v ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s35}>
                  {v === 'build' ? <Wand2 size={14} /> : <FileCode2 size={14} />} {label}
                </button>
              ))}
            </div>
            {dataSource === 'existing' ? (
              <select value={formId} onChange={e => setFormId(e.target.value)}
                className={styles.s36}>
                <option value="">Select a form…</option>
                {forms.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            ) : (
              <div className={styles.s37}>
                The form builder will open. On save, your form is linked and this page is created bound to it.
              </div>
            )}
          </div>
        )}

        <div className={styles.s38}>
          <button onClick={onClose} className={styles.s39}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim() || (needsForm && dataSource === 'existing' && !formId)}
            className={styles.s40}>
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
  const client = useApiClient();

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
    try {
      await client.post(`/builder/modules/${appId}/data-models`, { name, fields });
    } catch { /* ignore */ }
    setSubmitting(false);
    setName(''); setFields([{ name: 'title', type: 'Data', required: true, label: 'Title' }]);
    onSuccess();
  };

  if (!isOpen) return null;
  return (
    <div className={styles.s9}>
      <div className={styles.s10} onClick={onClose} />
      <div className={styles.s41}>
        <h3 className={styles.s29}>Add Data Model</h3>
        <div className="mb-4">
          <label className="ui-label">Model Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer"
            className={styles.s30} />
        </div>

        <div className={styles.s42}>
          <div className="ui-flex-between mb-2">
            <label className={styles.s43}>Fields</label>
            <button onClick={addField} className={styles.s44}>
              <Plus size={14} /> Add Field
            </button>
          </div>
          {fields.map((f, i) => (
            <div key={i} className={styles.s45}>
              <input value={f.name} onChange={e => updateField(i, 'name', e.target.value)} placeholder="field_name"
                className={styles.s46} />
              <input value={f.label} onChange={e => updateField(i, 'label', e.target.value)} placeholder="Label"
                className={styles.s47} />
              <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)}
                className={styles.s48}>
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className={styles.s49}>
                <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} /> Req
              </label>
              <button onClick={() => removeField(i)} className={styles.s50}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.s51}>
          <button onClick={onClose} className={styles.s39}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !name.trim()}
            className={styles.s52}>
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
  const client = useApiClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await client.get<any>(`/builder/modules/${app.id}/stats`);
        setStats(data);
      } catch { /* ignore */ }
    };
    fetchStats();
  }, [app.id, client]);

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
        <div className={styles.s53}>
          {lifecycleCards.map((c, i) => (
            <div key={i} className={styles.s54}>
              <div style={{ background: `${c.color}15` }} className={styles.s55}>
                <c.icon size={18} style={{ color: c.color }} />
              </div>
              <div>
                <div className={styles.s56}>{c.value}</div>
                <div className="ui-text-xs-soft">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={styles.s57}>
        <div className={styles.s58}>
          <div>
            <label className="ui-label">App Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className={styles.s30} />
          </div>
          <div>
            <label className="ui-label">Version</label>
            <input value={version} onChange={e => setVersion(e.target.value)}
              className={styles.s31} />
          </div>
        </div>
        <div className={styles.s59}>
          <label className="ui-label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className={styles.s60} />
        </div>
        <div className={styles.s61}>
          <div className="flex-1">
            <div className={styles.s26}>Slug</div>
            <div className={styles.s62}>{app.slug}</div>
          </div>
          <div className="flex-1">
            <div className={styles.s26}>Status</div>
            <div style={{ color: app.status === 'ACTIVE' ? '#16a34a' : '#d97706' }} className={styles.s63}>{app.status}</div>
          </div>
          <div className="flex-1">
            <div className={styles.s26}>Scope</div>
            <div className={styles.s7}>{app.scope}</div>
          </div>
        </div>
        <div className={styles.s64}>
          <button onClick={handleSave} disabled={saving}
            className={styles.s65}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComponentListSection({ app, type, typeLabel, icon: Icon, onRefresh, onBuildNew, onEditItem }: { app: AppModule; type: string; typeLabel: string; icon: React.ComponentType<any>; onRefresh: () => void; onBuildNew?: () => void; onEditItem?: (refId: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteComponentTarget, setDeleteComponentTarget] = useState<{ id: string; name: string } | null>(null);
  const components = (Array.isArray(app.components) ? app.components : []).filter(c => c.type === type);
  const client = useApiClient();

  const handleRemove = async (componentId: string) => {
    try {
      await client.delete(`/builder/modules/${app.id}/components/${componentId}`);
    } catch { /* ignore */ }
    onRefresh();
  };

  const headerAction = (
    <div className="ui-flex ui-gap-2">
      {onBuildNew && (
        <button onClick={onBuildNew} className={styles.s66}>
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
        <div className="ui-stack-3">
          {components.map((c: any) => (
            <div key={c.id} className={styles.s67}>
              <div className="ui-hstack-3">
                <div className={styles.s68}>
                  <Icon size={18} className="ui-text-primary" />
                </div>
                <div>
                  <div className={styles.s26}>{c.name}</div>
                  <div className="ui-text-xs-soft">ID: {c.refId?.slice(0, 12)}...</div>
                </div>
              </div>
              <div className="ui-flex ui-items-center ui-gap-1">
                {onEditItem && (
                  <button onClick={() => onEditItem(c.refId)} title={`Edit ${typeLabel.toLowerCase()}`} className={`${styles.s50} ${styles.editControl}`}>
                    <Pencil size={15} />
                  </button>
                )}
                <button onClick={() => setDeleteComponentTarget({ id: c.id, name: c.name })} className={`${styles.s50} ${styles.deleteControl}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddComponentModal isOpen={showAdd} onClose={() => setShowAdd(false)} type={type as any} appId={app.id} onSuccess={() => { setShowAdd(false); onRefresh(); }} />
      <ConfirmDialog
        open={!!deleteComponentTarget}
        onClose={() => setDeleteComponentTarget(null)}
        onConfirm={() => { if (deleteComponentTarget) { handleRemove(deleteComponentTarget.id); setDeleteComponentTarget(null); } }}
        title={`Remove ${typeLabel}`}
        message={`Are you sure you want to remove this ${typeLabel.toLowerCase()} from the app?`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}

function PagesSection({ app, onRefresh, forms, onLaunchFormBuilder, onDesignLayout }: { app: AppModule; onRefresh: () => void; forms: any[]; onLaunchFormBuilder: (draft: { name: string; slug: string; type: string }) => void; onDesignLayout: (page: any) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [deletePageTarget, setDeletePageTarget] = useState<{ id: string; name: string } | null>(null);
  const pages = Array.isArray(app.pages) ? app.pages : [];
  const client = useApiClient();

  const handleRemove = async (pageId: string) => {
    try {
      await client.delete(`/builder/modules/${app.id}/pages/${pageId}`);
    } catch { /* ignore */ }
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
        <div className="ui-stack-3">
          {pages.map((p: any) => (
            <div key={p.id} className={styles.s67}>
              <div className="ui-hstack-3">
                <div style={{ background: `${typeColors[p.type] || '#3b82f6'}15` }} className={styles.s69}>
                  <Layers size={18} style={{ color: typeColors[p.type] || '#3b82f6' }} />
                </div>
                <div>
                  <div className={styles.s26}>{p.name}</div>
                  <div className={styles.s70}>
                    <span className="font-mono">/{p.slug}</span>
                    <span style={{ background: `${typeColors[p.type] || '#3b82f6'}15`, color: typeColors[p.type] || '#3b82f6' }} className={styles.s71}>{p.type}</span>
                  </div>
                </div>
              </div>
              <div className={styles.s72}>
                {p.type === 'custom' && (
                  <button onClick={() => onDesignLayout(p)}
                    className={styles.s73}>
                    <Pencil size={12} /> Design Layout
                  </button>
                )}
                <button onClick={() => setDeletePageTarget({ id: p.id, name: p.name })} className={styles.s50}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddPageModal isOpen={showAdd} onClose={() => setShowAdd(false)} appId={app.id} forms={forms}
        onLaunchFormBuilder={(draft) => { setShowAdd(false); onLaunchFormBuilder(draft); }}
        onSuccess={() => { setShowAdd(false); onRefresh(); }} />
      <ConfirmDialog
        open={!!deletePageTarget}
        onClose={() => setDeletePageTarget(null)}
        onConfirm={() => { if (deletePageTarget) { handleRemove(deletePageTarget.id); setDeletePageTarget(null); } }}
        title="Remove Page"
        message={`Are you sure you want to remove page "${deletePageTarget?.name}"?`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}

function DataModelsSection({ app, onRefresh }: { app: AppModule; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteModelTarget, setDeleteModelTarget] = useState<{ id: string; name: string } | null>(null);
  const dataModels = Array.isArray(app.dataModels) ? app.dataModels : [];
  const client = useApiClient();

  const handleRemove = async (dmId: string) => {
    try {
      await client.delete(`/builder/modules/${app.id}/data-models/${dmId}`);
    } catch { /* ignore */ }
    onRefresh();
  };

  return (
    <>
      <div>
        <SectionHeader title="Data Models" subtitle="Define custom data structures for your app" action={<AddButton onClick={() => setShowAdd(true)} label="Add Data Model" />} />
        {dataModels.length === 0 ? (
          <EmptyState icon={Database} title="No data models yet" description="Define the data structures that power your app."
            action={<AddButton onClick={() => setShowAdd(true)} label="Add Data Model" />} />
        ) : (
          <div className="ui-stack-3">
            {dataModels.map((dm: any) => (
              <div key={dm.id} className={styles.s74}>
                <div className={styles.s75}>
                  <div className="ui-hstack-3">
                    <Database size={18} className="ui-text-primary" />
                    <div>
                      <div className={styles.s26}>{dm.name}</div>
                      <div className="ui-text-xs-soft">{(dm.fields || []).length} fields</div>
                    </div>
                  </div>
                  <button onClick={() => setDeleteModelTarget({ id: dm.id, name: dm.name })} className={styles.s50}><Trash2 size={16} /></button>
                </div>
                {dm.fields && dm.fields.length > 0 && (
                  <div className={styles.s76}>
                    <div className={styles.s77}>
                      {dm.fields.map((f: any, i: number) => (
                        <span key={i} className={styles.s78}>
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
      <ConfirmDialog
        open={!!deleteModelTarget}
        onClose={() => setDeleteModelTarget(null)}
        onConfirm={() => { if (deleteModelTarget) { handleRemove(deleteModelTarget.id); setDeleteModelTarget(null); } }}
        title="Remove Data Model"
        message={`Are you sure you want to remove data model "${deleteModelTarget?.name}"?`}
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}

function TestEngineSection({ app, onRefresh }: { app: AppModule; onRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(
    app.testResults && typeof app.testResults === 'object' && !Array.isArray(app.testResults) && (app.testResults as any).score != null ? app.testResults : null
  );
  const client = useApiClient();

  const runTests = async () => {
    setRunning(true);
    try {
      const data = await client.post<any>(`/builder/modules/${app.id}/test`);
      setResults(data);
    } catch { /* ignore */ }
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
            style={{ background: running ? 'var(--color-bg-subtle)' : '#10b981', color: running ? 'var(--color-text-muted)' : '#fff', cursor: running ? 'wait' : 'pointer' }} className={styles.s79}>
            {running ? <><RefreshCw size={16} className="spin" /> Running Tests...</> : <><Play size={16} /> Run All Tests</>}
          </button>
        } />

      {results ? (
        <div>
          {/* Score Card */}
          <div className={styles.s80}>
            <div className={styles.s81}>
              <div style={{ background: results.score >= 80 ? '#dcfce7' : results.score >= 50 ? '#fef3c7' : '#fee2e2', border: `4px solid ${results.score >= 80 ? '#16a34a' : results.score >= 50 ? '#d97706' : '#dc2626'}` }} className={styles.s82}>
                <span style={{ color: results.score >= 80 ? '#16a34a' : results.score >= 50 ? '#d97706' : '#dc2626' }} className={styles.s83}>{results.score}</span>
                <span className={styles.s84}>/ 100</span>
              </div>
              <div className="flex-1">
                <div className={styles.s85}>
                  {results.score >= 80 ? '✅ Ready to Publish' : results.score >= 50 ? '⚠️ Needs Improvement' : '❌ Not Ready'}
                </div>
                <div className={styles.s86}>
                  <span><strong>{results.passed}</strong> passed</span>
                  <span><strong>{results.failed}</strong> failed</span>
                  <span><strong>{results.totalTests}</strong> total tests</span>
                </div>
                {results.lastRunAt && (
                  <div className={styles.s87}>Last tested: {new Date(results.lastRunAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>

          {/* Score trend */}
          {Array.isArray(results.history) && results.history.length > 1 && (
            <div className={styles.s88}>
              <div className={styles.s89}>Score Trend</div>
              <div className={styles.s90}>
                {[...results.history].reverse().map((h: any, i: number) => (
                  <div key={i} title={`${h.score}% · ${new Date(h.runAt).toLocaleString()}`}
                    style={{ height: `${Math.max(6, h.score)}%`, background: h.score >= 80 ? '#16a34a' : h.score >= 50 ? '#d97706' : '#dc2626', opacity: 0.5 + (0.5 * (i + 1) / results.history.length) }} className={styles.s91} />
                ))}
              </div>
            </div>
          )}

          {/* Sandbox simulations */}
          {Array.isArray(results.simulations) && results.simulations.length > 0 && (
            <div className={styles.s32}>
              <div className={styles.s89}>Sandbox Simulations</div>
              <div className="ui-stack-2">
                {results.simulations.map((s: any, i: number) => (
                  <div key={i} className={styles.s92}>
                    {s.status === 'pass' ? <CheckCircle size={16} className={styles.s93} /> : <XCircle size={16} className={styles.s94} />}
                    <div className="flex-1">
                      <span className={styles.s26}>{s.name}</span>
                      <span className={styles.s95}>({s.type})</span>
                      <div className="ui-text-xs-soft">{s.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error List */}
          {results.errors && results.errors.length > 0 && (
            <div className="ui-stack-2">
              {results.errors.map((err: any, i: number) => {
                const sev = severityConfig[err.severity] ?? severityConfig.info!;
                const SevIcon = sev.icon;
                return (
                  <div key={i} style={{ background: sev.bg, border: `1px solid ${sev.color}22` }} className={styles.s96}>
                    <SevIcon size={18} style={{ color: sev.color }} className={styles.s97} />
                    <div>
                      <div style={{ color: sev.color }} className={styles.s98}>{err.message}</div>
                      <div className={styles.s99}>💡 {err.suggestion}</div>
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
            className={styles.s100}>
            <ExternalLink size={15} /> Open Live
          </a>
        ) : undefined} />

      <div className={styles.s101}>
        {/* App nav (simulated) */}
        <div className={styles.s102}>
          <div className={styles.s103}>
            <div style={{ background: `${app.color || '#3b82f6'}15` }} className={styles.s104}>{app.icon || '📦'}</div>
            <span className={styles.s105}>{app.name}</span>
          </div>
          {pages.map((p: any) => {
            const Icon = p.type === 'dashboard' ? BarChart3 : p.type === 'list' ? ListIcon : FileCode2;
            const isActive = (activePage?.id) === p.id;
            return (
              <button key={p.id} onClick={() => { setActivePageId(p.id); setLastPayload(null); }}
                style={{ background: isActive ? 'var(--color-primary-bg)' : 'transparent', color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: isActive ? 600 : 400 }} className={styles.s106}>
                <Icon size={15} /> <span className="flex-1">{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Render area */}
        <div className={styles.s107}>
          <h3 className={styles.s108}>{activePage?.name}</h3>
          {activePage?.type === 'custom' ? (
            <div className={styles.s109}>
              {(() => {
                const layout = Array.isArray(activePage.layout) ? activePage.layout : [];
                if (layout.length === 0) {
                  return (
                    <div className={styles.s110}>
                      <EmptyState icon={Layers} title="Empty Page Layout" description="Go to the Pages tab and click Design Layout to build this page." />
                    </div>
                  );
                }
                return layout.map((w: any) => (
                  <div key={w.id} style={{ gridColumn: `span ${w.gridSpan || 12}` }} className={styles.s111}>
                    <div className={styles.s112}>{w.title}</div>
                    {w.type === 'header' && (
                      <div>
                        <div className={styles.s113}>{w.title}</div>
                        <div className={styles.s114}>{w.config.subtitle}</div>
                      </div>
                    )}
                    {w.type === 'stats' && (
                      <div className={styles.s115}>
                        {(w.config.items || []).map((item: any, idx: number) => (
                          <div key={idx} className={styles.s116}>
                            <div style={{ color: item.color }} className={styles.s117}>{item.value}</div>
                            <div className={styles.s118}>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {w.type === 'alert' && (
                      <div className={styles.s119}>{w.config.text}</div>
                    )}
                    {w.type === 'form' && (
                      <div className={styles.s120}>[Form Embed: {forms.find((f: any) => f.id === w.config.formId)?.name || 'Select in layout'}]</div>
                    )}
                    {w.type === 'table' && (
                      <div className={styles.s120}>[Table Listing: {dataModels.find((dm: any) => dm.id === w.config.dataModelId)?.name || 'Select in layout'}]</div>
                    )}
                    {w.type === 'chart' && (
                      <div className={styles.s121}>[Chart Embed]</div>
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
                  <div className={styles.s122}>
                    <div className={styles.s123}>Captured payload (not saved)</div>
                    <pre className={styles.s124}>{JSON.stringify(lastPayload, null, 2)}</pre>
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={FileCode2} title="No form linked" description="Link a form to this page (Pages tab) and add fields to preview it." />
            )
          ) : (
            <div className={styles.s125}>
              {activePage?.type === 'dashboard' ? <BarChart3 size={36} className={styles.s126} /> : <ListIcon size={36} className={styles.s126} />}
              <div className={styles.s26}>{activePage?.type === 'dashboard' ? 'Dashboard' : 'List'} page</div>
              <div className="text-xs">{isInstalledRoute ? 'Renders live record data once installed — use “Open Live”.' : 'Renders live record data at runtime after publish + install.'}</div>
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
  const [rollbackTarget, setRollbackTarget] = useState<{ releaseId: string; version: string } | null>(null);
  const [unpublishConfirm, setUnpublishConfirm] = useState(false);
  const client = useApiClient();

  const testResults = app.testResults && typeof app.testResults === 'object' && !Array.isArray(app.testResults) ? app.testResults as any : {};
  const testScore = testResults.score ?? null;
  const isPublished = app.status === 'ACTIVE';

  const fetchReleases = useCallback(async () => {
    try {
      const data = await client.get<any[]>(`/builder/modules/${app.id}/releases`);
      setReleases(data);
    } catch { /* ignore */ }
  }, [app.id, client]);

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
    try {
      await client.post(`/builder/modules/${app.id}/publish`, {
        scope, bump, changelog, category, publisher, longDescription
      });
      setChangelog('');
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    }
    setPublishing(false);
    fetchReleases();
    onRefresh();
  };

  const handleUnpublish = async () => {
    setUnpublishing(true);
    try {
      await client.post(`/builder/modules/${app.id}/unpublish`);
    } catch { /* ignore */ }
    setUnpublishing(false);
    onRefresh();
  };

  const handleRollback = async (releaseId: string) => {
    setRollingBack(releaseId);
    try {
      await client.post(`/builder/modules/${app.id}/rollback`, { releaseId });
    } catch { /* ignore */ }
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
        <div className={styles.s127}>{error}</div>
      )}

      {/* Current Status */}
      <div className={styles.s80}>
        <div className={styles.s128}>
          <div style={{ background: isPublished ? '#dcfce7' : '#fef3c7' }} className={styles.s129}>
            {isPublished ? <CheckCircle size={24} className={styles.s130} /> : <Clock size={24} className={styles.s131} />}
          </div>
          <div className="flex-1">
            <div className={styles.s13}>{isPublished ? `Published · v${app.version}` : 'Draft'}</div>
            <div className={styles.s7}>
              {isPublished ? `Live on ${app.scope === 'GLOBAL' ? 'App Store (Global)' : 'Organization Only'}` : 'This app is not yet published'}
              {app.publishedAt && ` · ${new Date(app.publishedAt).toLocaleDateString()}`}
            </div>
          </div>
          {isPublished && (
            <button onClick={() => setUnpublishConfirm(true)} disabled={unpublishing}
              className={styles.s132}>
              {unpublishing ? 'Unpublishing...' : 'Unpublish'}
            </button>
          )}
        </div>

        {/* Pre-publish Checklist */}
        <div className={styles.s32}>
          <div className={styles.s89}>Pre-publish Checklist</div>
          <div className="ui-stack-2">
            {checks.map((check, i) => (
              <div key={i} style={{ background: check.pass ? '#f0fdf4' : '#fefce8' }} className={styles.s133}>
                {check.pass ? <CheckCircle size={16} className={styles.s130} /> : <AlertTriangle size={16} className={styles.s131} />}
                <span style={{ color: check.pass ? '#16a34a' : '#92400e' }} className={styles.s63}>{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Release configuration */}
        <div className={styles.s134}>
          <div>
            <label className="ui-label">Version Bump → <span className={styles.s135}>v{nextVersion}</span></label>
            <div className="ui-flex ui-gap-2">
              {(['patch', 'minor', 'major'] as const).map(b => (
                <button key={b} onClick={() => setBump(b)}
                  style={{ border: bump === b ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: bump === b ? 'var(--color-primary-bg)' : 'var(--color-bg)', fontWeight: bump === b ? 600 : 400, color: bump === b ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s136}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="ui-label">Access Scope</label>
            <div className="ui-flex ui-gap-2">
              {([{ v: 'ORGANIZATION' as const, label: 'Organization', icon: Lock }, { v: 'GLOBAL' as const, label: 'App Store', icon: Globe }]).map(s => (
                <button key={s.v} onClick={() => setScope(s.v)}
                  style={{ border: scope === s.v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: scope === s.v ? 'var(--color-primary-bg)' : 'var(--color-bg)', fontWeight: scope === s.v ? 600 : 400, color: scope === s.v ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s137}>
                  <s.icon size={13} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Store listing metadata */}
        <div className={styles.s134}>
          <div>
            <label className="ui-label">Store Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {['Operations', 'Finance', 'HR', 'Sales', 'Marketing', 'Industry', 'Integration', 'Intelligence', 'Custom'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="ui-label">Publisher</label>
            <input value={publisher} onChange={e => setPublisher(e.target.value)} placeholder="e.g. Operations Team" style={inputStyle} />
          </div>
        </div>
        <div className="mb-4">
          <label className="ui-label">Store Description</label>
          <textarea value={longDescription} onChange={e => setLongDescription(e.target.value)} placeholder="Detailed description shown on the App Store listing..." style={{ ...inputStyle }} className={styles.s138} />
        </div>
        <div className={styles.s32}>
          <label className="ui-label">Changelog (this release)</label>
          <textarea value={changelog} onChange={e => setChangelog(e.target.value)} placeholder="What changed in this version?" style={{ ...inputStyle }} className={styles.s139} />
        </div>

        <div className="ui-flex-end">
          <button onClick={handlePublish} disabled={publishing || !allChecksPassed}
            style={{ background: allChecksPassed ? '#10b981' : 'var(--color-bg-subtle)', color: allChecksPassed ? '#fff' : 'var(--color-text-muted)', cursor: allChecksPassed ? 'pointer' : 'not-allowed' }} className={styles.s140}>
            <Rocket size={16} /> {publishing ? 'Publishing...' : `Publish v${nextVersion}`}
          </button>
        </div>
      </div>

      {/* Release history */}
      <div className={styles.s57}>
        <div className="ui-hstack-2 mb-4">
          <History size={16} className="ui-text-muted" />
          <h3 className={styles.s141}>Release History</h3>
        </div>
        {releases.length === 0 ? (
          <div className={styles.s142}>No releases yet. Publish to cut your first release.</div>
        ) : (
          <div className="ui-stack-2">
            {releases.map((r: any) => {
              const isCurrent = r.id === (app as any).currentReleaseId;
              return (
                <div key={r.id} style={{ background: isCurrent ? 'var(--color-primary-bg)' : 'var(--color-bg)' }} className={styles.s143}>
                  <Tag size={15} style={{ color: r.status === 'ROLLED_BACK' ? 'var(--color-text-muted)' : 'var(--color-primary)' }} />
                  <div className="flex-1">
                    <div className={styles.s72}>
                      <span className={styles.s144}>v{r.version}</span>
                      <span style={{ background: r.channel === 'GLOBAL' ? '#ede9fe' : '#e0f2fe', color: r.channel === 'GLOBAL' ? '#7c3aed' : '#0369a1' }} className={styles.s145}>{r.channel === 'GLOBAL' ? 'App Store' : 'Org'}</span>
                      {isCurrent && <span className={styles.s146}>CURRENT</span>}
                      {r.status === 'ROLLED_BACK' && <span className={styles.s147}>SUPERSEDED</span>}
                    </div>
                    <div className={styles.s148}>
                      {r.changelog || 'No changelog'} · {new Date(r.publishedAt).toLocaleDateString()}{r.testScore != null ? ` · score ${r.testScore}%` : ''}
                    </div>
                  </div>
                  {!isCurrent && (
                    <button onClick={() => setRollbackTarget({ releaseId: r.id, version: r.version })} disabled={rollingBack === r.id}
                      className={styles.s149}>
                      <RotateCcw size={12} /> {rollingBack === r.id ? 'Restoring...' : 'Rollback'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={unpublishConfirm}
        onClose={() => setUnpublishConfirm(false)}
        onConfirm={() => { handleUnpublish(); setUnpublishConfirm(false); }}
        title="Unpublish App"
        message="Are you sure you want to unpublish this app? It will be removed from the App Store but existing installs stay intact."
        confirmLabel="Unpublish"
        variant="danger"
      />
      <ConfirmDialog
        open={!!rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={() => { if (rollbackTarget) { handleRollback(rollbackTarget.releaseId); setRollbackTarget(null); } }}
        title="Rollback Release"
        message={`Are you sure you want to roll the live app back to v${rollbackTarget?.version}? This restores that release's components, pages and data models.`}
        confirmLabel="Rollback"
        variant="danger"
      />
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
  const client = useApiClient();

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

  // Modal confirm targets
  const [deletePageTarget, setDeletePageTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteModelTarget, setDeleteModelTarget] = useState<{ id: string; name: string } | null>(null);
  const [unpublishConfirm, setUnpublishConfirm] = useState<boolean>(false);
  const [rollbackTarget, setRollbackTarget] = useState<{ releaseId: string; version: string } | null>(null);

  // Generic link-on-save for workflow/dashboard so users never leave the studio.
  const linkComponentToApp = useCallback(async (type: 'workflow' | 'dashboard', refId: string, name: string) => {
    const already = (Array.isArray(app?.components) ? app!.components : []).some((c: any) => c.type === type && c.refId === refId);
    if (already) return;
    try {
      await client.post(`/builder/modules/${appId}/components`, { type, refId, name });
    } catch { /* ignore */ }
  }, [appId, app, client]);

  const fetchApp = useCallback(async () => {
    if (!appId) return;
    try {
      const data = await client.get<any>(`/builder/modules/${appId}/full`);
      setApp(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [appId, client]);

  const fetchForms = useCallback(async () => {
    try {
      const data = await client.get<any>('/builder/forms');
      setForms(Array.isArray(data) ? data : data.data || []);
    } catch { /* ignore */ }
  }, [client]);

  useEffect(() => { fetchApp(); fetchForms(); }, [fetchApp, fetchForms]);

  const handleUpdate = async (data: any) => {
    try {
      await client.patch(`/builder/modules/${appId}`, data);
    } catch { /* ignore */ }
    fetchApp();
  };

  // Called by the embedded form builder after each save. On first save of a new
  // form, links it to the app and (if launched from the page composer) creates
  // the bound page — all without leaving the studio.
  const handleFormSaved = useCallback(async (form: { id: string; name: string }) => {
    const current = formBuilder;
    if (current?.pendingLink) {
      const already = (Array.isArray(app?.components) ? app!.components : []).some((c: any) => c.type === 'form' && c.refId === form.id);
      if (!already) {
        try {
          await client.post(`/builder/modules/${appId}/components`, { type: 'form', refId: form.id, name: form.name });
        } catch { /* ignore */ }
      }
    }
    if (current?.pageDraft) {
      try {
        await client.post(`/builder/modules/${appId}/pages`, { ...current.pageDraft, type: 'form', formId: form.id });
      } catch { /* ignore */ }
    }
    // Clear one-shot intents but keep the overlay open on the now-saved form.
    setFormBuilder((prev) => prev ? { formId: form.id, pendingLink: false } : prev);
    fetchApp();
    fetchForms();
  }, [appId, app, formBuilder, fetchApp, fetchForms, client]);

  if (loading) {
    return (
      <RouteGuard permission="builder.module.read">
        <div className={styles.s150}>
          <Loader2 size={32} className="spin ui-text-primary" />
        </div>
      </RouteGuard>
    );
  }

  if (!app) {
    return (
      <RouteGuard permission="builder.module.read">
        <div className={styles.s151}>
          <Package size={48} className={styles.s152} />
          <h2 className={styles.s153}>App not found</h2>
          <button onClick={() => router.push('/builder/erp')}
            className={styles.s154}>
            Back to Apps
          </button>
        </div>
      </RouteGuard>
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
    <RouteGuard permission="builder.module.read">
      <div className={styles.s155}>
      {/* Left Sidebar */}
      <div className={styles.s156}>
        {/* App header */}
        <div className={styles.s157}>
          <button onClick={() => router.push('/builder/erp')}
            className={styles.s158}>
            <ArrowLeft size={14} /> Back to Apps
          </button>
          <div className="ui-hstack-3">
            <div style={{ background: `${app.color || '#3b82f6'}15` }} className={styles.s159}>
              {app.icon || '📦'}
            </div>
            <div>
              <div className={styles.s160}>{app.name}</div>
              <div className={styles.s161}>v{app.version}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className={styles.s162}>
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            const badge = sectionBadges[item.id];
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                style={{ background: isActive ? 'var(--color-primary-bg)' : 'transparent', color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: isActive ? 600 : 400 }} className={styles.s163}>
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {badge !== undefined && badge > 0 && (
                  <span style={{ background: isActive ? 'var(--color-primary)' : 'var(--color-border)', color: isActive ? '#fff' : 'var(--color-text-muted)' }} className={styles.s145}>{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.s164}>
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
    </RouteGuard>
  );
}
