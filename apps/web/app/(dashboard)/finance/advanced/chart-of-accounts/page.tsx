/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, FileText, ChevronRight, ChevronDown, Folder } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  balance: string;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'ASSET' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/accounts', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccount)
      });
      if (res.ok) {
        setShowModal(false);
        setNewAccount({ code: '', name: '', type: 'ASSET' });
        fetchAccounts();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || res.statusText || 'Unknown error';
        console.error('Failed to create account:', errMsg);
        alert('Failed to create account: ' + errMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderTree = (parentId: string | null, depth = 0) => {
    const children = accounts.filter(a => a.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div style={{ marginLeft: depth > 0 ? 'var(--space-4)' : 0 }}>
        {children.map(account => {
          const hasChildren = accounts.some(a => a.parentId === account.id);
          const isExpanded = expanded[account.id];

          return (
            <div key={account.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-2)', 
                  padding: 'var(--space-2)', 
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  marginTop: 'var(--space-2)'
                }}
              >
                {hasChildren ? (
                  <button onClick={() => toggleExpand(account.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <span style={{ width: 16 }} /> // Spacer
                )}
                
                {hasChildren ? <Folder size={16} style={{ color: 'var(--color-primary)' }} /> : <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />}
                
                <span style={{ fontWeight: hasChildren ? 'var(--weight-bold)' : 'var(--weight-medium)', flex: 1 }}>
                  {account.code} - {account.name}
                </span>
                
                <span style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)' }}>
                  {account.type}
                </span>
                
                <span style={{ fontWeight: 'var(--weight-bold)', minWidth: '100px', textAlign: 'right' }}>
                  ${parseFloat(account.balance).toFixed(2)}
                </span>
              </div>
              
              {isExpanded && renderTree(account.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BookOpen style={{ color: 'var(--color-primary)' }} />
            Chart of Accounts
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Hierarchical view of your ledger accounts and balances.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="frappe-btn frappe-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Plus size={16} /> New Account
        </button>
      </div>

      <div className="frappe-card frappe-card-body">
        {loading ? (
          <p>Loading...</p>
        ) : (
          renderTree(null)
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="frappe-card frappe-card-body" style={{ width: '400px', background: 'var(--color-bg)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)' }}>Create New Account</h2>
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label>Account Code</label>
                <input 
                  type="text" 
                  className="frappe-input"
                  value={newAccount.code} 
                  onChange={e => setNewAccount({...newAccount, code: e.target.value})} 
                  required 
                />
              </div>
              <div className="frappe-form-group">
                <label>Account Name</label>
                <input 
                  type="text" 
                  className="frappe-input"
                  value={newAccount.name} 
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="frappe-form-group">
                <label>Account Type</label>
                <select 
                  className="frappe-input"
                  value={newAccount.type} 
                  onChange={e => setNewAccount({...newAccount, type: e.target.value})}
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="frappe-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="frappe-btn frappe-btn-primary">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
