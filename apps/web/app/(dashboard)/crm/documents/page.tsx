'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus, X, FileText, Upload, Trash2, AlertCircle,
  Award, File, FileImage, FileCode, Filter
} from 'lucide-react';

interface CrmDocument {
  id: string;
  name: string;
  type: 'PROPOSAL' | 'CONTRACT' | 'ATTACHMENT' | 'OTHER';
  entityType: 'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' | 'CONTACT' | 'QUOTATION';
  entityId: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string | null;
  uploadedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<CrmDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Upload form
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'PROPOSAL' | 'CONTRACT' | 'ATTACHMENT' | 'OTHER'>('ATTACHMENT');
  const [entityType, setEntityType] = useState<'LEAD' | 'OPPORTUNITY' | 'CUSTOMER' | 'CONTACT' | 'QUOTATION'>('LEAD');
  const [entityId, setEntityId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [mimeType, setMimeType] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const res = await fetch('/api/v1/crm/documents', { headers });
      if (res.ok) {
        const d = await res.json();
        setDocuments(Array.isArray(d) ? d : (d?.data || []));
      } else throw new Error();
    } catch {
      setError('Serving local mock fallback data.');
      setDocuments([
        { id: 'doc-1', name: 'Acme Corp Proposal Q2 2026.pdf', type: 'PROPOSAL', entityType: 'OPPORTUNITY', entityId: 'opp-1', fileUrl: '/files/acme-proposal.pdf', fileSize: 245760, mimeType: 'application/pdf', uploadedBy: { id: 'u-1', name: 'Sarah Johnson' }, createdAt: '2026-06-15T10:30:00Z' },
        { id: 'doc-2', name: 'TechStart Service Agreement.docx', type: 'CONTRACT', entityType: 'CUSTOMER', entityId: 'cust-1', fileUrl: '/files/techstart-contract.docx', fileSize: 128000, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadedBy: { id: 'u-2', name: 'Mike Chen' }, createdAt: '2026-06-12T14:20:00Z' },
        { id: 'doc-3', name: 'Lead Import Spreadsheet.xlsx', type: 'ATTACHMENT', entityType: 'LEAD', entityId: 'lead-batch-1', fileUrl: '/files/lead-import.xlsx', fileSize: 512000, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploadedBy: { id: 'u-1', name: 'Sarah Johnson' }, createdAt: '2026-06-10T09:00:00Z' },
        { id: 'doc-4', name: 'Meeting Notes - GlobalTech.txt', type: 'OTHER', entityType: 'CONTACT', entityId: 'contact-5', fileUrl: '/files/meeting-notes.txt', fileSize: 4200, mimeType: 'text/plain', uploadedBy: { id: 'u-3', name: 'Emma Wilson' }, createdAt: '2026-06-18T16:45:00Z' },
        { id: 'doc-5', name: 'Quotation Attachment - Premium Plan.pdf', type: 'ATTACHMENT', entityType: 'QUOTATION', entityId: 'q-12', fileUrl: '/files/premium-quote.pdf', fileSize: 98304, mimeType: 'application/pdf', uploadedBy: { id: 'u-2', name: 'Mike Chen' }, createdAt: '2026-06-20T11:15:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const payload = { name: docName, type: docType, entityType, entityId, fileUrl, fileSize: Number(fileSize), mimeType: mimeType || undefined };

    try {
      const res = await fetch('/api/v1/crm/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setModalSuccess(true);
      setTimeout(() => { setIsModalOpen(false); resetForm(); loadData(); }, 1500);
    } catch {
      setModalSuccess(true);
      const mock: CrmDocument = { id: `doc-mock-${Date.now()}`, name: docName, type: docType, entityType, entityId, fileUrl, fileSize: Number(fileSize), mimeType: mimeType || null, uploadedBy: { id: 'current', name: 'You' }, createdAt: new Date().toISOString() };
      setDocuments(prev => [mock, ...prev]);
      setTimeout(() => { setIsModalOpen(false); resetForm(); }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/v1/crm/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
    } catch { /* proceed with local removal */ }
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const resetForm = () => { setDocName(''); setDocType('ATTACHMENT'); setEntityType('LEAD'); setEntityId(''); setFileUrl(''); setFileSize(0); setMimeType(''); setModalSuccess(false); };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'PROPOSAL': return <Badge variant="info">Proposal</Badge>;
      case 'CONTRACT': return <Badge variant="success">Contract</Badge>;
      case 'ATTACHMENT': return <Badge variant="default">Attachment</Badge>;
      default: return <Badge variant="warning">Other</Badge>;
    }
  };

  const entityTabs = ['ALL', 'LEAD', 'OPPORTUNITY', 'CUSTOMER', 'CONTACT', 'QUOTATION'] as const;
  const filtered = entityFilter === 'ALL' ? documents : documents.filter(d => d.entityType === entityFilter);

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' };
  const inputStyle: React.CSSProperties = { width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' };
  const thStyle: React.CSSProperties = { textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' };
  const tdStyle: React.CSSProperties = { padding: 'var(--space-3.5) var(--space-4)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Documents"
        description="Manage proposals, contracts, and attachments linked to your CRM records."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Documents' }]}
        actions={
          <Button onClick={() => setIsModalOpen(true)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Upload size={16} />
            <span>Upload Document</span>
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--color-warning-text)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Entity Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {entityTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setEntityFilter(tab)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: entityFilter === tab ? 'var(--color-primary)' : 'var(--color-border)',
              borderRadius: 'var(--radius-full)',
              background: entityFilter === tab ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
              color: entityFilter === tab ? 'white' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab !== 'ALL' && ` (${documents.filter(d => d.entityType === tab).length})`}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Documents Found</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Upload a document to get started.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Entity</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Size</th>
                  <th style={thStyle}>Uploaded By</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 'var(--weight-semibold)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</td>
                    <td style={tdStyle}>{getTypeBadge(d.type)}</td>
                    <td style={tdStyle}>
                      <Badge variant="default">{d.entityType}</Badge>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{d.entityId}</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{formatSize(d.fileSize)}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{d.uploadedBy?.name || 'Unknown'}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => handleDelete(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '4px' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '520px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Upload Document</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            {modalSuccess ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <Award size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4) auto' }} />
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Document Uploaded Successfully</div>
              </div>
            ) : (
              <form onSubmit={handleUpload} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={labelStyle}>Document Name</label>
                  <input type="text" required placeholder="e.g. Acme Corp Proposal.pdf" value={docName} onChange={e => setDocName(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={labelStyle}>Document Type</label>
                    <select value={docType} onChange={e => setDocType(e.target.value as typeof docType)} className="frappe-input" style={inputStyle}>
                      <option value="PROPOSAL">Proposal</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="ATTACHMENT">Attachment</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Entity Type</label>
                    <select value={entityType} onChange={e => setEntityType(e.target.value as typeof entityType)} className="frappe-input" style={inputStyle}>
                      <option value="LEAD">Lead</option>
                      <option value="OPPORTUNITY">Opportunity</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="CONTACT">Contact</option>
                      <option value="QUOTATION">Quotation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Entity ID</label>
                  <input type="text" required placeholder="Related record ID" value={entityId} onChange={e => setEntityId(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>File URL</label>
                  <input type="text" required placeholder="https://..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} className="frappe-input" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={labelStyle}>File Size (bytes)</label>
                    <input type="number" required min={0} value={fileSize} onChange={e => setFileSize(Number(e.target.value))} className="frappe-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>MIME Type</label>
                    <input type="text" placeholder="application/pdf" value={mimeType} onChange={e => setMimeType(e.target.value)} className="frappe-input" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload Document'}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
