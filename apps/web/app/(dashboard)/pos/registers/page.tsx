'use client';
import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSRegistersPage() {
  const client = useApiClient();
  const [registers, setRegisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ terminalId: '', startingCash: 200 });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const data = await client.get<any>(`/pos/exp/registers?${params}`);
      if (data?.data) { setRegisters(data.data); setTotalPages(data.meta?.totalPages || 1); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const openRegister = async () => {
    try { await client.post('/pos/exp/registers', modalData); setShowModal(false); load(); } catch {}
  };

  const closeRegister = async (id: string) => {
    try { await client.put(`/pos/exp/registers/${id}/close`, { endingCash: 0, actualCash: 0 }); load(); } catch {}
  };

  return (
    <RouteGuard permission="pos.register.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2"><Monitor className="ui-text-primary" /> POS Registers</h1>
            <p className="ui-text-sm-muted">Manage register sessions across terminals.</p>
          </div>
          <div className="ui-hstack-2">
            <select className="ui-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option>
            </select>
            <button className="ui-btn" onClick={() => setShowModal(true)}><Plus size={14} /> Open Register</button>
          </div>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr><th>Terminal</th><th>Status</th><th>Opened</th><th>Closed</th><th>Starting</th><th>Sales</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr> :
                registers.map(r => (
                  <tr key={r.id}>
                    <td>{r.terminal?.name || r.terminalId}</td>
                    <td><span className={r.status === 'OPEN' ? 'ui-badge-success' : 'ui-badge'}>{r.status}</span></td>
                    <td>{new Date(r.openedAt).toLocaleString()}</td>
                    <td>{r.closedAt ? new Date(r.closedAt).toLocaleString() : '-'}</td>
                    <td>${Number(r.startingCash).toFixed(2)}</td>
                    <td>${Number(r.totalSales).toFixed(2)}</td>
                    <td>
                      {r.status === 'OPEN' && <button className="ui-btn-icon" onClick={() => closeRegister(r.id)} title="Close">Close</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Open Register</h2>
              <div className="ui-form-group"><label>Terminal ID</label><input className="ui-input" value={modalData.terminalId} onChange={e => setModalData({ ...modalData, terminalId: e.target.value })} /></div>
              <div className="ui-form-group"><label>Starting Cash</label><input type="number" className="ui-input" value={modalData.startingCash} onChange={e => setModalData({ ...modalData, startingCash: Number(e.target.value) })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={openRegister}>Open</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
