'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button } from '@unerp/ui';
import { Swords, Plus, X, Search, Shield, AlertTriangle, Trophy, MessageSquare } from 'lucide-react';

interface Battlecard {
  id: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  objections: Array<{ objection: string; response: string }>;
  winStrategy: string;
  createdAt: string;
}

const MOCK_BATTLECARDS: Battlecard[] = [
  { id: '1', competitorName: 'Acme Corp', strengths: ['Strong brand recognition', 'Large sales team', 'Enterprise integrations'], weaknesses: ['Slow onboarding', 'Limited customization', 'Higher pricing'], objections: [{ objection: 'They have more features', response: 'Our platform is more focused and delivers faster ROI' }, { objection: 'They are more established', response: 'We move faster and offer dedicated support' }], winStrategy: 'Emphasize our faster implementation time and personalized support. Offer a pilot program to demonstrate value quickly.', createdAt: '2026-06-01' },
  { id: '2', competitorName: 'GlobalTech Solutions', strengths: ['Global presence', 'Multi-language support'], weaknesses: ['Complex UI', 'Poor mobile experience', 'Slow support response'], objections: [{ objection: 'They operate in more countries', response: 'We cover all major markets and are expanding rapidly' }], winStrategy: 'Focus on user experience and mobile-first design. Highlight our faster support SLAs.', createdAt: '2026-06-05' },
  { id: '3', competitorName: 'QuickSell Pro', strengths: ['Low price point', 'Easy setup'], weaknesses: ['Limited reporting', 'No API access', 'Basic CRM only'], objections: [{ objection: 'They cost less', response: 'Our platform delivers 3x more value per dollar with advanced features included' }], winStrategy: 'Position as the platform they will grow into. Show total cost of ownership over 3 years.', createdAt: '2026-06-12' },
];

export default function BattlecardsPage() {
  const [battlecards, setBattlecards] = useState<Battlecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ competitorName: '', strengths: [''], weaknesses: [''], objections: [{ objection: '', response: '' }], winStrategy: '' });

  useEffect(() => { fetchBattlecards(); }, []);

  const fetchBattlecards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/battlecards', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBattlecards(Array.isArray(data) ? data : data.data || MOCK_BATTLECARDS);
    } catch {
      setBattlecards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.competitorName.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/battlecards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({
          competitorName: form.competitorName.trim(),
          strengths: form.strengths.filter((s) => s.trim()),
          weaknesses: form.weaknesses.filter((w) => w.trim()),
          objections: form.objections.filter((o) => o.objection.trim()),
          winStrategy: form.winStrategy.trim(),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ competitorName: '', strengths: [''], weaknesses: [''], objections: [{ objection: '', response: '' }], winStrategy: '' });
        fetchBattlecards();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const addRow = (field: 'strengths' | 'weaknesses') => setForm({ ...form, [field]: [...form[field], ''] });
  const removeRow = (field: 'strengths' | 'weaknesses', i: number) => setForm({ ...form, [field]: form[field].filter((_, idx) => idx !== i) });
  const updateRow = (field: 'strengths' | 'weaknesses', i: number, val: string) => { const arr = [...form[field]]; arr[i] = val; setForm({ ...form, [field]: arr }); };
  const addObjection = () => setForm({ ...form, objections: [...form.objections, { objection: '', response: '' }] });
  const removeObjection = (i: number) => setForm({ ...form, objections: form.objections.filter((_, idx) => idx !== i) });
  const updateObjection = (i: number, key: 'objection' | 'response', val: string) => {
    const arr = [...form.objections];
    const existing = arr[i];
    if (existing) {
      arr[i] = { ...existing, [key]: val };
      setForm({ ...form, objections: arr });
    }
  };

  const filtered = battlecards.filter((bc) => bc.competitorName.toLowerCase().includes(search.toLowerCase()));
  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Battlecards' }];
  const inputStyle: React.CSSProperties = { padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-6)' }}>
        <PageHeader title="Battlecards" breadcrumbs={breadcrumbs} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-10)' }}><Spinner /></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <PageHeader
        title="Battlecards"
        breadcrumbs={breadcrumbs}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Battlecard
          </Button>
        }
      />

      <div style={{ marginTop: 'var(--spacing-4)', maxWidth: 400, position: 'relative' }}>
        <Search style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search competitors..." style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-5)' }}>
        {filtered.map((bc) => (
          <Card key={bc.id} style={{ padding: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Swords style={{ width: 22, height: 22, color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{bc.competitorName}</h3>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 'var(--spacing-1)', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase' }}>
                  <Shield style={{ width: 12, height: 12 }} /> Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {bc.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 'var(--spacing-1)', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-warning)', textTransform: 'uppercase' }}>
                  <AlertTriangle style={{ width: 12, height: 12 }} /> Weaknesses
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {bc.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare style={{ width: 14, height: 14 }} /> {bc.objections.length} objections</span>
            </div>

            {bc.winStrategy && (
              <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 'var(--spacing-1)', fontWeight: 600, color: 'var(--color-primary)' }}>
                  <Trophy style={{ width: 14, height: 14 }} /> Win Strategy
                </div>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{bc.winStrategy.length > 120 ? bc.winStrategy.slice(0, 120) + '...' : bc.winStrategy}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-secondary)' }}>
          <Swords style={{ width: 48, height: 48, marginBottom: 'var(--spacing-3)', opacity: 0.4 }} />
          <p>{search ? 'No battlecards match your search.' : 'No battlecards yet. Create one to get started.'}</p>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto' }}>
          <Card style={{ width: 560, maxHeight: '90vh', overflow: 'auto', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>New Battlecard</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Competitor Name *</label>
              <input value={form.competitorName} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} placeholder="e.g. Acme Corp" style={inputStyle} />
            </div>

            {(['strengths', 'weaknesses'] as const).map((field) => (
              <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{field}</label>
                {form[field].map((val, i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                    <input value={val} onChange={(e) => updateRow(field, i, e.target.value)} placeholder={`Add ${field.slice(0, -1)}...`} style={{ ...inputStyle, flex: 1 }} />
                    {form[field].length > 1 && <button onClick={() => removeRow(field, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X style={{ width: 16, height: 16 }} /></button>}
                  </div>
                ))}
                <button onClick={() => addRow(field)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', textAlign: 'left', padding: 0 }}>+ Add {field.slice(0, -1)}</button>
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Objections</label>
              {form.objections.map((obj, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                    <input value={obj.objection} onChange={(e) => updateObjection(i, 'objection', e.target.value)} placeholder="Objection..." style={inputStyle} />
                    <input value={obj.response} onChange={(e) => updateObjection(i, 'response', e.target.value)} placeholder="Response..." style={inputStyle} />
                  </div>
                  {form.objections.length > 1 && <button onClick={() => removeObjection(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', marginTop: 8 }}><X style={{ width: 16, height: 16 }} /></button>}
                </div>
              ))}
              <button onClick={addObjection} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', textAlign: 'left', padding: 0 }}>+ Add objection</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Win Strategy</label>
              <textarea value={form.winStrategy} onChange={(e) => setForm({ ...form, winStrategy: e.target.value })} placeholder="How to win against this competitor..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.competitorName.trim() || saving}>{saving ? 'Creating...' : 'Create Battlecard'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
