'use client';

import React, { useState } from 'react';
import {
  GitFork, CheckSquare, Clock, CheckCircle, XCircle
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

export default function BulkApprovalsPage() {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <CheckSquare style={{ color: 'var(--color-primary)' }} />
          Bulk Approvals
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Review pending approval requests across multiple modules and action them in bulk.
        </p>
      </div>

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
    </div>
  );
}
