'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, StatusBadge } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
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

export default function BankFeedsConnectionsPage() {
  const client = useApiClient();
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
      setConnections(await client.get<BankConnection[]>('/advanced-finance/bank-feeds/connections'));
    } catch {
      alert('Unable to load bank connections.');
    }
  }, [client]);

  const fetchBankAccounts = useCallback(async () => {
    try {
      setBankAccounts(await client.get<BankAccount[]>('/advanced-finance/bank-accounts'));
    } catch {
      alert('Unable to load bank accounts.');
    }
  }, [client]);

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
      await client.post('/advanced-finance/bank-feeds/connections', {
          bankName: selectedBank,
          accountNumber: accountNumber || '•••• 5543',
          accountType,
          bankAccountId: targetBankAccountId,
          credentialsHash: 'plaid-mock-token-' + Math.random(),
        });
        setShowAddModal(false);
        setAccountNumber('');
        fetchConnections();
    } catch {
      alert('Unable to add the bank connection.');
      alert('Failed to connect feed');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this bank feed? All feed history will be deleted.')) return;
    try {
      await client.delete(`/advanced-finance/bank-feeds/connections/${id}`);
      fetchConnections();
    } catch {
      alert('Unable to delete the bank connection.');
    }
  };

  const handleSyncTransactions = async (id: string) => {
    setSyncingConnId(id);
    try {
      const data = await client.post<{ syncedCount: number }>(`/advanced-finance/bank-feeds/connections/${id}/sync`);
        alert(`Sync Complete! ${data.syncedCount} new transactions downloaded.`);
        fetchConnections();
    } catch {
      alert('Unable to sync the bank connection.');
      alert('Sync failed.');
    } finally {
      setSyncingConnId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between ui-items-start">
        <div>
          <h1 className="text-3xl">Bank Feeds & Connections</h1>
          <p className="ui-text-muted mt-1">
            Establish Plaid-style direct synchronization links with your external financial accounts to automate reconciliations.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} className="mr-2" />Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-2" />Add Direct Connection
          </Button>
        </div>
      </div>

      {/* Info Warning */}
      <div className={styles.s1}>
        <Info size={20} className={styles.s2} />
        <div>
          <span className={styles.s3}>Direct Bank Sync Protocol:</span> Direct connections leverage Plaid credentials to synchronise raw bank feeds. Unmatched deposits/withdrawals are held in the transaction matching bin.
        </div>
      </div>

      {/* Main List */}
      <Card className="ui-card">
        <div className={styles.s4}>
          <h3 className="ui-heading-base">Active direct feeds</h3>
        </div>

        {connections.length === 0 ? (
          <div className={styles.s5}>
            <Link2 size={36} className={styles.s6} />
            <p className={styles.s7}>No direct feeds connected yet</p>
            <p className={styles.s8}>Connect your first external bank to begin automating reconciliations.</p>
          </div>
        ) : (
          <div className="ui-flex-col">
            {connections.map((conn) => (
              <div key={conn.id} className={styles.s9}>
                <div className="ui-hstack-4">
                  <div className={styles.s10}>
                    <Building2 size={20} className="ui-text-primary" />
                  </div>
                  <div>
                    <div className="ui-hstack-2">
                      <span className="ui-heading-base">{conn.bankName}</span>
                      <span className={styles.s11}>
                        {conn.accountType}
                      </span>
                    </div>
                    <p className={styles.s12}>
                      Account: {conn.accountNumber} • Status: <span className={`${styles.connectionStatus} ${conn.status === 'ACTIVE' ? styles.connectionActive : styles.connectionInactive}`}>{conn.status}</span>
                    </p>
                    <p className="ui-text-xs-muted mt-1">
                      Last synced: {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="ui-flex ui-gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSyncTransactions(conn.id)} disabled={syncingConnId === conn.id}>
                    {syncingConnId === conn.id ? (
                      <>
                        <Loader2 size={14} className={`animate-spin ${styles.s13}`} />Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} className={styles.s14} />Sync Now
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteConnection(conn.id)} className={styles.s15}>
                    <Trash2 size={14} className={styles.s16} />Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Dialog */}
      {showAddModal && (
        <div className={styles.s17}>
          <Card className={`ui-card ${styles.s18}`}>
            <div className={styles.s19}>
              <h3 className="ui-heading-lg">Link External Bank Feed</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)} className={styles.s20}>Close</Button>
            </div>
            <form onSubmit={handleAddConnection} className="p-5 ui-stack-4">
              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Bank / Institution
                </label>
                <select
                  className="ui-input w-full"
                  value={selectedBank}
                  onChange={e => setSelectedBank(e.target.value)}
                >
                  <option value="Chase Bank">Chase Bank</option>
                  <option value="Wells Fargo">Wells Fargo</option>
                  <option value="Silicon Valley Bank">Silicon Valley Bank (SVB)</option>
                  <option value="Bank of America">Bank of America</option>
                  <option value="Citibank">Citibank</option>
                </select>
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Account Number (Last 4 digits)
                </label>
                <input
                  type="text"
                  className="ui-input w-full"
                  placeholder="e.g. 5543"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  maxLength={4}
                  required
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Account Type
                </label>
                <select
                  className="ui-input w-full"
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                >
                  <option value="CHECKING">Checking Account</option>
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CREDIT">Credit Card / Debt</option>
                </select>
              </div>

              <div className="ui-form-group">
                <label className="ui-label ui-label">
                  Target ERP Bank Account
                </label>
                <select
                  className="ui-input w-full"
                  value={targetBankAccountId}
                  onChange={e => setTargetBankAccountId(e.target.value)}
                  required
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map(ba => (
                    <option key={ba.id} value={ba.id}>{ba.bankName} - {ba.accountNumber}</option>
                  ))}
                </select>
              </div>

              <div className="ui-flex-end ui-gap-2 mt-2">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Establish Connection</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
