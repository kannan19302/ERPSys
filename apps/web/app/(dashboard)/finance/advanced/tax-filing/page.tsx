/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, Send, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface TaxFiling {
  id: string;
  filingType: string;
  periodStart: string;
  periodEnd: string;
  status: string;
}

export default function TaxFilingPage() {
  const [filings, setFilings] = useState<TaxFiling[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showFilingForm, setShowFilingForm] = useState(false);
  const [filingData, setFilingData] = useState({ filingType: '', periodStart: '', periodEnd: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/tax-filings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFilings((await res.json()) as TaxFiling[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/tax-filings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          filingType: filingData.filingType,
          periodStart: filingData.periodStart,
          periodEnd: filingData.periodEnd,
          status: 'DRAFT'
        })
      });
      if (res.ok) {
        setShowFilingForm(false);
        setFilingData({ filingType: '', periodStart: '', periodEnd: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to prepare return: ' + (err.message || 'Error'));
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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Tax Filings & Compliance</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Generate regulatory compliance payloads and file returns.</p>
        </div>
        <Button onClick={() => setShowFilingForm(!showFilingForm)}>
          <Send style={{ marginRight: 'var(--space-2)' }} />
          Prepare New Return
        </Button>
      </div>

      {showFilingForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Prepare Statutory Return</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateFiling} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Return Type</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={filingData.filingType} onChange={e => setFilingData({ ...filingData, filingType: e.target.value })}>
                    <option value="">Select Return Type</option>
                    <option value="GST-3B">GST-3B Returns</option>
                    <option value="GSTR-1">GSTR-1 Sales</option>
                    <option value="VAT-Return">VAT Quarterly Return</option>
                    <option value="TDS-26Q">TDS Section 26Q</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Period Start</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={filingData.periodStart} onChange={e => setFilingData({ ...filingData, periodStart: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Period End</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={filingData.periodEnd} onChange={e => setFilingData({ ...filingData, periodEnd: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowFilingForm(false)}>Cancel</Button>
                <Button type="submit">Generate Return Draft</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="bg-indigo-100 dark:bg-indigo-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
              <UploadCloud className="text-indigo-700 dark:text-indigo-400" style={{ height: '24px', width: '24px' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Statutory Filing Register</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Historical and drafted compliance returns</p>
            </div>
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          {filings.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <FileText style={{ marginBottom: 'var(--space-4)' }} />
              <p>No statutory filings found for this period.</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Return Type</th>
                  <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Period</th>
                  <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Status</th>
                  <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filings.map((filing) => (
                  <tr key={filing.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-bold)' }}>{filing.filingType}</td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {new Date(filing.periodStart).toLocaleDateString()} - {new Date(filing.periodEnd).toLocaleDateString()}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {filing.status === 'FILED' ? (
                        <span className="dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-success)', paddingInline: 'var(--space-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>
                          <CheckCircle className="h-3 w-3" /> FILED
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', paddingInline: 'var(--space-2)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>
                          {filing.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <Button variant="ghost" size="sm" onClick={() => alert(JSON.stringify(filing, null, 2))}>View Payload</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
