// @ts-nocheck
'use client';
import styles from './page.module.css';
import React, { useEffect, useMemo, useState } from 'react';
import { allApplications, getAppSpecificNavigation } from '@/navigation';
import { PageHeader } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import {
  Layers, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, Save, Plus, Trash2, Settings2, FolderPlus,
} from 'lucide-react';

interface NavConfig {
  order: string[];
  hidden: string[];
  renames: Record<string, string>;
  submodules: any[];
}

const itemKey = (it: any) => it.href || it.name;

export default function CustomizeAppPage() {
  const client = useApiClient();
  // Customizable targets = installed core apps (exclude kernel/dev tooling).
  const apps = useMemo(
    () => allApplications.filter((a) => a.installed && !['builder', 'app-store', 'api-keys', 'saas', 'admin', 'dashboard'].includes(a.id)),
    [],
  );
  const [moduleId, setModuleId] = useState(apps[0]?.id || 'finance');
  const app = apps.find((a) => a.id === moduleId);

  const staticItems = useMemo(() => getAppSpecificNavigation(app?.href || `/${moduleId}`).items || [], [moduleId, app]);

  const [config, setConfig] = useState<NavConfig>({ order: [], hidden: [], renames: {}, submodules: [] });
  const [submodules, setSubmodules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // New-submodule form
  const [subName, setSubName] = useState('');
  const [subFields, setSubFields] = useState('name, status, notes');

  const load = async () => {
    setLoading(true);
    try {
      const data = await client.get(`/builder/nav-overlay/${moduleId}`);
      setConfig({ order: [], hidden: [], renames: {}, submodules: [], ...(data?.config || {}) });
      setSubmodules(data?.submodules || []);
    } catch {
      setConfig({ order: [], hidden: [], renames: {}, submodules: [] });
      setSubmodules([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [moduleId]);

  // Ordered, editable view of the top-level nav items.
  const ordered = useMemo(() => {
    const rank = (it: any) => {
      const i = (config.order || []).indexOf(itemKey(it));
      return i === -1 ? 999 : i;
    };
    return [...staticItems].sort((a, b) => rank(a) - rank(b));
  }, [staticItems, config.order]);

  const isHidden = (it: any) => (config.hidden || []).includes(itemKey(it));
  const nameOf = (it: any) => config.renames?.[itemKey(it)] ?? it.name;

  const toggleHidden = (it: any) => {
    const k = itemKey(it);
    const hidden = new Set(config.hidden || []);
    hidden.has(k) ? hidden.delete(k) : hidden.add(k);
    setConfig({ ...config, hidden: [...hidden] });
  };
  const rename = (it: any, value: string) => {
    const renames = { ...(config.renames || {}) };
    if (value && value !== it.name) renames[itemKey(it)] = value;
    else delete renames[itemKey(it)];
    setConfig({ ...config, renames });
  };
  const move = (idx: number, dir: number) => {
    const keys = ordered.map(itemKey);
    const j = idx + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[idx], keys[j]] = [keys[j], keys[idx]];
    setConfig({ ...config, order: keys });
  };

  const save = async () => {
    await client.request(`/builder/nav-overlay/${moduleId}`, { method: 'PUT', body: JSON.stringify({ config }) });
    setSavedMsg('Saved — reload any page in this app to see the changes.');
    window.dispatchEvent(new Event('unerp_nav_overlay_updated'));
    setTimeout(() => setSavedMsg(''), 4000);
  };
  const reset = async () => {
    await client.delete(`/builder/nav-overlay/${moduleId}`);
    window.dispatchEvent(new Event('unerp_nav_overlay_updated'));
    setSavedMsg('Reset to defaults.');
    setTimeout(() => setSavedMsg(''), 4000);
    load();
  };

  const addSubmodule = async () => {
    if (!subName.trim()) return;
    const slug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const fields = subFields.split(',').map((f) => f.trim()).filter(Boolean);
    try {
      await client.post(`/builder/nav-overlay/${moduleId}/submodules`, { name: subName, slug, fields });
      setSubName('');
      setSubFields('name, status, notes');
      load();
    } catch { /* */ }
  };
  const removeSubmodule = async (slug: string) => {
    try {
      await client.delete(`/builder/nav-overlay/${moduleId}/submodules/${slug}`);
      load();
    } catch { /* */ }
  };

  return (
    <div className={styles.s1}>
      <PageHeader
        title="Customize an App"
        description="Reorder, hide, or rename an existing app's navigation, and add new submodules — all without touching core code. Changes apply only to your organization and can be reset to default at any time."
      />

      {/* App picker */}
      <div className={styles.s2}>
        {apps.map((a) => {
          const Icon = a.icon;
          const active = a.id === moduleId;
          return (
            <button
              key={a.id}
              onClick={() => setModuleId(a.id)}
              style={{ border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`, background: active ? 'var(--color-primary)' : 'var(--color-bg-elevated)', color: active ? '#fff' : 'var(--color-text)' }} className={styles.s3}
            >
              {Icon && <Icon size={16} />} {a.name}
            </button>
          );
        })}
      </div>

      {savedMsg && (
        <div className={styles.s4}>
          {savedMsg}
        </div>
      )}

      <div className={styles.s5}>
        {/* Nav editor */}
        <section className="ui-card p-5">
          <div className={styles.s6}>
            <h2 className={styles.s7}>
              <Layers size={18} /> Navigation
            </h2>
            <div className="ui-flex ui-gap-2">
              <button onClick={reset} className="ui-btn ui-btn-secondary"><RotateCcw size={15} /> Reset</button>
              <button onClick={save} className="ui-btn ui-btn-primary"><Save size={15} /> Save Changes</button>
            </div>
          </div>

          {loading ? (
            <p className="ui-text-sm-muted">Loading...</p>
          ) : (
            <div className="ui-stack-2">
              {ordered.map((it: any, idx: number) => (
                <div key={itemKey(it)} style={{ opacity: isHidden(it) ? 0.5 : 1 }} className={styles.s8}>
                  <div className="ui-flex-col">
                    <button onClick={() => move(idx, -1)} style={iconBtn} title="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => move(idx, 1)} style={iconBtn} title="Move down"><ArrowDown size={14} /></button>
                  </div>
                  <input
                    value={nameOf(it)}
                    onChange={(e) => rename(it, e.target.value)}
                    className={styles.s9}
                  />
                  {it.isHeader && <span className="ui-text-xs-tertiary">section</span>}
                  <button onClick={() => toggleHidden(it)} style={iconBtn} title={isHidden(it) ? 'Show' : 'Hide'}>
                    {isHidden(it) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submodules */}
        <section className="ui-card p-5">
          <h2 className={styles.s10}>
            <FolderPlus size={18} /> Submodules
          </h2>

          {submodules.length === 0 ? (
            <p className="ui-text-sm-muted">No custom submodules yet.</p>
          ) : (
            <div className={styles.s11}>
              {submodules.map((sm: any) => (
                <div key={sm.slug} className={styles.s12}>
                  <div>
                    <div className={styles.s13}>{sm.name}</div>
                    <div className="ui-text-xs-tertiary">{sm.pages?.length || 0} page(s) · /app/{moduleId}/{sm.slug}</div>
                  </div>
                  <button onClick={() => removeSubmodule(sm.slug)} style={iconBtn} title="Delete submodule"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.s14}>
            <label className="ui-heading-sm">Add a submodule</label>
            <input placeholder="Submodule name (e.g. Site Visits)" value={subName} onChange={(e) => setSubName(e.target.value)} style={inputStyle} />
            <input placeholder="Fields (comma separated)" value={subFields} onChange={(e) => setSubFields(e.target.value)} style={inputStyle} />
            <button onClick={addSubmodule} style={{ ...btn('primary') }} className={styles.s15}><Plus size={15} /> Create submodule</button>
          </div>
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)',
};
const iconBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-1)',
  background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-sm)',
};
const btn = (variant: string) => ({
  display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
  border: variant === 'ghost' ? '1px solid var(--color-border)' : 'none',
  background: variant === 'primary' ? 'var(--color-primary)' : 'transparent',
  color: variant === 'primary' ? '#fff' : 'var(--color-text)',
});
