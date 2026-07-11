'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { Plus, X, Trash2, Zap, Phone, Mail, Linkedin, ListTodo, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, ApiRequestError } from '../../../../../src/lib/api';

interface CadenceStepInput {
  channel: 'EMAIL' | 'CALL' | 'TASK' | 'LINKEDIN';
  templateId?: string;
  subject?: string;
  instructions?: string;
  delayDays: number;
  sortOrder: number;
}

interface StepTask {
  id: string;
  channel: string;
  status: string;
  dueAt: string;
  step?: { subject?: string | null; instructions?: string | null };
  enrollment?: { sequence?: { name?: string } };
}

const channelIcon: Record<string, React.ReactNode> = {
  EMAIL: <Mail size={14} />, CALL: <Phone size={14} />, TASK: <ListTodo size={14} />, LINKEDIN: <Linkedin size={14} />,
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };

export default function SalesCadencesPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<StepTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const [name, setName] = useState('');
  const [steps, setSteps] = useState<CadenceStepInput[]>([
    { channel: 'EMAIL', templateId: '', delayDays: 0, sortOrder: 0 },
    { channel: 'CALL', instructions: 'Follow-up call', delayDays: 2, sortOrder: 1 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const t = await apiGet<StepTask[]>('/crm/cadences/step-tasks/mine?status=PENDING');
      setTasks(Array.isArray(t) ? t : []);
    } catch (err) {
      toast.error('Could not load cadence tasks', err instanceof Error ? err.message : undefined);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const addStep = () => setSteps((s) => [...s, { channel: 'TASK', delayDays: 1, sortOrder: s.length }]);
  const removeStep = (idx: number) => setSteps((s) => s.filter((_, i) => i !== idx));
  const updateStep = (idx: number, patch: Partial<CadenceStepInput>) => setSteps((s) => s.map((step, i) => (i === idx ? { ...step, ...patch } : step)));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/crm/cadences', { name, steps });
      toast.success('Cadence created', `"${name}" is ready to enroll leads.`);
      setIsModalOpen(false);
      setName('');
      setSteps([{ channel: 'EMAIL', templateId: '', delayDays: 0, sortOrder: 0 }]);
    } catch (err) {
      toast.error('Could not create cadence', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessDue = async () => {
    try {
      const result = await apiPost<{ evaluated: number; emailStepsAdvanced: number; tasksCreated: number }>('/crm/cadences/process-due-steps');
      toast.success('Cadence steps processed', `${result.emailStepsAdvanced} email steps advanced, ${result.tasksCreated} call/task touchpoints created.`);
      loadData();
    } catch (err) {
      toast.error('Could not process due steps', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const handleCompleteTask = async (task: StepTask, status: 'COMPLETED' | 'SKIPPED') => {
    try {
      await apiPut(`/crm/cadences/step-tasks/${task.id}/complete`, { status });
      toast.success(status === 'COMPLETED' ? 'Touchpoint completed' : 'Touchpoint skipped');
      loadData();
    } catch (err) {
      toast.error('Could not update task', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const columns: Column<StepTask>[] = [
    { key: 'channel', header: 'Channel', render: (t) => <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>{channelIcon[t.channel]}<Badge variant="info">{t.channel}</Badge></span> },
    { key: 'sequence', header: 'Cadence', render: (t) => t.enrollment?.sequence?.name || '—' },
    { key: 'instructions', header: 'Instructions', render: (t) => t.step?.instructions || t.step?.subject || '—' },
    { key: 'dueAt', header: 'Due', render: (t) => new Date(t.dueAt).toLocaleDateString() },
    { key: 'actions', header: '', align: 'right', render: (t) => (
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => handleCompleteTask(t, 'SKIPPED')}>Skip</Button>
        <Button variant="primary" onClick={() => handleCompleteTask(t, 'COMPLETED')} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <CheckCircle2 size={14} /> Done
        </Button>
      </div>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Sales Cadences"
        description="Multi-channel outreach sequences — email, calls, tasks, and LinkedIn touchpoints in one auto-advancing playbook."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Sequences', href: '/crm/sequences' }, { label: 'Sales Cadences' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <ProtectedComponent permission="crm.settings.update">
              <Button variant="secondary" onClick={handleProcessDue} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Zap size={16} /> Process Due Steps
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="crm.settings.create">
              <Button onClick={() => setIsModalOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plus size={16} /> New Cadence
              </Button>
            </ProtectedComponent>
          </div>
        }
      />

      <Card>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>My Pending Touchpoints</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Call, task, and LinkedIn steps that need manual completion (email steps auto-advance).</p>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <ListTodo size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Pending Touchpoints</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Run "Process Due Steps" to generate new call/task/LinkedIn touchpoints from active enrollments.</div>
          </div>
        ) : (
          <DataTable<StepTask> columns={columns} data={tasks} rowKey={(t) => t.id} />
        )}
      </Card>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '620px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)', position: 'sticky', top: 0 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>New Multi-Channel Cadence</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={labelStyle}>Cadence Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="frappe-input" style={inputStyle} placeholder="e.g. Enterprise Outbound Q3" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <label style={labelStyle}>Steps</label>
                {steps.map((step, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'grid', gridTemplateColumns: '110px 1fr 90px 32px', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <select value={step.channel} onChange={(e) => updateStep(idx, { channel: e.target.value as CadenceStepInput['channel'] })} className="frappe-input" style={{ ...inputStyle, height: '34px' }}>
                      <option value="EMAIL">Email</option>
                      <option value="CALL">Call</option>
                      <option value="TASK">Task</option>
                      <option value="LINKEDIN">LinkedIn</option>
                    </select>
                    {step.channel === 'EMAIL' ? (
                      <input placeholder="Template ID" value={step.templateId || ''} onChange={(e) => updateStep(idx, { templateId: e.target.value })} className="frappe-input" style={{ ...inputStyle, height: '34px' }} />
                    ) : (
                      <input placeholder="Instructions for rep" value={step.instructions || ''} onChange={(e) => updateStep(idx, { instructions: e.target.value })} className="frappe-input" style={{ ...inputStyle, height: '34px' }} />
                    )}
                    <input type="number" title="Delay (days)" value={step.delayDays} onChange={(e) => updateStep(idx, { delayDays: Number(e.target.value) })} className="frappe-input" style={{ ...inputStyle, height: '34px' }} />
                    <button type="button" onClick={() => removeStep(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger, #dc2626)' }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addStep} style={{ alignSelf: 'flex-start' }}>+ Add Step</Button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting || steps.length === 0}>{submitting ? 'Creating…' : 'Create Cadence'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
