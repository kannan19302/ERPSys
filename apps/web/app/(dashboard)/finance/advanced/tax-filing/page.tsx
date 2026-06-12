/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, Send, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

export default function TaxFilingPage() {
  const [filings, setFilings] = useState<any[]>([]);
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
      if (res.ok) setFilings(await res.json());
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Filings & Compliance</h1>
          <p className="text-muted-foreground mt-1">Generate regulatory compliance payloads and file returns.</p>
        </div>
        <Button onClick={() => setShowFilingForm(!showFilingForm)}>
          <Send className="mr-2 h-4 w-4" />
          Prepare New Return
        </Button>
      </div>

      {showFilingForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Prepare Statutory Return</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateFiling} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={filingData.filingType} onChange={e => setFilingData({ ...filingData, filingType: e.target.value })}>
                    <option value="">Select Return Type</option>
                    <option value="GST-3B">GST-3B Returns</option>
                    <option value="GSTR-1">GSTR-1 Sales</option>
                    <option value="VAT-Return">VAT Quarterly Return</option>
                    <option value="TDS-26Q">TDS Section 26Q</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Period Start</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="date" required value={filingData.periodStart} onChange={e => setFilingData({ ...filingData, periodStart: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Period End</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="date" required value={filingData.periodEnd} onChange={e => setFilingData({ ...filingData, periodEnd: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowFilingForm(false)}>Cancel</Button>
                <Button type="submit">Generate Return Draft</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <Card className="flex flex-col border-primary/20">
        <div className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <UploadCloud className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Statutory Filing Register</h3>
              <p className="text-sm text-muted-foreground">Historical and drafted compliance returns</p>
            </div>
          </div>
        </div>
        <div className="p-0 overflow-auto">
          {filings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No statutory filings found for this period.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-4 font-medium">Return Type</th>
                  <th className="p-4 font-medium">Period</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filings.map((filing) => (
                  <tr key={filing.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-bold">{filing.filingType}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(filing.periodStart).toLocaleDateString()} - {new Date(filing.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {filing.status === 'FILED' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md text-xs font-medium">
                          <CheckCircle className="h-3 w-3" /> FILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md text-xs font-medium">
                          {filing.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
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
