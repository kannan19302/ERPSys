'use client';
import React, { useState, useEffect } from 'react';
import { Star, Check, X } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceReviewsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [listingId, setListingId] = useState(''); const [storeId, setStoreId] = useState(''); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  useEffect(() => { if (listingId && storeId) load(); }, [listingId, storeId, page]);
  const load = async () => { setLoading(true); try { const params = new URLSearchParams({ page: String(page), limit: '20' }); const d = await client.get<any>(`/ecommerce/exp/${storeId}/listings/${listingId}/reviews?${params}`); if (d?.data) { setItems(d.data); setTotalPages(d.meta?.totalPages || 1); } } catch {} setLoading(false); };
  const moderate = async (id: string, approved: boolean) => { try { await client.post(`/ecommerce/exp/reviews/${id}/moderate`, { approved }); load(); } catch {} };
  return (
    <RouteGuard permission="ecommerce.listing.read">
      <div className="ui-stack-6">
        <div><h1 className="text-2xl ui-hstack-2"><Star className="ui-text-primary" /> Product Reviews</h1><p className="ui-text-sm-muted">Moderate customer reviews.</p></div>
        <div className="ui-card ui-hstack-2"><input className="ui-input" placeholder="Store ID..." value={storeId} onChange={e => setStoreId(e.target.value)} /><input className="ui-input" placeholder="Listing ID..." value={listingId} onChange={e => setListingId(e.target.value)} /></div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Customer</th><th>Rating</th><th>Comment</th><th>Verified</th><th>Approved</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.customerName || 'Anonymous'}</td><td>{'★'.repeat(i.rating)}{'☆'.repeat(5 - i.rating)}</td><td className="max-w-xs truncate">{i.comment || '-'}</td><td>{i.isVerified ? <span className="ui-badge-success">Yes</span> : 'No'}</td><td>{i.isApproved ? <span className="ui-badge-success">Yes</span> : <span className="ui-badge">No</span>}</td>
                <td className="ui-hstack-1">{!i.isApproved && <button className="ui-btn-icon ui-text-success" onClick={() => moderate(i.id, true)}><Check size={14} /></button>}<button className="ui-btn-icon ui-text-error" onClick={() => moderate(i.id, false)}><X size={14} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </RouteGuard>
  );
}
