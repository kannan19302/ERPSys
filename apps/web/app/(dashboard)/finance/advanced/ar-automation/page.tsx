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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AR Automation & Dunning</h1>
          <p className="text-muted-foreground mt-1">Automated customer reminders, late fees, and credit control.</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {showLevelForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Create Dunning Level</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateLevel} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level Name</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required placeholder="First Notice" value={levelData.levelName} onChange={e => setLevelData({ ...levelData, levelName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Days Overdue</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="15" value={levelData.daysOverdue} onChange={e => setLevelData({ ...levelData, daysOverdue: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fee Amount</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="25.00" value={levelData.feeAmount} onChange={e => setLevelData({ ...levelData, feeAmount: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLevelForm(false)}>Cancel</Button>
                <Button type="submit">Save Level</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dunning Levels */}
        <Card className="flex flex-col h-full border-primary/20 hover:border-primary/50 transition-colors">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Dunning Levels</h3>
                <p className="text-sm text-muted-foreground">Configured reminder escalations</p>
              </div>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
            {levels.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No dunning levels configured.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Level Name</th>
                    <th className="p-3 font-medium text-right">Days Overdue</th>
                    <th className="p-3 font-medium text-right">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((lvl) => (
                    <tr key={lvl.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{lvl.levelName}</td>
                      <td className="p-3 text-right text-muted-foreground">+{lvl.daysOverdue} days</td>
                      <td className="p-3 text-right font-medium">${Number(lvl.feeAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t bg-muted/10">
            <Button variant="outline" className="w-full" onClick={() => setShowLevelForm(true)}>Configure Levels</Button>
          </div>
        </Card>

        {/* Dunning Runs */}
        <Card className="flex flex-col h-full border-primary/20 hover:border-primary/50 transition-colors">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <MailWarning className="h-6 w-6 text-rose-700 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Dunning Run History</h3>
                <p className="text-sm text-muted-foreground">Past automated reminder batches</p>
              </div>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No dunning runs recorded.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Invoices Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{new Date(run.runDate).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {run.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">{run.totalInvoices}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t bg-muted/10">
            <Button className="w-full" variant="danger" onClick={handleExecuteDunning}>Execute Manual Dunning Run <Play className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
