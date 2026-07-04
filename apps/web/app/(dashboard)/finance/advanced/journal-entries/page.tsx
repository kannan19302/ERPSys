'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Modal, TextField, FormField, Select,
  KPICard
} from '@unerp/ui';
import {
  ArrowUpDown, Plus, Save, X, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Send, CornerUpLeft, BookOpen, AlertCircle, RefreshCw
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
}

interface Dimension {
  id: string;
  name: string;
  code?: string;
}

interface JournalEntryLine {
  id?: string;
  accountId: string;
  account?: Account;
  debit: string;
  credit: string;
  description: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
}

interface Journal {
  id: string;
  entryNumber: string;
  date: string;
  notes: string;
  status: string; // DRAFT, SUBMITTED, APPROVED, POSTED, REJECTED, REVERSED
  entries: JournalEntryLine[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'info',
  SUBMITTED: 'warning',
  APPROVED: 'info',
  POSTED: 'success',
  REJECTED: 'danger',
  REVERSED: 'secondary',
};

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function fmtBalance(b: string | number) {
  const val = typeof b === 'string' ? parseFloat(b) : b;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedJournals, setExpandedJournals] = useState<Record<string, boolean>>({});

  // Form State
  const [entryNumber, setEntryNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { accountId: '', debit: '0', credit: '0', description: '' },
    { accountId: '', debit: '0', credit: '0', description: '' }
  ]);
  const [saving, setSaving] = useState(false);

  // Reversal Modal State
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reversingJournal, setReversingJournal] = useState<Journal | null>(null);
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split('T')[0]);
  const [reversing, setReversing] = useState(false);

  // Reject Modal State
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingJournal, setRejectingJournal] = useState<Journal | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${getToken() || ''}` };

      const [jourRes, accRes, ccRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/journals', { headers }),
        fetch('http://localhost:3001/api/v1/advanced-finance/accounts', { headers }),
        fetch('http://localhost:3001/api/v1/advanced-finance/cost-centers', { headers })
      ]);

      const [jourData, accData, ccData] = await Promise.all([
        jourRes.json(), accRes.json(), ccRes.json()
      ]);

      setJournals(Array.isArray(jourData) ? jourData : []);
      setAccounts(Array.isArray(accData) ? accData : []);
      setCostCenters(Array.isArray(ccData) ? ccData : []);
    } catch { /* use empty */ }
    finally { setLoading(false); }
  };

  const toggleExpand = (id: string) => {
    setExpandedJournals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: '0', credit: '0', description: '' }]);
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value } as JournalEntryLine;
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      alert(`Journal entries do not balance. Total debits (${totalDebits}) must equal total credits (${totalCredits}).`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        entryNumber: entryNumber || `JV-${Date.now()}`,
        notes,
        entries: lines.map(l => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
          costCenterId: l.costCenterId || undefined,
          departmentId: l.departmentId || undefined,
          projectId: l.projectId || undefined
        })).filter(l => l.accountId && (l.debit > 0 || l.credit > 0))
      };

      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken() || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setLines([
          { accountId: '', debit: '0', credit: '0', description: '' },
          { accountId: '', debit: '0', credit: '0', description: '' }
        ]);
        setEntryNumber('');
        setNotes('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Error saving journal');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowAction = async (id: string, action: string, body?: any) => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/journals/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken() || ''}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || `Failed to perform workflow action: ${action}`);
      }
    } catch {
      alert('Network error during workflow transaction');
    }
  };

  const startReversal = (journal: Journal) => {
    setReversingJournal(journal);
    setReversalDate(new Date().toISOString().split('T')[0]);
    setReverseOpen(true);
  };

  const handleReversal = async () => {
    if (!reversingJournal) return;
    setReversing(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/journals/${reversingJournal.id}/reverse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken() || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reversalDate })
      });
      if (res.ok) {
        setReverseOpen(false);
        setReversingJournal(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Reversal failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setReversing(false);
    }
  };

  const startRejection = (journal: Journal) => {
    setRejectingJournal(journal);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleRejection = async () => {
    if (!rejectingJournal || !rejectReason) return;
    setRejecting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/journals/${rejectingJournal.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken() || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        setRejectOpen(false);
        setRejectingJournal(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Rejection failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Journal Entries"
        description="Record manual accounting postings with approval and reversal workflows"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Journal Entries' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
            </Button>
            {!showForm && (
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={14} style={{ marginRight: 6 }} /> New Journal
              </Button>
            )}
          </div>
        }
      />

      {showForm && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', margin: 0, fontWeight: 'var(--weight-semibold)' }}>Create Journal Entry</h3>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              <X size={16} />
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <TextField label="Entry Number (Optional)" placeholder="JV-YYYYMMDD-XX" value={entryNumber} onChange={e => setEntryNumber(e.target.value)} />
            <TextField label="Notes / Reference" placeholder="Purpose of this manual posting" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={{ overflowX: 'auto', marginBottom: 'var(--space-4)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Account</th>
                  <th style={{ padding: 10 }}>Description</th>
                  <th style={{ padding: 10 }}>Cost Center</th>
                  <th style={{ padding: 10, textAlign: 'right', width: 120 }}>Debit</th>
                  <th style={{ padding: 10, textAlign: 'right', width: 120 }}>Credit</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 8 }}>
                      <select value={line.accountId} onChange={e => updateLine(idx, 'accountId', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                        <option value="">Select Account</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="text" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <select value={line.costCenterId || ''} onChange={e => updateLine(idx, 'costCenterId', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                        <option value="">None</option>
                        {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" min="0" step="0.01" value={line.debit} onChange={e => updateLine(idx, 'debit', e.target.value)} style={{ width: '100%', textAlign: 'right', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input type="number" min="0" step="0.01" value={line.credit} onChange={e => updateLine(idx, 'credit', e.target.value)} style={{ width: '100%', textAlign: 'right', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    </td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><X size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outline" onClick={addLine}>
              <Plus size={14} style={{ marginRight: 6 }} /> Add Row
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size="sm" /> Saving...</> : <><Save size={14} style={{ marginRight: 6 }} /> Save Journal</>}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!showForm && (
        <Card padding="none">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : journals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>
              <BookOpen size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>No journals found</p>
              <p style={{ fontSize: 13, margin: 0 }}>Create a new journal entry to begin manual ledger postings.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {journals.map(j => {
                const isExpanded = expandedJournals[j.id];
                const totalDebits = j.entries.reduce((s, e) => s + parseFloat(e.debit), 0);

                return (
                  <div key={j.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* Header Row */}
                    <div
                      style={{
                        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', transition: 'background var(--duration-fast) ease'
                      }}
                      onClick={() => toggleExpand(j.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-sunken)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 14 }}>{j.entryNumber}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          {new Date(j.date).toLocaleDateString()} — {j.notes}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 'bold' }}>{fmtBalance(totalDebits)}</span>
                        <Badge variant={STATUS_COLORS[j.status] as any}>{j.status}</Badge>
                      </div>
                    </div>

                    {/* Expandable Content (Lines & Workflow Buttons) */}
                    {isExpanded && (
                      <div style={{ background: 'var(--color-bg-sunken)', padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Lines Table */}
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-bg-elevated)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '8px 10px' }}>Account</th>
                                <th style={{ padding: '8px 10px' }}>Description</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Debit</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {j.entries.map((entry, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                  <td style={{ padding: '8px 10px', fontWeight: 'var(--weight-medium)' }}>
                                    {entry.account?.code ? `${entry.account.code} - ${entry.account.name}` : entry.accountId}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: 'var(--color-text-secondary)' }}>{entry.description}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--color-success)' }}>
                                    {parseFloat(entry.debit) > 0 ? fmtBalance(entry.debit) : '—'}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--color-danger)' }}>
                                    {parseFloat(entry.credit) > 0 ? fmtBalance(entry.credit) : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Workflow Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                          {j.status === 'DRAFT' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleWorkflowAction(j.id, 'submit')}>
                                <Send size={12} style={{ marginRight: 4 }} /> Submit for Approval
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleWorkflowAction(j.id, 'approve')}>
                                <CheckCircle size={12} style={{ marginRight: 4 }} /> Approve Directly
                              </Button>
                            </>
                          )}
                          {j.status === 'SUBMITTED' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => startRejection(j)}>
                                <XCircle size={12} style={{ marginRight: 4 }} /> Reject
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleWorkflowAction(j.id, 'approve')}>
                                <CheckCircle size={12} style={{ marginRight: 4 }} /> Approve
                              </Button>
                            </>
                          )}
                          {j.status === 'APPROVED' && (
                            <Button variant="primary" size="sm" onClick={() => handleWorkflowAction(j.id, 'post')}>
                              <CheckCircle size={12} style={{ marginRight: 4 }} /> Post to Ledger
                            </Button>
                          )}
                          {j.status === 'POSTED' && (
                            <Button variant="outline" size="sm" onClick={() => startReversal(j)} style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
                              <CornerUpLeft size={12} style={{ marginRight: 4 }} /> Reverse Journal
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Reversal Date Picker Modal */}
      <Modal open={reverseOpen} onClose={() => setReverseOpen(false)} title="Reverse Posted Journal"
        description="Creates a new balancing entry reversing the original debits and credits" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReverseOpen(false)} disabled={reversing}>Cancel</Button>
            <Button variant="primary" onClick={handleReversal} disabled={reversing}>
              {reversing ? <><Spinner size="sm" /> Reversing...</> : 'Perform Reversal'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, margin: 0 }}>
            Reversing journal <strong>{reversingJournal?.entryNumber}</strong> will create a counter-entry reversing all account balance updates.
          </p>
          <TextField label="Reversal Date" type="date" value={reversalDate} onChange={e => setReversalDate(e.target.value)} />
        </div>
      </Modal>

      {/* Reject Workflow Modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Journal Entry"
        description="Return this journal to draft status with feedback" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)} disabled={rejecting}>Cancel</Button>
            <Button variant="primary" onClick={handleRejection} disabled={rejecting || !rejectReason} style={{ background: 'var(--color-danger)' }}>
              {rejecting ? <><Spinner size="sm" /> Rejecting...</> : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, margin: 0 }}>
            Are you sure you want to reject journal <strong>{rejectingJournal?.entryNumber}</strong>?
          </p>
          <TextField label="Reason for Rejection" placeholder="Explain what changes are needed..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} required />
        </div>
      </Modal>
    </div>
  );
}
