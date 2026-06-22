/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, ArrowRightLeft, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
}

interface Portfolio {
  id: string;
  name: string;
  assetClass: string;
  yieldRate: number | string;
  currentValue: number | string;
}

interface TreasuryTransaction {
  id: string;
  type: string;
  currency: string;
  date: string;
  amount: number | string;
  status: string;
}

export default function TreasuryPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [investmentData, setInvestmentData] = useState({ name: '', assetClass: 'EQUITY', yieldRate: '', currentValue: '' });
  const [transferData, setTransferData] = useState({ type: 'TRANSFER', amount: '', currency: 'USD', bankAccountId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [portRes, transRes, bankRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/investment-portfolios', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/treasury-transactions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/bank-accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (portRes.ok) setPortfolios((await portRes.json()) as Portfolio[]);
      if (transRes.ok) setTransactions((await transRes.json()) as TreasuryTransaction[]);
      if (bankRes.ok) setBankAccounts((await bankRes.json()) as BankAccount[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/investment-portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: investmentData.name,
          assetClass: investmentData.assetClass,
          yieldRate: parseFloat(investmentData.yieldRate) || 0,
          currentValue: parseFloat(investmentData.currentValue) || 0
        })
      });
      if (res.ok) {
        setShowInvestmentForm(false);
        setInvestmentData({ name: '', assetClass: 'EQUITY', yieldRate: '', currentValue: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to save investment: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/treasury-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: transferData.type,
          amount: parseFloat(transferData.amount) || 0,
          currency: transferData.currency,
          bankAccountId: transferData.bankAccountId || undefined,
          status: 'SETTLED',
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setShowTransferForm(false);
        setTransferData({ type: 'TRANSFER', amount: '', currency: 'USD', bankAccountId: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to record transfer: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Treasury & Investments</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Manage corporate cash flow, forex trades, and investment portfolios.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={() => setShowTransferForm(!showTransferForm)}><ArrowRightLeft style={{ marginRight: 'var(--space-2)' }} /> Transfer Funds</Button>
          <Button onClick={() => setShowInvestmentForm(!showInvestmentForm)}><TrendingUp style={{ marginRight: 'var(--space-2)' }} /> New Investment</Button>
        </div>
      </div>

      {showInvestmentForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>New Corporate Investment</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateInvestment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-4">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Investment Name</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required placeholder="Treasury Bond B-2" value={investmentData.name} onChange={e => setInvestmentData({ ...investmentData, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Asset Class</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={investmentData.assetClass} onChange={e => setInvestmentData({ ...investmentData, assetClass: e.target.value })}>
                    <option value="EQUITY">Equity (Stocks)</option>
                    <option value="FIXED_INCOME">Fixed Income (Bonds)</option>
                    <option value="CASH_EQUIVALENT">Cash Equivalents</option>
                    <option value="COMMODITY">Commodities</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Yield Rate (%)</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="5.5" value={investmentData.yieldRate} onChange={e => setInvestmentData({ ...investmentData, yieldRate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Initial Value</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="250000" value={investmentData.currentValue} onChange={e => setInvestmentData({ ...investmentData, currentValue: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowInvestmentForm(false)}>Cancel</Button>
                <Button type="submit">Save Investment</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showTransferForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Record Treasury Transaction / Transfer</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-4">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Transaction Type</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={transferData.type} onChange={e => setTransferData({ ...transferData, type: e.target.value })}>
                    <option value="TRANSFER">Inter-Account Transfer</option>
                    <option value="FOREX_BUY">Forex Purchase</option>
                    <option value="FOREX_SELL">Forex Sale</option>
                    <option value="INVESTMENT_BUY">Investment Purchase</option>
                    <option value="INVESTMENT_SELL">Investment Redemption</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Amount</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="50000" value={transferData.amount} onChange={e => setTransferData({ ...transferData, amount: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Currency</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={transferData.currency} onChange={e => setTransferData({ ...transferData, currency: e.target.value })}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Bank Account</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={transferData.bankAccountId} onChange={e => setTransferData({ ...transferData, bankAccountId: e.target.value })}>
                    <option value="">Select Account</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowTransferForm(false)}>Cancel</Button>
                <Button type="submit">Record Transaction</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-3">
        {/* Portfolios Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card className="border-primary/20">
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <Landmark className="text-emerald-700 dark:text-emerald-400" style={{ height: '20px', width: '20px' }} />
                </div>
                <h3 style={{ fontWeight: 'var(--weight-bold)' }}>Investment Portfolios</h3>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Portfolio Name</th>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Asset Class</th>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Yield Rate</th>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No active investment portfolios found.
                      </td>
                    </tr>
                  ) : (
                    portfolios.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-bold)' }}>{p.name}</td>
                        <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{p.assetClass}</td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>+{Number(p.yieldRate).toFixed(2)}%</td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>${Number(p.currentValue).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-primary/20">
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <ArrowRightLeft className="text-blue-700 dark:text-blue-400" style={{ height: '20px', width: '20px' }} />
                </div>
                <h3 style={{ fontWeight: 'var(--weight-bold)' }}>Recent Treasury Transactions</h3>
              </div>
            </div>
            <div className="p-0">
              {transactions.length === 0 ? (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No recent treasury trades or transfers.</div>
              ) : (
                <div className="divide-y">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="hover:bg-muted/30" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontWeight: 'var(--weight-medium)' }}>{tx.type} <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>({tx.currency})</span></p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>{new Date(tx.date).toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 'var(--weight-bold)' }}>${Number(tx.amount).toLocaleString()}</p>
                        <p style={{ fontWeight: 'var(--weight-medium)', marginTop: 'var(--space-1)' }}>{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Treasury Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-primary-light)' }}>
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)', color: 'var(--color-primary)' }}>Total Cash Position</h3>
              <p style={{ fontSize: 'var(--text-3xl)' }}>$0.00</p>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Sufficient liquidity for next 30 days
              </div>
            </div>
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Operating Cash</span>
                  <span style={{ fontWeight: 'var(--weight-medium)' }}>$0.00</span>
                </div>
                <div style={{ width: '100%', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Short-term Inv.</span>
                  <span style={{ fontWeight: 'var(--weight-medium)' }}>$0.00</span>
                </div>
                <div style={{ width: '100%', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
