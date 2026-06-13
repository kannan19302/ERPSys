'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { FileText, Plus, Calendar, Download } from 'lucide-react';

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
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', docType: 'CONTRACT', fileUrl: '', fileName: '', expiryDate: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

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
  }, []);

  useEffect(() => {
    if (selectedEmpId) {
      fetchDocuments(selectedEmpId);
    } else {
      setDocs([]);
    }
  }, [selectedEmpId]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/v1/hr/employees', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEmployees(await res.json());
    } catch {}
  };

  const fetchDocuments = async (empId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/advanced-hr/documents/${empId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setDocs(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/advanced-hr/documents/${selectedEmpId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Document uploaded/registered successfully.');
        setShowForm(false);
        setForm({ name: '', docType: 'CONTRACT', fileUrl: '', fileName: '', expiryDate: '' });
        fetchDocuments(selectedEmpId);
      }
    } catch {
      setMsg('Error saving document.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
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
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      <Card padding="md">
        <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
          Select Employee to Manage Documents
        </label>
        <select
          className="frappe-input"
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
          <h4 style={{ margin: '0 0 var(--space-3)' }}>Register Employee Document</h4>
          <form onSubmit={uploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <input
              className="frappe-input"
              placeholder="Document Title (e.g. NDA Signature, IRS W-4)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <select
                className="frappe-input"
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
                className="frappe-input"
                placeholder="Expiration Date (if applicable)"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>
                Upload Local Document (Encrypted & Saved to Database)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                className="frappe-input"
                onChange={handleLocalFileChange}
              />
            </div>
            <input
              type="text"
              className="frappe-input"
              placeholder="Or enter Document URL / Cloud Link (optional)"
              value={form.fileUrl.startsWith('data:') ? '' : form.fileUrl}
              onChange={e => setForm({ ...form, fileUrl: e.target.value, fileName: '' })}
            />
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>Register Doc</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : selectedEmpId ? (
        <Card padding="none">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Document Name</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Category</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Expires</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    <FileText size={24} style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0 }}>No documents registered for this employee.</p>
                  </td>
                </tr>
              ) : (
                docs.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{doc.name}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{doc.docType}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {doc.expiryDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} className="text-muted-foreground" />
                          <span>{new Date(doc.expiryDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      {doc.fileUrl ? (
                        <Button variant="outline" size="sm" onClick={() => downloadFile(doc.fileUrl!, doc.fileName || doc.name)}>
                          <Download size={12} /> View / Download
                        </Button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>No file attached</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
            <FileText size={32} style={{ marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Select an employee above to access their compliance cabinet folder.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
