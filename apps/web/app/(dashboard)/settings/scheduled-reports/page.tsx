'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { FileText, Plus, Play, Edit3, Trash2, X, Clock, CheckCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  schedule: string;
  recipients: string[];
  filters: Record<string, unknown>;
  format: string;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const REPORT_TYPES = [
  { value: 'financial-summary', label: 'Financial Summary' },
  { value: 'sales-report', label: 'Sales Report' },
  { value: 'inventory-status', label: 'Inventory Status' },
  { value: 'hr-overview', label: 'HR Overview' },
  { value: 'audit-log', label: 'Audit Log' },
];

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const MOCK_REPORTS: ScheduledReport[] = [
  { id: 'sr-1', name: 'Weekly Sales Summary', reportType: 'sales-report', schedule: 'weekly', recipients: ['cfo@acme.com', 'sales@acme.com'], filters: {}, format: 'pdf', isActive: true, lastRunAt: '2026-06-20T06:00:00Z', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'sr-2', name: 'Monthly Financial Report', reportType: 'financial-summary', schedule: 'monthly', recipients: ['cfo@acme.com'], filters: {}, format: 'xlsx', isActive: true, lastRunAt: '2026-06-01T00:00:00Z', createdAt: '2026-05-15T10:00:00Z' },
  { id: 'sr-3', name: 'Daily Inventory Check', reportType: 'inventory-status', schedule: 'daily', recipients: ['warehouse@acme.com'], filters: {}, format: 'csv', isActive: false, lastRunAt: '2026-06-19T06:00:00Z', createdAt: '2026-05-20T10:00:00Z' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScheduledReportsPage() {
  const client = useApiClient();
  const [reports, setReports] = useState<ScheduledReport[]>(MOCK_REPORTS);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  /* Form state */
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('financial-summary');
  const [formSchedule, setFormSchedule] = useState('daily');
  const [formFormat, setFormFormat] = useState('pdf');
  const [formRecipients, setFormRecipients] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      const data = await client.get<ScheduledReport[]>('/reporting/scheduled');
      setReports(data);
    } catch {
      // keep mock
    }
  }, [client]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resetForm = () => {
    setFormName(''); setFormType('financial-summary'); setFormSchedule('daily');
    setFormFormat('pdf'); setFormRecipients('');
    setEditingId(null); setShowModal(false);
  };

  const openEdit = (r: ScheduledReport) => {
    setFormName(r.name); setFormType(r.reportType); setFormSchedule(r.schedule);
    setFormFormat(r.format); setFormRecipients(Array.isArray(r.recipients) ? r.recipients.join(', ') : '');
    setEditingId(r.id); setShowModal(true);
  };

  const handleSubmit = async () => {
    const recipients = formRecipients.split(',').map(e => e.trim()).filter(Boolean);
    const payload = { name: formName, reportType: formType, schedule: formSchedule, format: formFormat, recipients };
    try {
      if (editingId) {
        await client.request(`/reporting/scheduled/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await client.post('/reporting/scheduled', payload);
      }
      await fetchReports();
    } catch {
      if (!editingId) {
        setReports(prev => [{ id: `sr-${Date.now()}`, ...payload, filters: {}, isActive: true, lastRunAt: null, createdAt: new Date().toISOString() }, ...prev]);
      } else {
        setReports(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r));
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/reporting/scheduled/${id}`);
      await fetchReports();
    } catch {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await client.post(`/reporting/scheduled/${id}/run`);
      await fetchReports();
    } catch {
      setReports(prev => prev.map(r => r.id === id ? { ...r, lastRunAt: new Date().toISOString() } : r));
    }
    setTimeout(() => setRunningId(null), 1500);
  };

  const reportTypeLabel = (val: string) => REPORT_TYPES.find(t => t.value === val)?.label || val;
  const scheduleLabel = (val: string) => SCHEDULE_OPTIONS.find(s => s.value === val)?.label || val;

  return (
    <RouteGuard permission="settings.scheduled-reports.read">
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <FileText className="ui-text-primary" />
            Scheduled Reports
          </h1>
          <p className="ui-text-sm-muted">
            Configure automated report generation and delivery.
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className={styles.primaryButton}>
          <Plus size={14} /> New Scheduled Report
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="scheduled-report-modal-title">
            <div className="ui-flex-between mb-4">
              <h3 id="scheduled-report-modal-title" className={styles.modalTitle}>
                {editingId ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
              </h3>
              <button onClick={resetForm} className="ui-btn-icon ui-text-muted">
                <X size={16} />
              </button>
            </div>
            <div className="ui-stack-3">
              <div>
                <label className={styles.label}>Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Report name" className={styles.input} />
              </div>
              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className={styles.label}>Report Type</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)} className={styles.input}>
                    {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Schedule</label>
                  <select value={formSchedule} onChange={e => setFormSchedule(e.target.value)} className={styles.input}>
                    {SCHEDULE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={styles.label}>Format</label>
                <select value={formFormat} onChange={e => setFormFormat(e.target.value)} className={styles.input}>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">XLSX</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>Recipients (comma-separated emails)</label>
                <input value={formRecipients} onChange={e => setFormRecipients(e.target.value)} placeholder="user@example.com, another@example.com" className={styles.input} />
              </div>
              <div className={styles.formActions}>
                <button onClick={handleSubmit} disabled={!formName} className={styles.primaryButton}>
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button onClick={resetForm} className={styles.secondaryButton}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports table */}
      <ListPageTemplate
        columns={[
          { key: 'name', header: 'Name', render: (v, row) => <div><span className="font-semibold">{String(v)}</span>{(row.recipients as unknown[]).length > 0 && <div className="ui-text-micro">{(row.recipients as unknown[]).length} recipient{(row.recipients as unknown[]).length > 1 ? 's' : ''}</div>}</div> },
          { key: 'reportType', header: 'Report Type', render: (v) => <code className={styles.reportType}>{reportTypeLabel(String(v))}</code> },
          { key: 'schedule', header: 'Schedule', render: (v) => <span className={styles.schedule}><Clock size={12} className="ui-text-tertiary" /> {scheduleLabel(String(v))}</span> },
          { key: 'format', header: 'Format', render: (v) => <span className={styles.format}>{String(v)}</span> },
          { key: 'lastRunAt', header: 'Last Run', render: (v) => v ? new Date(String(v)).toLocaleString() : 'Never' },
          { key: 'isActive', header: 'Status', render: (v) => <span className={`${styles.status} ${v ? styles.statusActive : ''}`}>{v ? 'Active' : 'Paused'}</span> },
          { key: 'id', header: 'Actions', render: (v, row) => (
            <div className="ui-flex ui-gap-1">
              <button onClick={() => handleRun(String(v))} disabled={runningId === String(v)} className={styles.runButton}>
                {runningId === String(v) ? <><CheckCircle size={11} /> Done</> : <><Play size={11} /> Run</>}
              </button>
              <button onClick={() => openEdit(row as unknown as ScheduledReport)} className={styles.editButton}><Edit3 size={11} /></button>
              <button onClick={() => handleDelete(String(v))} className={styles.deleteButton}><Trash2 size={11} /></button>
            </div>
          ) },
        ] as ListColumn[]}
        data={reports as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No scheduled reports"
        emptyDescription="Create one to get started."
      />
    </div>
    </RouteGuard>
  );
}
