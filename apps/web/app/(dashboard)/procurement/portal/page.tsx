'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Store, Users, ShoppingCart, FileText, Plus, Ban, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Vendor { id: string; name: string; email?: string; status?: string; }
interface PortalUser { id: string; email: string; status: string; lastLoginAt?: string; createdAt: string; }
interface PurchaseOrder { id: string; poNumber: string; status: string; totalAmount?: number; currency?: string; createdAt: string; }
interface Rfq { id: string; rfqNumber?: string; status: string; dueDate?: string; createdAt: string; }

type Tab = 'users' | 'pos' | 'rfqs';

export default function SupplierPortalPage() {
  const client = useApiClient();
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
    client.get<Vendor[]>('/procurement/vendors').then(d => setVendors(Array.isArray(d) ? d : [])).catch(() => {});
  }, [client]);

  const loadPortalData = useCallback(async (vendor: Vendor, t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === 'users') {
        const d = await client.get<PortalUser[]>(`/procurement/vendors/${vendor.id}/portal-users`);
        setPortalUsers(Array.isArray(d) ? d : []);
      } else if (t === 'pos') {
        const d = await client.get<PurchaseOrder[]>(`/procurement/vendors/${vendor.id}/portal/purchase-orders`);
        setPurchaseOrders(Array.isArray(d) ? d : []);
      } else {
        const d = await client.get<Rfq[]>(`/procurement/vendors/${vendor.id}/portal/rfqs`);
        setRfqs(Array.isArray(d) ? d : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [client]);

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
      const res = await client.post<{ email: string; tempPassword: string }>(`/procurement/vendors/${selectedVendor.id}/portal-users`, { email: inviteEmail.trim() });
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
      await client.patch(`/procurement/portal-users/${userId}/disable`, {});
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
    <RouteGuard permission="procurement.portal.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div>
        <h1 className={styles.p1}>
          <Store size={28} className="ui-text-primary" />
          Supplier Portal
        </h1>
        <p className="ui-text-muted mt-1">
          Manage vendor self-service access — invite portal users, view their POs and open RFQs.
        </p>
      </div>

      {/* Vendor Selector */}
      <Card>
        <div className="p-5">
          <label className={styles.p2}>
            SELECT VENDOR
          </label>
          <div className="relative">
            <button
              onClick={() => setVendorOpen(o => !o)}
              style={{ color: selectedVendor ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
            >
              {selectedVendor ? selectedVendor.name : 'Choose a vendor…'}
              {vendorOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {vendorOpen && (
              <div className={styles.p4}>
                {vendors.length === 0 ? (
                  <div className={styles.p5}>
                    No vendors found
                  </div>
                ) : vendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => selectVendor(v)}
                    style={{ background: selectedVendor?.id === v.id ? 'var(--color-primary-light)' : 'transparent', color: selectedVendor?.id === v.id ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                  >
                    {v.name}
                    {v.email && <span className={styles.p7}>({v.email})</span>}
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
          <div className={styles.p8}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                style={{ borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: tab === t.id ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s1}
              >
                {t.icon} {t.label}
              </button>
            ))}
            <button
              onClick={() => selectedVendor && loadPortalData(selectedVendor, tab)}
              className={styles.p10}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {error && (
            <div className={styles.p11}>
              {error}
            </div>
          )}

          {inviteResult && (
            <div className={styles.p12}>
              <strong>Portal user invited:</strong> {inviteResult.email}<br />
              Temporary password: <code className={styles.p13}>{inviteResult.tempPassword}</code><br />
              <span className={styles.p14}>Share this with the vendor. They should change it after first login.</span>
            </div>
          )}

          {/* Tab Content */}
          {tab === 'users' && (
            <Card>
              <div className="p-5">
                <div className={styles.p15}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && invite()}
                    placeholder="vendor@supplier.com"
                    className={styles.p16}
                  />
                  <Button onClick={invite} disabled={inviting || !inviteEmail.trim()}>
                    <Plus size={14} className={styles.p17} />
                    {inviting ? 'Inviting…' : 'Invite User'}
                  </Button>
                </div>

                {loading ? (
                  <div className={styles.p18}>Loading…</div>
                ) : portalUsers.length === 0 ? (
                  <div className={styles.p19}>
                    No portal users yet for {selectedVendor.name}. Invite one above.
                  </div>
                ) : (
                  <table className={styles.p20}>
                    <thead>
                      <tr className={styles.p21}>
                        {['Email', 'Status', 'Last Login', 'Invited', ''].map(h => (
                          <th key={h} className={styles.p22}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portalUsers.map(u => (
                        <tr key={u.id} className="border-b">
                          <td className="p-3">{u.email}</td>
                          <td className="p-3"><Badge variant={statusVariant(u.status)} size="sm">{u.status}</Badge></td>
                          <td className={styles.p23}>
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                          </td>
                          <td className={styles.p24}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {u.status !== 'DISABLED' && (
                              <button
                                onClick={() => disable(u.id)}
                                className={styles.p25}
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
              <div className="p-5">
                <h3 className={styles.p26}>
                  PURCHASE ORDERS — {selectedVendor.name}
                </h3>
                {loading ? (
                  <div className={styles.p27}>Loading…</div>
                ) : purchaseOrders.length === 0 ? (
                  <div className={styles.p28}>No purchase orders for this vendor.</div>
                ) : (
                  <table className={styles.p29}>
                    <thead>
                      <tr className={styles.p30}>
                        {['PO Number', 'Status', 'Amount', 'Created'].map(h => (
                          <th key={h} className={styles.p31}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => (
                        <tr key={po.id} className="border-b">
                          <td className={styles.p32}>{po.poNumber}</td>
                          <td className="p-3"><Badge variant={statusVariant(po.status)} size="sm">{po.status}</Badge></td>
                          <td className="p-3">
                            {po.totalAmount != null ? `${po.currency || 'USD'} ${po.totalAmount.toLocaleString()}` : '—'}
                          </td>
                          <td className={styles.p33}>
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
              <div className="p-5">
                <h3 className={styles.p34}>
                  OPEN RFQs — {selectedVendor.name}
                </h3>
                {loading ? (
                  <div className={styles.p35}>Loading…</div>
                ) : rfqs.length === 0 ? (
                  <div className={styles.p36}>No RFQs for this vendor.</div>
                ) : (
                  <table className={styles.p37}>
                    <thead>
                      <tr className={styles.p38}>
                        {['RFQ #', 'Status', 'Due Date', 'Created'].map(h => (
                          <th key={h} className={styles.p39}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rfqs.map(r => (
                        <tr key={r.id} className="border-b">
                          <td className={styles.p40}>{r.rfqNumber || r.id.slice(0, 8)}</td>
                          <td className="p-3"><Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge></td>
                          <td className="p-3">
                            {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                          </td>
                          <td className={styles.p41}>
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
    </RouteGuard>
  );
}
