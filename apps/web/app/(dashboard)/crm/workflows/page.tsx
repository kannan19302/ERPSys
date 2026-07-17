'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Badge, Spinner, useToast, StatCardRow, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus, Trash2, Zap, ToggleLeft, ToggleRight,
  X, Settings, Layers, Activity
} from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

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
  const client = useApiClient();

  const loadData = useCallback(async () => {
    try {
      const d = await client.get<any>('/crm/workflows');
      setRules(Array.isArray(d) ? d : (d?.data || []));
    } catch (err) {
      toast.error('Could not load workflows', err instanceof Error ? err.message : 'Please try again.');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleActive = async (id: string) => {
    const prev = rules;
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r)); // optimistic
    try {
      await client.patch(`/crm/workflows/${id}/toggle`, {});
    } catch (err) {
      setRules(prev); // revert
      toast.error('Could not update workflow', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const deleteRule = async (id: string) => {
    const prev = rules;
    setRules(rules.filter(r => r.id !== id)); // optimistic
    try {
      await client.delete(`/crm/workflows/${id}`);
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
    const body = { name: formName, entity: formEntity, trigger: formTrigger, conditions: formConditions, actions: formActions, active: formActive };
    try {
      const created = await client.post<any>('/crm/workflows', body);
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

  const activeCount = rules.filter(r => r.active).length;
  const entityCounts = ENTITIES.reduce((acc, e) => { acc[e] = rules.filter(r => r.entity === e).length; return acc; }, {} as Record<string, number>);

  if (loading) {
    return (
      <RouteGuard permission="crm.read">
        <div className="ui-center-pad"><Spinner size="lg" /></div>
      </RouteGuard>
    );
  }

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-secondary)', width: '100%' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <RouteGuard permission="crm.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader title="Workflow Automation" description="Create rules to automate CRM actions"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Workflows' }]}
          actions={<Button size="sm" onClick={() => setIsModalOpen(true)}><Plus size={14} /> Create Rule</Button>}
        />

        <StatCardRow stats={[
          { label: 'Total Rules', value: rules.length, icon: <Layers size={16} />, color: 'var(--chart-1)' },
          { label: 'Active Rules', value: activeCount, icon: <Zap size={16} />, color: 'var(--chart-2)' },
          { label: 'Lead Rules', value: entityCounts['LEAD'] || 0, icon: <Activity size={16} />, color: 'var(--chart-3)' },
          { label: 'Opportunity Rules', value: entityCounts['OPPORTUNITY'] || 0, icon: <Settings size={16} />, color: 'var(--chart-5)' },
        ]} />

        <ListPageTemplate
          title=""
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'entity', header: 'Entity', render: (v) => <Badge variant="default">{String(v)}</Badge> },
            { key: 'trigger', header: 'Trigger', render: (v) => <Badge variant="default">{String(v).replace(/_/g, ' ')}</Badge> },
            { key: 'conditions', header: 'Conditions', render: (v) => String((v as WorkflowCondition[]).length) },
            { key: 'actions', header: 'Actions', render: (v) => String((v as WorkflowAction[]).length) },
            { key: 'active', header: 'Active', render: (v, row) => {
              const rule = row as unknown as WorkflowRule;
              return <button onClick={() => toggleActive(rule.id)} style={{ color: rule.active ? 'var(--color-success)' : 'var(--color-text-secondary)' }} className={styles.s1}>{rule.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}</button>;
            }},
            { key: 'id', header: '', render: (v) => <button onClick={() => deleteRule(String(v))} className="ui-btn-icon ui-text-danger"><Trash2 size={16} /></button> },
          ] as ListColumn[]}
          data={rules as unknown as Record<string, unknown>[]}
          loading={loading}
          searchable searchPlaceholder="Search rules…"
          emptyTitle="No workflow rules found"
        />

        {/* Create Modal */}
        {isModalOpen && (
          <div className={styles.style0}
            onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
            <div className={styles.style1}>
              <div className={styles.style2}>
                <h2 className={styles.style3}>Create Workflow Rule</h2>
                <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="ui-stack-4">
                <div>
                  <label className={styles.style4}>Rule Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Auto-assign hot leads" style={inputStyle} />
                </div>
                <div className="ui-grid-2">
                  <div>
                    <label className={styles.style5}>Entity</label>
                    <select value={formEntity} onChange={e => setFormEntity(e.target.value)} style={selectStyle}>
                      {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={styles.style6}>Trigger</label>
                    <select value={formTrigger} onChange={e => setFormTrigger(e.target.value)} style={selectStyle}>
                      {TRIGGERS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>

                {/* Conditions Builder */}
                <div>
                  <div className="ui-flex-between mb-2">
                    <label className={styles.style7}>Conditions</label>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition}><Plus size={12} /> Add</Button>
                  </div>
                  {formConditions.map((cond, idx) => (
                    <div key={idx} className={styles.style8}>
                      <input placeholder="Field" value={cond.field} onChange={e => updateCondition(idx, 'field', e.target.value)} style={inputStyle} />
                      <select value={cond.operator} onChange={e => updateCondition(idx, 'operator', e.target.value)} style={selectStyle}>
                        {OPERATORS.map(op => <option key={op} value={op}>{op.replace(/_/g, ' ')}</option>)}
                      </select>
                      <input placeholder="Value" value={cond.value} onChange={e => updateCondition(idx, 'value', e.target.value)} style={inputStyle} />
                      {formConditions.length > 1 && (
                        <button type="button" onClick={() => removeCondition(idx)} className={styles.style9}><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions Builder */}
                <div>
                  <div className="ui-flex-between mb-2">
                    <label className={styles.style10}>Actions</label>
                    <Button type="button" variant="outline" size="sm" onClick={addAction}><Plus size={12} /> Add</Button>
                  </div>
                  {formActions.map((action, idx) => (
                    <div key={idx} className={styles.style11}>
                      <select value={action.type} onChange={e => updateActionType(idx, e.target.value)} style={{ ...selectStyle }} className={styles.s2}>
                        {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select>
                      {formActions.length > 1 && (
                        <button type="button" onClick={() => removeAction(idx)} className={styles.style12}><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>

                <label className={styles.style13}>
                  <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} />
                  Active (rule will execute immediately)
                </label>

                <div className="ui-flex-end ui-gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting || !formName}>{submitting ? 'Creating...' : 'Create Rule'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
