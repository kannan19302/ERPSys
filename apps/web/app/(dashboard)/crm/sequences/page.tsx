'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Badge, Spinner } from '@unerp/ui';
import {
  Plus, X, Mail, Clock, Users, Layers,
  ChevronUp, ChevronDown, Trash2, Search, Zap
} from 'lucide-react';

interface SequenceStep { templateId: string; templateName: string; delayDays: number; sortOrder: number; }
interface Sequence {
  id: string; name: string; description: string | null;
  steps: SequenceStep[]; enrollmentCount: number; active: boolean;
  createdAt: string;
}
interface EmailTemplate { id: string; name: string; }

export default function SequencesPage() {
  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSteps, setFormSteps] = useState<SequenceStep[]>([
    { templateId: '', templateName: '', delayDays: 0, sortOrder: 1 },
  ]);

  const mockTemplates: EmailTemplate[] = [
    { id: 'tpl-1', name: 'Welcome Introduction' },
    { id: 'tpl-2', name: 'Product Overview' },
    { id: 'tpl-3', name: 'Case Study Share' },
    { id: 'tpl-4', name: 'Meeting Request' },
    { id: 'tpl-5', name: 'Follow-up Nudge' },
    { id: 'tpl-6', name: 'Final Check-in' },
  ];

  const mockSequences: Sequence[] = [
    {
      id: 's1', name: 'New Lead Nurture', description: 'Automated 4-step sequence for new inbound leads',
      steps: [
        { templateId: 'tpl-1', templateName: 'Welcome Introduction', delayDays: 0, sortOrder: 1 },
        { templateId: 'tpl-2', templateName: 'Product Overview', delayDays: 3, sortOrder: 2 },
        { templateId: 'tpl-3', templateName: 'Case Study Share', delayDays: 7, sortOrder: 3 },
        { templateId: 'tpl-4', templateName: 'Meeting Request', delayDays: 10, sortOrder: 4 },
      ],
      enrollmentCount: 142, active: true, createdAt: new Date().toISOString(),
    },
    {
      id: 's2', name: 'Re-engagement Campaign', description: 'Win back cold leads with a 3-touch sequence',
      steps: [
        { templateId: 'tpl-5', templateName: 'Follow-up Nudge', delayDays: 0, sortOrder: 1 },
        { templateId: 'tpl-3', templateName: 'Case Study Share', delayDays: 5, sortOrder: 2 },
        { templateId: 'tpl-6', templateName: 'Final Check-in', delayDays: 14, sortOrder: 3 },
      ],
      enrollmentCount: 67, active: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 's3', name: 'Post-Demo Follow Up', description: 'Follow up after product demonstrations',
      steps: [
        { templateId: 'tpl-5', templateName: 'Follow-up Nudge', delayDays: 1, sortOrder: 1 },
        { templateId: 'tpl-4', templateName: 'Meeting Request', delayDays: 5, sortOrder: 2 },
      ],
      enrollmentCount: 31, active: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token || ''}` };
      try {
        const [seqRes, tplRes] = await Promise.all([
          fetch('/api/v1/crm/sequences', { headers: h }),
          fetch('/api/v1/crm/email-templates', { headers: h }),
        ]);
        if (seqRes.ok) { const d = await seqRes.json(); setSequences(Array.isArray(d) ? d : (d?.data || mockSequences)); }
        else throw new Error();
        if (tplRes.ok) { const d = await tplRes.json(); setTemplates(Array.isArray(d) ? d : (d?.data || mockTemplates)); }
        else setTemplates(mockTemplates);
      } catch {
        setSequences(mockSequences);
        setTemplates(mockTemplates);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const resetForm = () => {
    setFormName(''); setFormDesc('');
    setFormSteps([{ templateId: '', templateName: '', delayDays: 0, sortOrder: 1 }]);
  };

  const addStep = () => {
    setFormSteps([...formSteps, { templateId: '', templateName: '', delayDays: 3, sortOrder: formSteps.length + 1 }]);
  };

  const removeStep = (idx: number) => {
    const updated = formSteps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setFormSteps(updated);
  };

  const updateStep = (idx: number, field: string, value: string | number) => {
    const updated = [...formSteps];
    if (field === 'templateId') {
      const tpl = templates.find(t => t.id === value);
      updated[idx] = { ...updated[idx], templateId: value as string, templateName: tpl?.name || '' };
    } else if (field === 'delayDays') {
      updated[idx] = { ...updated[idx], delayDays: Number(value) };
    }
    setFormSteps(updated);
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= formSteps.length) return;
    const updated = [...formSteps];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setFormSteps(updated.map((s, i) => ({ ...s, sortOrder: i + 1 })));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    const token = localStorage.getItem('token');
    const body = { name: formName, description: formDesc || null, steps: formSteps };
    try {
      const res = await fetch('/api/v1/crm/sequences', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(body),
      });
      if (res.ok) { const created = await res.json(); setSequences([created, ...sequences]); }
      else throw new Error();
    } catch {
      const newSeq: Sequence = { id: `s-${Date.now()}`, ...body, description: body.description, enrollmentCount: 0, active: true, createdAt: new Date().toISOString() };
      setSequences([newSeq, ...sequences]);
    } finally { setSubmitting(false); setIsModalOpen(false); resetForm(); }
  };

  const filtered = sequences.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-secondary)', width: '100%' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader title="Email Sequences" description="Automated multi-step email campaigns"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Email Sequences' }]}
        actions={<Button size="sm" onClick={() => setIsModalOpen(true)}><Plus size={14} /> Create Sequence</Button>}
      />

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sequences..."
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
      </div>

      {/* Sequence Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
        {filtered.map(seq => (
          <Card key={seq.id}>
            <div style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>{seq.name}</h3>
                <Badge variant={seq.active ? 'default' : 'secondary'}>{seq.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              {seq.description && (
                <p style={{ margin: 0, marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{seq.description}</p>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={14} /> {seq.steps.length} steps</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {seq.enrollmentCount} enrolled</span>
              </div>
              {/* Steps preview */}
              <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                {seq.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: idx < seq.steps.length - 1 ? 4 : 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary-light, #e8f0fe)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{step.sortOrder}</div>
                    <Mail size={12} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.templateName}</span>
                    {step.delayDays > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={10} /> +{step.delayDays}d</span>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            No sequences found. Create your first sequence to get started.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 12, padding: 'var(--space-6)', width: 580, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Create Sequence</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>Sequence Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. New Lead Nurture" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>Description</label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Describe this sequence..." rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Steps Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Steps</label>
                  <Button type="button" variant="outline" size="sm" onClick={addStep}><Plus size={12} /> Add Step</Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {formSteps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                          style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: 0 }}><ChevronUp size={14} /></button>
                        <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === formSteps.length - 1}
                          style={{ background: 'none', border: 'none', cursor: idx === formSteps.length - 1 ? 'default' : 'pointer', opacity: idx === formSteps.length - 1 ? 0.3 : 1, padding: 0 }}><ChevronDown size={14} /></button>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-primary)', minWidth: 20 }}>#{step.sortOrder}</span>
                      <select value={step.templateId} onChange={e => updateStep(idx, 'templateId', e.target.value)} required
                        style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                        <option value="">Select template...</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 100 }}>
                        <Clock size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                        <input type="number" min={0} value={step.delayDays} onChange={e => updateStep(idx, 'delayDays', e.target.value)}
                          style={{ ...inputStyle, width: 56, textAlign: 'center' }} />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>days</span>
                      </div>
                      {formSteps.length > 1 && (
                        <button type="button" onClick={() => removeStep(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting || !formName}>{submitting ? 'Creating...' : 'Create Sequence'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
