'use client';

import styles from './TemplatesTab.module.css';

import React, { useState, useEffect } from 'react';
import { GitFork, RefreshCw, Plus } from 'lucide-react';
import Link from 'next/link';
import { useApiClient } from '@unerp/framework';

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

export default function TemplatesTab() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const loadData = async () => {
    try {
      const wfs = await client.get<Workflow[]>('/workflows');
      setWorkflows(Array.isArray(wfs) ? wfs : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [client]);

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
      await client.post('/workflows', {
          name, triggerType,
          steps: [{ stepOrder: 1, actionType: 'APPROVAL', assigneeRole, slaLimitHours, backupAssigneeRole }],
      });
      void loadData();
    } catch {
      alert('Error creating workflow.');
    }
  };

  if (loading) {
    return (
      <div className={styles.p1}>
        <RefreshCw className="spin" size={32} />
        <span className={styles.p2}>Loading Workflow Templates...</span>
      </div>
    );
  }

  return (
    <div className={styles.p3}>
      <div className={styles.p4}>
        <Link href="/settings/automation-rules" className={styles.p5}>
          Open the full Automation Rules builder →
        </Link>
        <button
          onClick={handleCreateWorkflow}
          className={styles.p6}
        >
          <Plus size={16} /> Create Workflow
        </button>
      </div>

      <div className="ui-card p-5">
        <div className="ui-flex-between mb-4">
          <h2 className={styles.p7}>Workflow List ({workflows.length})</h2>
          <button onClick={loadData} className={styles.p8}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="ui-stack-3">
          {workflows.map((wf) => (
            <div key={wf.id} className={styles.p9}>
              <div className={styles.p10}>
                <span className={styles.p11}>{wf.name}</span>
                <span className={styles.p12}>Trigger: {wf.triggerType}</span>
              </div>
              <div>
                <span className="ui-text-xs-bold-muted">Steps Chain:</span>
                <div className={styles.p13}>
                  {wf.steps?.map((step) => (
                    <div key={step.id} className={styles.p14}>
                      Step {step.stepOrder}: {step.actionType} ({step.assigneeRole})
                      {step.slaLimitHours ? ` [SLA: ${step.slaLimitHours}h (Backup: ${step.backupAssigneeRole || 'Admin'})]` : ''}
                    </div>
                  ))}
                  {(!wf.steps || wf.steps.length === 0) && (
                    <span className="ui-text-caption ui-text-tertiary">No steps configured for this workflow template.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className={styles.p15}>
              No workflow templates found. Click &quot;Create Workflow&quot; to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
