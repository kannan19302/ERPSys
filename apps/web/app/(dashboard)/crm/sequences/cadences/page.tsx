'use client';
import styles from './page.module.css';
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
    { key: 'channel', header: 'Channel', render: (t) => <span className="ui-hstack-2">{channelIcon[t.channel]}<Badge variant="info">{t.channel}</Badge></span> },
    { key: 'sequence', header: 'Cadence', render: (t) => t.enrollment?.sequence?.name || '—' },
    { key: 'instructions', header: 'Instructions', render: (t) => t.step?.instructions || t.step?.subject || '—' },
    { key: 'dueAt', header: 'Due', render: (t) => new Date(t.dueAt).toLocaleDateString() },
    { key: 'actions', header: '', align: 'right', render: (t) => (
      <div className="ui-flex-end ui-gap-2">
        <Button variant="secondary" onClick={() => handleCompleteTask(t, 'SKIPPED')}>Skip</Button>
        <Button variant="primary" onClick={() => handleCompleteTask(t, 'COMPLETED')} className="ui-flex ui-items-center ui-gap-1">
          <CheckCircle2 size={14} /> Done
        </Button>
      </div>
    ) },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Sales Cadences"
        description="Multi-channel outreach sequences — email, calls, tasks, and LinkedIn touchpoints in one auto-advancing playbook."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Sequences', href: '/crm/sequences' }, { label: 'Sales Cadences' }]}
        actions={
          <div className="ui-flex ui-gap-3">
            <ProtectedComponent permission="crm.settings.update">
              <Button variant="secondary" onClick={handleProcessDue} className="ui-hstack-2">
                <Zap size={16} /> Process Due Steps
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="crm.settings.create">
              <Button onClick={() => setIsModalOpen(true)} variant="primary" className="ui-hstack-2">
                <Plus size={16} /> New Cadence
              </Button>
            </ProtectedComponent>
          </div>
        }
      />

      <Card>
        <div className={styles.style0}>
          <h3 className="ui-heading-base">My Pending Touchpoints</h3>
          <p className="ui-text-sm-muted">Call, task, and LinkedIn steps that need manual completion (email steps auto-advance).</p>
        </div>
        {loading ? (
          <div className="ui-center-pad"><Spinner size="lg" /></div>
        ) : tasks.length === 0 ? (
          <div className="ui-empty-state">
            <ListTodo size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Pending Touchpoints</div>
            <div className="text-sm">Run "Process Due Steps" to generate new call/task/LinkedIn touchpoints from active enrollments.</div>
          </div>
        ) : (
          <DataTable<StepTask> columns={columns} data={tasks} rowKey={(t) => t.id} />
        )}
      </Card>

      {isModalOpen && (
        <div className={styles.style1}>
          <div className={styles.style2}>
            <div className={styles.style3}>
              <h3 className="ui-heading-base">New Multi-Channel Cadence</h3>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 ui-stack-4">
              <div>
                <label style={labelStyle}>Cadence Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="ui-input" style={inputStyle} placeholder="e.g. Enterprise Outbound Q3" />
              </div>
              <div className="ui-stack-3">
                <label style={labelStyle}>Steps</label>
                {steps.map((step, idx) => (
                  <div key={idx} className={styles.style4}>
                    <select value={step.channel} onChange={(e) => updateStep(idx, { channel: e.target.value as CadenceStepInput['channel'] })} className={`ui-input ${styles.s1}`} style={{ ...inputStyle }}>
                      <option value="EMAIL">Email</option>
                      <option value="CALL">Call</option>
                      <option value="TASK">Task</option>
                      <option value="LINKEDIN">LinkedIn</option>
                    </select>
                    {step.channel === 'EMAIL' ? (
                      <input placeholder="Template ID" value={step.templateId || ''} onChange={(e) => updateStep(idx, { templateId: e.target.value })} className={`ui-input ${styles.s1}`} style={{ ...inputStyle }} />
                    ) : (
                      <input placeholder="Instructions for rep" value={step.instructions || ''} onChange={(e) => updateStep(idx, { instructions: e.target.value })} className={`ui-input ${styles.s1}`} style={{ ...inputStyle }} />
                    )}
                    <input type="number" title="Delay (days)" value={step.delayDays} onChange={(e) => updateStep(idx, { delayDays: Number(e.target.value) })} className={`ui-input ${styles.s1}`} style={{ ...inputStyle }} />
                    <button type="button" onClick={() => removeStep(idx)} className={styles.style5}><Trash2 size={14} /></button>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addStep} className={styles.style6}>+ Add Step</Button>
              </div>
              <div className={styles.style7}>
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
