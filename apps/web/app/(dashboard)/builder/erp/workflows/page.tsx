'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Workflow,
  PlusCircle,
  Search,
  Eye,
  Edit3,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  GitBranch,
  Users,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  AlertCircle,
} from 'lucide-react';

const WORKFLOWS_LIST = [
  {
    id: 1, name: 'Purchase Order Approval', document: 'Purchase Order', status: 'Active',
    steps: 3, pendingCount: 5, lastTriggered: '10 min ago',
    chain: ['Requestor', 'Manager', 'Finance Head'],
  },
  {
    id: 2, name: 'Leave Request Approval', document: 'Leave Application', status: 'Active',
    steps: 2, pendingCount: 12, lastTriggered: '1 hour ago',
    chain: ['Employee', 'HR Manager'],
  },
  {
    id: 3, name: 'Invoice Payment Release', document: 'Invoice', status: 'Draft',
    steps: 4, pendingCount: 0, lastTriggered: '2 days ago',
    chain: ['Accountant', 'Finance Mgr', 'CFO', 'CEO'],
  },
  {
    id: 4, name: 'New Vendor Onboarding', document: 'Vendor', status: 'Active',
    steps: 3, pendingCount: 2, lastTriggered: '3 hours ago',
    chain: ['Requestor', 'Procurement', 'Legal'],
  },
];

const CANVAS_NODES = [
  { id: 'n1', type: 'trigger', label: 'On Submit', x: 60, y: 40 },
  { id: 'n2', type: 'approver', label: 'Manager Review', x: 220, y: 40, approver: 'Dept. Manager', sla: '48h' },
  { id: 'n3', type: 'condition', label: 'Amount > 50k?', x: 390, y: 40 },
  { id: 'n4', type: 'approver', label: 'Finance Head', x: 390, y: 140, approver: 'Finance Head', sla: '24h' },
  { id: 'n5', type: 'action', label: 'Auto-Approve', x: 560, y: 40 },
  { id: 'n6', type: 'action', label: 'Send Email', x: 560, y: 140 },
];

const NODE_COLORS: Record<string, string> = {
  trigger: 'var(--color-primary)',
  approver: '#7c3aed',
  condition: '#d97706',
  action: '#059669',
};

export default function ERPWorkflowsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filtered = WORKFLOWS_LIST.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Workflow size={20} style={{ color: '#7c3aed' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Workflow Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Design configurable approval chains, conditions, and automation actions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => setActiveTab('builder')}>
            <PlusCircle size={15} />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
        {[
          { label: 'Active Workflows', value: '8', icon: CheckCircle, color: '#059669' },
          { label: 'Pending Approvals', value: '19', icon: Clock, color: '#d97706' },
          { label: 'Completed Today', value: '34', icon: Zap, color: 'var(--color-primary)' },
          { label: 'SLA Breaches', value: '2', icon: AlertCircle, color: '#dc2626' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'list', label: 'All Workflows', icon: Workflow },
          { id: 'builder', label: 'Visual Builder', icon: GitBranch },
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

      {/* List Tab */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative', maxWidth: '28rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input className="frappe-input" type="text" placeholder="Search workflows..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filtered.map(wf => (
              <div key={wf.id} className="frappe-card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Workflow size={18} style={{ color: '#7c3aed' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{wf.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Applied to: {wf.document} · {wf.steps} approval steps</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {wf.pendingCount > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                        {wf.pendingCount} pending
                      </span>
                    )}
                    <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: wf.status === 'Active' ? 'var(--color-success-light)' : 'var(--color-bg-hover)', color: wf.status === 'Active' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                      {wf.status}
                    </span>
                  </div>
                </div>

                {/* Approval Chain Visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  {wf.chain.map((step, idx) => (
                    <React.Fragment key={step}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: 'var(--radius-full)', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={10} style={{ color: '#7c3aed' }} />
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{step}</span>
                      </div>
                      {idx < wf.chain.length - 1 && <ArrowRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                    </React.Fragment>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Last triggered: {wf.lastTriggered}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }} onClick={() => setActiveTab('builder')}>
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}>
                      <Play size={13} style={{ color: '#059669' }} />
                      <span>Test</span>
                    </button>
                    <button className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Builder Tab */}
      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 'var(--space-4)', height: 'calc(100vh - 300px)' }}>
          {/* Node Palette */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Node Types
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)' }}>
              {[
                { type: 'trigger', label: 'Trigger Event', icon: Zap, color: 'var(--color-primary)' },
                { type: 'approver', label: 'Approver Step', icon: Users, color: '#7c3aed' },
                { type: 'condition', label: 'Condition Branch', icon: GitBranch, color: '#d97706' },
                { type: 'action', label: 'Automation Action', icon: Play, color: '#059669' },
                { type: 'escalation', label: 'SLA Escalation', icon: AlertCircle, color: '#dc2626' },
                { type: 'notification', label: 'Send Notification', icon: Shield, color: '#0891b2' },
              ].map(node => (
                <div
                  key={node.type}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-2.5)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    cursor: 'grab', fontSize: 'var(--text-xs)', color: 'var(--color-text)',
                    transition: 'all var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${node.color}15`; e.currentTarget.style.borderColor = node.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: `${node.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <node.icon size={11} style={{ color: node.color }} />
                  </div>
                  <span>{node.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'hidden', position: 'relative', background: 'var(--color-bg)' }}>
            {/* Grid Background */}
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Connection lines */}
              <line x1="130" y1="60" x2="220" y2="60" stroke="var(--color-border)" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="330" y1="60" x2="390" y2="60" stroke="var(--color-border)" strokeWidth="2" />
              <line x1="450" y1="60" x2="560" y2="60" stroke="#059669" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="450" y1="80" x2="450" y2="160" stroke="var(--color-border)" strokeWidth="2" />
              <line x1="450" y1="160" x2="560" y2="160" stroke="#7c3aed" strokeWidth="2" />
            </svg>

            {/* Nodes */}
            {CANVAS_NODES.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`, top: `${node.y}px`,
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-bg-elevated)',
                  border: `2px solid ${selectedNode === node.id ? NODE_COLORS[node.type] : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  boxShadow: selectedNode === node.id ? `0 0 0 3px ${NODE_COLORS[node.type]}30` : 'var(--shadow-sm)',
                  minWidth: '120px',
                  transition: 'all var(--duration-fast)',
                  zIndex: 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1.5)', marginBottom: 'var(--space-0.5)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: NODE_COLORS[node.type], flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: NODE_COLORS[node.type], textTransform: 'uppercase' }}>{node.type}</span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{node.label}</p>
                {(node as { approver?: string }).approver && <p style={{ fontSize: '10px', color: 'var(--color-text-secondary)', margin: 0 }}>{(node as { approver?: string }).approver}</p>}
              </div>
            ))}

            {/* Toolbar */}
            <div style={{ position: 'absolute', bottom: 'var(--space-3)', right: 'var(--space-3)', display: 'flex', gap: 'var(--space-1.5)' }}>
              <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-3)' }}>
                <Eye size={13} />
                <span>Preview</span>
              </button>
              <button className="frappe-btn frappe-btn-primary" style={{ padding: 'var(--space-1.5) var(--space-3)' }}>
                <CheckCircle size={13} />
                <span>Publish</span>
              </button>
            </div>
          </div>

          {/* Properties */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Node Properties
            </p>
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Node Label', value: CANVAS_NODES.find(n => n.id === selectedNode)?.label || '' },
                  { label: 'Assigned Role', value: 'Department Manager' },
                  { label: 'SLA (hours)', value: '48' },
                  { label: 'Escalation After', value: '72h' },
                ].map(prop => (
                  <div key={prop.label} className="frappe-form-group">
                    <label className="frappe-label">{prop.label}</label>
                    <input className="frappe-input" type="text" defaultValue={prop.value} style={{ fontSize: 'var(--text-xs)' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {[
                    { label: 'Send Email on Assign', checked: true },
                    { label: 'Allow Delegation', checked: true },
                    { label: 'Require Comment', checked: false },
                  ].map(toggle => (
                    <label key={toggle.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{toggle.label}</span>
                      <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: toggle.checked ? '#7c3aed' : 'var(--color-border)', position: 'relative' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '8px', background: 'white', position: 'absolute', top: '2px', left: toggle.checked ? '18px' : '2px', transition: 'left var(--duration-fast)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
                  <button className="frappe-btn frappe-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Node</button>
                  <button className="frappe-btn" style={{ padding: 'var(--space-2)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                <GitBranch size={24} style={{ margin: '0 auto var(--space-2)', opacity: 0.4, display: 'block' }} />
                Click a node in the canvas to configure it
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
