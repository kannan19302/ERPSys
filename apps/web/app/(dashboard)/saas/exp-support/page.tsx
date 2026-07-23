'use client';
import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, Eye, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasExpSupportPage() {
  const client = useApiClient(); const [tickets, setTickets] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null); const [showNew, setShowNew] = useState(false); const [message, setMessage] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', priority: 'MEDIUM' });
  useEffect(() => { load(); }, [page, statusFilter]);
  const load = async () => { setLoading(true); try { const params = new URLSearchParams({ page: String(page), limit: '20' }); if (statusFilter) params.set('status', statusFilter); const d = await client.get<any>(`/saas/exp/support-tickets?${params}`); if (d?.data) { setTickets(d.data); setTotalPages(d.meta?.totalPages || 1); } } catch {} setLoading(false); };
  const createTicket = async () => { try { await client.post('/saas/exp/support-tickets', form); setShowNew(false); load(); } catch {} };
  const sendMessage = async () => { try { await client.post('/saas/exp/support-tickets/messages', { ticketId: selected.id, content: message, isStaff: true }); setMessage(''); const d = await client.get<any>(`/saas/exp/support-tickets/${selected.id}`); setSelected(d); } catch {} };
  const updateStatus = async (id: string, status: string) => { try { await client.patch(`/saas/exp/support-tickets/${id}/status`, { status }); load(); if (selected) { const d = await client.get<any>(`/saas/exp/support-tickets/${id}`); setSelected(d); } } catch {} };
  return (
    <RouteGuard permission="saas.support-ticket.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><LifeBuoy className="ui-text-primary" /> Support Tickets</h1><p className="ui-text-sm-muted">Manage support tickets.</p></div>
          <div className="ui-hstack-2"><select className="ui-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="WAITING">Waiting on Customer</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select><button className="ui-btn" onClick={() => setShowNew(true)}><Plus size={14} /> New Ticket</button></div>
        </div>
        {selected ? (
          <div className="ui-card p-5">
            <button onClick={() => setSelected(null)} className="ui-text-primary mb-4">← Back to list</button>
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">#{selected.ticketNumber}: {selected.subject}</h2><span className={`ui-badge-${selected.status === 'OPEN' || selected.status === 'IN_PROGRESS' ? 'info' : selected.status === 'RESOLVED' || selected.status === 'CLOSED' ? 'success' : ''}`}>{selected.status}</span></div>
            <p className="ui-text-sm-muted mb-4">Priority: {selected.priority} | Created: {new Date(selected.createdAt).toLocaleString()}</p>
            <div className="ui-hstack-1 mb-4">{selected.status !== 'RESOLVED' && <button className="ui-btn" onClick={() => updateStatus(selected.id, 'RESOLVED')}>Resolve</button>}{selected.status !== 'CLOSED' && selected.status === 'RESOLVED' && <button className="ui-btn-secondary" onClick={() => updateStatus(selected.id, 'CLOSED')}>Close</button>}{selected.status === 'CLOSED' && <button className="ui-btn" onClick={() => updateStatus(selected.id, 'OPEN')}>Reopen</button>}</div>
            <div className="space-y-3 mb-4">{(selected.messages || []).map((m: any) => (
              <div key={m.id} className={`p-3 rounded ${m.isStaff ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                <div className="flex justify-between text-xs ui-text-muted mb-1"><span>{m.isStaff ? 'Staff' : 'Customer'}</span><span>{new Date(m.createdAt).toLocaleString()}</span></div>
                <p>{m.content}</p></div>
            ))}</div>
            {selected.status !== 'CLOSED' && <div className="ui-hstack-2"><input className="ui-input flex-1" placeholder="Type a message..." value={message} onChange={e => setMessage(e.target.value)} /><button className="ui-btn" onClick={sendMessage} disabled={!message.trim()}><Send size={14} /> Send</button></div>}
          </div>
        ) : (
          <div className="ui-card">
            <table className="ui-table">
              <thead><tr><th>#</th><th>Subject</th><th>Priority</th><th>Status</th><th>Messages</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr> : tickets.map(t => (
                <tr key={t.id}><td>{t.ticketNumber}</td><td className="max-w-xs truncate">{t.subject}</td><td><span className={`ui-badge-${t.priority === 'HIGH' || t.priority === 'URGENT' ? 'error' : t.priority === 'MEDIUM' ? 'warning' : 'info'}`}>{t.priority}</span></td><td><span className={`ui-badge-${t.status === 'OPEN' || t.status === 'IN_PROGRESS' ? 'info' : t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'success' : ''}`}>{t.status}</span></td><td>{(t._count?.messages || t.messages?.length || 0)}</td><td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/saas/exp/support-tickets/${t.id}`); setSelected(d); }}><Eye size={14} /></button></td></tr>
              ))}</tbody>
            </table>
            <div className="flex items-center justify-between p-4"><span className="ui-text-sm-muted">Page {page} of {totalPages}</span><div className="ui-hstack-1"><button className="ui-btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><button className="ui-btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div></div>
          </div>
        )}
        {showNew && (
          <div className="ui-modal-overlay" onClick={() => setShowNew(false)}>
            <div className="ui-modal" onClick={e => e.stopPropagation()}>
              <h2>New Support Ticket</h2>
              <div className="ui-form-group"><label>Subject</label><input className="ui-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="ui-form-group"><label>Description</label><textarea className="ui-input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="ui-form-group"><label>Priority</label><select className="ui-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></div>
              <div className="ui-hstack-2 mt-4"><button className="ui-btn" onClick={createTicket}>Create</button><button className="ui-btn-secondary" onClick={() => setShowNew(false)}>Cancel</button></div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
