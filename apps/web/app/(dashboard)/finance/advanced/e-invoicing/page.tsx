/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, FileCheck2, X, Copy, ShieldCheck } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  totalAmount: number | string;
  customer?: { name: string } | null;
}

interface EInvoice {
  id: string;
  invoiceId: string;
  format: string;
  status: string;
  irn: string | null;
  qrPayload: string | null;
  documentXml: string;
  createdAt: string;
}

const ADV = 'http://localhost:3001/api/v1/advanced-finance';
const FIN = 'http://localhost:3001/api/v1/finance';
const FORMATS = ['UBL', 'PEPPOL', 'GST_IRN'];

export default function EInvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [docs, setDocs] = useState<EInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [format, setFormat] = useState('UBL');
  const [viewDoc, setViewDoc] = useState<EInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = () => (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('admin_token') || '') : '');
  const auth = () => ({ Authorization: `Bearer ${token()}` });

  const fetchData = async () => {
    try {
      const [invRes, docRes] = await Promise.all([
        fetch(`${FIN}/invoices?limit=100`, { headers: auth() }),
        fetch(`${ADV}/e-invoices`, { headers: auth() }),
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(Array.isArray(data) ? data : (data?.data || []));
      }
      if (docRes.ok) setDocs((await docRes.json()) as EInvoice[]);
    } catch (e) {
      console.error(e);
      setError('Could not reach the finance service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generate = async (invoiceId: string) => {
    setGeneratingId(invoiceId);
    setError(null);
    try {
      const res = await fetch(`${ADV}/e-invoices/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ invoiceId, format }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.message || 'E-invoice generation failed (draft invoices cannot be issued).');
        return;
      }
      const doc = (await res.json()) as EInvoice;
      setViewDoc(doc);
      await fetchData();
    } catch (e) {
      console.error(e);
      setError('Could not reach the finance service.');
    } finally {
      setGeneratingId(null);
    }
  };

  const docFor = (invoiceId: string) => docs.filter((d) => d.invoiceId === invoiceId);
  const money = (v: number | string) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>E-Invoicing</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Generate standards-compliant legal e-invoices (UBL 2.1 / PEPPOL BIS / India GST IRN).</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <div className="space-y-1">
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="h-10 w-44 border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              {FORMATS.map((f) => <option key={f} value={f}>{f === 'GST_IRN' ? 'India GST (IRN)' : f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-4)', paddingBlock: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>{error}</div>
      )}

      <Card>
        <div style={{ padding: 'var(--space-6)' }}><h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Invoices</h3></div>
        <div style={{ padding: 'var(--space-6)', overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', paddingBlock: 'var(--space-2)' }}>Invoice #</th>
                <th style={{ textAlign: 'left' }}>Customer</th>
                <th style={{ textAlign: 'left' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'left' }}>E-Invoices</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ paddingBlock: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{inv.invoiceNumber}</td>
                  <td>{inv.customer?.name || '—'}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>{inv.status}</span></td>
                  <td style={{ textAlign: 'right' }}>{inv.currency} {money(inv.totalAmount)}</td>
                  <td className="pl-4">
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                      {docFor(inv.id).map((d) => (
                        <button key={d.id} onClick={() => setViewDoc(d)}
                          className="py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200" style={{ fontSize: 'var(--text-xs)', paddingInline: 'var(--space-2)', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          <FileCheck2 className="h-3 w-3" /> {d.format}
                        </button>
                      ))}
                      {docFor(inv.id).length === 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>none</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button size="sm" variant="outline" disabled={generatingId === inv.id || inv.status === 'DRAFT'} onClick={() => generate(inv.id)}>
                      {generatingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="mr-1 h-4 w-4" /> Generate</>}
                    </Button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Document viewer */}
      {viewDoc && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }} onClick={() => setViewDoc(null)}>
          <div style={{ borderRadius: 'var(--radius-xl)', width: '100%', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <ShieldCheck style={{ height: '20px', width: '20px', color: 'var(--color-success)' }} />
                <h3 style={{ fontWeight: 'var(--weight-semibold)' }}>{viewDoc.format} E-Invoice</h3>
                <span style={{ fontSize: 'var(--text-xs)', paddingInline: 'var(--space-2)', borderRadius: '9999px' }}>{viewDoc.status}</span>
              </div>
              <button onClick={() => setViewDoc(null)} className="hover:text-foreground" style={{ color: 'var(--color-text-secondary)' }}><X style={{ height: '20px', width: '20px' }} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {viewDoc.irn && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>IRN (Invoice Reference Number)</div>
                  <div style={{ fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>{viewDoc.irn}</div>
                </div>
              )}
              {viewDoc.qrPayload && (
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Signed QR Payload</div>
                  <div style={{ fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>{viewDoc.qrPayload}</div>
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Structured Document</div>
                  <button onClick={() => navigator.clipboard?.writeText(viewDoc.documentXml)} className="hover:underline" style={{ fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-primary)' }}>
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
                <pre style={{ fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', overflowX: 'auto' }}>{viewDoc.documentXml}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
