'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Modal, TextField, FormField, Select,
  KPICard,
} from '@unerp/ui';
import {
  BookOpen, Plus, FileText, ChevronRight, ChevronDown, Folder,
  Search, Download, DollarSign, TrendingUp, TrendingDown, Scale,
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  balance: string;
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  ASSET: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
  LIABILITY: { color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
  EQUITY: { color: 'var(--color-info)', bg: 'rgba(14,165,233,0.1)' },
  REVENUE: { color: 'var(--color-success)', bg: 'var(--color-success-light)' },
  EXPENSE: { color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
};

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function fmtBalance(b: string) {
  return `$${parseFloat(b).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'ASSET', parentId: '' });
  const [creating, setCreating] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/accounts', {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch { /* use empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.code || !newAccount.name) return;
    setCreating(true);
    try {
      const body: Record<string, string> = { code: newAccount.code, name: newAccount.name, type: newAccount.type };
      if (newAccount.parentId) body.parentId = newAccount.parentId;
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/accounts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken() || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCreateOpen(false);
        setNewAccount({ code: '', name: '', type: 'ASSET', parentId: '' });
        fetchAccounts();
      }
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    accounts.forEach((a) => { if (accounts.some(c => c.parentId === a.id)) map[a.id] = true; });
    setExpanded(map);
  };

  const collapseAll = () => setExpanded({});

  const totals = useMemo(() => {
    const byType: Record<string, number> = {};
    accounts.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + parseFloat(a.balance);
    });
    return byType;
  }, [accounts]);

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch = !search || a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const renderTree = (parentId: string | null, depth = 0): React.ReactNode => {
    const children = filteredAccounts.filter((a) => a.parentId === parentId);
    if (children.length === 0) return null;

    return children.map((account) => {
      const hasChildren = filteredAccounts.some((a) => a.parentId === account.id);
      const isExpanded = expanded[account.id];
      const tc = TYPE_COLORS[account.type] ?? { color: 'var(--color-text)', bg: 'var(--color-bg)' };
      const balance = parseFloat(account.balance);

      return (
        <div key={account.id}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              paddingLeft: `calc(var(--space-4) + ${depth * 24}px)`,
              borderBottom: '1px solid var(--color-border)',
              transition: 'background var(--duration-fast) var(--ease-default)',
              cursor: hasChildren ? 'pointer' : 'default',
            }}
            onClick={hasChildren ? () => toggleExpand(account.id) : undefined}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Expand/Collapse */}
            <div style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {hasChildren ? (
                isExpanded ? <ChevronDown size={16} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              ) : (
                <div style={{ width: 4, height: 4, borderRadius: 'var(--radius-full)', background: 'var(--color-border)' }} />
              )}
            </div>

            {/* Icon */}
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)',
              background: tc.bg, color: tc.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {hasChildren ? <Folder size={14} /> : <FileText size={14} />}
            </div>

            {/* Code & Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: hasChildren ? 'var(--weight-semibold)' : 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-text-tertiary)', marginRight: 'var(--space-2)' }}>{account.code}</span>
                {account.name}
              </span>
            </div>

            {/* Type Badge */}
            <Badge variant={account.type === 'REVENUE' ? 'success' : account.type === 'EXPENSE' ? 'warning' : account.type === 'LIABILITY' ? 'danger' : 'info'}>
              {account.type}
            </Badge>

            {/* Balance */}
            <span style={{
              fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', minWidth: 110, textAlign: 'right',
              color: balance >= 0 ? 'var(--color-text)' : 'var(--color-danger)',
            }}>
              {fmtBalance(account.balance)}
            </span>
          </div>

          {isExpanded && renderTree(account.id, depth + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Chart of Accounts"
        description="Hierarchical view of ledger accounts, balances, and account types"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Chart of Accounts' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => {}}>
              <Download size={14} style={{ marginRight: 6 }} /> Export
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> New Account
            </Button>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        <KPICard title="Total Assets" value={fmtBalance(String(totals.ASSET || 0))} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Liabilities" value={fmtBalance(String(totals.LIABILITY || 0))} icon={<TrendingDown size={18} />} color="var(--color-danger)" />
        <KPICard title="Total Equity" value={fmtBalance(String(totals.EQUITY || 0))} icon={<Scale size={18} />} color="var(--color-info)" />
        <KPICard title="Revenue" value={fmtBalance(String(totals.REVENUE || 0))} icon={<TrendingUp size={18} />} color="var(--color-success)" />
        <KPICard title="Expenses" value={fmtBalance(String(totals.EXPENSE || 0))} icon={<TrendingDown size={18} />} color="var(--color-warning)" />
      </div>

      {/* Toolbar */}
      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '6px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                border: '1px solid', borderColor: typeFilter === t ? 'var(--color-primary)' : 'var(--color-border)',
                background: typeFilter === t ? 'var(--color-primary-light)' : 'var(--color-bg)',
                color: typeFilter === t ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}>
                {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <button onClick={expandAll} style={{ padding: '6px 10px', fontSize: 'var(--text-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Expand All</button>
            <button onClick={collapseAll} style={{ padding: '6px 10px', fontSize: 'var(--text-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Collapse</button>
          </div>
        </div>
      </Card>

      {/* Account Tree */}
      <Card padding="none">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)',
        }}>
          <div style={{ width: 20 }} />
          <div style={{ width: 28 }} />
          <div style={{ flex: 1 }}>Account</div>
          <div style={{ width: 80, textAlign: 'center' }}>Type</div>
          <div style={{ width: 110, textAlign: 'right' }}>Balance</div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-tertiary)' }}>
            <BookOpen size={48} style={{ marginBottom: 'var(--space-3)', opacity: 0.3 }} />
            <p style={{ fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1)' }}>No accounts found</p>
            <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Create your first ledger account to get started.</p>
          </div>
        ) : (
          renderTree(null)
        )}

        {/* Footer */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{accounts.length} accounts total</span>
          <span>{accounts.filter(a => !a.parentId).length} root accounts</span>
        </div>
      </Card>

      {/* Create Account Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Account"
        description="Add a new ledger account to the chart of accounts" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate as any} disabled={creating}>
              {creating ? <><Spinner size="sm" /> Creating...</> : 'Create Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-3)' }}>
            <TextField label="Account Code" required placeholder="1000" value={newAccount.code} onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })} />
            <TextField label="Account Name" required placeholder="Cash & Equivalents" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Account Type" required>
              <Select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </Select>
            </FormField>
            <FormField label="Parent Account" hint="Leave empty for root account">
              <Select value={newAccount.parentId} onChange={(e) => setNewAccount({ ...newAccount, parentId: e.target.value })}>
                <option value="">— Root Account —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
