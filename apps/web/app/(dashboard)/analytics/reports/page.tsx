'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { BarChart2, Plus, X, Trash2 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface ReportFilter {
  id: string;
  reportName: string;
  source: string;
  filters: Record<string, any>;
  sortBy: string | null;
  sortOrder: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ReportsPage() {
  const client = useApiClient();
  const [reports, setReports] = useState<ReportFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({ reportName: '', source: 'PURCHASE_ORDER', filters: '{}', sortBy: '', sortOrder: 'desc' });

  useEffect(() => { fetchReports(); }, [client]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await client.get<ReportFilter[] | { data?: ReportFilter[] }>('/analytics/saved-filters');
      setReports(Array.isArray(data) ? data : (data?.data || []));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filters = JSON.parse(newReport.filters);
      await client.post('/analytics/saved-filters', { ...newReport, filters, sortBy: newReport.sortBy || undefined });
      setIsModalOpen(false);
      setNewReport({ reportName: '', source: 'PURCHASE_ORDER', filters: '{}', sortBy: '', sortOrder: 'desc' });
      fetchReports();
      alert('Saved filter created!');
    } catch { alert('Invalid filters JSON'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved filter?')) return;
    try { await client.delete(`/analytics/saved-filters/${id}`); fetchReports(); } catch { alert('Delete failed'); }
  };

  const sources = ['PURCHASE_ORDER', 'SALES_ORDER', 'INVOICE', 'PRODUCT', 'CUSTOMER', 'VENDOR', 'EMPLOYEE', 'PROJECT_TASK', 'WORK_ORDER'];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><BarChart2 size={28} className="ui-text-primary" /> Saved Reports</h1>
          <p className={styles.p2}>Create and manage reusable report filters</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}><Plus size={18} /> New Report</button>
      </div>
      <table className={styles.table}>
        <thead><tr><th>Name</th><th>Source</th><th>Filters</th><th>Sort</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id}>
              <td className={styles.nameCell}>{r.reportName}</td>
              <td><span className={styles.sourceBadge}>{r.source}</span></td>
              <td className={styles.filterCell}>{Object.keys(r.filters || {}).length} conditions</td>
              <td>{r.sortBy ? `${r.sortBy} (${r.sortOrder})` : '-'}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td><button onClick={() => handleDelete(r.id)} className={styles.iconBtn}><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && !loading && <div className="ui-text-muted">No saved reports yet.</div>}
      {isModalOpen && (
        <div className={styles.overlay}><div className={styles.modal}>
          <div className="ui-flex-between"><h3>New Report</h3><button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={18} /></button></div>
          <form onSubmit={handleCreate} className="ui-stack-3">
            <div className="ui-grid-2">
              <div className="ui-form-group"><label className="ui-label">Name</label><input className="ui-input" value={newReport.reportName} onChange={e => setNewReport(p => ({ ...p, reportName: e.target.value }))} required /></div>
              <div className="ui-form-group"><label className="ui-label">Source</label><select className="ui-input" value={newReport.source} onChange={e => setNewReport(p => ({ ...p, source: e.target.value }))}>{sources.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div className="ui-form-group"><label className="ui-label">Filters (JSON)</label><textarea className={styles.codeInput} value={newReport.filters} onChange={e => setNewReport(p => ({ ...p, filters: e.target.value }))} placeholder='{"status": "PENDING"}' rows={3} required /></div>
            <div className="ui-grid-2">
              <div className="ui-form-group"><label className="ui-label">Sort By (field)</label><input className="ui-input" value={newReport.sortBy} onChange={e => setNewReport(p => ({ ...p, sortBy: e.target.value }))} /></div>
              <div className="ui-form-group"><label className="ui-label">Order</label><select className="ui-input" value={newReport.sortOrder} onChange={e => setNewReport(p => ({ ...p, sortOrder: e.target.value }))}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
            </div>
            <button type="submit" className={styles.submitBtn}>Create</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
