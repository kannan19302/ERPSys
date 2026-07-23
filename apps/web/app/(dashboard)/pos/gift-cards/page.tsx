'use client';
import React, { useState, useEffect } from 'react';
import { Gift, Plus, Search, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSGiftCardsPage() {
  const client = useApiClient();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTopUp, setShowTopUp] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', initialBalance: 100, currency: 'USD', issuedTo: '', expiresAt: '' });
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { load(); }, [page, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      const data = await client.get<any>(`/pos/exp/gift-cards?${params}`);
      if (data?.data) { setCards(data.data); setTotalPages(data.meta?.totalPages || 1); }
    } catch {}
    setLoading(false);
  };

  const issue = async () => {
    try { await client.post('/pos/exp/gift-cards', form); setShowModal(false); load(); } catch {}
  };

  const topUp = async (id: string) => {
    try { await client.post(`/pos/exp/gift-cards/${id}/top-up`, { amount: 50 }); setShowTopUp(null); load(); } catch {}
  };

  return (
    <RouteGuard permission="pos.gift-card.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Gift className="ui-text-primary" /> Gift Cards</h1><p className="ui-text-sm-muted">Issue, manage, and track gift card balances.</p></div>
          <button className="ui-btn" onClick={() => setShowModal(true)}><Plus size={14} /> Issue Gift Card</button>
        </div>
        <div className="ui-card"><input className="ui-input" placeholder="Search by code or recipient..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {selected ? (
          <div className="ui-card p-5">
            <button onClick={() => setSelected(null)} className="ui-text-primary mb-4">← Back</button>
            <div className="ui-grid-3">
              <div><strong>Code:</strong> {selected.code}</div>
              <div><strong>Balance:</strong> <span className="text-lg font-bold">${Number(selected.currentBalance).toFixed(2)}</span></div>
              <div><strong>Initial:</strong> ${Number(selected.initialBalance).toFixed(2)}</div>
              <div><strong>Issued To:</strong> {selected.issuedTo || '-'}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Expires:</strong> {selected.expiresAt ? new Date(selected.expiresAt).toLocaleDateString() : 'Never'}</div>
            </div>
            <button className="ui-btn mt-4" onClick={() => setShowTopUp(selected.id)}>Top Up</button>
          </div>
        ) : (
          <div className="ui-card">
            <table className="ui-table">
              <thead><tr><th>Code</th><th>Balance</th><th>Status</th><th>Issued To</th><th>Expires</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> :
                  cards.map(c => (
                    <tr key={c.id}>
                      <td>{c.code}</td><td>${Number(c.currentBalance).toFixed(2)}</td>
                      <td><span className={`ui-badge-${c.status === 'ACTIVE' ? 'success' : ''}`}>{c.status}</span></td>
                      <td>{c.issuedTo || '-'}</td><td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-'}</td>
                      <td><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/pos/exp/gift-cards/${c.id}`); setSelected(d); }}><Eye size={14} /></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Issue Gift Card</h2>
              <div className="ui-form-group"><label>Code</label><input className="ui-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              <div className="ui-form-group"><label>Initial Balance</label><input type="number" className="ui-input" value={form.initialBalance} onChange={e => setForm({ ...form, initialBalance: Number(e.target.value) })} /></div>
              <div className="ui-form-group"><label>Issued To</label><input className="ui-input" value={form.issuedTo} onChange={e => setForm({ ...form, issuedTo: e.target.value })} /></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={issue}>Issue</button><button className="ui-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}
        {showTopUp && (
          <div className="ui-modal-overlay" onClick={() => setShowTopUp(null)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>Top Up Gift Card</h2>
              <p>Add $50 to this gift card?</p>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={() => topUp(showTopUp)}>Top Up $50</button><button className="ui-btn-secondary" onClick={() => setShowTopUp(null)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
