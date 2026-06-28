/* eslint-disable */
// @ts-nocheck
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { allApplications, getAppSpecificNavigation } from '@/navigation';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';
import { PageHeader } from '@unerp/ui';
import {
  Layers, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, Save, Plus, Trash2, Settings2, FolderPlus,
} from 'lucide-react';

const itemKey = (it) => it.href || it.name;

export default function CustomizeAppPage() {
  // Customizable targets = installed core apps (exclude kernel/dev tooling).
  const apps = useMemo(
    () => allApplications.filter((a) => a.installed && !['builder', 'app-store', 'api-keys', 'saas', 'admin', 'dashboard'].includes(a.id)),
    [],
  );
  const [moduleId, setModuleId] = useState(apps[0]?.id || 'finance');
  const app = apps.find((a) => a.id === moduleId);

  const staticItems = useMemo(() => getAppSpecificNavigation(app?.href || `/${moduleId}`).items || [], [moduleId, app]);

  const [config, setConfig] = useState({ order: [], hidden: [], renames: {}, submodules: [] });
  const [submodules, setSubmodules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // New-submodule form
  const [subName, setSubName] = useState('');
  const [subFields, setSubFields] = useState('name, status, notes');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/builder/nav-overlay/${moduleId}`);
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
    const rank = (it) => {
      const i = (config.order || []).indexOf(itemKey(it));
      return i === -1 ? 999 : i;
    };
    return [...staticItems].sort((a, b) => rank(a) - rank(b));
  }, [staticItems, config.order]);

  const isHidden = (it) => (config.hidden || []).includes(itemKey(it));
  const nameOf = (it) => config.renames?.[itemKey(it)] ?? it.name;

  const toggleHidden = (it) => {
    const k = itemKey(it);
    const hidden = new Set(config.hidden || []);
    hidden.has(k) ? hidden.delete(k) : hidden.add(k);
    setConfig({ ...config, hidden: [...hidden] });
  };
  const rename = (it, value) => {
    const renames = { ...(config.renames || {}) };
    if (value && value !== it.name) renames[itemKey(it)] = value;
    else delete renames[itemKey(it)];
    setConfig({ ...config, renames });
  };
  const move = (idx, dir) => {
    const keys = ordered.map(itemKey);
    const j = idx + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[idx], keys[j]] = [keys[j], keys[idx]];
    setConfig({ ...config, order: keys });
  };

  const save = async () => {
    await apiPut(`/builder/nav-overlay/${moduleId}`, { config });
    setSavedMsg('Saved — reload any page in this app to see the changes.');
    window.dispatchEvent(new Event('unerp_nav_overlay_updated'));
    setTimeout(() => setSavedMsg(''), 4000);
  };
  const reset = async () => {
    await apiDelete(`/builder/nav-overlay/${moduleId}`);
    window.dispatchEvent(new Event('unerp_nav_overlay_updated'));
    await load();
    setSavedMsg('Navigation reset to default.');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const addSubmodule = async () => {
    if (!subName.trim()) return;
    const slug = subName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const fields = subFields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((f) => ({ name: f.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label: f, type: 'text' }));
    await apiPost(`/builder/nav-overlay/${moduleId}/submodules`, {
      name: subName.trim(),
      slug,
      schema: { fields },
      pages: [{ slug, title: subName.trim(), type: 'LIST' }],
    });
    setSubName('');
    setSubFields('name, status, notes');
    window.dispatchEvent(new Event('unerp_nav_overlay_updated'));
    await load();
  };
  const removeSubmodule = async (slug) => {
    await apiDelete(`/builder/nav-overlay/${moduleId}/submodules/${slug}`);
    window.dispatchEvent(new Event('unerp_nav_overlay_updated'));
    await load();
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 980, margin: '0 auto' }}>
      <PageHeader
        title="Customize an App"
        description="Reorder, hide, or rename an existing app's navigation, and add new submodules — all without touching core code. Changes apply only to your organization and can be reset to default at any time."
      />

      {/* App picker */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {apps.map((a) => {
          const Icon = a.icon;
          const active = a.id === moduleId;
          return (
            <button
              key={a.id}
              onClick={() => setModuleId(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: active ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                color: active ? '#fff' : 'var(--color-text)',
              }}
            >
              {Icon && <Icon size={16} />} {a.name}
            </button>
          );
        })}
      </div>

      {savedMsg && (
        <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-success-bg, #ecfdf5)', color: 'var(--color-success, #047857)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          {savedMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* Nav editor */}
        <section style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0, display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Layers size={18} /> Navigation
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={reset} style={btn('ghost')}><RotateCcw size={15} /> Reset</button>
              <button onClick={save} style={btn('primary')}><Save size={15} /> Save</button>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {ordered.map((it, idx) => (
                <div key={itemKey(it)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', opacity: isHidden(it) ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => move(idx, -1)} style={iconBtn} title="Move up"><ArrowUp size={14} /></button>
                    <button onClick={() => move(idx, 1)} style={iconBtn} title="Move down"><ArrowDown size={14} /></button>
                  </div>
                  <input
                    value={nameOf(it)}
                    onChange={(e) => rename(it, e.target.value)}
                    style={{ flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}
                  />
                  {it.isHeader && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>section</span>}
                  <button onClick={() => toggleHidden(it)} style={iconBtn} title={isHidden(it) ? 'Show' : 'Hide'}>
                    {isHidden(it) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submodules */}
        <section style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-4)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <FolderPlus size={18} /> Submodules
          </h2>

          {submodules.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No custom submodules yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              {submodules.map((sm) => (
                <div key={sm.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{sm.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{sm.pages?.length || 0} page(s) · /app/{moduleId}/{sm.slug}</div>
                  </div>
                  <button onClick={() => removeSubmodule(sm.slug)} style={iconBtn} title="Delete submodule"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Add a submodule</label>
            <input placeholder="Submodule name (e.g. Site Visits)" value={subName} onChange={(e) => setSubName(e.target.value)} style={inputStyle} />
            <input placeholder="Fields (comma separated)" value={subFields} onChange={(e) => setSubFields(e.target.value)} style={inputStyle} />
            <button onClick={addSubmodule} style={{ ...btn('primary'), alignSelf: 'flex-start' }}><Plus size={15} /> Create submodule</button>
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
const btn = (variant) => ({
  display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
  border: variant === 'ghost' ? '1px solid var(--color-border)' : 'none',
  background: variant === 'primary' ? 'var(--color-primary)' : 'transparent',
  color: variant === 'primary' ? '#fff' : 'var(--color-text)',
});
