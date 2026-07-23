'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { FileDown, Plus, X, Play, Trash2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface ScheduledExport {
  id: string;
  name: string;
  source: string;
  format: string;
  scheduleType: string;
  scheduleConfig: Record<string, any>;
  recipients: string[];
  lastRunAt: string | null;
  nextRunAt: string | null;
  isActive: boolean;
}

export default function ExportsPage() {
  const client = useApiClient();
  const [exports, setExports] = useState<ScheduledExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExport, setNewExport] = useState({ name: '', source: 'PURCHASE_ORDER', format: 'CSV', scheduleType: 'ONCE', scheduleConfig: '{}', recipients: '' });

  useEffect(() => { fetchExports(); }, [client]);

  const fetchExports = async () => {
    try {
      setLoading(true);
      const data = await client.get<ScheduledExport[] | { data?: ScheduledExport[] }>('/analytics/scheduled-exports');
      setExports(Array.isArray(data) ? data : (data?.data || []));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduleConfig = JSON.parse(newExport.scheduleConfig);
      const recipients = newExport.recipients.split(',').map(r => r.trim()).filter(Boolean);
      await client.post('/analytics/scheduled-exports', { ...newExport, scheduleConfig, recipients });
      setIsModalOpen(false);
      setNewExport({ name: '', source: 'PURCHASE_ORDER', format: 'CSV', scheduleType: 'ONCE', scheduleConfig: '{}', recipients: '' });
      fetchExports();
      alert('Scheduled export created!');
    } catch { alert('Invalid config JSON'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scheduled export?')) return;
    try { await client.delete(`/analytics/scheduled-exports/${id}`); fetchExports(); } catch { alert('Delete failed'); }
  };

  const handleRunNow = async (id: string) => {
    try { await client.post(`/analytics/scheduled-exports/${id}/run`); alert('Export triggered!'); } catch { alert('Run failed'); }
  };

  const sources = ['PURCHASE_ORDER', 'SALES_ORDER', 'INVOICE', 'PRODUCT', 'CUSTOMER', 'VENDOR', 'EMPLOYEE', 'PROJECT_TASK', 'WORK_ORDER'];
  const formats = ['CSV', 'PDF', 'XLSX', 'JSON'];
  const schedules = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><FileDown size={28} className="ui-text-primary" /> Scheduled Exports</h1>
          <p className={styles.p2}>Automate data exports to CSV, PDF, or XLSX</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}><Plus size={18} /> Schedule Export</button>
      </div>
      <table className={styles.table}>
        <thead><tr><th>Name</th><th>Source</th><th>Format</th><th>Schedule</th><th>Last Run</th><th>Next Run</th><th></th></tr></thead>
        <tbody>
          {exports.map(e => (
            <tr key={e.id}>
              <td className={styles.nameCell}>{e.name}</td>
              <td><span className={styles.sourceBadge}>{e.source}</span></td>
              <td><span className={styles.formatBadge}>{e.format}</span></td>
              <td>{e.scheduleType}</td>
              <td className="ui-text-muted">{e.lastRunAt ? new Date(e.lastRunAt).toLocaleDateString() : 'Never'}</td>
              <td className="ui-text-muted">{e.nextRunAt ? new Date(e.nextRunAt).toLocaleDateString() : '-'}</td>
              <td>
                <div className="ui-flex ui-gap-1">
                  <button onClick={() => handleRunNow(e.id)} className={styles.iconBtn} title="Run now"><Play size={14} /></button>
                  <button onClick={() => handleDelete(e.id)} className={styles.iconBtn} title="Delete"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {exports.length === 0 && !loading && <div className="ui-text-muted">No scheduled exports yet.</div>}
      {isModalOpen && (
        <div className={styles.overlay}><div className={styles.modal}>
          <div className="ui-flex-between"><h3>Schedule Export</h3><button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={18} /></button></div>
          <form onSubmit={handleCreate} className="ui-stack-3">
            <div className="ui-grid-2">
              <div className="ui-form-group"><label className="ui-label">Name</label><input className="ui-input" value={newExport.name} onChange={e => setNewExport(p => ({ ...p, name: e.target.value }))} required /></div>
              <div className="ui-form-group"><label className="ui-label">Source</label><select className="ui-input" value={newExport.source} onChange={e => setNewExport(p => ({ ...p, source: e.target.value }))}>{sources.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div className="ui-grid-3">
              <div className="ui-form-group"><label className="ui-label">Format</label><select className="ui-input" value={newExport.format} onChange={e => setNewExport(p => ({ ...p, format: e.target.value }))}>{formats.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div className="ui-form-group"><label className="ui-label">Schedule</label><select className="ui-input" value={newExport.scheduleType} onChange={e => setNewExport(p => ({ ...p, scheduleType: e.target.value }))}>{schedules.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="ui-form-group"><label className="ui-label">Recipients</label><input className="ui-input" value={newExport.recipients} onChange={e => setNewExport(p => ({ ...p, recipients: e.target.value }))} placeholder="email1@a.com,email2@a.com" /></div>
            </div>
            <div className="ui-form-group"><label className="ui-label">Schedule Config (JSON)</label><textarea className={styles.codeInput} value={newExport.scheduleConfig} onChange={e => setNewExport(p => ({ ...p, scheduleConfig: e.target.value }))} placeholder='{"dayOfWeek": "MONDAY", "time": "08:00"}' rows={2} /></div>
            <button type="submit" className={styles.submitBtn}>Create</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
