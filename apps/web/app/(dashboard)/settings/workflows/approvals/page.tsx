'use client';

import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

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

export default function WorkflowApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const appRes = await fetch('/api/v1/workflows/approvals', { headers });
      if (appRes.ok) {
        const apps = await appRes.json();
        setApprovals(Array.isArray(apps) ? apps : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const comments = prompt(`Enter comments for ${status.toLowerCase()}:`, '');
    if (comments === null) return; // user cancelled prompt
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/workflows/approvals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, comments })
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Error actioning approval');
      }
    } catch {
      alert('Error actioning approval.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Approvals Queue...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Activity style={{ color: 'var(--color-primary)' }} />
            Active Approvals Queue
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Review, approve, or reject active document authorizations currently assigned to your team.
          </p>
        </div>
        <button onClick={loadData} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>
          Active Approvals ({approvals.filter(a => a.status === 'PENDING').length} Pending)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {approvals.map(app => (
            <div key={app.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', gap: 'var(--space-3)' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>Entity: {app.entityType} ({app.entityId})</p>
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Workflow Step: {app.step?.actionType || 'APPROVAL'} assigned to <strong style={{ color: 'var(--color-text)' }}>{app.step?.assigneeRole}</strong>
                </p>
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  Comments: {app.comments || 'No comments'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {app.status === 'PENDING' ? (
                  <>
                    <button 
                      onClick={() => handleApprove(app.id, 'APPROVED')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', padding: 'var(--space-1)' }}
                      title="Approve"
                    >
                      <CheckCircle size={22} />
                    </button>
                    <button 
                      onClick={() => handleApprove(app.id, 'REJECTED')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: 'var(--space-1)' }}
                      title="Reject"
                    >
                      <XCircle size={22} />
                    </button>
                  </>
                ) : (
                  <span style={{
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-full)',
                    background: app.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    color: app.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-error)'
                  }}>
                    {app.status}
                  </span>
                )}
              </div>
            </div>
          ))}
          {approvals.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              No active approval requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
