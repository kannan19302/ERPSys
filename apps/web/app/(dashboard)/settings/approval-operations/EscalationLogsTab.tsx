'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  comments?: string;
  step?: {
    actionType: string;
    assigneeRole: string;
    slaLimitHours?: number;
    backupAssigneeRole?: string;
  };
}

export default function EscalationLogsTab() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [checkingSla, setCheckingSla] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch('/api/v1/workflows/approvals', { headers });
      if (res.ok) {
        const data = await res.json();
        setApprovals(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadApprovals(); }, []);

  const handleCheckSla = async () => {
    try {
      setCheckingSla(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/workflows/sla-check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const breaches = await res.json();
        alert(`SLA check complete! Found and processed ${breaches.length} breaches.`);
        loadApprovals();
      } else {
        alert('Failed to check SLAs.');
      }
    } catch {
      alert('Error checking SLAs.');
    } finally {
      setCheckingSla(false);
    }
  };

  const slaPendingApprovals = approvals.filter((app) => app.status === 'PENDING' && app.step?.slaLimitHours);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCheckSla}
          disabled={checkingSla}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-warning)', color: 'black', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)' }}
        >
          <RefreshCw size={14} className={checkingSla ? 'spin' : ''} />
          {checkingSla ? 'Sweeping SLA limits...' : 'Run SLA Breach Check'}
        </button>
      </div>

      <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} /> Pending Approvals Under SLA Monitoring ({slaPendingApprovals.length})
        </h3>

        {loading ? (
          <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Loading approval SLAs...</div>
        ) : slaPendingApprovals.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            No active pending approval requests have SLA limits configured.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {slaPendingApprovals.map((app) => (
              <div key={app.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{app.entityType} ({app.entityId})</h4>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    <span><strong>Assignee:</strong> {app.step?.assigneeRole}</span>
                    <span><strong>SLA Limit:</strong> {app.step?.slaLimitHours} hours</span>
                    <span><strong>Backup Role:</strong> {app.step?.backupAssigneeRole || 'None'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '10px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> Under Monitoring
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
