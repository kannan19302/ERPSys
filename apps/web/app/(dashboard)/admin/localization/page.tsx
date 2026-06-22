'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, PageHeader, Button, Badge, Spinner } from '@unerp/ui';
import { Globe, Trash2, X, Search, Download, Upload } from 'lucide-react';

interface LanguageInfo {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
}

interface TranslationOverride {
  id: string;
  locale: string;
  key: string;
  translation: string;
}

/* ── fallback defaults ── */
const FALLBACK_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
];

const FALLBACK_OVERRIDES: TranslationOverride[] = [
  { id: 'lo-1', locale: 'es', key: 'dashboard.welcome', translation: '¡Bienvenido al sistema UniERP!' },
  { id: 'lo-2', locale: 'fr', key: 'dashboard.welcome', translation: 'Bienvenue dans le système UniERP !' },
  { id: 'lo-3', locale: 'de', key: 'nav.finance', translation: 'Finanzbuchhaltung' },
  { id: 'lo-4', locale: 'ar', key: 'dashboard.welcome', translation: 'مرحبًا بكم في نظام UniERP!' },
];

/* ── helpers ── */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function LocalizationPage() {
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [overrides, setOverrides] = useState<TranslationOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLocale, setNewLocale] = useState('es');
  const [newKey, setNewKey] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [filterLocale, setFilterLocale] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── fetch data ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [langRes, overRes] = await Promise.all([
          fetch('/api/v1/admin/localization/languages', { headers: authHeaders() }),
          fetch('/api/v1/admin/localization/overrides', { headers: authHeaders() }),
        ]);
        if (!langRes.ok || !overRes.ok) throw new Error('API error');
        const langData = await langRes.json();
        const overData = await overRes.json();
        if (!cancelled) {
          setLanguages(Array.isArray(langData) ? langData.map((l: any) => ({ code: l.code, name: l.name, dir: l.direction ?? l.dir ?? 'ltr' })) : FALLBACK_LANGUAGES);
          setOverrides(Array.isArray(overData) ? overData : FALLBACK_OVERRIDES);
        }
      } catch {
        if (!cancelled) {
          setLanguages(FALLBACK_LANGUAGES);
          setOverrides(FALLBACK_OVERRIDES);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── add override ── */
  const handleAdd = async () => {
    if (!newKey || !newTranslation) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/localization/overrides', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ locale: newLocale, key: newKey, translation: newTranslation }),
      });
      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      setOverrides((prev) => [saved, ...prev]);
      showToast('Override saved', 'success');
    } catch {
      /* local fallback */
      setOverrides((prev) => [{ id: `lo-${Date.now()}`, locale: newLocale, key: newKey, translation: newTranslation }, ...prev]);
      showToast('Saved locally (API unavailable)', 'error');
    } finally {
      setSaving(false);
      setNewKey('');
      setNewTranslation('');
      setShowAddModal(false);
    }
  };

  /* ── delete override ── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/localization/overrides/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Delete failed');
      setOverrides((prev) => prev.filter((o) => o.id !== id));
      showToast('Override deleted', 'success');
    } catch {
      setOverrides((prev) => prev.filter((o) => o.id !== id));
      showToast('Deleted locally (API unavailable)', 'error');
    }
  };

  /* ── export ── */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation-overrides.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Overrides exported', 'success');
  };

  /* ── import ── */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items: { locale: string; key: string; translation: string }[] = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error('Invalid format');
      let successCount = 0;
      for (const item of items) {
        try {
          const res = await fetch('/api/v1/admin/localization/overrides', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ locale: item.locale, key: item.key, translation: item.translation }),
          });
          if (res.ok) {
            const saved = await res.json();
            setOverrides((prev) => [saved, ...prev]);
            successCount++;
          }
        } catch {
          /* skip individual failures */
        }
      }
      showToast(`Imported ${successCount}/${items.length} overrides`, successCount === items.length ? 'success' : 'error');
    } catch {
      showToast('Invalid JSON file', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── filter ── */
  const filtered = overrides.filter((o) => {
    const matchLocale = filterLocale === 'All' || o.locale === filterLocale;
    const matchSearch = o.key.toLowerCase().includes(searchQuery.toLowerCase()) || o.translation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLocale && matchSearch;
  });

  /* ── completeness: unique keys across all overrides ── */
  const totalKeys = new Set(overrides.map((o) => o.key)).size;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 500,
          padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
          boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.2s ease-out',
        }}>
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Localization & Translations"
        description="Manage multi-language support. Override default translations and configure locale-specific settings."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Localization' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Download size={16} /> Export
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Upload size={16} /> Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <Button variant="primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Add Override
            </Button>
          </div>
        }
      />

      {/* Language Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        {languages.map((lang) => {
          const count = overrides.filter((o) => o.locale === lang.code).length;
          const pct = totalKeys > 0 ? Math.round((count / totalKeys) * 100) : 0;
          return (
            <Card
              key={lang.code}
              padding="md"
              style={{
                cursor: 'pointer',
                border: filterLocale === lang.code ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                transition: 'all 0.15s ease',
                textAlign: 'center',
              }}
              onClick={() => setFilterLocale(filterLocale === lang.code ? 'All' : lang.code)}
            >
              <div style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>
                <Globe size={24} style={{ color: filterLocale === lang.code ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
              </div>
              <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{lang.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                {lang.code.toUpperCase()} · {lang.dir === 'rtl' ? 'RTL' : 'LTR'}
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Badge variant={count > 0 ? 'info' : 'default'}>
                  {count} override{count !== 1 ? 's' : ''}
                </Badge>
              </div>
              {/* Completeness bar */}
              <div style={{ marginTop: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-sm)', height: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{pct}%</div>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card padding="md" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search translation keys or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }}
          />
        </div>
        {filterLocale !== 'All' && (
          <Button variant="outline" onClick={() => setFilterLocale('All')} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <X size={14} /> Clear </Button>
        )}
      </Card>

      {/* Overrides Table */}
      <Card padding="none" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Locale</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Translation Key</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Value</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Badge variant="info">{o.locale.toUpperCase()}</Badge>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <code style={{ background: 'var(--color-bg-sunken)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>{o.key}</code>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text)' }}>{o.translation}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(o.id)} title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px' }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No translation overrides found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Override Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Add Translation Override</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Locale</label>
                <select value={newLocale} onChange={(e) => setNewLocale(e.target.value)} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                  {languages.map((l) => (<option key={l.code} value={l.code}>{l.name} ({l.code})</option>))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Translation Key</label>
                <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. dashboard.welcome" style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Translation Value</label>
                <textarea value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} placeholder="Translated text..." rows={3} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAdd} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Override'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
