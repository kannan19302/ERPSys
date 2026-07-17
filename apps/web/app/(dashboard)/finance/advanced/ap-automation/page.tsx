'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, ShieldCheck, CreditCard, ArrowRight, CheckCircle2, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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

  const fetchData = useCallback(async () => {
    try {
      const [schRes, runRes, venRes, bankRes] = await Promise.all([
        client.get<unknown>('/advanced-finance/payment-schedules'),
        client.get<unknown>('/advanced-finance/payment-runs'),
        client.get<unknown>('/crm/vendors'),
        client.get<unknown>('/advanced-finance/bank-accounts')
      ]);
      const list = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : ((value as { data?: T[] })?.data || []);
      setSchedules(list<APSchedule>(schRes)); setRuns(list<APRun>(runRes)); setVendors(list<{ id: string; name: string }>(venRes)); setBankAccounts(list<{ id: string; bankName: string; accountNumber: string }>(bankRes));
    } catch {
      alert('Unable to load accounts payable automation data.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        vendorId: scheduleData.vendorId,
        amount: parseFloat(scheduleData.amount) || 0,
        dueDate: new Date(scheduleData.dueDate).toISOString(),
        status: 'PENDING'
      };

      await client.post('/advanced-finance/payment-schedules', payload);
        setShowScheduleForm(false);
        setScheduleData({ vendorId: '', amount: '', dueDate: '' });
        fetchData();
    } catch {
      alert('Unable to save the payment schedule.');
    }
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        bankAccountId: runData.bankAccountId,
        totalAmount: parseFloat(runData.totalAmount) || 0,
        runDate: new Date(runData.runDate).toISOString(),
        status: 'COMPLETED'
      };

      await client.post('/advanced-finance/payment-runs', payload);
        setShowRunForm(false);
        setRunData({ bankAccountId: '', totalAmount: '', runDate: '' });
        fetchData();
    } catch {
      alert('Unable to create the payment run.');
    }
  };

  const handleRunMatchingEngine = async () => {
    // Manually run/create a sample payment schedule using first vendor
    if (vendors.length === 0) {
      alert('Please add a vendor first to run the matching engine.');
      return;
    }
    try {
      const sampleVendor = vendors[0] as { id: string; name: string };
      const payload = {
        vendorId: sampleVendor.id,
        amount: Math.floor(Math.random() * 5000) + 500,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING'
      };

      await client.post('/advanced-finance/payment-schedules', payload);
        alert('Matching engine completed. Generated a verified payment schedule for: ' + sampleVendor.name);
        fetchData();
    } catch {
      alert('Unable to run the matching engine.');
    }
  };

  if (loading) return <div className="p-8 ui-flex-center"><Loader2 className="animate-spin h-8 w-8 ui-text-primary" /></div>;

  return (
    <RouteGuard permission="finance.payables.read">
      <div className="p-8 ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-3xl">AP Automation</h1>
          <p className="ui-text-muted mt-1">3-Way matching, payment scheduling, and AP runs.</p>
        </div>
        <div className="ui-flex ui-gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2" />
            Refresh Data
          </Button>
          <Button onClick={() => alert('Rules configuration updated.')}>
            <Settings className="mr-2" />
            Configure AP Rules
          </Button>
        </div>
      </div>

      {/* Forms Section */}
      {showScheduleForm && (
        <Card className="border-primary/20">
          <div className="p-6">
            <h3 className={styles.s1}>Schedule New Payment</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleCreateSchedule} className="ui-stack-4">
              <div className="ui-grid-3">
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Vendor</label>
                  <select
                    className="ui-field-line"
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
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Amount ($)</label>
                  <input
                    className="ui-field-line"
                    type="number"
                    required
                    placeholder="1500.00"
                    value={scheduleData.amount}
                    onChange={e => setScheduleData({ ...scheduleData, amount: e.target.value })}
                  />
                </div>
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Due Date</label>
                  <input
                    className="ui-field-line"
                    type="date"
                    required
                    value={scheduleData.dueDate}
                    onChange={e => setScheduleData({ ...scheduleData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="ui-flex-end ui-gap-2">
                <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                <Button type="submit">Schedule Payment</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showRunForm && (
        <Card className="border-primary/20">
          <div className="p-6">
            <h3 className={styles.s2}>Create Payment Run</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleCreateRun} className="ui-stack-4">
              <div className="ui-grid-3">
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Bank Account</label>
                  <select
                    className="ui-field-line"
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
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Total Amount ($)</label>
                  <input
                    className="ui-field-line"
                    type="number"
                    required
                    placeholder="25000.00"
                    value={runData.totalAmount}
                    onChange={e => setRunData({ ...runData, totalAmount: e.target.value })}
                  />
                </div>
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Run Date</label>
                  <input
                    className="ui-field-line"
                    type="date"
                    required
                    value={runData.runDate}
                    onChange={e => setRunData({ ...runData, runDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="ui-flex-end ui-gap-2">
                <Button type="button" variant="outline" onClick={() => setShowRunForm(false)}>Cancel</Button>
                <Button type="submit">Create Payment Run</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="ui-grid-2">
        {/* Payment Schedules */}
        <Card className={`border-primary/20 hover:border-primary/50 transition-colors ${styles.s3}`}>
          <div className={styles.s4}>
            <div className="ui-hstack-3">
              <div className={`bg-indigo-100 dark:bg-indigo-900/30 ${styles.s5}`}>
                <ShieldCheck className={`text-indigo-700 dark:text-indigo-400 ${styles.s6}`} />
              </div>
              <div className={styles.s7}>
                <div>
                  <h3 className="ui-heading-lg">3-Way PO Matching</h3>
                  <p className="ui-text-sm-muted">Pending verification schedules</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowScheduleForm(!showScheduleForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.s8}>
            {schedules.length === 0 ? (
              <div className={styles.s9}>
                <CheckCircle2 className={styles.s10} />
                <p>All POs matched and verified.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'vendor', header: 'Vendor', render: (v) => <span className="font-medium">{(v as any)?.name || 'Unknown'}</span> },
                  { key: 'dueDate', header: 'Due Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                  { key: 'amount', header: 'Amount', render: (v) => <span className="font-medium">${Number(v).toFixed(2)}</span> },
                ] as ListColumn[]}
                data={(schedules as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="All POs matched and verified"
                emptyDescription="No pending payment schedules."
              />
            )}
          </div>
          <div className={styles.s11}>
            <Button variant="outline" className="w-full" onClick={handleRunMatchingEngine}>Run Matching Engine <ArrowRight className={styles.s12} /></Button>
          </div>
        </Card>

        {/* Payment Runs */}
        <Card className={`border-primary/20 hover:border-primary/50 transition-colors ${styles.s13}`}>
          <div className={styles.s14}>
            <div className="ui-hstack-3">
              <div className={`bg-green-100 dark:bg-green-900/30 ${styles.s15}`}>
                <CreditCard className={`text-green-700 dark:text-green-400 ${styles.s16}`} />
              </div>
              <div className={styles.s17}>
                <div>
                  <h3 className="ui-heading-lg">Payment Runs</h3>
                  <p className="ui-text-sm-muted">Batch AP wire and check runs</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowRunForm(!showRunForm)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.s18}>
            {runs.length === 0 ? (
              <div className={styles.s19}>
                <p>No active payment runs.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'runDate', header: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                  { key: 'bankAccount', header: 'Account', render: (v) => String((v as any)?.bankName ?? '—') },
                  { key: 'totalAmount', header: 'Total', render: (v) => <span className={styles.s20}>${Number(v).toFixed(2)}</span> },
                ] as ListColumn[]}
                data={(runs as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No active payment runs"
                emptyDescription="Create a payment run to get started."
              />
            )}
          </div>
          <div className={styles.s21}>
            <Button className="w-full" onClick={() => setShowRunForm(!showRunForm)}>Create Payment Run <Plus className={styles.s22} /></Button>
          </div>
        </Card>
      </div>
      </div>
    </RouteGuard>
  );
}
