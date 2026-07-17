'use client';
import styles from './ActiveApprovalsTab.module.css';
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
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
  };
}

export default function ActiveApprovalsTab() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  const loadData = async () => {
    try {
      const apps = await client.get<ApprovalRequest[]>('/workflows/approvals');
      setApprovals(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [client]);

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const comments = prompt(`Enter comments for ${status.toLowerCase()}:`, '');
    if (comments === null) return;

    try {
      await client.request(`/workflows/approvals/${id}`, { method: 'PUT', body: JSON.stringify({ status, comments }) });
      void loadData();
    } catch {
      alert('Error actioning approval.');
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <RefreshCw className="spin" size={32} />
        <span className={styles.s2}>Loading Approvals Queue...</span>
      </div>
    );
  }

  return (
    <div className={styles.s3}>
      <div className="ui-flex-end">
        <button onClick={loadData} className={styles.s4}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="ui-card p-5">
        <h2 className={styles.s5}>
          Active Approvals ({approvals.filter((a) => a.status === 'PENDING').length} Pending)
        </h2>

        <div className="ui-stack-3">
          {approvals.map((app) => (
            <div key={app.id} className={styles.s6}>
              <div>
                <p className={styles.s7}>Entity: {app.entityType} ({app.entityId})</p>
                <p className={styles.s8}>
                  Workflow Step: {app.step?.actionType || 'APPROVAL'} assigned to <strong className={styles.s9}>{app.step?.assigneeRole}</strong>
                </p>
                <p className={styles.s10}>
                  Comments: {app.comments || 'No comments'}
                </p>
              </div>

              <div className="ui-hstack-3">
                {app.status === 'PENDING' ? (
                  <>
                    <button onClick={() => handleApprove(app.id, 'APPROVED')} className={styles.s11} title="Approve">
                      <CheckCircle size={22} />
                    </button>
                    <button onClick={() => handleApprove(app.id, 'REJECTED')} className={styles.s12} title="Reject">
                      <XCircle size={22} />
                    </button>
                  </>
                ) : (
                  <span style={{ background: app.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-error-light)', color: app.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-error)' }} className={styles.s13}
                  >
                    {app.status}
                  </span>
                )}
              </div>
            </div>
          ))}
          {approvals.length === 0 && (
            <div className={styles.s14}>
              No active approval requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
