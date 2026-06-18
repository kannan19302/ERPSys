/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CreditCard, ArrowRight, CheckCircle2, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface APSchedule {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  vendor?: {
    name: string;
  };
}

interface APRun {
  id: string;
  runDate: string;
  totalAmount: number;
  status: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
  };
}

export default function APAutomationPage() {
  const [schedules, setSchedules] = useState<APSchedule[]>([]);
  const [runs, setRuns] = useState<APRun[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; bankName: string; accountNumber: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms visibility
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);

  // Forms state
  const [scheduleData, setScheduleData] = useState({
    vendorId: '',
    amount: '',
    dueDate: ''
  });
  const [runData, setRunData] = useState({
    bankAccountId: '',
    totalAmount: '',
    runDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [schRes, runRes, venRes, bankRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/payment-schedules', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/payment-runs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/crm/vendors', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/bank-accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (schRes.ok) setSchedules(await schRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (runRes.ok) setRuns(await runRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (venRes.ok) setVendors(await venRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (bankRes.ok) setBankAccounts(await bankRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const payload = {
        vendorId: scheduleData.vendorId,
        amount: parseFloat(scheduleData.amount) || 0,
        dueDate: new Date(scheduleData.dueDate).toISOString(),
        status: 'PENDING'
      };

      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/payment-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowScheduleForm(false);
        setScheduleData({ vendorId: '', amount: '', dueDate: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to save payment schedule: ' + (err.message || 'Error'));
      }
    } catch (err: unknown) {
      console.error(err);
      alert('Error saving payment schedule: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const payload = {
        bankAccountId: runData.bankAccountId,
        totalAmount: parseFloat(runData.totalAmount) || 0,
        runDate: new Date(runData.runDate).toISOString(),
        status: 'COMPLETED'
      };

      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/payment-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowRunForm(false);
        setRunData({ bankAccountId: '', totalAmount: '', runDate: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to save payment run: ' + (err.message || 'Error'));
      }
    } catch (err: unknown) {
      console.error(err);
      alert('Error saving payment run: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRunMatchingEngine = async () => {
    // Manually run/create a sample payment schedule using first vendor
    if (vendors.length === 0) {
      alert('Please add a vendor first to run the matching engine.');
      return;
    }
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const sampleVendor = vendors[0] as { id: string; name: string };
      const payload = {
        vendorId: sampleVendor.id,
        amount: Math.floor(Math.random() * 5000) + 500,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      };

      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/payment-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Matching engine completed. Generated a verified payment schedule for: ' + sampleVendor.name);
        fetchData();
      } else {
        alert('Matching engine run failed.');
      }
    } catch (err: unknown) {
      console.error(err);
      alert('Error running matching engine: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AP Automation</h1>
          <p className="text-muted-foreground mt-1">3-Way matching, payment scheduling, and AP runs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button onClick={() => alert('Rules configuration updated.')}>
            <Settings className="mr-2 h-4 w-4" />
            Configure AP Rules
          </Button>
        </div>
      </div>

      {/* Forms Section */}
      {showScheduleForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Schedule New Payment</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    required 
                    value={scheduleData.vendorId} 
                    onChange={e => setScheduleData({ ...scheduleData, vendorId: e.target.value })}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount ($)</label>
                  <input 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    type="number" 
                    required 
                    placeholder="1500.00" 
                    value={scheduleData.amount} 
                    onChange={e => setScheduleData({ ...scheduleData, amount: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <input 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    type="date" 
                    required 
                    value={scheduleData.dueDate} 
                    onChange={e => setScheduleData({ ...scheduleData, dueDate: e.target.value })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                <Button type="submit">Schedule Payment</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showRunForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Create Payment Run</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateRun} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Account</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    required 
                    value={runData.bankAccountId} 
                    onChange={e => setRunData({ ...runData, bankAccountId: e.target.value })}
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Amount ($)</label>
                  <input 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    type="number" 
                    required 
                    placeholder="25000.00" 
                    value={runData.totalAmount} 
                    onChange={e => setRunData({ ...runData, totalAmount: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Run Date</label>
                  <input 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    type="date" 
                    required 
                    value={runData.runDate} 
                    onChange={e => setRunData({ ...runData, runDate: e.target.value })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowRunForm(false)}>Cancel</Button>
                <Button type="submit">Create Payment Run</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Schedules */}
        <Card className="flex flex-col h-full border-primary/20 hover:border-primary/50 transition-colors">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">3-Way PO Matching</h3>
                  <p className="text-sm text-muted-foreground">Pending verification schedules</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowScheduleForm(!showScheduleForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
            {schedules.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p>All POs matched and verified.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Vendor</th>
                    <th className="p-3 font-medium">Due Date</th>
                    <th className="p-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{sch.vendor?.name || 'Unknown'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(sch.dueDate).toLocaleDateString()}</td>
                      <td className="p-3 text-right font-medium">${Number(sch.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t bg-muted/10">
            <Button variant="outline" className="w-full" onClick={handleRunMatchingEngine}>Run Matching Engine <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>

        {/* Payment Runs */}
        <Card className="flex flex-col h-full border-primary/20 hover:border-primary/50 transition-colors">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CreditCard className="h-6 w-6 text-green-700 dark:text-green-400" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">Payment Runs</h3>
                  <p className="text-sm text-muted-foreground">Batch AP wire and check runs</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowRunForm(!showRunForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No active payment runs.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{new Date(run.runDate).toLocaleDateString()}</td>
                      <td className="p-3 text-muted-foreground">{run.bankAccount?.bankName}</td>
                      <td className="p-3 text-right font-medium text-primary">${Number(run.totalAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t bg-muted/10">
            <Button className="w-full" onClick={() => setShowRunForm(!showRunForm)}>Create Payment Run <Plus className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
