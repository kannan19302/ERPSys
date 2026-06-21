'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Play, Edit3, Trash2, X, Clock, CheckCircle } from 'lucide-react';

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

const API_BASE = '/api/v1/reporting/scheduled';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

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
      const data = await apiFetch<ScheduledReport[]>('');
      setReports(data);
    } catch {
      // keep mock
    }
  }, []);

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
        await apiFetch(`/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('', { method: 'POST', body: JSON.stringify(payload) });
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
      await apiFetch(`/${id}`, { method: 'DELETE' });
      await fetchReports();
    } catch {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await apiFetch(`/${id}/run`, { method: 'POST' });
      await fetchReports();
    } catch {
      setReports(prev => prev.map(r => r.id === id ? { ...r, lastRunAt: new Date().toISOString() } : r));
    }
    setTimeout(() => setRunningId(null), 1500);
  };

  const reportTypeLabel = (val: string) => REPORT_TYPES.find(t => t.value === val)?.label || val;
  const scheduleLabel = (val: string) => SCHEDULE_OPTIONS.find(s => s.value === val)?.label || val;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)',
    color: 'var(--color-text)', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText style={{ color: 'var(--color-primary)' }} />
            Scheduled Reports
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Configure automated report generation and delivery.
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} style={{
          background: 'var(--color-primary)', color: '#fff', border: 'none',
          padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        }}>
          <Plus size={14} /> New Scheduled Report
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', width: '500px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>
                {editingId ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Report name" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Report Type</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)} style={inputStyle}>
                    {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Schedule</label>
                  <select value={formSchedule} onChange={e => setFormSchedule(e.target.value)} style={inputStyle}>
                    {SCHEDULE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Format</label>
                <select value={formFormat} onChange={e => setFormFormat(e.target.value)} style={inputStyle}>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">XLSX</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'block' }}>Recipients (comma-separated emails)</label>
                <input value={formRecipients} onChange={e => setFormRecipients(e.target.value)} placeholder="user@example.com, another@example.com" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button onClick={handleSubmit} disabled={!formName} style={{
                  background: 'var(--color-primary)', color: '#fff', border: 'none',
                  padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                  cursor: !formName ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)', opacity: !formName ? 0.5 : 1,
                }}>
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button onClick={resetForm} style={{
                  background: 'none', border: '1px solid var(--color-border)',
                  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports table */}
      <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {['Name', 'Report Type', 'Schedule', 'Format', 'Last Run', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No scheduled reports. Create one to get started.</td></tr>
            )}
            {reports.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>
                  {r.name}
                  {r.recipients.length > 0 && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{r.recipients.length} recipient{r.recipients.length > 1 ? 's' : ''}</div>
                  )}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <code style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{reportTypeLabel(r.reportType)}</code>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <Clock size={12} style={{ color: 'var(--color-text-tertiary)' }} /> {scheduleLabel(r.schedule)}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-bg)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase' }}>{r.format}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : 'Never'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)',
                    color: r.isActive ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                    background: r.isActive ? 'var(--color-success-light)' : 'var(--color-bg)',
                  }}>
                    {r.isActive ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button onClick={() => handleRun(r.id)} disabled={runningId === r.id} style={{
                      background: 'none', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)',
                      padding: '3px 8px', cursor: 'pointer', color: 'var(--color-success)',
                      display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px',
                    }}>
                      {runningId === r.id ? <><CheckCircle size={11} /> Done</> : <><Play size={11} /> Run</>}
                    </button>
                    <button onClick={() => openEdit(r)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '3px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <Edit3 size={11} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: '3px 8px', cursor: 'pointer', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
