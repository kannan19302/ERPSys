/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { MailWarning, AlertTriangle, Play, Loader2, RefreshCw } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface DunningLevel {
  id: string;
  levelName: string;
  daysOverdue: number;
  feeAmount: number;
}

interface DunningRun {
  id: string;
  runDate: string;
  status: string;
  totalInvoices: number;
}

export default function ARAutomationPage() {
  const [levels, setLevels] = useState<DunningLevel[]>([]);
  const [runs, setRuns] = useState<DunningRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [levelData, setLevelData] = useState({ levelName: '', daysOverdue: '', feeAmount: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [lvlRes, runRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/dunning-levels', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/dunning-runs', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (lvlRes.ok) setLevels(await lvlRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (runRes.ok) setRuns(await runRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/dunning-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          levelName: levelData.levelName,
          daysOverdue: parseInt(levelData.daysOverdue) || 0,
          feeAmount: parseFloat(levelData.feeAmount) || 0
        })
      });
      if (res.ok) {
        setShowLevelForm(false);
        setLevelData({ levelName: '', daysOverdue: '', feeAmount: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to save dunning level: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteDunning = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/dunning-runs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Manual dunning run started successfully.');
        fetchData();
      } else {
        alert('Failed to start dunning run.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>AR Automation & Dunning</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Automated customer reminders, late fees, and credit control.</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw style={{ marginRight: 'var(--space-2)' }} />
          Refresh Data
        </Button>
      </div>

      {showLevelForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Create Dunning Level</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateLevel} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Level Name</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required placeholder="First Notice" value={levelData.levelName} onChange={e => setLevelData({ ...levelData, levelName: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Days Overdue</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="15" value={levelData.daysOverdue} onChange={e => setLevelData({ ...levelData, daysOverdue: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Fee Amount</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="25.00" value={levelData.feeAmount} onChange={e => setLevelData({ ...levelData, feeAmount: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowLevelForm(false)}>Cancel</Button>
                <Button type="submit">Save Level</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-2">
        {/* Dunning Levels */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="bg-amber-100 dark:bg-amber-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <AlertTriangle className="text-amber-700 dark:text-amber-400" style={{ height: '24px', width: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Dunning Levels</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Configured reminder escalations</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1', overflow: 'auto' }}>
            {levels.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p>No dunning levels configured.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Level Name</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Days Overdue</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((lvl) => (
                    <tr key={lvl.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{lvl.levelName}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>+{lvl.daysOverdue} days</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>${Number(lvl.feeAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="outline" style={{ width: '100%' }} onClick={() => setShowLevelForm(true)}>Configure Levels</Button>
          </div>
        </Card>

        {/* Dunning Runs */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="bg-rose-100 dark:bg-rose-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <MailWarning className="text-rose-700 dark:text-rose-400" style={{ height: '24px', width: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Dunning Run History</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Past automated reminder batches</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1', overflow: 'auto' }}>
            {runs.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p>No dunning runs recorded.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Date</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Invoices Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>{new Date(run.runDate).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>
                          {run.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>{run.totalInvoices}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button style={{ width: '100%' }} variant="danger" onClick={handleExecuteDunning}>Execute Manual Dunning Run <Play style={{ marginLeft: 'var(--space-2)' }} /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
