'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Store, Users, ShoppingCart, FileText, Plus, Ban, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';

const API = 'http://localhost:3001/api/v1';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

interface Vendor { id: string; name: string; email?: string; status?: string; }
interface PortalUser { id: string; email: string; status: string; lastLoginAt?: string; createdAt: string; }
interface PurchaseOrder { id: string; poNumber: string; status: string; totalAmount?: number; currency?: string; createdAt: string; }
interface Rfq { id: string; rfqNumber?: string; status: string; dueDate?: string; createdAt: string; }

type Tab = 'users' | 'pos' | 'rfqs';

export default function SupplierPortalPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);

  useEffect(() => {
    apiFetch('/procurement/vendors').then(d => setVendors(Array.isArray(d) ? d : d.data || [])).catch(() => {});
  }, []);

  const loadPortalData = useCallback(async (vendor: Vendor, t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === 'users') {
        const d = await apiFetch(`/procurement/vendors/${vendor.id}/portal-users`);
        setPortalUsers(Array.isArray(d) ? d : []);
      } else if (t === 'pos') {
        const d = await apiFetch(`/procurement/vendors/${vendor.id}/portal/purchase-orders`);
        setPurchaseOrders(Array.isArray(d) ? d : []);
      } else {
        const d = await apiFetch(`/procurement/vendors/${vendor.id}/portal/rfqs`);
        setRfqs(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectVendor = (v: Vendor) => {
    setSelectedVendor(v);
    setVendorOpen(false);
    setInviteResult(null);
    setTab('users');
    loadPortalData(v, 'users');
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    if (selectedVendor) loadPortalData(selectedVendor, t);
  };

  const invite = async () => {
    if (!selectedVendor || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const res = await apiFetch(`/procurement/vendors/${selectedVendor.id}/portal-users`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      setInviteResult({ email: res.email, tempPassword: res.tempPassword });
      setInviteEmail('');
      loadPortalData(selectedVendor, 'users');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const disable = async (userId: string) => {
    if (!selectedVendor) return;
    try {
      await apiFetch(`/procurement/portal-users/${userId}/disable`, { method: 'PATCH' });
      loadPortalData(selectedVendor, 'users');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable');
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Portal Users', icon: <Users size={14} /> },
    { id: 'pos', label: 'Purchase Orders', icon: <ShoppingCart size={14} /> },
    { id: 'rfqs', label: 'RFQs', icon: <FileText size={14} /> },
  ];

  const statusVariant = (s: string): 'success' | 'warning' | 'danger' | 'default' | 'info' => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
      ACTIVE: 'success', INVITED: 'info', DISABLED: 'danger',
      APPROVED: 'success', OPEN: 'default', CLOSED: 'default', CANCELLED: 'danger',
    };
    return map[s] || 'default';
  };

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Store size={28} style={{ color: 'var(--color-primary)' }} />
          Supplier Portal
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Manage vendor self-service access — invite portal users, view their POs and open RFQs.
        </p>
      </div>

      {/* Vendor Selector */}
      <Card>
        <div style={{ padding: 'var(--space-5)' }}>
          <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
            SELECT VENDOR
          </label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setVendorOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: selectedVendor ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                fontSize: 'var(--text-sm)', cursor: 'pointer',
              }}
            >
              {selectedVendor ? selectedVendor.name : 'Choose a vendor…'}
              {vendorOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {vendorOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', maxHeight: 260, overflowY: 'auto',
              }}>
                {vendors.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                    No vendors found
                  </div>
                ) : vendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => selectVendor(v)}
                    style={{
                      width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-4)',
                      background: selectedVendor?.id === v.id ? 'var(--color-primary-light)' : 'transparent',
                      color: selectedVendor?.id === v.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {v.name}
                    {v.email && <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>({v.email})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {selectedVendor && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--color-border)' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)',
                  borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                  marginBottom: -2, fontWeight: tab === t.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
            <button
              onClick={() => selectedVendor && loadPortalData(selectedVendor, tab)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 'var(--space-2)' }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              {error}
            </div>
          )}

          {inviteResult && (
            <div style={{ padding: 'var(--space-4)', background: 'var(--color-success-light)', color: 'var(--color-success-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <strong>Portal user invited:</strong> {inviteResult.email}<br />
              Temporary password: <code style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inviteResult.tempPassword}</code><br />
              <span style={{ opacity: 0.8 }}>Share this with the vendor. They should change it after first login.</span>
            </div>
          )}

          {/* Tab Content */}
          {tab === 'users' && (
            <Card>
              <div style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && invite()}
                    placeholder="vendor@supplier.com"
                    style={{
                      flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
                      background: 'var(--color-bg)', color: 'var(--color-text-primary)',
                    }}
                  />
                  <Button onClick={invite} disabled={inviting || !inviteEmail.trim()}>
                    <Plus size={14} style={{ marginRight: 'var(--space-1)' }} />
                    {inviting ? 'Inviting…' : 'Invite User'}
                  </Button>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</div>
                ) : portalUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                    No portal users yet for {selectedVendor.name}. Invite one above.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        {['Email', 'Status', 'Last Login', 'Invited', ''].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portalUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>{u.email}</td>
                          <td style={{ padding: 'var(--space-3)' }}><Badge variant={statusVariant(u.status)} size="sm">{u.status}</Badge></td>
                          <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            {u.status !== 'DISABLED' && (
                              <button
                                onClick={() => disable(u.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
                              >
                                <Ban size={12} /> Disable
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}

          {tab === 'pos' && (
            <Card>
              <div style={{ padding: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  PURCHASE ORDERS — {selectedVendor.name}
                </h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</div>
                ) : purchaseOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>No purchase orders for this vendor.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        {['PO Number', 'Status', 'Amount', 'Created'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => (
                        <tr key={po.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{po.poNumber}</td>
                          <td style={{ padding: 'var(--space-3)' }}><Badge variant={statusVariant(po.status)} size="sm">{po.status}</Badge></td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            {po.totalAmount != null ? `${po.currency || 'USD'} ${po.totalAmount.toLocaleString()}` : '—'}
                          </td>
                          <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
                            {new Date(po.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}

          {tab === 'rfqs' && (
            <Card>
              <div style={{ padding: 'var(--space-5)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  OPEN RFQs — {selectedVendor.name}
                </h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading…</div>
                ) : rfqs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>No RFQs for this vendor.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        {['RFQ #', 'Status', 'Due Date', 'Created'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rfqs.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{r.rfqNumber || r.id.slice(0, 8)}</td>
                          <td style={{ padding: 'var(--space-3)' }}><Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge></td>
                          <td style={{ padding: 'var(--space-3)' }}>
                            {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
