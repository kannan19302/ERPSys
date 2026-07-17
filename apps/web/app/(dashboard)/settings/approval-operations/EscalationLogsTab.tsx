'use client';
import styles from './EscalationLogsTab.module.css';
import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [checkingSla, setCheckingSla] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadApprovals = async () => {
    try {
      setApprovals(await client.get<ApprovalRequest[]>('/workflows/approvals'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadApprovals(); }, [client]);

  const handleCheckSla = async () => {
    try {
      setCheckingSla(true);
      const breaches = await client.post<Array<unknown>>('/workflows/sla-check');
      alert(`SLA check complete! Found and processed ${breaches.length} breaches.`);
      void loadApprovals();
    } catch {
      alert('Error checking SLAs.');
    } finally {
      setCheckingSla(false);
    }
  };

  const slaPendingApprovals = approvals.filter((app) => app.status === 'PENDING' && app.step?.slaLimitHours);

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <button
          onClick={handleCheckSla}
          disabled={checkingSla}
          className={styles.s1}
        >
          <RefreshCw size={14} className={checkingSla ? 'spin' : ''} />
          {checkingSla ? 'Sweeping SLA limits...' : 'Run SLA Breach Check'}
        </button>
      </div>

      <div className={styles.s2}>
        <h3 className={styles.s3}>
          <Clock size={16} /> Pending Approvals Under SLA Monitoring ({slaPendingApprovals.length})
        </h3>

        {loading ? (
          <div className={styles.s4}>Loading approval SLAs...</div>
        ) : slaPendingApprovals.length === 0 ? (
          <div className={styles.s5}>
            No active pending approval requests have SLA limits configured.
          </div>
        ) : (
          <div className="ui-stack-3">
            {slaPendingApprovals.map((app) => (
              <div key={app.id} className={styles.s6}>
                <div>
                  <h4 className={styles.s7}>{app.entityType} ({app.entityId})</h4>
                  <div className={styles.s8}>
                    <span><strong>Assignee:</strong> {app.step?.assigneeRole}</span>
                    <span><strong>SLA Limit:</strong> {app.step?.slaLimitHours} hours</span>
                    <span><strong>Backup Role:</strong> {app.step?.backupAssigneeRole || 'None'}</span>
                  </div>
                </div>
                <div className="ui-hstack-2">
                  <span className={styles.s9}>
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
