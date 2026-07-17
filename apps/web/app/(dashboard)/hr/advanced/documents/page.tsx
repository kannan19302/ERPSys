'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { FileText, Plus, Calendar, Download } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface EmployeeDocument {
  id: string;
  name: string;
  docType: string;
  fileUrl: string | null;
  fileName?: string | null;
  expiryDate: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

export default function DocumentsPage() {
  const client = useApiClient();
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', docType: 'CONTRACT', fileUrl: '', fileName: '', expiryDate: '' });

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          fileUrl: reader.result as string,
          fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadFile = (dataUrl: string, fileName: string) => {
    try {
      const parts = dataUrl.split(',');
      if (parts.length < 2) {
        window.open(dataUrl, '_blank');
        return;
      }
      const part0 = parts[0];
      const part1 = parts[1];
      if (!part0 || !part1) return;
      
      const mimeMatch = part0.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(part1);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(dataUrl, '_blank');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [client]);

  useEffect(() => {
    if (selectedEmpId) {
      fetchDocuments(selectedEmpId);
    } else {
      setDocs([]);
    }
  }, [client, selectedEmpId]);

  const fetchEmployees = async () => {
    try {
      const data = await client.get<Employee[] | { data?: Employee[] }>('/hr/employees');
      setEmployees(Array.isArray(data) ? data : (data.data || []));
    } catch {}
  };

  const fetchDocuments = async (empId: string) => {
    setLoading(true);
    try {
      const data = await client.get<EmployeeDocument[] | { data?: EmployeeDocument[] }>(`/advanced-hr/documents/${empId}`);
      setDocs(Array.isArray(data) ? data : (data.data || []));
    } catch {} finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    setSubmitting(true);
    try {
      await client.post(`/advanced-hr/documents/${selectedEmpId}`, form);
      setMsg('Document uploaded/registered successfully.');
      setShowForm(false);
      setForm({ name: '', docType: 'CONTRACT', fileUrl: '', fileName: '', expiryDate: '' });
      fetchDocuments(selectedEmpId);
    } catch {
      setMsg('Error saving document.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Documents Manager"
        description="Verify and track employee contract signatures, background clearance certificates, and tax compliance forms."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Documents' }]}
        actions={
          selectedEmpId && (
            <Button variant="primary" onClick={() => setShowForm(!showForm)}>
              <Plus size={14} /> Add Document
            </Button>
          )
        }
      />

      {msg && (
        <div className={styles.message}>
          {msg}
        </div>
      )}

      <Card padding="md">
        <label className={styles.selectLabel}>
          Select Employee to Manage Documents
        </label>
        <select
          className="ui-input"
          value={selectedEmpId}
          onChange={e => setSelectedEmpId(e.target.value)}
        >
          <option value="">-- Select Employee --</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </select>
      </Card>

      {showForm && selectedEmpId && (
        <Card padding="md">
          <h4 className={styles.formTitle}>Register Employee Document</h4>
          <form onSubmit={uploadDocument} className="ui-stack-3">
            <input
              className="ui-input"
              placeholder="Document Title (e.g. NDA Signature, IRS W-4)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="ui-grid-2 ui-gap-3">
              <select
                className="ui-input"
                value={form.docType}
                onChange={e => setForm({ ...form, docType: e.target.value })}
              >
                <option value="CONTRACT">Employment Contract</option>
                <option value="ID_PROOF">Government ID</option>
                <option value="TAX_FORM">Tax Document</option>
                <option value="CLEARANCE">Background Check</option>
                <option value="CERTIFICATE">Academic / Skill Cert</option>
              </select>
              <input
                type="date"
                className="ui-input"
                placeholder="Expiration Date (if applicable)"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
            <div className="ui-stack-1">
              <label className={styles.uploadLabel}>
                Upload Local Document (Encrypted & Saved to Database)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                className="ui-input"
                onChange={handleLocalFileChange}
              />
            </div>
            <input
              type="text"
              className="ui-input"
              placeholder="Or enter Document URL / Cloud Link (optional)"
              value={form.fileUrl.startsWith('data:') ? '' : form.fileUrl}
              onChange={e => setForm({ ...form, fileUrl: e.target.value, fileName: '' })}
            />
            <div className="ui-flex-end ui-gap-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Register Doc</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : selectedEmpId ? (
        (() => {
          const docColumns: ListColumn[] = [
            { key: 'name', header: 'Document Name' },
            { key: 'docType', header: 'Category' },
            { key: 'expiryDate', header: 'Expires', render: (v) => v ? (
              <div className={styles.expiryDate}>
                <Calendar size={12} className="text-muted-foreground" />
                <span>{new Date(String(v)).toLocaleDateString()}</span>
              </div>
            ) : 'Never' },
            { key: 'fileUrl', header: 'Action', render: (v, row) => {
              const doc = row as unknown as EmployeeDocument;
              return v ? (
                <Button variant="outline" size="sm" onClick={() => downloadFile(doc.fileUrl!, doc.fileName || doc.name)}>
                  <Download size={12} /> View / Download
                </Button>
              ) : (
                <span className="ui-text-caption">No file attached</span>
              );
            }},
          ];
          return (
            <ListPageTemplate
              title=""
              columns={docColumns}
              data={docs as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No documents registered for this employee."
            />
          );
        })()
      ) : (
        <Card>
          <div className={styles.emptyState}>
            <FileText size={32} className={styles.emptyIcon} />
            <p className="m-0">Select an employee above to access their compliance cabinet folder.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
