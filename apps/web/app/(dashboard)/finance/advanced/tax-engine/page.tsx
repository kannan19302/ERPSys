/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Percent, ShieldAlert, Plus, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface TaxRule {
  id: string;
  name: string;
  components?: { length: number }[];
  status: string;
}

interface WithholdingTax {
  id: string;
  name: string;
  rate: number | string;
  threshold?: number | string;
}

export default function TaxEnginePage() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [withholding, setWithholding] = useState<WithholdingTax[]>([]);
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
      if (rulesRes.ok) setRules((await rulesRes.json()) as TaxRule[]);
      if (wTaxesRes.ok) setWithholding((await wTaxesRes.json()) as WithholdingTax[]);
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

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Tax Engine</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Configure complex Tax Rules, GST components, and TDS logic.</p>
        </div>
        <Button onClick={fetchData}>
          <Settings style={{ marginRight: 'var(--space-2)' }} />
          Refresh Data
        </Button>
      </div>

      {showRuleForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Create Tax Rule</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Rule Name</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required placeholder="Standard GST" value={ruleData.name} onChange={e => setRuleData({ ...ruleData, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Tax Rate (%)</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="18" value={ruleData.rate} onChange={e => setRuleData({ ...ruleData, rate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Type</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={ruleData.type} onChange={e => setRuleData({ ...ruleData, type: e.target.value })}>
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="CUSTOMS">CUSTOMS</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowRuleForm(false)}>Cancel</Button>
                <Button type="submit">Save Rule</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showWithholdingForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Add Withholding Tax (TDS)</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateWithholding} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Tax Name</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required placeholder="TDS on Contracts (Section 194C)" value={withholdingData.name} onChange={e => setWithholdingData({ ...withholdingData, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Rate (%)</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="2" value={withholdingData.rate} onChange={e => setWithholdingData({ ...withholdingData, rate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Threshold Limit ($)</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="1000" value={withholdingData.threshold} onChange={e => setWithholdingData({ ...withholdingData, threshold: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowWithholdingForm(false)}>Cancel</Button>
                <Button type="submit">Save Withholding Tax</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-2">
        {/* Tax Rules */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="bg-purple-100 dark:bg-purple-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <Percent className="text-purple-700 dark:text-purple-400" style={{ height: '24px', width: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Sales & Purchase Tax Rules</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>e.g. Inter-state GST, Standard VAT</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1', overflow: 'auto' }}>
            {rules.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p>No tax rules configured.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Rule Name</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Components</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{rule.name}</td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{rule.components?.length || 0} rates</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
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
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="outline" style={{ width: '100%' }} onClick={() => setShowRuleForm(true)}>Create Tax Rule <Plus style={{ marginLeft: 'var(--space-2)' }} /></Button>
          </div>
        </Card>

        {/* Withholding Taxes / TDS */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="bg-red-100 dark:bg-red-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                <ShieldAlert className="text-red-700 dark:text-red-400" style={{ height: '24px', width: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Withholding Taxes (TDS)</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Automated deductions on AP invoices</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1', overflow: 'auto' }}>
            {withholding.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p>No withholding taxes configured.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>Tax Name</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {withholding.map((tax) => (
                    <tr key={tax.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{tax.name}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>{Number(tax.rate).toFixed(2)}%</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--color-text-secondary)' }}>${Number(tax.threshold || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="outline" style={{ width: '100%' }} onClick={() => setShowWithholdingForm(true)}>Add Withholding Tax <Plus style={{ marginLeft: 'var(--space-2)' }} /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
