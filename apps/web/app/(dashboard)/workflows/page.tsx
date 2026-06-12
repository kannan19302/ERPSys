'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  stepOrder: number;
  actionType: string;
  assigneeRole: string;
}

interface Workflow {
  id: string;
  name: string;
  triggerType: string;
  steps?: WorkflowStep[];
}

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

export default function WorkflowsPage() {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'workflows' | 'approvals'>('workflows');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [wfRes, appRes] = await Promise.all([
        fetch('http://localhost:3001/workflows', { headers }),
        fetch('http://localhost:3001/workflows/approvals', { headers }),
      ]);

      const [wfs, apps] = await Promise.all([
        wfRes.json(), appRes.json()
      ]);

      setWorkflows(Array.isArray(wfs) ? wfs : []);
      setApprovals(Array.isArray(apps) ? apps : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('token');
      const comments = prompt(`Enter comments for ${status.toLowerCase()}:`, '');
      const res = await fetch(`http://localhost:3001/workflows/approvals/${id}`, {
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

  const handleCreateWorkflow = async () => {
    const name = prompt('Enter workflow name:');
    if (!name) return;
    const triggerType = prompt('Enter trigger type (e.g. PO_CREATED, LEAVE_REQUESTED, INVOICE_CREATED):', 'PO_CREATED');
    if (!triggerType) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          triggerType,
          steps: [
            { stepOrder: 1, actionType: 'APPROVAL', assigneeRole: 'Admin' }
          ]
        })
      });
      loadData();
    } catch {
      alert('Error creating workflow.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Workflows Platform...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <GitFork style={{ color: 'var(--color-primary)' }} />
            Approval Workflows Engine
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Define sequential approvals for transactions, assign staff roles, and track active delegation chains.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('workflows')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'workflows' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'workflows' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <GitFork size={16} /> Workflow Configuration
        </button>
        <button 
          onClick={() => setActiveTab('approvals')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'approvals' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'approvals' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Activity size={16} /> Active Approvals ({approvals.filter(a=>a.status==='PENDING').length})
        </button>
      </div>

      {/* Main Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Tab view */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'workflows' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Workflow Templates</h2>
                <button 
                  onClick={handleCreateWorkflow}
                  style={{
                    background: 'var(--color-primary)', color: 'var(--color-bg-elevated)', border: 'none',
                    padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'bold'
                  }}
                >
                  Create Workflow
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {workflows.map(wf => (
                  <div key={wf.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>{wf.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 'bold' }}>Trigger: {wf.triggerType}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Steps Chain:</span>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                        {wf.steps?.map((step: WorkflowStep) => (
                          <div key={step.id} style={{ padding: 'var(--space-1) var(--space-2.5)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '10px', background: 'var(--color-bg)' }}>
                            Step {step.stepOrder}: {step.actionType} ({step.assigneeRole})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Active Approvals Log</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {approvals.map(app => (
                  <div key={app.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Entity: {app.entityType} ({app.entityId})</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Workflow Step: {app.step?.actionType} assigned to {app.step?.assigneeRole}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Comments: {app.comments || 'No comments'}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {app.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleApprove(app.id, 'APPROVED')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }}><CheckCircle size={20} /></button>
                          <button onClick={() => handleApprove(app.id, 'REJECTED')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><XCircle size={20} /></button>
                        </>
                      ) : (
                        <span style={{
                          fontSize: '11px', fontWeight: 'bold', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)',
                          background: app.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                          color: app.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>{app.status}</span>
                      )}
                    </div>
                  </div>
                ))}
                {approvals.length === 0 && (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No active approval requests found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ color: 'var(--color-primary)' }} />
            Workflow Engine Rationale
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Workflows automatically trigger approval chains for key business entities when events are registered in the monorepo event-emitter system.
          </p>
        </div>

      </div>
    </div>
  );
}
