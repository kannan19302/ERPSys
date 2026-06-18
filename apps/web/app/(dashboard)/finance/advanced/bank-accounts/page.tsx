/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Wallet, Landmark, Loader2, ArrowRight } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  status: string;
  accountId?: string;
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    bankName: '',
    accountNumber: '',
    currency: 'USD'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [banksRes, glRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/bank-accounts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (banksRes.ok) setBankAccounts(await banksRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (glRes.ok) {
        const data = await glRes.json();
        const assetAccounts = (data as GLAccount[]).filter(a => a.type === 'ASSET');
        setGlAccounts(assetAccounts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ accountId: '', bankName: '', accountNumber: '', currency: 'USD' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage treasury, bank accounts, and petty cash.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Register New Bank Account</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Bank Name</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="Chase Bank" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Account Number / IBAN</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="1234567890" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select Currency</option>
                    
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Linked GL Account</label>
                  <select value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select GL Account</option>
                    
                      {glAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Account</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map(account => {
          const glAcc = glAccounts.find(g => g.id === account.accountId);
          return (
            <Card key={account.id} className="hover:border-primary/30 transition-colors">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Landmark className="h-6 w-6 text-green-700 dark:text-green-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-muted-foreground">{account.currency}</p>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${account.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {account.status}
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-xl">{account.bankName}</h3>
                <p className="font-mono text-muted-foreground mt-1 tracking-widest text-sm">**** {account.accountNumber.slice(-4) || account.accountNumber}</p>
                
                <div className="mt-6 pt-4 border-t flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">GL: {glAcc ? glAcc.code : 'Unlinked'}</span>
                  <Button variant="ghost" className="px-0 h-auto">View Ledger <ArrowRight className="ml-1 h-3 w-3" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
        
        {bankAccounts.length === 0 && !showForm && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">No bank accounts setup</h3>
            <p className="text-sm">Add your corporate bank accounts to start managing treasury.</p>
          </div>
        )}
      </div>
    </div>
  );
}
