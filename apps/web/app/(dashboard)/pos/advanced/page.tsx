'use client';

import React, { useState } from 'react';
import {
  Store, RotateCcw, Gift, Monitor, WifiOff, Plus,
  Percent, Clock, Award, ShoppingCart, ArrowLeft, Zap
} from 'lucide-react';

interface ReturnItem {
  id: string;
  originalOrderNo: string;
  productName: string;
  qty: number;
  refundAmount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REFUNDED' | 'REJECTED';
  createdAt: string;
}

interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalSpent: number;
  lastVisit: string;
}

interface Promotion {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED' | 'BOGO' | 'BUNDLE';
  value: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';
  appliedCount: number;
}

interface Terminal {
  id: string;
  name: string;
  code: string;
  store: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  currentCashier: string | null;
  lastSync: string;
  registerStatus: 'OPEN' | 'CLOSED';
}

export default function POSAdvancedPage() {
  const [activeTab, setActiveTab] = useState<'returns' | 'loyalty' | 'promotions' | 'terminals' | 'offline'>('returns');

  const [returns] = useState<ReturnItem[]>([
    { id: 'ret-1', originalOrderNo: 'POS-2026-0842', productName: 'Wireless Mouse Pro', qty: 1, refundAmount: 45.99, reason: 'Defective', status: 'PENDING', createdAt: '2026-06-14' },
    { id: 'ret-2', originalOrderNo: 'POS-2026-0838', productName: 'USB-C Hub 7-port', qty: 2, refundAmount: 79.98, reason: 'Wrong item shipped', status: 'APPROVED', createdAt: '2026-06-13' },
    { id: 'ret-3', originalOrderNo: 'POS-2026-0830', productName: 'Ergonomic Keyboard', qty: 1, refundAmount: 129.99, reason: 'Customer changed mind', status: 'REFUNDED', createdAt: '2026-06-12' },
    { id: 'ret-4', originalOrderNo: 'POS-2026-0825', productName: 'Monitor Stand', qty: 1, refundAmount: 34.99, reason: 'Damaged in transit', status: 'REJECTED', createdAt: '2026-06-11' },
  ]);

  const [loyaltyMembers] = useState<LoyaltyMember[]>([
    { id: 'lm-1', name: 'Alice Thompson', email: 'alice@example.com', points: 12500, tier: 'PLATINUM', totalSpent: 8750, lastVisit: '2026-06-14' },
    { id: 'lm-2', name: 'Bob Martinez', email: 'bob@example.com', points: 7200, tier: 'GOLD', totalSpent: 5400, lastVisit: '2026-06-12' },
    { id: 'lm-3', name: 'Carol Davis', email: 'carol@example.com', points: 3800, tier: 'SILVER', totalSpent: 2650, lastVisit: '2026-06-10' },
    { id: 'lm-4', name: 'David Kim', email: 'david@example.com', points: 1200, tier: 'BRONZE', totalSpent: 890, lastVisit: '2026-06-08' },
    { id: 'lm-5', name: 'Eva Chen', email: 'eva@example.com', points: 9500, tier: 'GOLD', totalSpent: 6200, lastVisit: '2026-06-13' },
  ]);

  const [promotions] = useState<Promotion[]>([
    { id: 'promo-1', name: 'Summer Flash Sale', type: 'PERCENTAGE', value: 20, startDate: '2026-06-15', endDate: '2026-06-30', status: 'SCHEDULED', appliedCount: 0 },
    { id: 'promo-2', name: 'Buy 2 Get 1 Free', type: 'BOGO', value: 0, startDate: '2026-06-01', endDate: '2026-06-30', status: 'ACTIVE', appliedCount: 156 },
    { id: 'promo-3', name: '$10 Off Orders Over $50', type: 'FIXED', value: 10, startDate: '2026-06-01', endDate: '2026-06-14', status: 'ACTIVE', appliedCount: 89 },
    { id: 'promo-4', name: 'Tech Bundle Discount', type: 'BUNDLE', value: 15, startDate: '2026-05-01', endDate: '2026-05-31', status: 'EXPIRED', appliedCount: 234 },
  ]);

  const [terminals] = useState<Terminal[]>([
    { id: 'term-1', name: 'Checkout 1', code: 'POS-CHK-01', store: 'Main Store', status: 'ONLINE', currentCashier: 'Sarah M.', lastSync: '2026-06-14 14:32', registerStatus: 'OPEN' },
    { id: 'term-2', name: 'Checkout 2', code: 'POS-CHK-02', store: 'Main Store', status: 'ONLINE', currentCashier: 'James P.', lastSync: '2026-06-14 14:31', registerStatus: 'OPEN' },
    { id: 'term-3', name: 'Self-Service Kiosk', code: 'POS-SSK-01', store: 'Main Store', status: 'ONLINE', currentCashier: null, lastSync: '2026-06-14 14:30', registerStatus: 'CLOSED' },
    { id: 'term-4', name: 'Warehouse POS', code: 'POS-WH-01', store: 'Warehouse', status: 'OFFLINE', currentCashier: null, lastSync: '2026-06-14 10:15', registerStatus: 'CLOSED' },
    { id: 'term-5', name: 'Mobile Cart', code: 'POS-MOB-01', store: 'Pop-up', status: 'MAINTENANCE', currentCashier: null, lastSync: '2026-06-13 18:00', registerStatus: 'CLOSED' },
  ]);

  const tierColor = (tier: string) => {
    const colors: Record<string, string> = { BRONZE: 'hsl(30, 60%, 50%)', SILVER: 'hsl(0, 0%, 60%)', GOLD: 'hsl(45, 80%, 50%)', PLATINUM: 'hsl(260, 60%, 55%)' };
    return colors[tier] || 'var(--color-text-secondary)';
  };

  const statusStyles = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
      PENDING: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
      APPROVED: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
      REFUNDED: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
      REJECTED: { color: 'var(--color-error)', bg: 'var(--color-error-light)' },
      ACTIVE: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
      SCHEDULED: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
      EXPIRED: { color: 'var(--color-text-tertiary)', bg: 'var(--color-bg)' },
      ONLINE: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
      OFFLINE: { color: 'var(--color-error)', bg: 'var(--color-error-light)' },
      MAINTENANCE: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    };
    return map[status] || { color: 'var(--color-text)', bg: 'var(--color-bg)' };
  };

  const tabs = [
    { id: 'returns' as const, label: 'Returns & Refunds', icon: <RotateCcw size={14} /> },
    { id: 'loyalty' as const, label: 'Loyalty Program', icon: <Gift size={14} /> },
    { id: 'promotions' as const, label: 'Promotions Engine', icon: <Percent size={14} /> },
    { id: 'terminals' as const, label: 'Multi-Terminal', icon: <Monitor size={14} /> },
    { id: 'offline' as const, label: 'Offline Mode', icon: <WifiOff size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Store style={{ color: 'var(--color-primary)' }} />
          POS Advanced Features
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Returns & credit notes, customer loyalty, promotions engine, multi-terminal management, and offline sync.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', whiteSpace: 'nowrap'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Returns & Refunds */}
      {activeTab === 'returns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Return Requests</h3>
            <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ArrowLeft size={14} /> Process Return
            </button>
          </div>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {['Order #', 'Product', 'Qty', 'Refund', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{r.originalOrderNo}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.productName}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.qty}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)' }}>${r.refundAmount.toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '12px' }}>{r.reason}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)', ...statusStyles(r.status) }}>{r.status}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px' }}>Approve</button>
                          <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px' }}>Reject</button>
                        </div>
                      )}
                      {r.status === 'APPROVED' && (
                        <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px' }}>Issue Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loyalty Program */}
      {activeTab === 'loyalty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
            {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(tier => {
              const count = loyaltyMembers.filter(m => m.tier === tier).length;
              return (
                <div key={tier} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', textAlign: 'center' }}>
                  <Award size={24} style={{ color: tierColor(tier), margin: '0 auto var(--space-1)' }} />
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: tierColor(tier) }}>{count}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{tier}</div>
                </div>
              );
            })}
          </div>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {['Member', 'Tier', 'Points', 'Total Spent', 'Last Visit'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loyaltyMembers.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 'var(--weight-semibold)' }}>{m.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{m.email}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)', color: tierColor(m.tier), background: 'var(--color-bg)' }}>{m.tier}</span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-bold)' }}>{m.points.toLocaleString()} pts</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>${m.totalSpent.toLocaleString()}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{m.lastVisit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotions Engine */}
      {activeTab === 'promotions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Active & Scheduled Promotions</h3>
            <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={14} /> Create Promotion
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {promotions.map(p => (
              <div key={p.id} style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{p.name}</div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{p.type.replace('_', ' ')}</span>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)', ...statusStyles(p.status) }}>{p.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Value</div><div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{p.type === 'PERCENTAGE' ? `${p.value}%` : p.type === 'FIXED' ? `$${p.value}` : p.type === 'BOGO' ? 'Buy 2 Get 1' : `${p.value}% bundle`}</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Used</div><div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{p.appliedCount} times</div></div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />{p.startDate} → {p.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Terminal Management */}
      {activeTab === 'terminals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {terminals.map(t => (
              <div key={t.id} style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Monitor size={20} style={{ color: statusStyles(t.status).color }} />
                    <div>
                      <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{t.code} • {t.store}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)', ...statusStyles(t.status) }}>{t.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Cashier</div><div style={{ fontSize: 'var(--text-sm)' }}>{t.currentCashier || '—'}</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Register</div><div style={{ fontSize: 'var(--text-sm)' }}>{t.registerStatus}</div></div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                  Last sync: {t.lastSync}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Mode */}
      {activeTab === 'offline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <WifiOff size={28} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>Ready</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Offline Mode Status</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <ShoppingCart size={28} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>0</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Queued Transactions</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <Zap size={28} style={{ color: 'var(--color-warning)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>2.4 MB</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Cached Product Data</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Offline Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Enable Offline POS Transactions', desc: 'Queue sales when internet is unavailable', enabled: true },
                { label: 'Auto-Sync on Reconnect', desc: 'Automatically reconcile queued transactions when back online', enabled: true },
                { label: 'Cache Product Catalog', desc: 'Store full product catalog in IndexedDB for offline product lookup', enabled: true },
                { label: 'Offline Payment Capture', desc: 'Capture card details offline for later processing (PCI compliant)', enabled: false },
                { label: 'Conflict Resolution', desc: 'Auto-resolve stock level conflicts using server-wins strategy', enabled: true },
              ].map((opt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                  </div>
                  <div style={{
                    width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
                    background: opt.enabled ? 'var(--color-primary)' : 'var(--color-border)',
                    position: 'relative', transition: 'background 0.2s ease'
                  }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '2px',
                      left: opt.enabled ? '20px' : '2px',
                      transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Sync History</h3>
            {[
              { time: '2026-06-14 14:30', direction: 'UP', count: 12, status: 'SUCCESS' },
              { time: '2026-06-14 10:15', direction: 'UP', count: 8, status: 'SUCCESS' },
              { time: '2026-06-14 09:00', direction: 'DOWN', count: 450, status: 'SUCCESS' },
              { time: '2026-06-13 18:30', direction: 'UP', count: 23, status: 'PARTIAL' },
            ].map((sync, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)' }}>{sync.time}</span>
                  <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)', fontSize: '11px' }}>{sync.direction === 'UP' ? '↑ Upload' : '↓ Download'} ({sync.count} records)</span>
                </div>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  color: sync.status === 'SUCCESS' ? 'var(--color-success)' : 'var(--color-warning)',
                  background: sync.status === 'SUCCESS' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                  fontWeight: 'var(--weight-semibold)'
                }}>{sync.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
