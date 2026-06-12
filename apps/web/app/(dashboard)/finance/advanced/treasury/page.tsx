/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, ArrowRightLeft, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

export default function TreasuryPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
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
      if (portRes.ok) setPortfolios(await portRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (bankRes.ok) setBankAccounts(await bankRes.json());
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treasury & Investments</h1>
          <p className="text-muted-foreground mt-1">Manage corporate cash flow, forex trades, and investment portfolios.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransferForm(!showTransferForm)}><ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Funds</Button>
          <Button onClick={() => setShowInvestmentForm(!showInvestmentForm)}><TrendingUp className="mr-2 h-4 w-4" /> New Investment</Button>
        </div>
      </div>

      {showInvestmentForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">New Corporate Investment</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateInvestment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Investment Name</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required placeholder="Treasury Bond B-2" value={investmentData.name} onChange={e => setInvestmentData({ ...investmentData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset Class</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={investmentData.assetClass} onChange={e => setInvestmentData({ ...investmentData, assetClass: e.target.value })}>
                    <option value="EQUITY">Equity (Stocks)</option>
                    <option value="FIXED_INCOME">Fixed Income (Bonds)</option>
                    <option value="CASH_EQUIVALENT">Cash Equivalents</option>
                    <option value="COMMODITY">Commodities</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Yield Rate (%)</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="5.5" value={investmentData.yieldRate} onChange={e => setInvestmentData({ ...investmentData, yieldRate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Value</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="250000" value={investmentData.currentValue} onChange={e => setInvestmentData({ ...investmentData, currentValue: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowInvestmentForm(false)}>Cancel</Button>
                <Button type="submit">Save Investment</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showTransferForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Record Treasury Transaction / Transfer</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={transferData.type} onChange={e => setTransferData({ ...transferData, type: e.target.value })}>
                    <option value="TRANSFER">Inter-Account Transfer</option>
                    <option value="FOREX_BUY">Forex Purchase</option>
                    <option value="FOREX_SELL">Forex Sale</option>
                    <option value="INVESTMENT_BUY">Investment Purchase</option>
                    <option value="INVESTMENT_SELL">Investment Redemption</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="50000" value={transferData.amount} onChange={e => setTransferData({ ...transferData, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={transferData.currency} onChange={e => setTransferData({ ...transferData, currency: e.target.value })}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Account</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={transferData.bankAccountId} onChange={e => setTransferData({ ...transferData, bankAccountId: e.target.value })}>
                    <option value="">Select Account</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowTransferForm(false)}>Cancel</Button>
                <Button type="submit">Record Transaction</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolios Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Landmark className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold">Investment Portfolios</h3>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-4 font-medium">Portfolio Name</th>
                    <th className="p-4 font-medium">Asset Class</th>
                    <th className="p-4 font-medium text-right">Yield Rate</th>
                    <th className="p-4 font-medium text-right">Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No active investment portfolios found.
                      </td>
                    </tr>
                  ) : (
                    portfolios.map(p => (
                      <tr key={p.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-bold">{p.name}</td>
                        <td className="p-4 text-xs tracking-wider uppercase text-muted-foreground">{p.assetClass}</td>
                        <td className="p-4 text-right text-emerald-600 font-medium">+{Number(p.yieldRate).toFixed(2)}%</td>
                        <td className="p-4 text-right font-bold text-primary">${Number(p.currentValue).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-primary/20">
            <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ArrowRightLeft className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                </div>
                <h3 className="font-bold">Recent Treasury Transactions</h3>
              </div>
            </div>
            <div className="p-0">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No recent treasury trades or transfers.</div>
              ) : (
                <div className="divide-y">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <p className="font-medium">{tx.type} <span className="text-muted-foreground text-xs font-normal">({tx.currency})</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(tx.date).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${Number(tx.amount).toLocaleString()}</p>
                        <p className="text-[10px] text-green-500 font-medium uppercase mt-1">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Treasury Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col border-primary/20 bg-primary/5">
            <div className="p-6 border-b border-primary/10">
              <h3 className="font-bold text-lg mb-1 text-primary">Total Cash Position</h3>
              <p className="text-3xl font-extrabold tracking-tight">$0.00</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Sufficient liquidity for next 30 days
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Operating Cash</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/2"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Short-term Inv.</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/4"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
