'use client';
import styles from './page.module.css';
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
    { key: 'signerName', header: 'Signer', render: (s) => <div><div className="font-semibold">{s.signerName}</div><div className="ui-text-xs-muted">{s.signerEmail}</div></div> },
    { key: 'status', header: 'Status', render: (s) => <Badge variant={s.status === 'SIGNED' ? 'success' : s.status === 'EXPIRED' ? 'danger' : 'default'}>{s.status}</Badge> },
    { key: 'signedAt', header: 'Signed At', render: (s) => (s.signedAt ? new Date(s.signedAt).toLocaleString() : '—') },
    { key: 'certificate', header: 'Certificate', render: (s) => (s.certificate ? <Badge variant="info">{s.certificate.certificateNumber}</Badge> : '—') },
    { key: 'actions', header: '', align: 'right', render: (s) => (
      s.status === 'SIGNED' ? (
        <Button variant="secondary" onClick={() => viewCertificate(s)} className="ui-flex ui-items-center ui-gap-1">
          <ShieldCheck size={14} /> View Certificate
        </Button>
      ) : null
    ) },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Quote E-Signatures"
        description="Request electronic signatures on quotations and generate a legally-defensible, tamper-evident audit certificate once signed."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Quotations', href: '/crm/quotations' }, { label: 'E-Signatures' }]}
      />

      <Card>
        <div className={styles.style0}>
          <input placeholder="Quotation ID" value={quotationId} onChange={(e) => setQuotationId(e.target.value)} className={`ui-input ${styles.s1}`} style={{ ...inputStyle }} />
          <Button variant="primary" onClick={search} className="ui-hstack-2">
            <Search size={16} /> Look Up
          </Button>
        </div>

        {quotationId && (
          <ProtectedComponent permission="crm.opportunity.update">
            <form onSubmit={handleRequest} className={styles.style1}>
              <div>
                <label style={labelStyle}>Signer Name</label>
                <input required value={signerName} onChange={(e) => setSignerName(e.target.value)} className="ui-input" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Signer Email</label>
                <input required type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} className="ui-input" style={inputStyle} />
              </div>
              <Button type="submit" variant="primary" disabled={requesting} className="ui-hstack-2">
                <FileSignature size={16} /> {requesting ? 'Sending…' : 'Request Signature'}
              </Button>
            </form>
          </ProtectedComponent>
        )}

        {loading ? (
          <div className="ui-center-pad"><Spinner size="lg" /></div>
        ) : searched && signatures.length === 0 ? (
          <div className="ui-empty-state">
            <FileText size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Signature Requests Yet</div>
            <div className="text-sm">Request a signature above to start the e-signature flow.</div>
          </div>
        ) : signatures.length > 0 ? (
          <DataTable<QuotationSignature> columns={columns} data={signatures} rowKey={(s) => s.id} />
        ) : null}
      </Card>

      {certificate && (
        <Card>
          <div className={styles.style2}>
            <ShieldCheck size={18} className="ui-text-success" />
            <h3 className="ui-heading-base">Signature Certificate {certificate.certificateNumber}</h3>
          </div>
          <div className="p-6">
            <pre className={styles.style3}>
              {certDoc || 'Loading certificate document…'}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
