'use client';
import styles from './BattlecardsTab.module.css';
import React, { useState, useEffect } from 'react';
import { Card, Spinner, Button, Modal, FormField, Input, Textarea } from '@unerp/ui';
import { Swords, Plus, X, Search, Shield, AlertTriangle, Trophy, MessageSquare } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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

export default function BattlecardsTab() {
  const [battlecards, setBattlecards] = useState<Battlecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ competitorName: '', strengths: [''], weaknesses: [''], objections: [{ objection: '', response: '' }], winStrategy: '' });
  const client = useApiClient();

  const fetchBattlecards = async () => {
    setLoading(true);
    try {
      const res = await client.get<any>('/crm/battlecards');
      setBattlecards(Array.isArray(res) ? res : res.data || MOCK_BATTLECARDS);
    } catch {
      setBattlecards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBattlecards(); }, []);

  const handleCreate = async () => {
    if (!form.competitorName.trim()) return;
    setSaving(true);
    try {
      await client.post('/crm/battlecards', {
        competitorName: form.competitorName.trim(),
        strengths: form.strengths.filter((s) => s.trim()),
        weaknesses: form.weaknesses.filter((w) => w.trim()),
        objections: form.objections.filter((o) => o.objection.trim()),
        winStrategy: form.winStrategy.trim(),
      });
      setShowModal(false);
      setForm({ competitorName: '', strengths: [''], weaknesses: [''], objections: [{ objection: '', response: '' }], winStrategy: '' });
      fetchBattlecards();
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

  if (loading) {
    return <div className={styles.style0}><Spinner /></div>;
  }

  return (
    <div className={styles.style1}>
      <div className="ui-flex-end">
        <Button onClick={() => setShowModal(true)}>
          <Plus className={styles.style2} /> New Battlecard
        </Button>
      </div>

      <div className={styles.style3}>
        <Search className={styles.style4} />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search competitors..." className={styles.style5} />
      </div>

      <div className={styles.style6}>
        {filtered.map((bc) => (
          <Card key={bc.id} className={styles.style7}>
            <div className={styles.style8}>
              <Swords className={styles.style9} />
              <h3 className={styles.style10}>{bc.competitorName}</h3>
            </div>

            <div className={styles.style11}>
              <div className="flex-1">
                <div className={styles.style12}>
                  <Shield className={styles.style13} /> Strengths
                </div>
                <ul className={styles.s1}>
                  {bc.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="flex-1">
                <div className={styles.style14}>
                  <AlertTriangle className={styles.style15} /> Weaknesses
                </div>
                <ul className={styles.s1}>
                  {bc.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            <div className={styles.style16}>
              <span className="ui-flex ui-items-center ui-gap-1"><MessageSquare className={styles.style17} /> {bc.objections.length} objections</span>
            </div>

            {bc.winStrategy && (
              <div className={styles.style18}>
                <div className={styles.style19}>
                  <Trophy className={styles.style20} /> Win Strategy
                </div>
                <p className={styles.s2}>{bc.winStrategy.length > 120 ? bc.winStrategy.slice(0, 120) + '...' : bc.winStrategy}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.style21}>
          <Swords className={styles.s3} />
          <p>{search ? 'No battlecards match your search.' : 'No battlecards yet. Create one to get started.'}</p>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Battlecard" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate} disabled={!form.competitorName.trim() || saving}>{saving ? 'Creating...' : 'Create Battlecard'}</Button></>}
      >
        <div className={styles.style22}>
          <FormField label="Competitor Name" required>
            <Input value={form.competitorName} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} placeholder="e.g. Acme Corp" />
          </FormField>

          {(['strengths', 'weaknesses'] as const).map((field) => (
            <div key={field} className={styles.style23}>
              <label className={styles.style24}>{field}</label>
              {form[field].map((val, i) => (
                <div key={i} className={styles.style25}>
                  <Input value={val} onChange={(e) => updateRow(field, i, e.target.value)} placeholder={`Add ${field.slice(0, -1)}...`} className="flex-1" />
                  {form[field].length > 1 && <button onClick={() => removeRow(field, i)} className="ui-btn-icon ui-text-muted"><X className={styles.style26} /></button>}
                </div>
              ))}
              <button onClick={() => addRow(field)} className={styles.style27}>+ Add {field.slice(0, -1)}</button>
            </div>
          ))}

          <div className={styles.style28}>
            <label className={styles.style29}>Objections</label>
            {form.objections.map((obj, i) => (
              <div key={i} className={styles.style30}>
                <div className={styles.style31}>
                  <Input value={obj.objection} onChange={(e) => updateObjection(i, 'objection', e.target.value)} placeholder="Objection..." />
                  <Input value={obj.response} onChange={(e) => updateObjection(i, 'response', e.target.value)} placeholder="Response..." />
                </div>
                {form.objections.length > 1 && <button onClick={() => removeObjection(i)} className={styles.style32}><X className={styles.style33} /></button>}
              </div>
            ))}
            <button onClick={addObjection} className={styles.style34}>+ Add objection</button>
          </div>

          <FormField label="Win Strategy">
            <Textarea value={form.winStrategy} onChange={(e) => setForm({ ...form, winStrategy: e.target.value })} placeholder="How to win against this competitor..." rows={3} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
