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

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Bank Accounts</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Manage treasury, bank accounts, and petty cash.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus style={{ marginRight: 'var(--space-2)' }} />
          Add Bank Account
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Register New Bank Account</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Bank Name</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="Chase Bank" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Account Number / IBAN</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="1234567890" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <option value="">Select Currency</option>
                    
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Linked GL Account</label>
                  <select value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })} className="h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                    <option value="">Select GL Account</option>
                    
                      {glAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-4)' }}>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Account</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-3">
        {bankAccounts.map(account => {
          const glAcc = glAccounts.find(g => g.id === account.accountId);
          return (
            <Card key={account.id} className="hover:border-primary/30 transition-colors">
              <div style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
                  <div className="bg-green-100 dark:bg-green-900/30" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)' }}>
                    <Landmark className="text-green-700 dark:text-green-400" style={{ height: '24px', width: '24px' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>{account.currency}</p>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${account.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {account.status}
                    </div>
                  </div>
                </div>
                <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xl)' }}>{account.bankName}</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>**** {account.accountNumber.slice(-4) || account.accountNumber}</p>
                
                <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>GL: {glAcc ? glAcc.code : 'Unlinked'}</span>
                  <Button variant="ghost" className="px-0 h-auto">View Ledger <ArrowRight className="ml-1 h-3 w-3" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
        
        {bankAccounts.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <Wallet style={{ marginBottom: 'var(--space-3)' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)' }}>No bank accounts setup</h3>
            <p style={{ fontSize: 'var(--text-sm)' }}>Add your corporate bank accounts to start managing treasury.</p>
          </div>
        )}
      </div>
    </div>
  );
}
