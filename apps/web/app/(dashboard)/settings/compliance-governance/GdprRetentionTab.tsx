'use client';
import styles from './GdprRetentionTab.module.css';
import React, { useState, useEffect } from 'react';
import {
  Button, Modal, FormField, Select, ListPageTemplate, type ListColumn,
} from '@unerp/ui';
import { useApiClient } from '@unerp/framework';

interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
  lastRunAt: string | null;
}

const ENTITY_TYPES = ['customers', 'vendors', 'contacts', 'leads', 'employees'];

const MOCK_POLICIES: RetentionPolicy[] = [
  { id: '1', entityType: 'customers', retentionDays: 2555, action: 'archive', isActive: true, lastRunAt: null },
  { id: '2', entityType: 'leads', retentionDays: 365, action: 'delete', isActive: true, lastRunAt: '2026-06-01T00:00:00Z' },
  { id: '3', entityType: 'contacts', retentionDays: 1825, action: 'archive', isActive: false, lastRunAt: null },
];

export default function GdprRetentionTab() {
  const client = useApiClient();
  const [policies, setPolicies] = useState<RetentionPolicy[]>(MOCK_POLICIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState(ENTITY_TYPES[0] || '');
  const [editDays, setEditDays] = useState(365);
  const [editAction, setEditAction] = useState('archive');

  useEffect(() => {
    client.get<RetentionPolicy[]>('/admin/gdpr/retention-policies')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setPolicies(data); })
      .catch(() => {});
  }, [client]);

  const handleSave = async () => {
    if (!editEntity) return;
    try {
      const result = await client.post<RetentionPolicy>('/admin/gdpr/retention-policies', { entityType: editEntity, retentionDays: editDays, action: editAction, isActive: true });
      setPolicies((prev) => {
        const idx = prev.findIndex((p) => p.entityType === editEntity);
        if (idx >= 0) { const next = [...prev]; next[idx] = result; return next; }
        return [...prev, result];
      });
    } catch {
      setPolicies((prev) => [...prev, { id: Date.now().toString(), entityType: editEntity, retentionDays: editDays, action: editAction, isActive: true, lastRunAt: null }]);
    }
    setModalOpen(false);
  };

  const toggleActive = async (policy: RetentionPolicy) => {
    const updated = { ...policy, isActive: !policy.isActive };
    try {
      await client.post('/admin/gdpr/retention-policies', { entityType: policy.entityType, retentionDays: policy.retentionDays, action: policy.action, isActive: !policy.isActive });
    } catch { /* still reflect optimistically */ }
    setPolicies((prev) => prev.map((p) => (p.id === policy.id ? updated : p)));
  };

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setModalOpen(true)}>Add Policy</Button>
      </div>

      <div className="ui-card ui-card p-5">
        <ListPageTemplate
          columns={[
            { key: 'entityType', header: 'Entity Type', render: (v) => <span className={styles.s1}>{String(v)}</span> },
            { key: 'retentionDays', header: 'Retention (days)' },
            { key: 'action', header: 'Action', render: (v) => (
              <span style={{ background: v === 'delete' ? 'var(--color-danger-light)' : 'var(--color-warning-light)', color: v === 'delete' ? 'var(--color-danger)' : 'var(--color-warning)' }} className={styles.s2}
              >
                {String(v)}
              </span>
            ) },
            { key: 'isActive', header: 'Active', render: (v, row) => (
              <button onClick={() => toggleActive(row as unknown as RetentionPolicy)} style={{ background: v ? 'var(--color-success)' : 'var(--color-bg-sunken)' }} className={styles.s3}>
                <span style={{ left: v ? 18 : 2 }} className={styles.s4} />
              </button>
            ) },
            { key: 'lastRunAt', header: 'Last Run', render: (v) => (v ? new Date(String(v)).toLocaleDateString() : 'Never') },
          ] as ListColumn[]}
          data={policies as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No retention policies"
          emptyDescription="No GDPR retention policies configured."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add GDPR Retention Policy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="ui-stack-4">
          <FormField label="Entity">
            <Select value={editEntity} onChange={(e) => setEditEntity(e.target.value)}>
              {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </Select>
          </FormField>
          <FormField label="Retention (days)">
            <input type="number" value={editDays} onChange={(e) => setEditDays(Number(e.target.value))} className={styles.s5} />
          </FormField>
          <FormField label="Action">
            <Select value={editAction} onChange={(e) => setEditAction(e.target.value)}>
              <option value="archive">Archive</option>
              <option value="delete">Delete</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
