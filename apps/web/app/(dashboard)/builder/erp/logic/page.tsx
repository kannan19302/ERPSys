'use client';
import styles from './page.module.css';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import {
  Zap,
  PlusCircle,
  Search,
  Play,
  Pause,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  GitBranch,
  ArrowRight,
  AlertTriangle,
  Mail,
  Bell,
  RefreshCw,
  Database,
  Webhook,
  Code2,
} from 'lucide-react';

// Will be fetched from API

const TRIGGER_TYPES = [
  { id: 'record.created', label: 'Record Created', icon: Database, group: 'Data Events' },
  { id: 'record.updated', label: 'Record Updated', icon: RefreshCw, group: 'Data Events' },
  { id: 'record.deleted', label: 'Record Deleted', icon: Trash2, group: 'Data Events' },
  { id: 'form.submitted', label: 'Form Submitted', icon: CheckCircle, group: 'Form Events' },
  { id: 'workflow.approved', label: 'Workflow Approved', icon: GitBranch, group: 'Workflow Events' },
  { id: 'workflow.rejected', label: 'Workflow Rejected', icon: AlertTriangle, group: 'Workflow Events' },
  { id: 'schedule.daily', label: 'Daily Schedule', icon: Clock, group: 'Scheduled' },
  { id: 'schedule.weekly', label: 'Weekly Schedule', icon: Clock, group: 'Scheduled' },
  { id: 'api.webhook', label: 'Incoming Webhook', icon: Webhook, group: 'API Events' },
];

const ACTION_TYPES = [
  { id: 'send_email', label: 'Send Email', icon: Mail },
  { id: 'send_notification', label: 'Send Notification', icon: Bell },
  { id: 'update_record', label: 'Update Record', icon: RefreshCw },
  { id: 'call_api', label: 'Call API Endpoint', icon: Code2 },
  { id: 'trigger_workflow', label: 'Trigger Approval Workflow', icon: GitBranch },
  { id: 'run_script', label: 'Run Script (Sandboxed)', icon: Code2 },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
  Draft: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
  Paused: { bg: 'var(--color-bg-elevated)', text: 'var(--color-text-tertiary)' },
};

export default function ERPLogicPage() {
  const client = useApiClient();
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'builder'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await client.patch(`/builder/automation-rules/${editingItem.id}`, data);
      } else {
        await client.post('/builder/automation-rules', data);
      }
      fetchRules();
    } catch { /* ignore */ }
    setIsModalOpen(false);
    setEditingItem(null);
  };
  
  // Builder state
  const [ruleName, setRuleName] = useState('New Rule');
  const [ruleDesc, setRuleDesc] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>(['send_email']);

  const fetchRules = async () => {
    setLoading(true);
    try {
      setRules(await client.get('/builder/automation-rules'));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [client]);

  const handleToggleStatus = async (rule: any) => {
    const newStatus = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await client.patch(`/builder/automation-rules/${rule.id}`, { status: newStatus });
      fetchRules();
    } catch {}
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const executeDeleteRule = async (id: string) => {
    try {
      await client.delete(`/builder/automation-rules/${id}`);
      fetchRules();
    } catch {}
  };

  const handleSaveAndActivate = async () => {
    try {
      await client.post('/builder/automation-rules', {
          name: ruleName,
          description: ruleDesc,
          trigger: selectedTrigger || 'record.created',
          status: 'ACTIVE',
          actions: selectedActions
      });
      fetchRules();
      setActiveTab('rules');
    } catch {}
  };

  const handleTestRun = async (id: string) => {
    try {
      await client.post(`/builder/automation-rules/${id}/test`);
      alert('Test run triggered successfully');
    } catch {}
  };

  const filtered = rules.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Business Logic & Automation"
        description="Visual rule engine for trigger-based automations, scheduled jobs, and cross-module logic"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/erp')}>
              ← App Studio
            </button>
            <button onClick={handleSaveAndActivate} className="ui-btn ui-btn-primary">
              <Play size={14} /> Save & Activate
            </button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className={styles.s1}>
        {[
          { label: 'Total Rules', value: rules.length.toString(), color: 'var(--color-success)' },
          { label: 'Active Rules', value: rules.filter(r => r.status === 'ACTIVE').length.toString(), color: '#7c3aed' },
          { label: 'Drafts/Paused', value: rules.filter(r => r.status !== 'ACTIVE').length.toString(), color: 'var(--color-warning)' },
          { label: 'Avg Exec Time', value: '1.2s', color: 'var(--color-primary)' },
        ].map(stat => (
          <div key={stat.label} className={`ui-card ${styles.s2}`} >
            <span className="ui-text-xs-muted">{stat.label}</span>
            <span style={{ color: stat.color }} className={styles.s3}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.s4}>
        {[
          { id: 'rules', label: 'My Rules', icon: Zap },
          { id: 'builder', label: 'Rule Builder', icon: GitBranch },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{ fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: activeTab === tab.id ? '#7c3aed' : 'var(--color-text-secondary)', borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent' }} className={styles.s5}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rules List */}
      {activeTab === 'rules' && (
        <div className="ui-stack-4">
          <div className={styles.s6}>
            <Search size={15} className="ui-input-icon-abs" />
            <input className={`ui-input ${styles.s7}`} type="text" placeholder="Search rules..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}  />
          </div>

          <div className="ui-stack-3">
            {filtered.map(rule => {
              const sc = STATUS_COLORS[rule.status] ?? STATUS_COLORS['Draft']!;
              return (
                <div key={rule.id} className="ui-card p-4">
                  <div className={styles.s8}>
                    <div className="flex-1">
                      <div className={styles.s9}>
                        <p className={styles.s10}>{rule.name}</p>
                        <span style={{ background: sc.bg, color: sc.text }} className={styles.s11}>
                          {rule.status}
                        </span>
                      </div>
                      <p className={styles.s12}>{rule.description}</p>
                    </div>
                    <div className={styles.s13}>
                      <button className={`ui-btn ui-btn-secondary ${styles.s14}`}  onClick={() => handleTestRun(rule.id)}>
                        <Play size={12} /> <span className={styles.s15}>Test</span>
                      </button>
                      {rule.status === 'ACTIVE'
                        ? <button onClick={() => handleToggleStatus(rule)} className={`ui-btn ui-btn-secondary ${styles.s14}`} ><Pause size={12} /></button>
                        : <button onClick={() => handleToggleStatus(rule)} className={`ui-btn ui-btn-secondary ${styles.s14}`} ><Play size={12} /></button>
                      }
                      <button onClick={() => setDeleteTarget(rule.id)} className={`ui-btn ${styles.s16}`} >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.s17}>
                    <div className={styles.s18}>
                      <Zap size={11} className={styles.s19} />
                      <span className="ui-text-xs-muted">Trigger: <strong>{rule.trigger}</strong></span>
                    </div>
                    <div className={styles.s18}>
                      <GitBranch size={11} className="ui-text-tertiary" />
                      <span className="ui-text-xs-muted">{rule.conditions} conditions</span>
                    </div>
                    <div className={styles.s18}>
                      <ArrowRight size={11} className="ui-text-tertiary" />
                      <span className="ui-text-xs-muted">{rule.actions} actions</span>
                    </div>
                    <div className={styles.s20}>
                      <Clock size={11} className="ui-text-tertiary" />
                      <span className="ui-text-xs-tertiary">{rule.runs.toLocaleString()} runs · Last: {rule.lastRun}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rule Builder */}
      {activeTab === 'builder' && (
        <div className={styles.s21}>
          {/* Left: Trigger Palette */}
          <div className={`ui-card ${styles.s22}`} >
            <div className="ui-card p-4">
              <div className="mb-4">
                <p className={styles.s23}>
                  Rule Name
                </p>
                <input 
                  type="text" 
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Auto-Assign PO Approval" 
                  className={styles.s24}
                />
              </div>

              <div className="mb-4">
                <p className={styles.s23}>
                  Description
                </p>
                <input 
                  type="text" 
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="What does this rule do?" 
                  className={styles.s24}
                />
              </div>
            </div>
            {['Data Events', 'Form Events', 'Workflow Events', 'Scheduled', 'API Events'].map(group => (
              <div key={group} className={styles.s25}>
                <p className={styles.s26}>{group}</p>
                {TRIGGER_TYPES.filter(t => t.group === group).map(trigger => (
                  <div
                    key={trigger.id}
                    onClick={() => setSelectedTrigger(trigger.id)}
                    style={{ background: selectedTrigger === trigger.id ? 'rgba(124,58,237,0.1)' : 'transparent', color: selectedTrigger === trigger.id ? '#7c3aed' : 'var(--color-text)', border: `1px solid ${selectedTrigger === trigger.id ? '#7c3aed' : 'transparent'}` }} className={`${styles.s27} ${selectedTrigger !== trigger.id ? styles.triggerOption : ''}`}
                  >
                    <trigger.icon size={12} />
                    <span>{trigger.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Center: Visual Rule Canvas */}
          <div className="ui-card p-4 ui-stack-3">
            <div className={styles.s28}>
              <h3 className={styles.s29}>Rule Canvas</h3>
              <div className="ui-flex ui-gap-2">
                <button className="ui-btn ui-btn-secondary">Test Run</button>
                <button className="ui-btn ui-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                  <CheckCircle size={14} />
                  <span>Save & Activate</span>
                </button>
              </div>
            </div>

            {/* Rule name */}
            <div className="ui-form-group">
              <label className="ui-label">Rule Name</label>
              <input className="ui-input" type="text" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Auto-Assign Invoice on Submit" />
            </div>

            {/* Trigger block */}
            <div className={styles.s30}>
              <p className={styles.s31}>① Trigger</p>
              <div className="ui-form-group m-0">
                <select className="ui-input">
                  {TRIGGER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.s32}>
              <div className={styles.s33}>
                <ArrowRight size={12} className={styles.s34} />
              </div>
            </div>

            {/* Conditions block */}
            <div className={styles.s35}>
              <p className={styles.s36}>② Conditions (Optional)</p>
              <div className={styles.s37}>
                <select className="ui-input text-xs"><option>amount</option><option>status</option><option>department</option></select>
                <select className="ui-input text-xs"><option>greater than</option><option>equals</option><option>contains</option></select>
                <input className="ui-input text-xs" type="text" placeholder="10000" />
                <button onClick={() => { /* Delete condition */ }} className={`ui-btn ui-btn-secondary ${styles.s38}`} ><Trash2 size={12} /></button>
              </div>
              <button onClick={() => { /* Add condition */ }} className={`ui-btn ui-btn-secondary ${styles.s39}`} >
                <PlusCircle size={12} />
                <span>Add Condition</span>
              </button>
            </div>

            <div className={styles.s32}>
              <div className={styles.s33}>
                <ArrowRight size={12} className={styles.s34} />
              </div>
            </div>

            {/* Actions block */}
            <div className={styles.s40}>
              <p className={styles.s41}>③ Actions</p>
              {selectedActions.map((actionId, i) => {
                const action = ACTION_TYPES.find(a => a.id === actionId);
                return (
                  <div key={i} className={styles.s42}>
                    <div className={styles.s43}>
                      {action && <action.icon size={13} className={styles.s44} />}
                    </div>
                    <select className={`ui-input ${styles.s45}`}  value={actionId} onChange={e => {
                      const updated = [...selectedActions];
                      updated[i] = e.target.value;
                      setSelectedActions(updated);
                    }}>
                      {ACTION_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                    <button className={styles.s46} onClick={() => setSelectedActions(selectedActions.filter((_, idx) => idx !== i))}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
              <button className={`ui-btn ui-btn-secondary ${styles.s47}`}  onClick={() => setSelectedActions([...selectedActions, 'send_notification'])}>
                <PlusCircle size={12} />
                <span>Add Action</span>
              </button>
            </div>
          </div>

          {/* Right: Action Library */}
          <div className={`ui-card ${styles.s22}`} >
            <p className={styles.s48}>
              Action Library
            </p>
            <div className={styles.s49}>
              {ACTION_TYPES.map(action => (
                <div
                  key={action.id}
                  onClick={() => setSelectedActions([...selectedActions, action.id])}
                  className={`${styles.s50} ${styles.actionOption}`}
                >
                  <action.icon size={13} className={styles.s51} />
                  <span>{action.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.s52}>
              <p className={styles.s53}>Rule Settings</p>
              {[
                { label: 'Run once per record', checked: true },
                { label: 'Log every execution', checked: true },
                { label: 'Halt on error', checked: false },
              ].map(toggle => (
                <label key={toggle.label} className={styles.s54}>
                  <span className={styles.s55}>{toggle.label}</span>
                  <div style={{ background: toggle.checked ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s56}>
                    <div style={{ left: toggle.checked ? '18px' : '2px' }} className={styles.s57} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    
      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Item" : "Create New"}
        fields={[ { name: 'name', label: 'Name', type: 'text', required: true }, { name: 'trigger', label: 'Trigger', type: 'text', required: true } ]}
        initialData={editingItem}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDeleteRule(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Automation Rule"
        message="Are you sure you want to delete this automation rule?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
