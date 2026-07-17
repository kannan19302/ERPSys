'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import {
  Plus, X, FileText, Upload, Trash2, AlertCircle,
  Award, File, FileImage, FileCode, Filter
} from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';
import styles from './page.module.css';

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

  const toast = useToast();
  const client = useApiClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await client.get<any>('/crm/documents');
      setDocuments(Array.isArray(d) ? d : (d?.data || []));
    } catch (err) {
      setError('Could not load documents. Please try again.');
      toast.error('Could not load documents', err instanceof Error ? err.message : undefined);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { name: docName, type: docType, entityType, entityId, fileUrl, fileSize: Number(fileSize), mimeType: mimeType || undefined };

    try {
      await client.post('/crm/documents', payload);
      setModalSuccess(true);
      toast.success('Document linked', `"${docName}" has been added.`);
      setTimeout(() => { setIsModalOpen(false); resetForm(); loadData(); }, 1200);
    } catch (err) {
      toast.error('Could not link document', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = documents;
    setDocuments(prev.filter(d => d.id !== id)); // optimistic
    try {
      await client.delete(`/crm/documents/${id}`);
      toast.success('Document removed');
    } catch (err) {
      setDocuments(prev); // revert
      toast.error('Could not delete document', err instanceof Error ? err.message : 'Please try again.');
    }
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

  const [docSortBy, setDocSortBy] = useState<string>('createdAt');
  const [docSortOrder, setDocSortOrder] = useState<SortOrder>('desc');
  const sortedDocs = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (docSortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (docSortBy === 'fileSize') cmp = a.fileSize - b.fileSize;
    else if (docSortBy === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return docSortOrder === 'desc' ? -cmp : cmp;
  });

  const docColumns: Column<CrmDocument>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (d) => <span className="font-semibold">{d.name}</span> },
    { key: 'type', header: 'Type', render: (d) => getTypeBadge(d.type) },
    {
      key: 'entityType', header: 'Entity',
      render: (d) => (
        <div>
          <Badge variant="default">{d.entityType}</Badge>
          <div className={styles.entityId}>{d.entityId}</div>
        </div>
      ),
    },
    { key: 'fileSize', header: 'Size', align: 'right', sortable: true, render: (d) => formatSize(d.fileSize) },
    { key: 'uploadedBy', header: 'Uploaded By', render: (d) => d.uploadedBy?.name || 'Unknown' },
    { key: 'createdAt', header: 'Date', sortable: true, render: (d) => new Date(d.createdAt).toLocaleDateString() },
    {
      key: 'actions', header: 'Actions', align: 'center', width: '80px',
      render: (d) => (
        <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} className={styles.deleteButton} title="Delete">
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <RouteGuard permission="crm.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Documents"
          description="Manage proposals, contracts, and attachments linked to your CRM records."
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Documents' }]}
          actions={
            <Button onClick={() => setIsModalOpen(true)} variant="primary" className="ui-hstack-2">
              <Upload size={16} />
              <span>Upload Document</span>
            </Button>
          }
        />

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Entity Filter Tabs */}
        <div className={styles.entityTabs}>
          {entityTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setEntityFilter(tab)}
              className={`${styles.entityTab} ${entityFilter === tab ? styles.entityTabActive : ''}`}
            >
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab !== 'ALL' && ` (${documents.filter(d => d.entityType === tab).length})`}
            </button>
          ))}
        </div>

        {/* Documents Table */}
        <Card>
          {loading ? (
            <div className="ui-center-pad"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="ui-empty-state">
              <FileText size={48} className="ui-hr-faded" />
              <div className="font-semibold">No Documents Found</div>
              <div className="text-sm">Upload a document to get started.</div>
            </div>
          ) : (
            <DataTable<CrmDocument>
              columns={docColumns}
              data={sortedDocs}
              rowKey={(d) => d.id}
              sortBy={docSortBy}
              sortOrder={docSortOrder}
              onSortChange={(key, order) => { setDocSortBy(key); setDocSortOrder(order); }}
            />
          )}
        </Card>

        {/* Upload Modal */}
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className="ui-heading-base">Upload Document</h3>
                <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
              </div>
              {modalSuccess ? (
                <div className={styles.successMessage}>
                  <Award size={48} className={styles.successIcon} />
                  <div className="ui-heading-base">Document Uploaded Successfully</div>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="p-6 ui-stack-4">
                  <div>
                    <label className={styles.fieldLabel}>Document Name</label>
                    <input type="text" required placeholder="e.g. Acme Corp Proposal.pdf" value={docName} onChange={e => setDocName(e.target.value)} className={`ui-input ${styles.fieldInput}`} />
                  </div>
                  <div className="ui-grid-2">
                    <div>
                      <label className={styles.fieldLabel}>Document Type</label>
                      <select value={docType} onChange={e => setDocType(e.target.value as typeof docType)} className={`ui-input ${styles.fieldInput}`}>
                        <option value="PROPOSAL">Proposal</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="ATTACHMENT">Attachment</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={styles.fieldLabel}>Entity Type</label>
                      <select value={entityType} onChange={e => setEntityType(e.target.value as typeof entityType)} className={`ui-input ${styles.fieldInput}`}>
                        <option value="LEAD">Lead</option>
                        <option value="OPPORTUNITY">Opportunity</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="CONTACT">Contact</option>
                        <option value="QUOTATION">Quotation</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>Entity ID</label>
                    <input type="text" required placeholder="Related record ID" value={entityId} onChange={e => setEntityId(e.target.value)} className={`ui-input ${styles.fieldInput}`} />
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>File URL</label>
                    <input type="text" required placeholder="https://..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} className={`ui-input ${styles.fieldInput}`} />
                  </div>
                  <div className="ui-grid-2">
                    <div>
                      <label className={styles.fieldLabel}>File Size (bytes)</label>
                      <input type="number" required min={0} value={fileSize} onChange={e => setFileSize(Number(e.target.value))} className={`ui-input ${styles.fieldInput}`} />
                    </div>
                    <div>
                      <label className={styles.fieldLabel}>MIME Type</label>
                      <input type="text" placeholder="application/pdf" value={mimeType} onChange={e => setMimeType(e.target.value)} className={`ui-input ${styles.fieldInput}`} />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Upload Document'}</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
