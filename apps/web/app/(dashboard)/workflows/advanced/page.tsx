'use client';

import React, { useState } from 'react';
import {
  GitFork, CheckSquare, BarChart3, Mail, Zap, Clock, Users,
  CheckCircle, XCircle, ArrowRight, TrendingUp, AlertTriangle
} from 'lucide-react';

interface PendingApproval {
  id: string;
  entityType: string;
  entityId: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  amount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  slaDeadline: string;
  selected: boolean;
}

export default function WorkflowsAdvancedPage() {
  const [activeTab, setActiveTab] = useState<'bulk' | 'analytics' | 'dynamic' | 'email'>('bulk');

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    { id: 'pa-1', entityType: 'Purchase Order', entityId: 'PO-2026-0284', description: 'Office Supplies — Q3 Stock', requestedBy: 'Jane Smith', requestedAt: '2026-06-14 09:15', amount: 4500, priority: 'MEDIUM', slaDeadline: '2026-06-15 09:15', selected: false },
    { id: 'pa-2', entityType: 'Leave Request', entityId: 'LR-2026-0042', description: 'Annual Leave — 5 days', requestedBy: 'Mike Johnson', requestedAt: '2026-06-14 08:30', amount: 0, priority: 'LOW', slaDeadline: '2026-06-16 08:30', selected: false },
    { id: 'pa-3', entityType: 'Invoice', entityId: 'INV-2026-0198', description: 'Vendor Payment — Steel Corp', requestedBy: 'Finance Team', requestedAt: '2026-06-13 16:00', amount: 28500, priority: 'HIGH', slaDeadline: '2026-06-14 16:00', selected: false },
    { id: 'pa-4', entityType: 'Travel Expense', entityId: 'EXP-2026-0056', description: 'Client Visit — NYC Trip', requestedBy: 'Sarah Chen', requestedAt: '2026-06-13 14:20', amount: 2350, priority: 'MEDIUM', slaDeadline: '2026-06-15 14:20', selected: false },
    { id: 'pa-5', entityType: 'Purchase Order', entityId: 'PO-2026-0285', description: 'Machine Parts — Urgent Repair', requestedBy: 'Ops Manager', requestedAt: '2026-06-13 11:00', amount: 12800, priority: 'CRITICAL', slaDeadline: '2026-06-14 11:00', selected: false },
    { id: 'pa-6', entityType: 'Budget Transfer', entityId: 'BT-2026-0012', description: 'Marketing → R&D Reallocation', requestedBy: 'CFO Office', requestedAt: '2026-06-12 15:30', amount: 50000, priority: 'HIGH', slaDeadline: '2026-06-14 15:30', selected: false },
  ]);

  const toggleSelect = (id: string) => {
    setPendingApprovals(prev => prev.map(a => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  const toggleSelectAll = () => {
    const allSelected = pendingApprovals.every(a => a.selected);
    setPendingApprovals(prev => prev.map(a => ({ ...a, selected: !allSelected })));
  };

  const bulkAction = (action: 'approve' | 'reject') => {
    const selected = pendingApprovals.filter(a => a.selected);
    if (selected.length === 0) { alert('Select at least one item.'); return; }
    alert(`${action === 'approve' ? 'Approved' : 'Rejected'} ${selected.length} item(s) successfully.`);
    setPendingApprovals(prev => prev.filter(a => !a.selected));
  };

  const priorityColor = (p: string) => {
    const map: Record<string, string> = { LOW: 'var(--color-text-secondary)', MEDIUM: 'var(--color-warning)', HIGH: 'var(--color-error)', CRITICAL: 'var(--color-error)' };
    return map[p] || 'var(--color-text)';
  };

  const tabs = [
    { id: 'bulk' as const, label: 'Bulk Approvals', icon: <CheckSquare size={14} /> },
    { id: 'analytics' as const, label: 'Approval Analytics', icon: <BarChart3 size={14} /> },
    { id: 'dynamic' as const, label: 'Dynamic Routing', icon: <Zap size={14} /> },
    { id: 'email' as const, label: 'Email Approvals', icon: <Mail size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <GitFork style={{ color: 'var(--color-primary)' }} />
          Advanced Workflow Engine
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Bulk approvals, approval cycle analytics, dynamic routing rules, and one-click email approve/reject.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Bulk Approvals */}
      {activeTab === 'bulk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              {pendingApprovals.filter(a => a.selected).length} of {pendingApprovals.length} selected
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={() => bulkAction('approve')} style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <CheckCircle size={14} /> Approve Selected
              </button>
              <button onClick={() => bulkAction('reject')} style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <XCircle size={14} /> Reject Selected
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: '40px' }}>
                    <input type="checkbox" checked={pendingApprovals.every(a => a.selected)} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                  </th>
                  {['Type', 'ID', 'Description', 'Requested By', 'Amount', 'Priority', 'SLA'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)', background: a.selected ? 'var(--color-primary-light)' : 'transparent' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <input type="checkbox" checked={a.selected} onChange={() => toggleSelect(a.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '10px', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--color-text-secondary)' }}>{a.entityType}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{a.entityId}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{a.description}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{a.requestedBy}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)' }}>{a.amount > 0 ? `$${a.amount.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'var(--weight-bold)', color: priorityColor(a.priority) }}>{a.priority}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: new Date(a.slaDeadline) < new Date() ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(a.slaDeadline).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { label: 'Avg Cycle Time', value: '4.2 hrs', trend: '-12%', trendColor: 'var(--color-success)' },
              { label: 'Approval Rate', value: '87.3%', trend: '+2.1%', trendColor: 'var(--color-success)' },
              { label: 'SLA Breach Rate', value: '8.5%', trend: '-3.4%', trendColor: 'var(--color-success)' },
              { label: 'Active Bottleneck', value: 'CFO Review', trend: '6 pending', trendColor: 'var(--color-warning)' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>{m.label}</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{m.value}</div>
                <div style={{ fontSize: '11px', color: m.trendColor, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-1)' }}>
                  <TrendingUp size={12} /> {m.trend}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {/* Approver Workload */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
                <Users size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />
                Approver Workload
              </h3>
              {[
                { name: 'CFO', pending: 6, avgTime: '8.4 hrs', load: 'HIGH' },
                { name: 'VP Operations', pending: 4, avgTime: '3.2 hrs', load: 'MEDIUM' },
                { name: 'HR Director', pending: 2, avgTime: '1.8 hrs', load: 'LOW' },
                { name: 'CTO', pending: 3, avgTime: '5.6 hrs', load: 'MEDIUM' },
                { name: 'General Counsel', pending: 1, avgTime: '12.0 hrs', load: 'HIGH' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none' }}>
                  <div>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{a.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>Avg: {a.avgTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{a.pending}</span>
                    <span style={{
                      fontSize: '9px', padding: '2px 6px', borderRadius: 'var(--radius-full)',
                      color: a.load === 'HIGH' ? 'var(--color-error)' : a.load === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-success)',
                      background: a.load === 'HIGH' ? 'var(--color-error-light)' : a.load === 'MEDIUM' ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                    }}>{a.load}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottleneck Detection */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-warning)' }} />
                Bottleneck Detection
              </h3>
              {[
                { step: 'CFO Financial Approval', avgDelay: '8.4 hrs', breachRate: '22%', impact: 'HIGH' },
                { step: 'Legal NDA Review', avgDelay: '12.0 hrs', breachRate: '35%', impact: 'CRITICAL' },
                { step: 'CTO Technical Sign-off', avgDelay: '5.6 hrs', breachRate: '12%', impact: 'MEDIUM' },
              ].map((b, i) => (
                <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{b.step}</span>
                    <span style={{
                      fontSize: '9px', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)',
                      color: b.impact === 'CRITICAL' ? 'var(--color-error)' : b.impact === 'HIGH' ? 'var(--color-warning)' : 'var(--color-primary)',
                      background: b.impact === 'CRITICAL' ? 'var(--color-error-light)' : b.impact === 'HIGH' ? 'var(--color-warning-light)' : 'var(--color-primary-light)',
                    }}>{b.impact}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Avg delay: {b.avgDelay} • Breach rate: {b.breachRate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Routing */}
      {activeTab === 'dynamic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Dynamic Approval Routing Rules</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Route approval requests to different approvers based on live ERP data conditions.
            </p>
            {[
              { condition: 'Purchase Order Amount > $10,000', route: 'CFO', fallback: 'VP Finance', active: true },
              { condition: 'Leave Duration > 5 days', route: 'HR Director', fallback: 'Department Head', active: true },
              { condition: 'Invoice Vendor = "Preferred"', route: 'Auto-Approve', fallback: 'AP Manager', active: true },
              { condition: 'Travel Expense Region = "International"', route: 'Global Travel Manager', fallback: 'VP Operations', active: false },
              { condition: 'Budget Transfer > 20% of Department Budget', route: 'CEO', fallback: 'CFO', active: true },
            ].map((rule, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)',
                opacity: rule.active ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                  <Zap size={16} style={{ color: rule.active ? 'var(--color-primary)' : 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>IF {rule.condition}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                      <ArrowRight size={10} /> Route to: <strong>{rule.route}</strong>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>• Fallback: {rule.fallback}</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
                  background: rule.active ? 'var(--color-primary)' : 'var(--color-border)',
                  position: 'relative'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: rule.active ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email-Based Approvals */}
      {activeTab === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>
              <Mail size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />
              One-Click Email Approve/Reject
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Approvers receive emails with secure one-click approve/reject buttons — no login required.
            </p>

            <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', background: 'var(--color-bg)', maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>U</div>
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>UniERP Approval Request</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>notifications@unerp.dev</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <p style={{ fontSize: 'var(--text-sm)', margin: '0 0 var(--space-2) 0' }}>Hi <strong>John</strong>,</p>
                <p style={{ fontSize: 'var(--text-sm)', margin: '0 0 var(--space-2) 0', color: 'var(--color-text-secondary)' }}>
                  A <strong>Purchase Order (PO-2026-0285)</strong> requires your approval:
                </p>
                <div style={{ background: 'var(--color-bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: '13px' }}>
                  <div><strong>Item:</strong> Machine Parts — Urgent Repair</div>
                  <div><strong>Amount:</strong> $12,800.00</div>
                  <div><strong>Requested by:</strong> Ops Manager</div>
                  <div><strong>Priority:</strong> CRITICAL</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <button style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: 'var(--space-2.5) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                  ✅ Approve
                </button>
                <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: 'var(--space-2.5) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>
                  ❌ Reject
                </button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
                This link expires in 24 hours. Secured with HMAC token verification.
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Email Approval Settings</h3>
            {[
              { label: 'Enable Email Approvals', desc: 'Send approval emails with one-click action buttons', enabled: true },
              { label: 'Secure Token Expiry', desc: 'Set to 24 hours — action links expire after this period', enabled: true },
              { label: 'CC Requester on Decision', desc: 'Automatically CC the original requester when approved/rejected', enabled: true },
              { label: 'Include Comment Box', desc: 'Add an optional comments field in the email action', enabled: false },
            ].map((opt, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                </div>
                <div style={{
                  width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
                  background: opt.enabled ? 'var(--color-primary)' : 'var(--color-border)',
                  position: 'relative'
                }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: opt.enabled ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
