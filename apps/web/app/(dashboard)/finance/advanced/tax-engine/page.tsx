/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { Percent, ShieldAlert, Plus, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

export default function TaxEnginePage() {
  const [rules, setRules] = useState<any[]>([]);
  const [withholding, setWithholding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showWithholdingForm, setShowWithholdingForm] = useState(false);
  const [ruleData, setRuleData] = useState({ name: '', rate: '', type: 'GST' });
  const [withholdingData, setWithholdingData] = useState({ name: '', rate: '', threshold: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [rulesRes, wTaxesRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/tax-rules', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/withholding-taxes', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (wTaxesRes.ok) setWithholding(await wTaxesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/tax-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: ruleData.name,
          rate: parseFloat(ruleData.rate) || 0,
          type: ruleData.type,
          status: 'ACTIVE'
        })
      });
      if (res.ok) {
        setShowRuleForm(false);
        setRuleData({ name: '', rate: '', type: 'GST' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to create tax rule: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWithholding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/withholding-taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: withholdingData.name,
          rate: parseFloat(withholdingData.rate) || 0,
          threshold: parseFloat(withholdingData.threshold) || 0
        })
      });
      if (res.ok) {
        setShowWithholdingForm(false);
        setWithholdingData({ name: '', rate: '', threshold: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to create withholding tax: ' + (err.message || 'Error'));
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
          <h1 className="text-3xl font-bold tracking-tight">Tax Engine</h1>
          <p className="text-muted-foreground mt-1">Configure complex Tax Rules, GST components, and TDS logic.</p>
        </div>
        <Button onClick={fetchData}>
          <Settings className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {showRuleForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Create Tax Rule</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rule Name</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required placeholder="Standard GST" value={ruleData.name} onChange={e => setRuleData({ ...ruleData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax Rate (%)</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="18" value={ruleData.rate} onChange={e => setRuleData({ ...ruleData, rate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={ruleData.type} onChange={e => setRuleData({ ...ruleData, type: e.target.value })}>
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="CUSTOMS">CUSTOMS</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowRuleForm(false)}>Cancel</Button>
                <Button type="submit">Save Rule</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showWithholdingForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Add Withholding Tax (TDS)</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateWithholding} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax Name</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required placeholder="TDS on Contracts (Section 194C)" value={withholdingData.name} onChange={e => setWithholdingData({ ...withholdingData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate (%)</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="2" value={withholdingData.rate} onChange={e => setWithholdingData({ ...withholdingData, rate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Threshold Limit ($)</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="1000" value={withholdingData.threshold} onChange={e => setWithholdingData({ ...withholdingData, threshold: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowWithholdingForm(false)}>Cancel</Button>
                <Button type="submit">Save Withholding Tax</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tax Rules */}
        <Card className="flex flex-col h-full border-primary/20 hover:border-primary/50 transition-colors">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Percent className="h-6 w-6 text-purple-700 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sales & Purchase Tax Rules</h3>
                <p className="text-sm text-muted-foreground">e.g. Inter-state GST, Standard VAT</p>
              </div>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
            {rules.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No tax rules configured.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Rule Name</th>
                    <th className="p-3 font-medium">Components</th>
                    <th className="p-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{rule.name}</td>
                      <td className="p-3 text-muted-foreground">{rule.components?.length || 0} rates</td>
                      <td className="p-3 text-right">
                        {rule.status === 'ACTIVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                        ) : rule.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t bg-muted/10">
            <Button variant="outline" className="w-full" onClick={() => setShowRuleForm(true)}>Create Tax Rule <Plus className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>

        {/* Withholding Taxes / TDS */}
        <Card className="flex flex-col h-full border-primary/20 hover:border-primary/50 transition-colors">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <ShieldAlert className="h-6 w-6 text-red-700 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Withholding Taxes (TDS)</h3>
                <p className="text-sm text-muted-foreground">Automated deductions on AP invoices</p>
              </div>
            </div>
          </div>
          <div className="p-0 flex-1 overflow-auto max-h-[400px]">
            {withholding.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No withholding taxes configured.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">Tax Name</th>
                    <th className="p-3 font-medium text-right">Rate</th>
                    <th className="p-3 font-medium text-right">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {withholding.map((tax) => (
                    <tr key={tax.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{tax.name}</td>
                      <td className="p-3 text-right font-medium">{Number(tax.rate).toFixed(2)}%</td>
                      <td className="p-3 text-right text-muted-foreground">${Number(tax.threshold || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 border-t bg-muted/10">
            <Button variant="outline" className="w-full" onClick={() => setShowWithholdingForm(true)}>Add Withholding Tax <Plus className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
