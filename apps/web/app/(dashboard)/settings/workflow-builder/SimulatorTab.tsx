'use client';

import styles from './SimulatorTab.module.css';

import React, { useState } from 'react';
import { GitFork, Activity, Play } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface SimulationStep {
  stepOrder: number;
  actionType: string;
  assigneeRole: string;
  slaHours: number | null;
  backupRole: string | null;
}

interface SimulationResult {
  success: boolean;
  workflowName?: string;
  stepsCount?: number;
  sequence?: SimulationStep[];
  message?: string;
}

export default function SimulatorTab() {
  const client = useApiClient();
  const [simTriggerType, setSimTriggerType] = useState('PO_CREATED');
  const [simEntityType, setSimEntityType] = useState('PurchaseOrder');
  const [simEntityId, setSimEntityId] = useState('PO-1001');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await client.post<SimulationResult>('/workflows/simulate', { triggerType: simTriggerType, entityType: simEntityType, entityId: simEntityId });
      setSimResult(data);
    } catch {
      alert('Error simulating workflow.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.p1}>
      <div className={styles.p2}>
        <h3 className={styles.p3}>
          <GitFork size={16} /> Simulator Trigger Settings
        </h3>

        <form onSubmit={handleSimulate} className="ui-stack-4">
          <div>
            <label className={styles.p4}>System Trigger Event</label>
            <select
              value={simTriggerType}
              onChange={(e) => setSimTriggerType(e.target.value)}
              className={styles.p5}
            >
              <option value="PO_CREATED">PO_CREATED</option>
              <option value="LEAVE_REQUESTED">LEAVE_REQUESTED</option>
              <option value="INVOICE_CREATED">INVOICE_CREATED</option>
            </select>
          </div>

          <div>
            <label className={styles.p6}>Target Entity Name</label>
            <input
              type="text"
              value={simEntityType}
              onChange={(e) => setSimEntityType(e.target.value)}
              className={styles.p7}
            />
          </div>

          <div>
            <label className={styles.p8}>Simulated Entity ID</label>
            <input
              type="text"
              value={simEntityId}
              onChange={(e) => setSimEntityId(e.target.value)}
              className={styles.p9}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.p10}
          >
            {loading ? 'Running simulation dry-run...' : 'Execute Dry-run Simulation'}
          </button>
        </form>
      </div>

      <div className={styles.p11}>
        <h3 className={styles.p12}>
          <Activity size={16} /> Route Results Output
        </h3>

        {!simResult ? (
          <div className={styles.p13}>
            Configure and run simulator trigger details to visualize execution.
          </div>
        ) : (
          <div className="ui-stack-3">
            {simResult.success ? (
              <>
                <div className={styles.p14}>
                  Successfully matched: {simResult.workflowName} ({simResult.stepsCount} workflow steps found)
                </div>

                <div className={styles.p15}>
                  {simResult.sequence?.map((step) => (
                    <div key={step.stepOrder} className={styles.p16}>
                      <div className={styles.p17}>
                        <span>Step {step.stepOrder}: {step.actionType}</span>
                        <span className="ui-text-xs-muted">Assignee: {step.assigneeRole}</span>
                      </div>
                      {step.slaHours ? (
                        <div className={styles.p18}>
                          <span><strong>SLA Breach Limit:</strong> {step.slaHours} hours</span>
                          <span>|</span>
                          <span><strong>Backup Delegate Role:</strong> {step.backupRole || 'Admin'}</span>
                        </div>
                      ) : (
                        <div className={styles.p19}>
                          No SLA policies configured for this workflow approval step.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.p20}>
                {simResult.message || 'No matching active workflow trigger could be simulated.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
