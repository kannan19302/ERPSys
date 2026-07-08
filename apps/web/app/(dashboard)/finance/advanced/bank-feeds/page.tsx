/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, StatusBadge } from '@unerp/ui';
import {
  RefreshCw, Plus, Trash2, ShieldAlert,
  Loader2, CheckCircle2, AlertCircle, Building2,
  Calendar, CreditCard, Link2, Info
} from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
}

interface BankConnection {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  status: string;
  lastSyncedAt: string | null;
  bankAccountId: string;
}

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export default function BankFeedsConnectionsPage() {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [selectedBank, setSelectedBank] = useState('Chase Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('CHECKING');
  const [targetBankAccountId, setTargetBankAccountId] = useState('');
  const [syncingConnId, setSyncingConnId] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/connections`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setConnections(await res.json() as BankConnection[]);
      }
    } catch (e) {
      console.error('Error fetching bank connections:', e);
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bank-accounts`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setBankAccounts(await res.json() as BankAccount[]);
      }
    } catch (e) {
      console.error('Error fetching bank accounts:', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConnections(), fetchBankAccounts()]);
    setLoading(false);
  }, [fetchConnections, fetchBankAccounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBankAccountId) {
      alert('Please select a target ERP Bank Account');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/connections`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          bankName: selectedBank,
          accountNumber: accountNumber || '•••• 5543',
          accountType,
          bankAccountId: targetBankAccountId,
          credentialsHash: 'plaid-mock-token-' + Math.random(),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setAccountNumber('');
        fetchConnections();
      } else {
        const err = await res.json() as { message?: string };
        alert(err.message || 'Failed to create connection');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect feed');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this bank feed? All feed history will be deleted.')) return;
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/connections/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        fetchConnections();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncTransactions = async (id: string) => {
    setSyncingConnId(id);
    try {
      const res = await fetch(`${API_BASE}/bank-feeds/connections/${id}/sync`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json() as { syncedCount: number };
        alert(`Sync Complete! ${data.syncedCount} new transactions downloaded.`);
        fetchConnections();
      } else {
        alert('Sync failed. Please verify credentials/token.');
      }
    } catch (e) {
      console.error(e);
      alert('Sync failed.');
    } finally {
      setSyncingConnId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Bank Feeds & Connections</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Establish Plaid-style direct synchronization links with your external financial accounts to automate reconciliations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />Add Direct Connection
          </Button>
        </div>
      </div>

      {/* Info Warning */}
      <div style={{
        display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-4)',
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--radius-lg)', alignItems: 'center', fontSize: 'var(--text-sm)'
      }}>
        <Info size={20} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-info)' }}>Direct Bank Sync Protocol:</span> Direct connections leverage Plaid credentials to synchronise raw bank feeds. Unmatched deposits/withdrawals are held in the transaction matching bin.
        </div>
      </div>

      {/* Main List */}
      <Card className="frappe-card">
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Active direct feeds</h3>
        </div>

        {connections.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <Link2 size={36} style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} />
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)' }}>No direct feeds connected yet</p>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Connect your first external bank to begin automating reconciliations.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {connections.map((conn) => (
              <div key={conn.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '1px solid var(--color-border)'
                  }}>
                    <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>{conn.bankName}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '2px 8px', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
                        {conn.accountType}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                      Account: {conn.accountNumber} • Status: <span style={{ color: conn.status === 'ACTIVE' ? '#22c55e' : '#ef4444', fontWeight: 'var(--weight-semibold)' }}>{conn.status}</span>
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                      Last synced: {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="outline" size="sm" onClick={() => handleSyncTransactions(conn.id)} disabled={syncingConnId === conn.id}>
                    {syncingConnId === conn.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" style={{ marginRight: '8px' }} />Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} style={{ marginRight: '8px' }} />Sync Now
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteConnection(conn.id)} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                    <Trash2 size={14} style={{ marginRight: '8px' }} />Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Dialog */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
          <Card className="frappe-card" style={{ width: '450px', background: 'var(--color-surface-primary)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Link External Bank Feed</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)} style={{ padding: 'var(--space-1)' }}>Close</Button>
            </div>
            <form onSubmit={handleAddConnection} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Bank / Institution
                </label>
                <select
                  className="frappe-input"
                  value={selectedBank}
                  onChange={e => setSelectedBank(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Chase Bank">Chase Bank</option>
                  <option value="Wells Fargo">Wells Fargo</option>
                  <option value="Silicon Valley Bank">Silicon Valley Bank (SVB)</option>
                  <option value="Bank of America">Bank of America</option>
                  <option value="Citibank">Citibank</option>
                </select>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Account Number (Last 4 digits)
                </label>
                <input
                  type="text"
                  className="frappe-input"
                  placeholder="e.g. 5543"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  maxLength={4}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Account Type
                </label>
                <select
                  className="frappe-input"
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="CHECKING">Checking Account</option>
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CREDIT">Credit Card / Debt</option>
                </select>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Target ERP Bank Account
                </label>
                <select
                  className="frappe-input"
                  value={targetBankAccountId}
                  onChange={e => setTargetBankAccountId(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map(ba => (
                    <option key={ba.id} value={ba.id}>{ba.bankName} - {ba.accountNumber}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Establish Connection</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
