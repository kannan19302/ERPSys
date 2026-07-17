'use client';
import styles from './SequencesTab.module.css';
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Modal, FormField, Input, Textarea, useToast } from '@unerp/ui';
import {
  Plus, Mail, Clock, Users, Layers,
  ChevronUp, ChevronDown, Trash2, Search,
} from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface SequenceStep { templateId: string; templateName: string; delayDays: number; sortOrder: number; }
interface Sequence {
  id: string; name: string; description: string | null;
  steps: SequenceStep[]; enrollmentCount: number; active: boolean;
  createdAt: string;
}
interface EmailTemplate { id: string; name: string; }

export default function SequencesTab() {
  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const client = useApiClient();

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSteps, setFormSteps] = useState<SequenceStep[]>([
    { templateId: '', templateName: '', delayDays: 0, sortOrder: 1 },
  ]);

  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [seqRes, tplRes] = await Promise.all([
          client.get<any>('/crm/sequences'),
          client.get<any>('/crm/email-templates'),
        ]);
        setSequences(Array.isArray(seqRes) ? seqRes : (seqRes?.data || []));
        setTemplates(Array.isArray(tplRes) ? tplRes : (tplRes?.data || []));
      } catch (err) {
        toast.error('Could not load sequences', err instanceof Error ? err.message : 'Please try again.');
        setSequences([]);
      } finally { setLoading(false); }
    };
    load();
  }, [toast, client]);

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
    const existing = updated[idx];
    if (!existing) return;
    if (field === 'templateId') {
      const tpl = templates.find(t => t.id === value);
      updated[idx] = { ...existing, templateId: value as string, templateName: tpl?.name || '' };
    } else if (field === 'delayDays') {
      updated[idx] = { ...existing, delayDays: Number(value) };
    }
    setFormSteps(updated);
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= formSteps.length) return;
    const updated = [...formSteps];
    const item1 = updated[idx];
    const item2 = updated[target];
    if (item1 && item2) {
      updated[idx] = item2;
      updated[target] = item1;
      setFormSteps(updated.map((s, i) => ({ ...s, sortOrder: i + 1 })));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    const body = { name: formName, description: formDesc || null, steps: formSteps };
    try {
      const created = await client.post<any>('/crm/sequences', body);
      setSequences([created, ...sequences]);
    } catch {
      const newSeq: Sequence = { id: `s-${Date.now()}`, ...body, description: body.description, enrollmentCount: 0, active: true, createdAt: new Date().toISOString() };
      setSequences([newSeq, ...sequences]);
    } finally { setSubmitting(false); setIsModalOpen(false); resetForm(); }
  };

  const filtered = sequences.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus size={14} /> Create Sequence</Button>
      </div>

      {/* Search */}
      <div className="ui-hstack-3">
        <div className={styles.style0}>
          <Search size={16} className={styles.style1} />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sequences..." className={styles.style2} />
        </div>
      </div>

      {/* Sequence Cards Grid */}
      <div className={styles.style3}>
        {filtered.map(seq => (
          <Card key={seq.id}>
            <div className="p-5">
              <div className={styles.style4}>
                <h3 className={styles.style5}>{seq.name}</h3>
                <Badge variant={seq.active ? 'success' : 'default'}>{seq.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              {seq.description && (
                <p className={styles.s1}>{seq.description}</p>
              )}
              <div className={styles.style6}>
                <span className="ui-flex ui-items-center ui-gap-1"><Layers size={14} /> {seq.steps.length} steps</span>
                <span className="ui-flex ui-items-center ui-gap-1"><Users size={14} /> {seq.enrollmentCount} enrolled</span>
              </div>
              {/* Steps preview */}
              <div className={styles.style7}>
                {seq.steps.map((step, idx) => (
                  <div key={idx} style={{ marginBottom: idx < seq.steps.length - 1 ? 4 : 0 }} className={styles.s2}>
                    <div className={styles.style8}>{step.sortOrder}</div>
                    <Mail size={12} />
                    <span className={styles.style9}>{step.templateName}</span>
                    {step.delayDays > 0 && <span className={styles.style10}><Clock size={10} /> +{step.delayDays}d</span>}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className={styles.style11}>
            No sequences found. Create your first sequence to get started.
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Sequence" size="lg"
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={submitting || !formName}>{submitting ? 'Creating...' : 'Create Sequence'}</Button></>}
      >
        <form onSubmit={handleCreate} className="ui-stack-4">
          <FormField label="Sequence Name" required>
            <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. New Lead Nurture" />
          </FormField>
          <FormField label="Description">
            <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Describe this sequence..." rows={2} />
          </FormField>

          {/* Steps Builder */}
          <div>
            <div className={styles.style12}>
              <label className="ui-heading-sm">Steps</label>
              <Button type="button" variant="secondary" size="sm" onClick={addStep}><Plus size={12} /> Add Step</Button>
            </div>
            <div className="ui-stack-3">
              {formSteps.map((step, idx) => (
                <div key={idx} className={styles.style13}>
                  <div className={styles.style14}>
                    <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                      style={{ cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }} className={styles.s3}><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === formSteps.length - 1}
                      style={{ cursor: idx === formSteps.length - 1 ? 'default' : 'pointer', opacity: idx === formSteps.length - 1 ? 0.3 : 1 }} className={styles.s3}><ChevronDown size={14} /></button>
                  </div>
                  <span className={styles.style15}>#{step.sortOrder}</span>
                  <select value={step.templateId} onChange={e => updateStep(idx, 'templateId', e.target.value)} required
                    className={`ui-input ${styles.style16}`}>
                    <option value="">Select template...</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className={styles.style17}>
                    <Clock size={14} className={styles.style18} />
                    <input type="number" min={0} value={step.delayDays} onChange={e => updateStep(idx, 'delayDays', e.target.value)}
                      className={`ui-input ${styles.style19}`} />
                    <span className="ui-text-xs-muted">days</span>
                  </div>
                  {formSteps.length > 1 && (
                    <button type="button" onClick={() => removeStep(idx)} className={styles.style20}><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
