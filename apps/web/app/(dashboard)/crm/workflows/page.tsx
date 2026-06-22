'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Badge, Spinner, useToast } from '@unerp/ui';
import {
  Plus, Trash2, Zap, ToggleLeft, ToggleRight,
  Search, X, Settings, Layers, Activity
} from 'lucide-react';

interface WorkflowCondition { field: string; operator: string; value: string; }
interface WorkflowAction { type: string; config: Record<string, string>; }
interface WorkflowRule {
  id: string; name: string; entity: string; trigger: string;
  conditions: WorkflowCondition[]; actions: WorkflowAction[];
  active: boolean; createdAt: string;
}

const ENTITIES = ['LEAD', 'OPPORTUNITY', 'ACTIVITY', 'CONTACT'];
const TRIGGERS = ['ON_CREATE', 'ON_UPDATE', 'ON_STAGE_CHANGE', 'ON_STATUS_CHANGE', 'SCHEDULED'];
const ACTION_TYPES = ['SEND_EMAIL', 'CREATE_TASK', 'UPDATE_FIELD', 'SEND_NOTIFICATION', 'ASSIGN_OWNER'];
const OPERATORS = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];

export default function WorkflowsPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEntity, setFormEntity] = useState('LEAD');
  const [formTrigger, setFormTrigger] = useState('ON_CREATE');
  const [formConditions, setFormConditions] = useState<WorkflowCondition[]>([{ field: '', operator: 'equals', value: '' }]);
  const [formActions, setFormActions] = useState<WorkflowAction[]>([{ type: 'SEND_EMAIL', config: {} }]);
  const [formActive, setFormActive] = useState(true);

  const toast = useToast();
  const authHeaders = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}` });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/crm/workflows', { headers: authHeaders() });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const d = await res.json(); setRules(Array.isArray(d) ? d : (d?.data || []));
      } catch (err) {
        toast.error('Could not load workflows', err instanceof Error ? err.message : 'Please try again.');
        setRules([]);
      } finally { setLoading(false); }
    };
    load();
  }, [toast]);

  const toggleActive = async (id: string) => {
    const prev = rules;
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r)); // optimistic
    try {
      const res = await fetch(`/api/v1/crm/workflows/${id}/toggle`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
    } catch (err) {
      setRules(prev); // revert
      toast.error('Could not update workflow', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const deleteRule = async (id: string) => {
    const prev = rules;
    setRules(rules.filter(r => r.id !== id)); // optimistic
    try {
      const res = await fetch(`/api/v1/crm/workflows/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      toast.success('Workflow deleted');
    } catch (err) {
      setRules(prev); // revert
      toast.error('Could not delete workflow', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const resetForm = () => {
    setFormName(''); setFormEntity('LEAD'); setFormTrigger('ON_CREATE');
    setFormConditions([{ field: '', operator: 'equals', value: '' }]);
    setFormActions([{ type: 'SEND_EMAIL', config: {} }]);
    setFormActive(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    const token = localStorage.getItem('token');
    const body = { name: formName, entity: formEntity, trigger: formTrigger, conditions: formConditions, actions: formActions, active: formActive };
    try {
      const res = await fetch('/api/v1/crm/workflows', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const created = await res.json();
      setRules([created, ...rules]);
      toast.success('Workflow created', `"${formName}" is now active.`);
      setIsModalOpen(false); resetForm();
    } catch (err) {
      toast.error('Could not create workflow', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addCondition = () => setFormConditions([...formConditions, { field: '', operator: 'equals', value: '' }]);
  const removeCondition = (idx: number) => setFormConditions(formConditions.filter((_, i) => i !== idx));
  const updateCondition = (idx: number, key: keyof WorkflowCondition, val: string) => {
    const updated = [...formConditions];
    const existing = updated[idx];
    if (existing) {
      updated[idx] = { ...existing, [key]: val } as WorkflowCondition;
      setFormConditions(updated);
    }
  };
  const addAction = () => setFormActions([...formActions, { type: 'SEND_EMAIL', config: {} }]);
  const removeAction = (idx: number) => setFormActions(formActions.filter((_, i) => i !== idx));
  const updateActionType = (idx: number, type: string) => {
    const updated = [...formActions]; updated[idx] = { type, config: {} }; setFormActions(updated);
  };

  const filtered = rules.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCount = rules.filter(r => r.active).length;
  const entityCounts = ENTITIES.reduce((acc, e) => { acc[e] = rules.filter(r => r.entity === e).length; return acc; }, {} as Record<string, number>);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-secondary)', width: '100%' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader title="Workflow Automation" description="Create rules to automate CRM actions"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Workflows' }]}
        actions={<Button size="sm" onClick={() => setIsModalOpen(true)}><Plus size={14} /> Create Rule</Button>}
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Total Rules', value: rules.length, icon: <Layers size={20} />, color: 'var(--color-primary)' },
          { label: 'Active Rules', value: activeCount, icon: <Zap size={20} />, color: 'var(--color-success)' },
          { label: 'Lead Rules', value: entityCounts['LEAD'] || 0, icon: <Activity size={20} />, color: 'var(--color-info)' },
          { label: 'Opportunity Rules', value: entityCounts['OPPORTUNITY'] || 0, icon: <Settings size={20} />, color: 'var(--color-warning)' },
        ].map(k => (
          <Card key={k.label}>
            <div style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>{k.icon}</div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{k.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search rules..."
            style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
      </div>

      {/* Rules Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {['Name', 'Entity', 'Trigger', 'Conditions', 'Actions', 'Active', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>{rule.name}</td>
                  <td style={{ padding: 'var(--space-3)' }}><Badge variant="default">{rule.entity}</Badge></td>
                  <td style={{ padding: 'var(--space-3)' }}><Badge variant="default">{rule.trigger.replace(/_/g, ' ')}</Badge></td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{rule.conditions.length}</td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{rule.actions.length}</td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <button onClick={() => toggleActive(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.active ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                      {rule.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <button onClick={() => deleteRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No workflow rules found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 12, padding: 'var(--space-6)', width: 640, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Create Workflow Rule</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>Rule Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Auto-assign hot leads" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>Entity</label>
                  <select value={formEntity} onChange={e => setFormEntity(e.target.value)} style={selectStyle}>
                    {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>Trigger</label>
                  <select value={formTrigger} onChange={e => setFormTrigger(e.target.value)} style={selectStyle}>
                    {TRIGGERS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              {/* Conditions Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Conditions</label>
                  <Button type="button" variant="outline" size="sm" onClick={addCondition}><Plus size={12} /> Add</Button>
                </div>
                {formConditions.map((cond, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <input placeholder="Field" value={cond.field} onChange={e => updateCondition(idx, 'field', e.target.value)} style={inputStyle} />
                    <select value={cond.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} style={selectStyle}>
                      {OPERATORS.map(op => <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>)}
                    </select>
                    <input placeholder="Value" value={cond.value} onChange={e => updateCondition(idx, 'value', e.target.value)} style={inputStyle} />
                    {formConditions.length > 1 && (
                      <button type="button" onClick={() => removeCondition(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Actions</label>
                  <Button type="button" variant="outline" size="sm" onClick={addAction}><Plus size={12} /> Add</Button>
                </div>
                {formActions.map((action, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                    <select value={action.type} onChange={e => updateActionType(idx, e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                    {formActions.length > 1 && (
                      <button type="button" onClick={() => removeAction(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} />
                Active (rule will execute immediately)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting || !formName}>{submitting ? 'Creating...' : 'Create Rule'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
