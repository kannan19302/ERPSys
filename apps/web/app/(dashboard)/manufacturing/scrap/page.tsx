'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, X, DollarSign } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface ScrapRecord {
  id: string;
  workOrderId: string;
  productId: string;
  scrappedQty: number;
  reason: string;
  reasonDetail: string | null;
  costImpact: number | null;
  createdAt: string;
}

export default function ScrapPage() {
  const client = useApiClient();
  const [records, setRecords] = useState<ScrapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ workOrderId: '', productId: '', scrappedQty: '1', reason: '', reasonDetail: '', costImpact: '' });

  useEffect(() => { fetchRecords(); }, [client]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await client.get<ScrapRecord[] | { data?: ScrapRecord[] }>('/manufacturing/scrap');
      setRecords(Array.isArray(data) ? data : (data?.data || []));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/manufacturing/scrap', { ...newRecord, scrappedQty: parseFloat(newRecord.scrappedQty), costImpact: newRecord.costImpact ? parseFloat(newRecord.costImpact) : undefined });
      setIsModalOpen(false);
      setNewRecord({ workOrderId: '', productId: '', scrappedQty: '1', reason: '', reasonDetail: '', costImpact: '' });
      fetchRecords();
      alert('Scrap recorded!');
    } catch { alert('Failed to record scrap'); }
  };

  const totalScrapped = records.reduce((s, r) => s + r.scrappedQty, 0);
  const totalCostImpact = records.reduce((s, r) => s + (r.costImpact || 0), 0);

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><AlertTriangle size={28} className="ui-text-warning" /> Scrap & Waste Tracking</h1>
          <p className={styles.p2}>Record production scrap and calculate cost impact</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}><Plus size={18} /> Record Scrap</button>
      </div>
      {records.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Total Scrapped</span><span className={styles.summaryValue}>{totalScrapped} units</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Cost Impact</span><span className={styles.summaryValue}>${totalCostImpact.toLocaleString()}</span></div>
        </div>
      )}
      <table className={styles.table}>
        <thead><tr><th>Date</th><th>Work Order</th><th>Product</th><th>Qty</th><th>Reason</th><th>Cost Impact</th></tr></thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>{r.workOrderId}</td>
              <td>{r.productId}</td>
              <td className={styles.qtyCell}>{r.scrappedQty}</td>
              <td><span className={styles.reasonBadge}>{r.reason}</span>{r.reasonDetail && <span className={styles.detail}>: {r.reasonDetail}</span>}</td>
              <td>{r.costImpact ? `$${r.costImpact.toLocaleString()}` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && !loading && <div className="ui-text-muted">No scrap records yet.</div>}
      {isModalOpen && (
        <div className={styles.overlay}><div className={styles.modal}>
          <div className="ui-flex-between"><h3>Record Scrap</h3><button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={18} /></button></div>
          <form onSubmit={handleCreate} className="ui-stack-3">
            <div className="ui-form-group"><label className="ui-label">Work Order ID</label><input className="ui-input" value={newRecord.workOrderId} onChange={e => setNewRecord(p => ({ ...p, workOrderId: e.target.value }))} required /></div>
            <div className="ui-form-group"><label className="ui-label">Product ID</label><input className="ui-input" value={newRecord.productId} onChange={e => setNewRecord(p => ({ ...p, productId: e.target.value }))} required /></div>
            <div className="ui-grid-2">
              <div className="ui-form-group"><label className="ui-label">Scrapped Qty</label><input className="ui-input" type="number" value={newRecord.scrappedQty} onChange={e => setNewRecord(p => ({ ...p, scrappedQty: e.target.value }))} required /></div>
              <div className="ui-form-group"><label className="ui-label">Cost Impact ($)</label><input className="ui-input" type="number" value={newRecord.costImpact} onChange={e => setNewRecord(p => ({ ...p, costImpact: e.target.value }))} /></div>
            </div>
            <div className="ui-form-group"><label className="ui-label">Reason</label><input className="ui-input" value={newRecord.reason} onChange={e => setNewRecord(p => ({ ...p, reason: e.target.value }))} required placeholder="e.g. MATERIAL_DEFECT, OPERATOR_ERROR" /></div>
            <div className="ui-form-group"><label className="ui-label">Detail</label><textarea className="ui-input" value={newRecord.reasonDetail} onChange={e => setNewRecord(p => ({ ...p, reasonDetail: e.target.value }))} /></div>
            <button type="submit" className={styles.submitBtn}>Record</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
