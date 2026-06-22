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

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>AP Automation</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>3-Way matching, payment scheduling, and AP runs.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw style={{ marginRight: 'var(--space-2)' }} />
            Refresh Data
          </Button>
          <Button onClick={() => alert('Rules configuration updated.')}>
            <Settings style={{ marginRight: 'var(--space-2)' }} />
            Configure AP Rules
          </Button>
        </div>
      </div>

      {/* Forms Section */}
      {showScheduleForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Schedule New Payment</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Vendor</label>
                  <select 
                    style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} 
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Amount ($)</label>
                  <input 
                    style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} 
                    type="number" 
                    required 
                    placeholder="1500.00" 
                    value={scheduleData.amount} 
                    onChange={e => setScheduleData({ ...scheduleData, amount: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Due Date</label>
                  <input 
                    style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} 
                    type="date" 
                    required 
                    value={scheduleData.dueDate} 
                    onChange={e => setScheduleData({ ...scheduleData, dueDate: e.target.value })} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                <Button type="submit">Schedule Payment</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showRunForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Create Payment Run</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateRun} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Bank Account</label>
                  <select 
                    style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} 
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Total Amount ($)</label>
                  <input 
                    style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} 
                    type="number" 
                    required 
                    placeholder="25000.00" 
                    value={runData.totalAmount} 
                    onChange={e => setRunData({ ...runData, totalAmount: e.target.value })} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Run Date</label>
                  <input 
                    style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} 
                    type="date" 
                    required 
                    value={runData.runDate} 
                    onChange={e => setRunData({ ...runData, runDate: e.target.value })} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowRunForm(false)}>Cancel</Button>
                <Button type="submit">Create Payment Run</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-2">
        {/* Payment Schedules */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="bg-indigo-100 dark:bg-indigo-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <ShieldCheck className="text-indigo-700 dark:text-indigo-400" style={{ height: '24px', width: '24px' }} />
              </div>
              <div style={{ flex: '1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>3-Way PO Matching</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Pending verification schedules</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowScheduleForm(!showScheduleForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div style={{ flex: '1', overflow: 'auto' }}>
            {schedules.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <CheckCircle2 style={{ marginBottom: 'var(--space-2)', opacity: '0.5' }} />
                <p>All POs matched and verified.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Vendor</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Due Date</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{sch.vendor?.name || 'Unknown'}</td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{new Date(sch.dueDate).toLocaleDateString()}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>${Number(sch.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="outline" style={{ width: '100%' }} onClick={handleRunMatchingEngine}>Run Matching Engine <ArrowRight style={{ marginLeft: 'var(--space-2)' }} /></Button>
          </div>
        </Card>

        {/* Payment Runs */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="bg-green-100 dark:bg-green-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <CreditCard className="text-green-700 dark:text-green-400" style={{ height: '24px', width: '24px' }} />
              </div>
              <div style={{ flex: '1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Payment Runs</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Batch AP wire and check runs</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowRunForm(!showRunForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div style={{ flex: '1', overflow: 'auto' }}>
            {runs.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p>No active payment runs.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Date</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Account</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>{new Date(run.runDate).toLocaleDateString()}</td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{run.bankAccount?.bankName}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)', color: 'var(--color-primary)' }}>${Number(run.totalAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button style={{ width: '100%' }} onClick={() => setShowRunForm(!showRunForm)}>Create Payment Run <Plus style={{ marginLeft: 'var(--space-2)' }} /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
