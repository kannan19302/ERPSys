'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  RefreshCw, 
  ArrowUpDown, 
  DollarSign, 
  BookOpen, 
  Percent, 
  Landmark
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: string;
}

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
}

interface JournalEntryLine {
  id: string;
  debit: string;
  credit: string;
  account?: {
    code: string;
    name: string;
  };
}

interface Journal {
  id: string;
  entryNumber: string;
  date: string;
  notes: string;
  entries?: JournalEntryLine[];
}

interface Budget {
  id: string;
  amount: string;
  account?: {
    name: string;
    balance: string;
  };
}

interface Reconciliation {
  id: string;
  statementDate: string;
  status: string;
  statementBalance: string;
}

export default function AdvancedFinancePage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [activeTab, setActiveTab] = useState<'coa' | 'journals' | 'budgets' | 'reconciliation'>('coa');

  // Modal forms
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('ASSET');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [ratesRes, accountsRes, journalsRes, budgetsRes, reconRes] = await Promise.all([
        fetch('http://localhost:3001/advanced-finance/exchange-rates', { headers }),
        fetch('http://localhost:3001/advanced-finance/accounts', { headers }),
        fetch('http://localhost:3001/advanced-finance/journals', { headers }),
        fetch('http://localhost:3001/advanced-finance/budgets', { headers }),
        fetch('http://localhost:3001/advanced-finance/reconciliations', { headers }),
      ]);

      const [rates, accs, journs, buds, recons] = await Promise.all([
        ratesRes.json(), accountsRes.json(), journalsRes.json(), budgetsRes.json(), reconRes.json()
      ]);

      setExchangeRates(Array.isArray(rates) ? rates : []);
      setAccounts(Array.isArray(accs) ? accs : []);
      setJournals(Array.isArray(journs) ? journs : []);
      setBudgets(Array.isArray(buds) ? buds : []);
      setReconciliations(Array.isArray(recons) ? recons : []);

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountCode || !accountName) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/advanced-finance/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: accountCode, name: accountName, type: accountType })
      });
      if (res.ok) {
        setAccountCode('');
        setAccountName('');
        setShowAccountForm(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Error creating account');
      }
    } catch {
      alert('An error occurred creating account');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Financial Ledger...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Wallet style={{ color: 'var(--color-primary)' }} />
            Advanced Finance & Bookkeeping
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage double-entry ledger accounts, post journals, configure budgets, and reconcile bank statements.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('coa')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'coa' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'coa' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <BookOpen size={16} /> Chart of Accounts
        </button>
        <button 
          onClick={() => setActiveTab('journals')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'journals' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'journals' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <ArrowUpDown size={16} /> Journal Postings
        </button>
        <button 
          onClick={() => setActiveTab('budgets')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'budgets' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'budgets' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <DollarSign size={16} /> Budgeting
        </button>
        <button 
          onClick={() => setActiveTab('reconciliation')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'reconciliation' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'reconciliation' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Landmark size={16} /> Bank Reconciliation
        </button>
      </div>

      {/* Main Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Tab view */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'coa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Chart of Accounts</h2>
                <button 
                  onClick={() => setShowAccountForm(!showAccountForm)}
                  style={{
                    background: 'var(--color-primary)', color: '#ffffff', border: 'none',
                    padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'bold'
                  }}
                >
                  Create Account
                </button>
              </div>

              {showAccountForm && (
                <form onSubmit={handleCreateAccount} style={{ padding: 'var(--space-4)', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Code</label>
                    <input type="text" placeholder="1010" value={accountCode} onChange={(e) => setAccountCode(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px', fontSize: 'var(--text-xs)' }} />
                  </div>
                  <div style={{ flex: 2, minWidth: '200px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Account Name</label>
                    <input type="text" placeholder="Petty Cash" value={accountName} onChange={(e) => setAccountName(e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px', fontSize: 'var(--text-xs)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Type</label>
                    <select value={accountType} onChange={(e) => setAccountType(e.target.value)} style={{ width: '120px', padding: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px', fontSize: 'var(--text-xs)' }}>
                      <option value="ASSET">Asset</option>
                      <option value="LIABILITY">Liability</option>
                      <option value="EQUITY">Equity</option>
                      <option value="REVENUE">Revenue</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                  <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', padding: 'var(--space-2) var(--space-4)', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                    Save
                  </button>
                </form>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Code</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Name</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Type</th>
                    <th style={{ padding: 'var(--space-2.5)', textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{acc.code}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>{acc.name}</td>
                      <td style={{ padding: 'var(--space-2.5)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>{acc.type}</span>
                      </td>
                      <td style={{ padding: 'var(--space-2.5)', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(acc.balance).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'journals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Posted Journals</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {journals.map(j => (
                  <div key={j.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>Entry: {j.entryNumber}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(j.date).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Notes: {j.notes}</p>
                    
                    {/* Entry lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {j.entries?.map((e: JournalEntryLine) => (
                        <div key={e.id} style={{ display: 'flex', justifyItems: 'space-between', fontSize: 'var(--text-xs)' }}>
                          <span style={{ flex: 2 }}>{e.account?.name} ({e.account?.code})</span>
                          <span style={{ flex: 1, textAlign: 'right', color: parseFloat(e.debit) > 0 ? 'var(--color-primary)' : 'inherit' }}>
                            {parseFloat(e.debit) > 0 ? `$${parseFloat(e.debit).toFixed(2)}` : ''}
                          </span>
                          <span style={{ flex: 1, textAlign: 'right' }}>
                            {parseFloat(e.credit) > 0 ? `$${parseFloat(e.credit).toFixed(2)}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Budgets vs. Actuals</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2.5)' }}>Account</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Budgeted Amount</th>
                    <th style={{ padding: 'var(--space-2.5)' }}>Actual Balance</th>
                    <th style={{ padding: 'var(--space-2.5)', textAlign: 'right' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(b => {
                    const variance = parseFloat(b.amount) - parseFloat(b.account?.balance || '0');
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-2.5)', fontWeight: 'bold' }}>{b.account?.name}</td>
                        <td style={{ padding: 'var(--space-2.5)' }}>${parseFloat(b.amount).toFixed(2)}</td>
                        <td style={{ padding: 'var(--space-2.5)' }}>${parseFloat(b.account?.balance || '0').toFixed(2)}</td>
                        <td style={{ padding: 'var(--space-2.5)', textAlign: 'right', color: variance < 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>
                          ${variance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reconciliation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Bank Statement Reconciliations</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
                {reconciliations.map(recon => (
                  <div key={recon.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>Statement Date: {new Date(recon.statementDate).toLocaleDateString()}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Status: {recon.status}</p>
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      Balance: ${parseFloat(recon.statementBalance).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Exchange Rates */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Percent size={16} style={{ color: 'var(--color-primary)' }} />
            Currency Exchange Rates
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {exchangeRates.map(rate => (
              <div key={rate.id} style={{ display: 'flex', justifyItems: 'space-between', fontSize: 'var(--text-xs)', padding: 'var(--space-2) 0', borderBottom: '1px dashed var(--color-border)', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>{rate.fromCurrency} / {rate.toCurrency}</span>
                <span>{parseFloat(rate.rate).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
