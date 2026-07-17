'use client';
import styles from './BulkApprovalsTab.module.css';
import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';

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

export default function BulkApprovalsTab() {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    { id: 'pa-1', entityType: 'Purchase Order', entityId: 'PO-2026-0284', description: 'Office Supplies — Q3 Stock', requestedBy: 'Jane Smith', requestedAt: '2026-06-14 09:15', amount: 4500, priority: 'MEDIUM', slaDeadline: '2026-06-15 09:15', selected: false },
    { id: 'pa-2', entityType: 'Leave Request', entityId: 'LR-2026-0042', description: 'Annual Leave — 5 days', requestedBy: 'Mike Johnson', requestedAt: '2026-06-14 08:30', amount: 0, priority: 'LOW', slaDeadline: '2026-06-16 08:30', selected: false },
    { id: 'pa-3', entityType: 'Invoice', entityId: 'INV-2026-0198', description: 'Vendor Payment — Steel Corp', requestedBy: 'Finance Team', requestedAt: '2026-06-13 16:00', amount: 28500, priority: 'HIGH', slaDeadline: '2026-06-14 16:00', selected: false },
    { id: 'pa-4', entityType: 'Travel Expense', entityId: 'EXP-2026-0056', description: 'Client Visit — NYC Trip', requestedBy: 'Sarah Chen', requestedAt: '2026-06-13 14:20', amount: 2350, priority: 'MEDIUM', slaDeadline: '2026-06-15 14:20', selected: false },
    { id: 'pa-5', entityType: 'Purchase Order', entityId: 'PO-2026-0285', description: 'Machine Parts — Urgent Repair', requestedBy: 'Ops Manager', requestedAt: '2026-06-13 11:00', amount: 12800, priority: 'CRITICAL', slaDeadline: '2026-06-14 11:00', selected: false },
    { id: 'pa-6', entityType: 'Budget Transfer', entityId: 'BT-2026-0012', description: 'Marketing → R&D Reallocation', requestedBy: 'CFO Office', requestedAt: '2026-06-12 15:30', amount: 50000, priority: 'HIGH', slaDeadline: '2026-06-14 15:30', selected: false },
  ]);

  const toggleSelect = (id: string) => {
    setPendingApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)));
  };

  const toggleSelectAll = () => {
    const allSelected = pendingApprovals.every((a) => a.selected);
    setPendingApprovals((prev) => prev.map((a) => ({ ...a, selected: !allSelected })));
  };

  const bulkAction = (action: 'approve' | 'reject') => {
    const selected = pendingApprovals.filter((a) => a.selected);
    if (selected.length === 0) { alert('Select at least one item.'); return; }
    alert(`${action === 'approve' ? 'Approved' : 'Rejected'} ${selected.length} item(s) successfully.`);
    setPendingApprovals((prev) => prev.filter((a) => !a.selected));
  };

  const priorityColor = (p: string) => {
    const map: Record<string, string> = { LOW: 'var(--color-text-secondary)', MEDIUM: 'var(--color-warning)', HIGH: 'var(--color-error)', CRITICAL: 'var(--color-error)' };
    return map[p] || 'var(--color-text)';
  };

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-between">
        <div className="ui-hstack-3">
          <label className={styles.s1}>
            <input type="checkbox" checked={pendingApprovals.every((a) => a.selected)} onChange={toggleSelectAll} className={styles.s2} />
            Select All
          </label>
          <span className="ui-text-sm-muted">
            {pendingApprovals.filter((a) => a.selected).length} of {pendingApprovals.length} selected
          </span>
        </div>
        <div className="ui-flex ui-gap-2">
          <button onClick={() => bulkAction('approve')} className={styles.s3}>
            <CheckCircle size={14} /> Approve Selected
          </button>
          <button onClick={() => bulkAction('reject')} className={styles.s4}>
            <XCircle size={14} /> Reject Selected
          </button>
        </div>
      </div>
      <ListPageTemplate
        columns={[
          { key: 'selected', header: 'Sel', render: (v, row) => (
            <input type="checkbox" checked={Boolean(v)} onChange={() => toggleSelect(String(row.id))} className={styles.s2} />
          ) },
          { key: 'entityType', header: 'Type', render: (v) => <span className={styles.s5}>{String(v)}</span> },
          { key: 'entityId', header: 'ID', render: (v) => <span className="font-semibold">{String(v)}</span> },
          { key: 'description', header: 'Description' },
          { key: 'requestedBy', header: 'Requested By', render: (v) => <span className="ui-text-muted">{String(v)}</span> },
          { key: 'amount', header: 'Amount', render: (v) => <span className="font-bold">{Number(v) > 0 ? `$${Number(v).toLocaleString()}` : '—'}</span> },
          { key: 'priority', header: 'Priority', render: (v) => <span style={{ color: priorityColor(String(v)) }} className={styles.s6}>{String(v)}</span> },
          { key: 'slaDeadline', header: 'SLA', render: (v) => (
            <span style={{ color: new Date(String(v)) < new Date() ? 'var(--color-error)' : 'var(--color-text-secondary)' }} className={styles.s7}>
              <Clock size={10} className={styles.s8} />
              {new Date(String(v)).toLocaleDateString()}
            </span>
          ) },
        ] as ListColumn[]}
        data={pendingApprovals as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No pending approvals"
        emptyDescription="No pending approvals."
      />
    </div>
  );
}
