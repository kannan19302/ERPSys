'use client';

import React, { useState } from 'react';
import { GitFork, Activity, Play } from 'lucide-react';

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
  const [simTriggerType, setSimTriggerType] = useState('PO_CREATED');
  const [simEntityType, setSimEntityType] = useState('PurchaseOrder');
  const [simEntityId, setSimEntityId] = useState('PO-1001');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/workflows/simulate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: simTriggerType, entityType: simEntityType, entityId: simEntityId }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch {
      alert('Error simulating workflow.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-6)', alignItems: 'start' }}>
      <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GitFork size={16} /> Simulator Trigger Settings
        </h3>

        <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>System Trigger Event</label>
            <select
              value={simTriggerType}
              onChange={(e) => setSimTriggerType(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginTop: '6px' }}
            >
              <option value="PO_CREATED">PO_CREATED</option>
              <option value="LEAVE_REQUESTED">LEAVE_REQUESTED</option>
              <option value="INVOICE_CREATED">INVOICE_CREATED</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Target Entity Name</label>
            <input
              type="text"
              value={simEntityType}
              onChange={(e) => setSimEntityType(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginTop: '6px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Simulated Entity ID</label>
            <input
              type="text"
              value={simEntityId}
              onChange={(e) => setSimEntityId(e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', marginTop: '6px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 'var(--space-2.5)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}
          >
            {loading ? 'Running simulation dry-run...' : 'Execute Dry-run Simulation'}
          </button>
        </form>
      </div>

      <div style={{ padding: 'var(--space-5)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', minHeight: '340px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={16} /> Route Results Output
        </h3>

        {!simResult ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', justifyContent: 'center' }}>
            Configure and run simulator trigger details to visualize execution.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {simResult.success ? (
              <>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                  Successfully matched: {simResult.workflowName} ({simResult.stepsCount} workflow steps found)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  {simResult.sequence?.map((step) => (
                    <div key={step.stepOrder} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                        <span>Step {step.stepOrder}: {step.actionType}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Assignee: {step.assigneeRole}</span>
                      </div>
                      {step.slaHours ? (
                        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-warning)', display: 'flex', gap: 'var(--space-2)' }}>
                          <span><strong>SLA Breach Limit:</strong> {step.slaHours} hours</span>
                          <span>|</span>
                          <span><strong>Backup Delegate Role:</strong> {step.backupRole || 'Admin'}</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                          No SLA policies configured for this workflow approval step.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                {simResult.message || 'No matching active workflow trigger could be simulated.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
