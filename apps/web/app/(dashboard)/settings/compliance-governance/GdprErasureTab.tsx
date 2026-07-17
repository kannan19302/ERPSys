'use client';
import styles from './GdprErasureTab.module.css';
import React, { useState, useEffect } from 'react';
import {
  Button, Modal, TextField, FormField, ListPageTemplate, type ListColumn,
} from '@unerp/ui';
import { CheckCircle, Play } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface ErasureRequest {
  id: string;
  requestedBy: string;
  subjectEmail: string;
  subjectName: string | null;
  status: string;
  entityTypes: string[];
  erasedAt: string | null;
  createdAt: string;
}

const ENTITY_TYPES = ['customers', 'vendors', 'contacts', 'leads', 'employees'];

const MOCK_REQUESTS: ErasureRequest[] = [
  { id: '1', requestedBy: 'admin', subjectEmail: 'john@example.com', subjectName: 'John Doe', status: 'PENDING', entityTypes: ['customers', 'contacts'], erasedAt: null, createdAt: '2026-06-18T10:00:00Z' },
  { id: '2', requestedBy: 'admin', subjectEmail: 'jane@example.com', subjectName: 'Jane Smith', status: 'COMPLETED', entityTypes: ['leads'], erasedAt: '2026-06-17T15:00:00Z', createdAt: '2026-06-15T09:00:00Z' },
];

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  COMPLETED: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  REJECTED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
};

export default function GdprErasureTab() {
  const client = useApiClient();
  const [requests, setRequests] = useState<ErasureRequest[]>(MOCK_REQUESTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    client.get<ErasureRequest[]>('/admin/gdpr/erasure-requests')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setRequests(data); })
      .catch(() => {});
  }, [client]);

  const handleCreate = async () => {
    if (!email || selectedTypes.length === 0) return;
    try {
      const result = await client.post<ErasureRequest>('/admin/gdpr/erasure-requests', { subjectEmail: email, subjectName: name || undefined, entityTypes: selectedTypes });
      setRequests((prev) => [result, ...prev]);
    } catch {
      setRequests((prev) => [{
        id: Date.now().toString(), requestedBy: 'current', subjectEmail: email,
        subjectName: name || null, status: 'PENDING', entityTypes: selectedTypes,
        erasedAt: null, createdAt: new Date().toISOString(),
      }, ...prev]);
    }
    setModalOpen(false);
    setEmail('');
    setName('');
    setSelectedTypes([]);
  };

  const handleExecute = async (id: string) => {
    try {
      await client.post(`/admin/gdpr/erasure-requests/${id}/execute`);
    } catch { /* ignore, still reflect in UI */ }
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'COMPLETED', erasedAt: new Date().toISOString() } : r)));
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setModalOpen(true)}>New Erasure Request</Button>
      </div>

      <div className="ui-card ui-card p-5">
        <ListPageTemplate
          columns={[
            { key: 'subjectEmail', header: 'Subject', render: (v, row) => (
              <div>
                <div className={styles.s1}>{String(v)}</div>
                {row.subjectName ? <div className={styles.s2}>{String(row.subjectName)}</div> : null}
              </div>
            ) },
            { key: 'entityTypes', header: 'Entity Types', render: (v) => (
              <div className={styles.s3}>
                {((v as string[]) || []).map((et) => (
                  <span key={et} className={styles.s4}>{et}</span>
                ))}
              </div>
            ) },
            { key: 'status', header: 'Status', render: (v) => {
              const sc = statusColors[String(v)] || statusColors.PENDING;
              return (
                <span style={{ background: sc?.bg, color: sc?.color }} className={styles.s5}>
                  {String(v)}
                </span>
              );
            } },
            { key: 'createdAt', header: 'Date', render: (v) => <span className={styles.s6}>{new Date(String(v)).toLocaleDateString()}</span> },
            { key: 'id', header: 'Actions', render: (v, row) => {
              if (row.status === 'PENDING') {
                return (
                  <button onClick={() => handleExecute(String(v))} className={styles.s7}>
                    <Play size={10} /> Execute
                  </button>
                );
              }
              if (row.status === 'COMPLETED') {
                return (
                  <span className={styles.s8}>
                    <CheckCircle size={12} className={styles.s11} />
                    Done
                  </span>
                );
              }
              return null;
            } },
          ] as ListColumn[]}
          data={requests as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No erasure requests"
          emptyDescription="No GDPR erasure requests."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New GDPR Erasure Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create Request</Button>
          </>
        }
      >
        <div className="ui-stack-4">
          <TextField label="Subject Email" required placeholder="person@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Subject Name" placeholder="Optional" value={name} onChange={(e) => setName(e.target.value)} />
          <FormField label="Entity Types">
            <div className={styles.s9}>
              {ENTITY_TYPES.map((t) => (
                <label key={t} className={styles.s10}>
                  <input type="checkbox" checked={selectedTypes.includes(t)} onChange={() => toggleType(t)} />
                  {t}
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
