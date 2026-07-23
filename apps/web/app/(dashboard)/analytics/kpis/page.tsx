'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Activity, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface KpiValue {
  id: string;
  kpiName: string;
  category: string;
  value: number;
  previousValue: number | null;
  targetValue: number | null;
  unit: string | null;
  recordedAt: string;
}

export default function KpisPage() {
  const client = useApiClient();
  const [kpis, setKpis] = useState<KpiValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKpi, setNewKpi] = useState({ kpiName: '', category: 'FINANCE', value: '', previousValue: '', targetValue: '', unit: '' });

  useEffect(() => { fetchKpis(); }, [client]);

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const data = await client.get<KpiValue[] | { data?: KpiValue[] }>('/analytics/kpi-values');
      setKpis(Array.isArray(data) ? data : (data?.data || []));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/analytics/kpi-values', { ...newKpi, value: parseFloat(newKpi.value), previousValue: newKpi.previousValue ? parseFloat(newKpi.previousValue) : undefined, targetValue: newKpi.targetValue ? parseFloat(newKpi.targetValue) : undefined, unit: newKpi.unit || undefined });
      setIsModalOpen(false);
      setNewKpi({ kpiName: '', category: 'FINANCE', value: '', previousValue: '', targetValue: '', unit: '' });
      fetchKpis();
      alert('KPI recorded!');
    } catch { alert('Failed to record KPI'); }
  };

  const change = (current: number, prev: number | null): number | null => {
    if (prev === null || prev === 0) return null;
    return ((current - prev) / prev) * 100;
  };

  const categories = ['FINANCE', 'SALES', 'OPERATIONS', 'HR', 'INVENTORY', 'PROJECTS', 'MANUFACTURING'];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><Activity size={28} className="ui-text-primary" /> KPI Dashboard</h1>
          <p className={styles.p2}>Track key performance indicators across the organization</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}><Plus size={18} /> Record KPI</button>
      </div>
      {kpis.length > 0 && (
        <div className={styles.kpiGrid}>
          {kpis.map(k => {
            const pct = change(k.value, k.previousValue);
            const meetingTarget = k.targetValue !== null ? k.value >= k.targetValue : null;
            return (
              <div key={k.id} className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiName}>{k.kpiName}</span>
                  <span className={styles.kpiCategory}>{k.category}</span>
                </div>
                <div className={styles.kpiValue}>{k.value?.toLocaleString()}{k.unit && <span className={styles.kpiUnit}> {k.unit}</span>}</div>
                <div className={styles.kpiMeta}>
                  {pct !== null && (
                    <span className={pct >= 0 ? styles.upChange : styles.downChange}>
                      {pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(pct).toFixed(1)}%
                    </span>
                  )}
                  {k.targetValue !== null && (
                    <span className={meetingTarget ? styles.onTarget : styles.offTarget}>
                      Target: {k.targetValue?.toLocaleString()}{k.unit}
                    </span>
                  )}
                </div>
                <p className={styles.kpiDate}>{new Date(k.recordedAt).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}
      {kpis.length === 0 && !loading && <div className="ui-text-muted">No KPI values recorded yet.</div>}
      {isModalOpen && (
        <div className={styles.overlay}><div className={styles.modal}>
          <div className="ui-flex-between"><h3>Record KPI</h3><button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={18} /></button></div>
          <form onSubmit={handleCreate} className="ui-stack-3">
            <div className="ui-grid-2">
              <div className="ui-form-group"><label className="ui-label">KPI Name</label><input className="ui-input" value={newKpi.kpiName} onChange={e => setNewKpi(p => ({ ...p, kpiName: e.target.value }))} required /></div>
              <div className="ui-form-group"><label className="ui-label">Category</label><select className="ui-input" value={newKpi.category} onChange={e => setNewKpi(p => ({ ...p, category: e.target.value }))}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div className="ui-grid-3">
              <div className="ui-form-group"><label className="ui-label">Value</label><input className="ui-input" type="number" step="any" value={newKpi.value} onChange={e => setNewKpi(p => ({ ...p, value: e.target.value }))} required /></div>
              <div className="ui-form-group"><label className="ui-label">Previous</label><input className="ui-input" type="number" step="any" value={newKpi.previousValue} onChange={e => setNewKpi(p => ({ ...p, previousValue: e.target.value }))} /></div>
              <div className="ui-form-group"><label className="ui-label">Target</label><input className="ui-input" type="number" step="any" value={newKpi.targetValue} onChange={e => setNewKpi(p => ({ ...p, targetValue: e.target.value }))} /></div>
            </div>
            <div className="ui-form-group"><label className="ui-label">Unit (e.g., $, %, units)</label><input className="ui-input" value={newKpi.unit} onChange={e => setNewKpi(p => ({ ...p, unit: e.target.value }))} /></div>
            <button type="submit" className={styles.submitBtn}>Record</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
