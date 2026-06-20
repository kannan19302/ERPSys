'use client';
import { GenericBuilderModal } from '@/components/builder/GenericBuilderModal';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'builder'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('token') || '';
      if (editingItem) {
        await fetch(`/api/v1/builder/automation-rules/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/v1/builder/automation-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        });
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
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/automation-rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleStatus = async (rule: any) => {
    const newStatus = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/builder/automation-rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchRules();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/builder/automation-rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRules();
    } catch {}
  };

  const handleSaveAndActivate = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: ruleName,
          description: ruleDesc,
          trigger: selectedTrigger || 'record.created',
          status: 'ACTIVE',
          actions: selectedActions
        })
      });
      if (res.ok) {
        fetchRules();
        setActiveTab('rules');
      }
    } catch {}
  };

  const handleTestRun = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/automation-rules/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) alert('Test run triggered successfully');
    } catch {}
  };

  const filtered = rules.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Zap size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Business Logic & Automation
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Visual rule engine for trigger-based automations, scheduled jobs, and cross-module logic
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← App Studio
          </button>
          <button onClick={handleSaveAndActivate} className="frappe-btn frappe-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            <Play size={14} /> Save & Activate
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {[
          { label: 'Total Rules', value: rules.length.toString(), color: 'var(--color-success)' },
          { label: 'Active Rules', value: rules.filter(r => r.status === 'ACTIVE').length.toString(), color: '#7c3aed' },
          { label: 'Drafts/Paused', value: rules.filter(r => r.status !== 'ACTIVE').length.toString(), color: 'var(--color-warning)' },
          { label: 'Avg Exec Time', value: '1.2s', color: 'var(--color-primary)' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{stat.label}</span>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'rules', label: 'My Rules', icon: Zap },
          { id: 'builder', label: 'Rule Builder', icon: GitBranch },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2.5) var(--space-4)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: activeTab === tab.id ? '#7c3aed' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all var(--duration-fast)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rules List */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative', maxWidth: '28rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input className="frappe-input" type="text" placeholder="Search rules..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filtered.map(rule => {
              const sc = STATUS_COLORS[rule.status] ?? STATUS_COLORS['Draft']!;
              return (
                <div key={rule.id} className="frappe-card" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{rule.name}</p>
                        <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: sc.bg, color: sc.text }}>
                          {rule.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{rule.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1.5)', marginLeft: 'var(--space-3)', flexShrink: 0 }}>
                      <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }} onClick={() => handleTestRun(rule.id)}>
                        <Play size={12} /> <span style={{fontSize: '11px'}}>Test</span>
                      </button>
                      {rule.status === 'ACTIVE'
                        ? <button onClick={() => handleToggleStatus(rule)} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Pause size={12} /></button>
                        : <button onClick={() => handleToggleStatus(rule)} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}><Play size={12} /></button>
                      }
                      <button onClick={() => handleDelete(rule.id)} className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                      <Zap size={11} style={{ color: '#7c3aed' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Trigger: <strong>{rule.trigger}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                      <GitBranch size={11} style={{ color: 'var(--color-text-tertiary)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{rule.conditions} conditions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                      <ArrowRight size={11} style={{ color: 'var(--color-text-tertiary)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{rule.actions} actions</span>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                      <Clock size={11} style={{ color: 'var(--color-text-tertiary)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{rule.runs.toLocaleString()} runs · Last: {rule.lastRun}</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 260px', gap: 'var(--space-4)', minHeight: '500px' }}>
          {/* Left: Trigger Palette */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-1.5) 0' }}>
                  Rule Name
                </p>
                <input 
                  type="text" 
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Auto-Assign PO Approval" 
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', background: 'var(--color-bg)' }}
                />
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-1.5) 0' }}>
                  Description
                </p>
                <input 
                  type="text" 
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="What does this rule do?" 
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', background: 'var(--color-bg)' }}
                />
              </div>
            </div>
            {['Data Events', 'Form Events', 'Workflow Events', 'Scheduled', 'API Events'].map(group => (
              <div key={group} style={{ marginBottom: 'var(--space-3)' }}>
                <p style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', margin: '0 0 var(--space-1.5) 0', letterSpacing: '0.08em' }}>{group}</p>
                {TRIGGER_TYPES.filter(t => t.group === group).map(trigger => (
                  <div
                    key={trigger.id}
                    onClick={() => setSelectedTrigger(trigger.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-1.5) var(--space-2)', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontSize: 'var(--text-xs)', marginBottom: '2px',
                      background: selectedTrigger === trigger.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                      color: selectedTrigger === trigger.id ? '#7c3aed' : 'var(--color-text)',
                      border: `1px solid ${selectedTrigger === trigger.id ? '#7c3aed' : 'transparent'}`,
                      transition: 'all var(--duration-fast)',
                    }}
                    onMouseEnter={e => { if (selectedTrigger !== trigger.id) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={e => { if (selectedTrigger !== trigger.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <trigger.icon size={12} />
                    <span>{trigger.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Center: Visual Rule Canvas */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Rule Canvas</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="frappe-btn frappe-btn-secondary">Test Run</button>
                <button className="frappe-btn frappe-btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                  <CheckCircle size={14} />
                  <span>Save & Activate</span>
                </button>
              </div>
            </div>

            {/* Rule name */}
            <div className="frappe-form-group">
              <label className="frappe-label">Rule Name</label>
              <input className="frappe-input" type="text" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Auto-Assign Invoice on Submit" />
            </div>

            {/* Trigger block */}
            <div style={{ background: 'rgba(124,58,237,0.06)', border: '2px solid #7c3aed', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#7c3aed', margin: '0 0 var(--space-2) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>① Trigger</p>
              <div className="frappe-form-group" style={{ margin: 0 }}>
                <select className="frappe-input">
                  {TRIGGER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '2px', height: '24px', background: 'var(--color-border)', position: 'relative' }}>
                <ArrowRight size={12} style={{ position: 'absolute', bottom: -6, left: -5, color: 'var(--color-text-tertiary)', transform: 'rotate(90deg)' }} />
              </div>
            </div>

            {/* Conditions block */}
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>② Conditions (Optional)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                <select className="frappe-input" style={{ fontSize: 'var(--text-xs)' }}><option>amount</option><option>status</option><option>department</option></select>
                <select className="frappe-input" style={{ fontSize: 'var(--text-xs)' }}><option>greater than</option><option>equals</option><option>contains</option></select>
                <input className="frappe-input" type="text" placeholder="10000" style={{ fontSize: 'var(--text-xs)' }} />
                <button onClick={() => { /* Delete condition */ }} className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2)' }}><Trash2 size={12} /></button>
              </div>
              <button onClick={() => { /* Add condition */ }} className="frappe-btn frappe-btn-secondary" style={{ marginTop: 'var(--space-2)' }}>
                <PlusCircle size={12} />
                <span>Add Condition</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '2px', height: '24px', background: 'var(--color-border)', position: 'relative' }}>
                <ArrowRight size={12} style={{ position: 'absolute', bottom: -6, left: -5, color: 'var(--color-text-tertiary)', transform: 'rotate(90deg)' }} />
              </div>
            </div>

            {/* Actions block */}
            <div style={{ background: 'rgba(5,150,105,0.06)', border: '2px solid #059669', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: '#059669', margin: '0 0 var(--space-2) 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>③ Actions</p>
              {selectedActions.map((actionId, i) => {
                const action = ACTION_TYPES.find(a => a.id === actionId);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {action && <action.icon size={13} style={{ color: '#059669' }} />}
                    </div>
                    <select className="frappe-input" style={{ flex: 1, fontSize: 'var(--text-xs)' }} value={actionId} onChange={e => {
                      const updated = [...selectedActions];
                      updated[i] = e.target.value;
                      setSelectedActions(updated);
                    }}>
                      {ACTION_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '2px' }} onClick={() => setSelectedActions(selectedActions.filter((_, idx) => idx !== i))}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
              <button className="frappe-btn frappe-btn-secondary" style={{ marginTop: 'var(--space-1)' }} onClick={() => setSelectedActions([...selectedActions, 'send_notification'])}>
                <PlusCircle size={12} />
                <span>Add Action</span>
              </button>
            </div>
          </div>

          {/* Right: Action Library */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Action Library
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)' }}>
              {ACTION_TYPES.map(action => (
                <div
                  key={action.id}
                  onClick={() => setSelectedActions([...selectedActions, action.id])}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)',
                    padding: 'var(--space-2) var(--space-2.5)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text)',
                    transition: 'all var(--duration-fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.08)'; e.currentTarget.style.borderColor = '#059669'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <action.icon size={13} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>{action.label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-2) 0', color: 'var(--color-text)' }}>Rule Settings</p>
              {[
                { label: 'Run once per record', checked: true },
                { label: 'Log every execution', checked: true },
                { label: 'Halt on error', checked: false },
              ].map(toggle => (
                <label key={toggle.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{toggle.label}</span>
                  <div style={{ width: '34px', height: '18px', borderRadius: '9px', background: toggle.checked ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '7px', background: 'white', position: 'absolute', top: '2px', left: toggle.checked ? '18px' : '2px', transition: 'left var(--duration-fast)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
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
    </div>
  );
}
