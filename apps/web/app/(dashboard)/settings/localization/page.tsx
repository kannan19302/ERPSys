'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, PageHeader, Button, Badge, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
export default function LocalizationPage() {
  const client = useApiClient();
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
        const [langData, overData] = await Promise.all([
          client.get<unknown[]>('/admin/localization/languages'),
          client.get<TranslationOverride[]>('/admin/localization/overrides'),
        ]);
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
  }, [client]);

  /* ── add override ── */
  const handleAdd = async () => {
    if (!newKey || !newTranslation) return;
    setSaving(true);
    try {
      const saved = await client.post<TranslationOverride>('/admin/localization/overrides', { locale: newLocale, key: newKey, translation: newTranslation });
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
      await client.delete(`/admin/localization/overrides/${id}`);
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
          const saved = await client.post<TranslationOverride>('/admin/localization/overrides', item);
          setOverrides((prev) => [saved, ...prev]);
          successCount++;
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
      <div className={styles.p1}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="ui-stack-6 ui-animate-in">
      {/* Toast */}
      {toast && (
        <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s1}>
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Localization & Translations"
        description="Manage multi-language support. Override default translations and configure locale-specific settings."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Localization' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={handleExport} className="ui-hstack-2">
              <Download size={16} /> Export
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="ui-hstack-2">
              <Upload size={16} /> Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className={styles.p2} />
            <Button variant="primary" onClick={() => setShowAddModal(true)} className="ui-hstack-2">
              Add Override
            </Button>
          </div>
        }
      />

      {/* Language Cards */}
      <div className={styles.p3}>
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
              <div className={styles.p4}>
                <Globe size={24} style={{ color: filterLocale === lang.code ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
              </div>
              <div className="ui-heading-sm">{lang.name}</div>
              <div className="ui-text-xs-muted">
                {lang.code.toUpperCase()} · {lang.dir === 'rtl' ? 'RTL' : 'LTR'}
              </div>
              <div className={styles.p5}>
                <Badge variant={count > 0 ? 'info' : 'default'}>
                  {count} override{count !== 1 ? 's' : ''}
                </Badge>
              </div>
              {/* Completeness bar */}
              <div className={styles.p6}>
                <div style={{ width: `${pct}%` }} className={styles.s2} />
              </div>
              <div className={styles.p7}>{pct}%</div>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card padding="md" className="ui-hstack-4">
        <div className={styles.p8}>
          <Search size={16} className="ui-input-icon-abs" />
          <input
            type="text"
            placeholder="Search translation keys or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.p9}
          />
        </div>
        {filterLocale !== 'All' && (
          <Button variant="outline" onClick={() => setFilterLocale('All')} className="ui-flex ui-items-center ui-gap-1">
            <X size={14} /> Clear </Button>
        )}
      </Card>

      {/* Overrides Table */}
      <ListPageTemplate
        columns={[
          { key: 'locale', header: 'Locale', render: (v) => <Badge variant="info">{String(v).toUpperCase()}</Badge> },
          { key: 'key', header: 'Translation Key', render: (v) => <code className={styles.p10}>{String(v)}</code> },
          { key: 'translation', header: 'Value' },
          { key: 'id', header: 'Actions', render: (v) => <div className="text-right"><button onClick={() => handleDelete(String(v))} title="Delete" className={styles.p11}><Trash2 size={15} /></button></div> },
        ] as ListColumn[]}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No translation overrides found"
        emptyDescription="Add translation overrides above."
      />

      {/* Add Override Modal */}
      {showAddModal && (
        <div className={styles.p12}>
          <div className={styles.p13}>
            <div className={styles.p14}>
              <h3 className={styles.p15}>Add Translation Override</h3>
              <button onClick={() => setShowAddModal(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>
            <div className="p-5 ui-stack-4">
              <div className="ui-stack-1">
                <label className="ui-text-xs-label">Locale</label>
                <select value={newLocale} onChange={(e) => setNewLocale(e.target.value)} className={styles.p16}>
                  {languages.map((l) => (<option key={l.code} value={l.code}>{l.name} ({l.code})</option>))}
                </select>
              </div>
              <div className="ui-stack-1">
                <label className="ui-text-xs-label">Translation Key</label>
                <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. dashboard.welcome" className={styles.p17} />
              </div>
              <div className="ui-stack-1">
                <label className="ui-text-xs-label">Translation Value</label>
                <textarea value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} placeholder="Translated text..." rows={3} className={styles.p18} />
              </div>
              <div className={styles.p19}>
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
