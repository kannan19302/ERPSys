'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { Search, FileSignature, ShieldCheck, FileText } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../../src/lib/api';

interface QuotationSignature {
  id: string;
  quotationId: string;
  signerName: string;
  signerEmail: string;
  status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'DECLINED';
  signedAt: string | null;
  expiresAt: string;
  token: string;
  createdAt: string;
  certificate?: { certificateNumber: string } | null;
}

interface Certificate {
  certificateNumber: string;
  documentHash: string;
  signerName: string;
  signerEmail: string;
  ipAddress: string | null;
  issuedAt: string;
  auditTrail: { event: string; at: string; detail?: string }[];
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };

export default function QuoteSignaturesPage() {
  const [quotationId, setQuotationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [signatures, setSignatures] = useState<QuotationSignature[]>([]);
  const [searched, setSearched] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [certDoc, setCertDoc] = useState<string | null>(null);

  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [requesting, setRequesting] = useState(false);
  const toast = useToast();

  const search = async () => {
    if (!quotationId.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const list = await apiGet<QuotationSignature[]>(`/crm/quote-signature/quotations/${quotationId.trim()}`);
      setSignatures(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Could not load signatures', err instanceof ApiRequestError ? err.message : undefined);
      setSignatures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    try {
      await apiPost('/crm/quote-signature/request', { quotationId: quotationId.trim(), signerName, signerEmail, expiresInDays: 14 });
      toast.success('Signature request sent', `Awaiting signature from ${signerEmail}.`);
      setSignerName(''); setSignerEmail('');
      search();
    } catch (err) {
      toast.error('Could not request signature', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setRequesting(false);
    }
  };

  const viewCertificate = async (sig: QuotationSignature) => {
    setCertificate(null);
    setCertDoc(null);
    try {
      const cert = await apiGet<Certificate>(`/crm/quote-signature/certificates/${sig.id}`);
      setCertificate(cert);
      const doc = await apiGet<{ content: string }>(`/crm/quote-signature/certificates/${sig.id}/document`);
      setCertDoc(doc.content);
    } catch (err) {
      toast.error('Could not load certificate', err instanceof ApiRequestError ? err.message : 'Quotation may not be signed yet.');
    }
  };

  const columns: Column<QuotationSignature>[] = [
    { key: 'signerName', header: 'Signer', render: (s) => <div><div style={{ fontWeight: 'var(--weight-semibold)' }}>{s.signerName}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{s.signerEmail}</div></div> },
    { key: 'status', header: 'Status', render: (s) => <Badge variant={s.status === 'SIGNED' ? 'success' : s.status === 'EXPIRED' ? 'danger' : 'default'}>{s.status}</Badge> },
    { key: 'signedAt', header: 'Signed At', render: (s) => (s.signedAt ? new Date(s.signedAt).toLocaleString() : '—') },
    { key: 'certificate', header: 'Certificate', render: (s) => (s.certificate ? <Badge variant="info">{s.certificate.certificateNumber}</Badge> : '—') },
    { key: 'actions', header: '', align: 'right', render: (s) => (
      s.status === 'SIGNED' ? (
        <Button variant="secondary" onClick={() => viewCertificate(s)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <ShieldCheck size={14} /> View Certificate
        </Button>
      ) : null
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Quote E-Signatures"
        description="Request electronic signatures on quotations and generate a legally-defensible, tamper-evident audit certificate once signed."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Quotations', href: '/crm/quotations' }, { label: 'E-Signatures' }]}
      />

      <Card>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)' }}>
          <input placeholder="Quotation ID" value={quotationId} onChange={(e) => setQuotationId(e.target.value)} className="frappe-input" style={{ ...inputStyle, flex: 1 }} />
          <Button variant="primary" onClick={search} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Search size={16} /> Look Up
          </Button>
        </div>

        {quotationId && (
          <ProtectedComponent permission="crm.opportunity.update">
            <form onSubmit={handleRequest} style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Signer Name</label>
                <input required value={signerName} onChange={(e) => setSignerName(e.target.value)} className="frappe-input" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Signer Email</label>
                <input required type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} className="frappe-input" style={inputStyle} />
              </div>
              <Button type="submit" variant="primary" disabled={requesting} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileSignature size={16} /> {requesting ? 'Sending…' : 'Request Signature'}
              </Button>
            </form>
          </ProtectedComponent>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : searched && signatures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Signature Requests Yet</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Request a signature above to start the e-signature flow.</div>
          </div>
        ) : signatures.length > 0 ? (
          <DataTable<QuotationSignature> columns={columns} data={signatures} rowKey={(s) => s.id} />
        ) : null}
      </Card>

      {certificate && (
        <Card>
          <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Signature Certificate {certificate.certificateNumber}</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <pre style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
              {certDoc || 'Loading certificate document…'}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
