/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard, Tabs,
} from '@unerp/ui';
import { Receipt, Plus, DollarSign, Clock, Scan, ShieldAlert, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  merchant?: string | null;
  amount: string | number;
  taxAmount: string | number;
  receiptUrl?: string | null;
  expenseDate: string;
  policyViolation: boolean;
  policyViolationReason?: string | null;
}

interface ExpenseReport {
  id: string;
  title: string;
  description?: string | null;
  totalAmount: string | number;
  status: string;
  hasPolicyViolation: boolean;
  requiresSecondApproval: boolean;
  employeeId: string;
  employee?: { firstName: string; lastName: string } | null;
  items: ExpenseItem[];
  createdAt: string;
}

const fmt = (n: number | string) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const statusVariant = (status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
  if (status === 'APPROVED' || status === 'PAID') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'SUBMITTED' || status === 'PENDING_SECOND_APPROVAL') return 'warning';
  return 'default';
};

export default function ExpenseManagementPage() {
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<ExpenseReport | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add-item form state
  const [itemCategory, setItemCategory] = useState('TRAVEL');
  const [itemDescription, setItemDescription] = useState('');
  const [itemMerchant, setItemMerchant] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemDate, setItemDate] = useState(new Date().toISOString().substring(0, 10));
  const [itemReceipt, setItemReceipt] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrScanning, setOcrScanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/expense-reports`, { headers: authHeaders() });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error('Failed to load expense reports', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshDetail = useCallback(async (id: string) => {
    const res = await fetch(`${API_BASE}/expense-reports/${id}`, { headers: authHeaders() });
    if (res.ok) setDetailReport(await res.json());
  }, []);

  const pending = reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'PENDING_SECOND_APPROVAL').length;
  const totalPending = reports
    .filter((r) => r.status === 'SUBMITTED' || r.status === 'PENDING_SECOND_APPROVAL')
    .reduce((a, r) => a + Number(r.totalAmount), 0);
  const violations = reports.filter((r) => r.hasPolicyViolation).length;

  const filtered = activeTab === 'all' ? reports : reports.filter((r) => r.status === activeTab);

  const createReport = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/expense-reports`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          employeeId: newEmployeeId,
          reportNumber: `EXP-${Date.now()}`,
          title: newTitle,
          description: newDescription || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCreateOpen(false);
      setNewTitle(''); setNewDescription(''); setNewEmployeeId('');
      await load();
    } catch (e) {
      console.error('Failed to create expense report', e);
    } finally {
      setSubmitting(false);
    }
  };

  const runOcrScan = async () => {
    setOcrScanning(true);
    try {
      const res = await fetch(`${API_BASE}/expenses/ocr-scan`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fileName: 'receipt.jpg', rawText: ocrText }),
      });
      const data = await res.json();
      if (data.extracted) {
        if (data.extracted.merchant) setItemMerchant(data.extracted.merchant);
        if (data.extracted.amount) setItemAmount(String(data.extracted.amount));
        if (data.extracted.date) setItemDate(data.extracted.date);
        if (data.extracted.suggestedCategory) setItemCategory(data.extracted.suggestedCategory);
      }
    } catch (e) {
      console.error('OCR scan failed', e);
    } finally {
      setOcrScanning(false);
    }
  };

  const addItem = async () => {
    if (!detailReport) return;
    try {
      const res = await fetch(`${API_BASE}/expense-reports/${detailReport.id}/items`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          category: itemCategory,
          description: itemDescription,
          merchant: itemMerchant || undefined,
          amount: Number(itemAmount),
          expenseDate: itemDate,
          receiptUrl: itemReceipt || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setItemDescription(''); setItemMerchant(''); setItemAmount(''); setItemReceipt(''); setOcrText('');
      await refreshDetail(detailReport.id);
      await load();
    } catch (e) {
      console.error('Failed to add expense item', e);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!detailReport) return;
    try {
      await fetch(`${API_BASE}/expense-items/${itemId}`, { method: 'DELETE', headers: authHeaders() });
      await refreshDetail(detailReport.id);
      await load();
    } catch (e) {
      console.error('Failed to delete expense item', e);
    }
  };

  const doAction = async (id: string, action: 'submit' | 'approve' | 'second-approve' | 'pay') => {
    try {
      await fetch(`${API_BASE}/expense-reports/${id}/${action}`, { method: 'POST', headers: authHeaders() });
      await load();
      if (detailReport?.id === id) await refreshDetail(id);
    } catch (e) {
      console.error(`Failed to ${action} report`, e);
    }
  };

  const columns: Column<ExpenseReport>[] = [
    {
      key: 'report', header: 'Expense Report',
      render: (row) => (
        <div style={{ cursor: 'pointer' }} onClick={() => refreshDetail(row.id)}>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
            {row.title} {row.hasPolicyViolation && <ShieldAlert size={13} style={{ color: 'var(--color-danger)', marginLeft: 4, display: 'inline' }} />}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId} · {row.items?.length || 0} items
          </div>
        </div>
      ),
    },
    { key: 'totalAmount', header: 'Amount', align: 'right' as const, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmt(row.totalAmount)}</span> },
    { key: 'createdAt', header: 'Created', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(row.createdAt).toLocaleDateString()}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={statusVariant(row.status)}>{row.status.replace(/_/g, ' ')}</Badge> },
    {
      key: 'actions', header: '', align: 'right' as const, width: '220px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
          {row.status === 'DRAFT' && <Button variant="secondary" onClick={() => doAction(row.id, 'submit')}>Submit</Button>}
          {row.status === 'SUBMITTED' && <Button variant="primary" onClick={() => doAction(row.id, 'approve')}>Approve</Button>}
          {row.status === 'PENDING_SECOND_APPROVAL' && <Button variant="primary" onClick={() => doAction(row.id, 'second-approve')}>2nd Approve</Button>}
          {row.status === 'APPROVED' && <Button variant="primary" onClick={() => doAction(row.id, 'pay')}>Mark Paid</Button>}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Expense Management" description="Employee expense reports, OCR receipt capture, policy enforcement, and reimbursement"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Expense Management' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Report</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Pending Approval" value={pending} icon={<Clock size={18} />} color="var(--color-warning)" />
        <KPICard title="Pending Amount" value={fmt(totalPending)} icon={<DollarSign size={18} />} color="var(--color-warning)" />
        <KPICard title="Policy Violations" value={violations} icon={<ShieldAlert size={18} />} color="var(--color-danger)" />
        <KPICard title="Total Reports" value={reports.length} icon={<Receipt size={18} />} color="var(--color-primary)" />
      </div>

      <Tabs tabs={[
        { key: 'all', label: 'All' }, { key: 'SUBMITTED', label: 'Pending' },
        { key: 'PENDING_SECOND_APPROVAL', label: '2nd Approval' },
        { key: 'APPROVED', label: 'Approved' }, { key: 'PAID', label: 'Paid' },
      ]} value={activeTab} onChange={setActiveTab} />

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} loading={loading}
          emptyTitle="No expense reports" emptyMessage="Submit your first expense report." emptyIcon={<Receipt size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Expense Report" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={createReport} disabled={submitting || !newTitle || !newEmployeeId}>Create</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Report Title" placeholder="Client Visit - Chicago" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <TextField label="Employee ID" required value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)} />
          <TextField label="Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
        </div>
      </Modal>

      <Modal open={!!detailReport} onClose={() => setDetailReport(null)} title={detailReport?.title || 'Expense Report'} size="lg"
        footer={<Button variant="secondary" onClick={() => setDetailReport(null)}>Close</Button>}
      >
        {detailReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant={statusVariant(detailReport.status)}>{detailReport.status.replace(/_/g, ' ')}</Badge>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>{fmt(detailReport.totalAmount)}</span>
            </div>

            <Card padding="sm">
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Line Items</div>
              {(detailReport.items || []).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)' }}>
                      {item.description} {item.policyViolation && <span title={item.policyViolationReason || ''}><ShieldAlert size={12} style={{ color: 'var(--color-danger)', display: 'inline', marginLeft: 4 }} /></span>}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{item.category} · {item.merchant || 'N/A'} · {new Date(item.expenseDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmt(item.amount)}</span>
                    {detailReport.status === 'DRAFT' && (
                      <Button variant="danger" onClick={() => deleteItem(item.id)}><Trash2 size={13} /></Button>
                    )}
                  </div>
                </div>
              ))}
              {(!detailReport.items || detailReport.items.length === 0) && (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>No items yet.</div>
              )}
            </Card>

            {detailReport.status === 'DRAFT' && (
              <Card padding="sm">
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Add Item</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <FormField label="Scan receipt text (simulated OCR)">
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <TextField placeholder="Paste receipt text here..." value={ocrText} onChange={(e) => setOcrText(e.target.value)} />
                      <Button variant="secondary" onClick={runOcrScan} disabled={ocrScanning || !ocrText}><Scan size={14} style={{ marginRight: 4 }} /> Scan</Button>
                    </div>
                  </FormField>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    <FormField label="Category">
                      <Select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                        <option value="TRAVEL">Travel</option><option value="MEALS">Meals</option>
                        <option value="OFFICE">Office</option><option value="UTILITIES">Utilities</option>
                        <option value="OTHER">Other</option>
                      </Select>
                    </FormField>
                    <TextField label="Merchant" value={itemMerchant} onChange={(e) => setItemMerchant(e.target.value)} />
                  </div>
                  <TextField label="Description" required value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    <TextField label="Amount" type="number" required value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} />
                    <TextField label="Date" type="date" required value={itemDate} onChange={(e) => setItemDate(e.target.value)} />
                  </div>
                  <TextField label="Receipt URL (optional)" value={itemReceipt} onChange={(e) => setItemReceipt(e.target.value)} />
                  <Button variant="primary" onClick={addItem} disabled={!itemDescription || !itemAmount}>Add Item</Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
