'use client';

import React, { useState, useEffect } from 'react';
import { GitFork, RefreshCw, Plus } from 'lucide-react';

interface WorkflowStep {
  id: string;
  stepOrder: number;
  actionType: string;
  assigneeRole: string;
  slaLimitHours?: number;
  backupAssigneeRole?: string;
}

interface Workflow {
  id: string;
  name: string;
  triggerType: string;
  steps?: WorkflowStep[];
}

export default function WorkflowTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const wfRes = await fetch('/api/v1/workflows', { headers });
      if (wfRes.ok) {
        const wfs = await wfRes.json();
        setWorkflows(Array.isArray(wfs) ? wfs : []);
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

  const handleCreateWorkflow = async () => {
    const name = prompt('Enter workflow name:');
    if (!name) return;
    const triggerType = prompt('Enter trigger type (e.g. PO_CREATED, LEAVE_REQUESTED, INVOICE_CREATED):', 'PO_CREATED');
    if (!triggerType) return;
    const assigneeRole = prompt('Enter primary assignee role:', 'Admin');
    if (!assigneeRole) return;
    const slaLimitStr = prompt('Enter SLA limit hours (optional, e.g. 24):', '24');
    const slaLimitHours = slaLimitStr ? parseInt(slaLimitStr, 10) : undefined;
    const backupAssigneeRole = slaLimitHours ? (prompt('Enter backup assignee role:', 'Manager') || 'Admin') : undefined;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          triggerType,
          steps: [
            { 
              stepOrder: 1, 
              actionType: 'APPROVAL', 
              assigneeRole,
              slaLimitHours,
              backupAssigneeRole
            }
          ]
        })
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Error creating workflow');
      }
    } catch {
      alert('Error creating workflow.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Workflow Templates...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <GitFork style={{ color: 'var(--color-primary)' }} />
            Workflow Templates
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Define custom approval paths, trigger conditions, roles assignments, and backup escalation paths for documents.
          </p>
        </div>
        <button 
          onClick={handleCreateWorkflow}
          style={{
            background: 'var(--color-primary)', 
            color: '#fff', 
            border: 'none',
            padding: 'var(--space-2) var(--space-4)', 
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer', 
            fontSize: 'var(--text-sm)', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <Plus size={16} /> Create Workflow
        </button>
      </div>

      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Workflow List ({workflows.length})</h2>
          <button onClick={loadData} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {workflows.map(wf => (
            <div key={wf.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{wf.name}</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 'bold' }}>Trigger: {wf.triggerType}</span>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Steps Chain:</span>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {wf.steps?.map((step: WorkflowStep) => (
                    <div key={step.id} style={{ padding: 'var(--space-1.5) var(--space-2.5)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '11px', background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)' }}>
                      Step {step.stepOrder}: {step.actionType} ({step.assigneeRole})
                      {step.slaLimitHours ? ` [SLA: ${step.slaLimitHours}h (Backup: ${step.backupAssigneeRole || 'Admin'})]` : ''}
                    </div>
                  ))}
                  {(!wf.steps || wf.steps.length === 0) && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>No steps configured for this workflow template.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              No workflow templates found. Click "Create Workflow" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
