'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Modal, TextField, FormField, Select,
  KPICard,
} from '@unerp/ui';
import {
  BookOpen, Plus, FileText, ChevronRight, ChevronDown, Folder,
  Search, Download, DollarSign, TrendingUp, TrendingDown, Scale,
  Edit2, Trash2, List, Calendar, AlertCircle, RefreshCw
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  balance: string;
  isActive?: boolean;
}

interface LedgerEntry {
  journalId: string;
  entryNumber: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  notes?: string;
}

interface LedgerData {
  account: { id: string; code: string; name: string; type: string };
  entries: LedgerEntry[];
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  entryCount: number;
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

function fmtBalance(b: string | number) {
  const val = typeof b === 'string' ? parseFloat(b) : b;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'ASSET', parentId: '' });
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState({ name: '', type: 'ASSET', parentId: '', isActive: true });
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Ledger state
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setEditForm({
      name: account.name,
      type: account.type,
      parentId: account.parentId || '',
      isActive: account.isActive !== false,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken() || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          parentId: editForm.parentId || null,
          isActive: editForm.isActive,
        }),
      });
      if (res.ok) {
        setEditOpen(false);
        setEditingAccount(null);
        fetchAccounts();
      }
    } catch { /* handled */ }
    finally { setUpdating(false); }
  };

  const confirmDelete = (account: Account) => {
    setDeletingAccount(account);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/accounts/${deletingAccount.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteOpen(false);
        setDeletingAccount(null);
        fetchAccounts();
      } else {
        setDeleteError(data.message || 'Failed to delete account.');
      }
    } catch {
      setDeleteError('An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  };

  const fetchLedger = async (account: Account) => {
    setActiveAccount(account);
    setLedgerLoading(true);
    setLedgerOpen(true);
    try {
      let url = `http://localhost:3001/api/v1/advanced-finance/accounts/${account.id}/ledger`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerData(data);
      }
    } catch { /* handled */ }
    finally { setLedgerLoading(false); }
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-hover)';
              const el = e.currentTarget.querySelector('.row-actions') as HTMLElement;
              if (el) el.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              const el = e.currentTarget.querySelector('.row-actions') as HTMLElement;
              if (el) el.style.opacity = '0';
            }}
          >
            {/* Expand/Collapse Toggle */}
            <div
              style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: hasChildren ? 'pointer' : 'default' }}
              onClick={hasChildren ? () => toggleExpand(account.id) : undefined}
            >
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
              {account.isActive === false && (
                <Badge variant="secondary" style={{ marginLeft: 8, fontSize: 10 }}>Inactive</Badge>
              )}
            </div>

            {/* Inline Hover Action Buttons */}
            <div className="row-actions" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity var(--duration-fast) ease', marginRight: 12 }}>
              <Button size="sm" variant="outline" onClick={() => fetchLedger(account)} title="View Ledger Card">
                <List size={12} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEdit(account)} title="Edit Account">
                <Edit2 size={12} />
              </Button>
              <Button size="sm" variant="outline" onClick={() => confirmDelete(account)} title="Delete Account" style={{ color: 'var(--color-danger)' }}>
                <Trash2 size={12} />
              </Button>
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
            <Button variant="outline" onClick={fetchAccounts}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
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

      {/* Edit Account Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Account"
        description="Update account properties and status" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={updating}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={updating}>
              {updating ? <><Spinner size="sm" /> Updating...</> : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {editingAccount && (
            <div style={{ background: 'var(--color-bg-sunken)', padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 8 }}>
              <strong>Code:</strong> {editingAccount.code} (Code cannot be modified)
            </div>
          )}
          <TextField label="Account Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <FormField label="Account Type" required>
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
              </Select>
            </FormField>
            <FormField label="Parent Account">
              <Select value={editForm.parentId} onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}>
                <option value="">— Root Account —</option>
                {accounts.filter(a => a.id !== editingAccount?.id).map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Account Status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="isActive" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
              <label htmlFor="isActive" style={{ fontSize: 13, cursor: 'pointer' }}>Active (Allows posting transactions)</label>
            </div>
          </FormField>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Ledger Account"
        description="Permanently remove this account from the chart of accounts" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="primary" onClick={handleDelete} disabled={deleting} style={{ background: 'var(--color-danger)' }}>
              {deleting ? <><Spinner size="sm" /> Deleting...</> : 'Confirm Delete'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deleteError && (
            <div style={{ display: 'flex', gap: 8, padding: 12, background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{deleteError}</div>
            </div>
          )}
          <p style={{ fontSize: 14, margin: 0 }}>
            Are you sure you want to delete account <strong>{deletingAccount?.code} - {deletingAccount?.name}</strong>?
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
            Note: You can only delete accounts that have no journal entries and no child accounts. If this account is already in use, deactivate it instead.
          </p>
        </div>
      </Modal>

      {/* Ledger Card Modal (Drill-Down Viewer) */}
      <Modal open={ledgerOpen} onClose={() => setLedgerOpen(false)} title={`Ledger Card: ${activeAccount?.code || ''}`}
        description={activeAccount?.name || ''} size="lg"
        footer={<Button variant="secondary" onClick={() => setLedgerOpen(false)}>Close</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Date Filters */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button variant="outline" onClick={() => activeAccount && fetchLedger(activeAccount)}>
              Filter Ledger
            </Button>
            <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); if (activeAccount) fetchLedger(activeAccount); }}>
              Reset
            </Button>
          </div>

          {ledgerLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><Spinner size="lg" /></div>
          ) : ledgerData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Ledger Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <KPICard title="Total Debits" value={fmtBalance(ledgerData.totalDebits)} color="var(--color-text)" />
                <KPICard title="Total Credits" value={fmtBalance(ledgerData.totalCredits)} color="var(--color-text)" />
                <KPICard title="Closing Balance" value={fmtBalance(ledgerData.closingBalance)} color={ledgerData.closingBalance >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'} />
              </div>

              {/* Transactions Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: 10 }}>Date</th>
                      <th style={{ padding: 10 }}>Ref #</th>
                      <th style={{ padding: 10 }}>Description</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Debit</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Credit</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                          No postings found for this period.
                        </td>
                      </tr>
                    ) : (
                      ledgerData.entries.map((entry, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 10 }}>{new Date(entry.date).toLocaleDateString()}</td>
                          <td style={{ padding: 10 }}>{entry.entryNumber}</td>
                          <td style={{ padding: 10 }}>
                            <div>{entry.description}</div>
                            {entry.notes && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{entry.notes}</div>}
                          </td>
                          <td style={{ padding: 10, textAlign: 'right', color: 'var(--color-success)' }}>
                            {entry.debit > 0 ? fmtBalance(entry.debit) : '—'}
                          </td>
                          <td style={{ padding: 10, textAlign: 'right', color: 'var(--color-danger)' }}>
                            {entry.credit > 0 ? fmtBalance(entry.credit) : '—'}
                          </td>
                          <td style={{ padding: 10, textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>
                            {fmtBalance(entry.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>
              Select dates and click filter to load ledger.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
