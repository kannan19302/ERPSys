'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Button, Badge } from '@unerp/ui';
import { Globe, Plus, Trash2, X, Search } from 'lucide-react';

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

const supportedLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'zh', name: '中文', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
];

export default function LocalizationPage() {
  const [overrides, setOverrides] = useState<TranslationOverride[]>([
    { id: 'lo-1', locale: 'es', key: 'dashboard.welcome', translation: '¡Bienvenido al sistema UniERP!' },
    { id: 'lo-2', locale: 'fr', key: 'dashboard.welcome', translation: 'Bienvenue dans le système UniERP !' },
    { id: 'lo-3', locale: 'de', key: 'nav.finance', translation: 'Finanzbuchhaltung' },
    { id: 'lo-4', locale: 'ar', key: 'dashboard.welcome', translation: 'مرحبًا بكم في نظام UniERP!' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocale, setNewLocale] = useState('es');
  const [newKey, setNewKey] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [filterLocale, setFilterLocale] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = () => {
    if (!newKey || !newTranslation) return;
    setOverrides((prev) => [
      { id: `lo-${Date.now()}`, locale: newLocale, key: newKey, translation: newTranslation },
      ...prev,
    ]);
    setNewKey('');
    setNewTranslation('');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  };

  const filtered = overrides.filter((o) => {
    const matchLocale = filterLocale === 'All' || o.locale === filterLocale;
    const matchSearch = o.key.toLowerCase().includes(searchQuery.toLowerCase()) || o.translation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLocale && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Localization & Translations"
        description="Manage multi-language support. Override default translations and configure locale-specific settings."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Localization' }]}
        actions={
          <Button variant="primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} /> Add Override
          </Button>
        }
      />

      {/* Language Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
        {supportedLanguages.map((lang) => {
          const count = overrides.filter((o) => o.locale === lang.code).length;
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
            <X size={14} /> Clear Filter
          </Button>
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
                  {supportedLanguages.map((l) => (<option key={l.code} value={l.code}>{l.name} ({l.code})</option>))}
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
                <Button variant="primary" onClick={handleAdd}>Save Override</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
