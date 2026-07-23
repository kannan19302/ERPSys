'use client';
import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Shift {
  id: string; registerId: string; employeeId: string; status: string;
  startTime: string; endTime: string | null; openingCash: string; closingCash: string | null;
  declaredCash: string | null; cashVariance: string | null; totalSales: string; notes: string | null;
  _count?: { shiftTransactions: number };
}

export default function POSShiftsPage() {
  const client = useApiClient();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeData, setCloseData] = useState({ closingCash: 0, declaredCash: 0, notes: '' });

  const loadShifts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const data = await client.get<any>(`/pos/exp/shifts?${params}`);
      if (data && data.data) { setShifts(data.data); setTotalPages(data.meta?.totalPages || 1); }
      else { setShifts([]); setTotalPages(1); }
    } catch { setShifts([]); setTotalPages(1); }
    setLoading(false);
  };

  useEffect(() => { loadShifts(); }, [page, statusFilter]);

  const startShift = async () => {
    try {
      await client.post('/pos/exp/shifts', { registerId: selectedShift?.registerId || '', employeeId: 'emp-system', openingCash: 200 });
      setShowStartModal(false);
      loadShifts();
    } catch {}
  };

  const closeShift = async (id: string) => {
    try {
      await client.put(`/pos/exp/shifts/${id}/close`, closeData);
      setShowCloseModal(false);
      loadShifts();
    } catch {}
  };

  const loadShiftDetail = async (id: string) => {
    try {
      const data = await client.get<any>(`/pos/exp/shifts/${id}`);
      setSelectedShift(data);
    } catch {}
  };

  return (
    <RouteGuard permission="pos.shift.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2"><Clock className="ui-text-primary" /> POS Shifts</h1>
            <p className="ui-text-sm-muted">Manage cashier shifts, track openings/closings, and monitor cash drawer activity.</p>
          </div>
          <div className="ui-hstack-2">
            <select className="ui-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button className="ui-btn" onClick={() => setShowStartModal(true)}><Play size={14} /> Start Shift</button>
          </div>
        </div>

        {selectedShift ? (
          <div className="ui-card p-5">
            <button onClick={() => setSelectedShift(null)} className="ui-text-primary mb-4">← Back to Shifts</button>
            <div className="ui-grid-3">
              <div><strong>Status:</strong> <span className={selectedShift.status === 'OPEN' ? 'ui-text-success' : 'ui-text-muted'}>{selectedShift.status}</span></div>
              <div><strong>Employee:</strong> {selectedShift.employeeId}</div>
              <div><strong>Start:</strong> {new Date(selectedShift.startTime).toLocaleString()}</div>
              <div><strong>End:</strong> {selectedShift.endTime ? new Date(selectedShift.endTime).toLocaleString() : '-'}</div>
              <div><strong>Opening Cash:</strong> ${Number(selectedShift.openingCash).toFixed(2)}</div>
              <div><strong>Closing Cash:</strong> ${selectedShift.closingCash ? Number(selectedShift.closingCash).toFixed(2) : '-'}</div>
              <div><strong>Declared:</strong> ${selectedShift.declaredCash ? Number(selectedShift.declaredCash).toFixed(2) : '-'}</div>
              <div><strong>Variance:</strong> <span className={Number(selectedShift.cashVariance) !== 0 ? 'ui-text-error' : ''}>{selectedShift.cashVariance ? Number(selectedShift.cashVariance).toFixed(2) : '-'}</span></div>
              <div><strong>Total Sales:</strong> ${Number(selectedShift.totalSales).toFixed(2)}</div>
            </div>
            {selectedShift.status === 'OPEN' && (
              <button className="ui-btn mt-4" onClick={() => { setShowCloseModal(true); }}>
                <Square size={14} /> Close Shift
              </button>
            )}
          </div>
        ) : (
          <div className="ui-card">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Status</th><th>Start Time</th><th>End Time</th>
                  <th>Opening Cash</th><th>Closing Cash</th><th>Sales</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={8} className="text-center p-4">Loading...</td></tr> :
                  shifts.length === 0 ? <tr><td colSpan={8} className="text-center p-4">No shifts found</td></tr> :
                  shifts.map(s => (
                    <tr key={s.id}>
                      <td>{s.employeeId}</td>
                      <td><span className={s.status === 'OPEN' ? 'ui-badge-success' : 'ui-badge'}>{s.status}</span></td>
                      <td>{new Date(s.startTime).toLocaleString()}</td>
                      <td>{s.endTime ? new Date(s.endTime).toLocaleString() : '-'}</td>
                      <td>${Number(s.openingCash).toFixed(2)}</td>
                      <td>{s.closingCash ? `$${Number(s.closingCash).toFixed(2)}` : '-'}</td>
                      <td>${Number(s.totalSales).toFixed(2)}</td>
                      <td><button className="ui-btn-icon" onClick={() => loadShiftDetail(s.id)} title="View"><Eye size={16} /></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4">
              <span className="ui-text-sm-muted">Page {page} of {totalPages}</span>
              <div className="ui-hstack-1">
                <button className="ui-btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
                <button className="ui-btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {showCloseModal && selectedShift && (
          <div className="ui-modal-overlay" onClick={() => setShowCloseModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Close Shift</h2>
              <div className="ui-form-group">
                <label>Closing Cash</label>
                <input type="number" className="ui-input" value={closeData.closingCash} onChange={e => setCloseData({ ...closeData, closingCash: Number(e.target.value) })} />
              </div>
              <div className="ui-form-group">
                <label>Declared Cash</label>
                <input type="number" className="ui-input" value={closeData.declaredCash} onChange={e => setCloseData({ ...closeData, declaredCash: Number(e.target.value) })} />
              </div>
              <div className="ui-form-group">
                <label>Notes</label>
                <textarea className="ui-input" value={closeData.notes} onChange={e => setCloseData({ ...closeData, notes: e.target.value })} />
              </div>
              <div className="ui-hstack-2 mt-4">
                <button className="ui-btn" onClick={() => closeShift(selectedShift.id)}>Close Shift</button>
                <button className="ui-btn-secondary" onClick={() => setShowCloseModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
