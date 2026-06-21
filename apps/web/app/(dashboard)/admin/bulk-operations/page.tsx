'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers, Users, Package, Briefcase, FileText, ArrowRight, ArrowLeft,
  Trash2, RefreshCw, UserCheck, CheckCircle, AlertTriangle, Play,
  Clock, ChevronDown, Plus, X, History, Loader2,
} from 'lucide-react';

interface BulkOperation {
  id: string;
  entityType: string;
  operationType: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  criteria: Record<string, unknown>;
  changes: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

interface EntityCounts {
  Customer: number;
  Vendor: number;
  Product: number;
  Employee: number;
  Invoice: number;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  Customer: <Users size={28} />,
  Vendor: <Briefcase size={28} />,
  Product: <Package size={28} />,
  Employee: <UserCheck size={28} />,
  Invoice: <FileText size={28} />,
};

const OP_DESCRIPTIONS: Record<string, string> = {
  MASS_UPDATE: 'Update fields across all matching records in bulk.',
  MASS_DELETE: 'Permanently remove all matching records.',
  MASS_TRANSFER: 'Transfer ownership of matching records to another user.',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  PROCESSING: { bg: '#dbeafe', color: '#1e40af' },
  COMPLETED: { bg: '#d1fae5', color: '#065f46' },
  FAILED: { bg: '#fee2e2', color: '#991b1b' },
};

export default function BulkOperationsPage() {
  const [tab, setTab] = useState<'wizard' | 'history'>('wizard');
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [operationType, setOperationType] = useState('');
  const [criteria, setCriteria] = useState('{}');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [updateFields, setUpdateFields] = useState<{ field: string; value: string }[]>([{ field: '', value: '' }]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [transferOwner, setTransferOwner] = useState('');
  const [entityCounts, setEntityCounts] = useState<EntityCounts | null>(null);
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [executing, setExecuting] = useState(false);
  const [activeOp, setActiveOp] = useState<BulkOperation | null>(null);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEntityCounts = async () => {
    try {
      const res = await fetch('/api/v1/admin/bulk-operations/entity-counts', { headers: authHeaders() });
      if (res.ok) setEntityCounts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/bulk-operations', { headers: authHeaders() });
      if (res.ok) setOperations(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchEntityCounts(); fetchOperations(); }, []);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  const previewCriteria = async () => {
    setPreviewLoading(true);
    try {
      JSON.parse(criteria);
      const res = await fetch('/api/v1/admin/bulk-operations/entity-counts', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPreviewCount(data[entityType] ?? 0);
      }
    } catch {
      setPreviewCount(null);
    }
    setPreviewLoading(false);
  };

  const executeOperation = async () => {
    setExecuting(true);
    try {
      const body: Record<string, unknown> = { entityType, operationType, criteria: JSON.parse(criteria) };
      if (operationType === 'MASS_UPDATE') body.changes = updateFields.filter(f => f.field);
      if (operationType === 'MASS_TRANSFER') body.newOwner = transferOwner;
      const res = await fetch('/api/v1/admin/bulk-operations', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) {
        const op = await res.json();
        setActiveOp(op);
        setStep(6);
        const iv = setInterval(async () => {
          try {
            const r = await fetch(`/api/v1/admin/bulk-operations/${op.id}`, { headers: authHeaders() });
            if (r.ok) {
              const updated = await r.json();
              setActiveOp(updated);
              if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
                clearInterval(iv);
                setPollInterval(null);
                fetchOperations();
              }
            }
          } catch { /* ignore */ }
        }, 2000);
        setPollInterval(iv);
      }
    } catch (e) { console.error(e); }
    setExecuting(false);
  };

  const resetWizard = () => {
    setStep(1); setEntityType(''); setOperationType(''); setCriteria('{}');
    setPreviewCount(null); setUpdateFields([{ field: '', value: '' }]);
    setDeleteConfirm(false); setTransferOwner(''); setActiveOp(null);
  };

  const canNext = (): boolean => {
    if (step === 1) return !!entityType;
    if (step === 2) return !!operationType;
    if (step === 3) { try { JSON.parse(criteria); return true; } catch { return false; } }
    if (step === 4) {
      if (operationType === 'MASS_UPDATE') return updateFields.some(f => f.field && f.value);
      if (operationType === 'MASS_DELETE') return deleteConfirm;
      if (operationType === 'MASS_TRANSFER') return !!transferOwner;
    }
    return true;
  };

  const card = (s: React.CSSProperties = {}): React.CSSProperties => ({
    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', ...s,
  });

  const btnPrimary: React.CSSProperties = {
    background: 'var(--color-primary)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)',
    fontWeight: 'var(--weight-semibold)' as never, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
  };

  const btnOutline: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  };

  const renderStep = () => {
    if (step === 1) return (
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
          Step 1: Select Entity Type
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {(['Customer', 'Vendor', 'Product', 'Employee', 'Invoice'] as const).map(e => (
            <div key={e} onClick={() => setEntityType(e)} style={{
              ...card(), cursor: 'pointer', textAlign: 'center',
              borderColor: entityType === e ? 'var(--color-primary)' : 'var(--color-border)',
              boxShadow: entityType === e ? '0 0 0 2px var(--color-primary)' : 'none',
            }}>
              <div style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>
                {ENTITY_ICONS[e]}
              </div>
              <div style={{ fontWeight: 'var(--weight-semibold)' as never, fontSize: 'var(--text-sm)' }}>{e}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                {entityCounts ? `${entityCounts[e].toLocaleString()} records` : '...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (step === 2) return (
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
          Step 2: Choose Operation
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {(['MASS_UPDATE', 'MASS_DELETE', 'MASS_TRANSFER'] as const).map(op => (
            <div key={op} onClick={() => setOperationType(op)} style={{
              ...card({ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }),
              borderColor: operationType === op ? 'var(--color-primary)' : 'var(--color-border)',
              boxShadow: operationType === op ? '0 0 0 2px var(--color-primary)' : 'none',
            }}>
              <div style={{ color: op === 'MASS_DELETE' ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                {op === 'MASS_UPDATE' ? <RefreshCw size={24} /> : op === 'MASS_DELETE' ? <Trash2 size={24} /> : <UserCheck size={24} />}
              </div>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)' as never, fontSize: 'var(--text-sm)' }}>
                  {op.replace('_', ' ')}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {OP_DESCRIPTIONS[op]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (step === 3) return (
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
          Step 3: Define Criteria
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          Enter a JSON filter to match {entityType} records.
        </p>
        <textarea value={criteria} onChange={e => setCriteria(e.target.value)} rows={8} style={{
          width: '100%', fontFamily: 'monospace', fontSize: 'var(--text-sm)',
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)',
          color: 'var(--color-text)', resize: 'vertical',
        }} />
        <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button onClick={previewCriteria} disabled={previewLoading} style={btnOutline}>
            {previewLoading ? <Loader2 size={14} className="spin" /> : <Play size={14} />} Preview Count
          </button>
          {previewCount !== null && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Matching records: <strong>{previewCount.toLocaleString()}</strong>
            </span>
          )}
        </div>
      </div>
    );

    if (step === 4) return (
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
          Step 4: Configure Changes
        </h3>
        {operationType === 'MASS_UPDATE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {updateFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input placeholder="Field name" value={f.field} onChange={e => {
                  const u = [...updateFields]; const item = u[i]; if (item) { item.field = e.target.value; setUpdateFields(u); }
                }} style={{
                  flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: 'var(--text-sm)',
                }} />
                <input placeholder="New value" value={f.value} onChange={e => {
                  const u = [...updateFields]; const item = u[i]; if (item) { item.value = e.target.value; setUpdateFields(u); }
                }} style={{
                  flex: 1, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', fontSize: 'var(--text-sm)',
                }} />
                {updateFields.length > 1 && (
                  <button onClick={() => setUpdateFields(updateFields.filter((_, j) => j !== i))} style={{ ...btnOutline, padding: 'var(--space-2)', color: 'var(--color-danger)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setUpdateFields([...updateFields, { field: '', value: '' }])} style={{ ...btnOutline, alignSelf: 'flex-start' }}>
              <Plus size={14} /> Add Field
            </button>
          </div>
        )}
        {operationType === 'MASS_DELETE' && (
          <div style={{ ...card({ background: '#fef2f2' }), display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input type="checkbox" checked={deleteConfirm} onChange={e => setDeleteConfirm(e.target.checked)} id="del-confirm" />
            <label htmlFor="del-confirm" style={{ fontSize: 'var(--text-sm)', color: '#991b1b' }}>
              <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              I confirm that I want to permanently delete all matching {entityType} records. This action cannot be undone.
            </label>
          </div>
        )}
        {operationType === 'MASS_TRANSFER' && (
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as never, marginBottom: 'var(--space-2)', display: 'block' }}>
              New Owner (User ID or email)
            </label>
            <input value={transferOwner} onChange={e => setTransferOwner(e.target.value)} placeholder="user@example.com" style={{
              width: '100%', maxWidth: 400, padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'var(--color-bg)',
              color: 'var(--color-text)', fontSize: 'var(--text-sm)',
            }} />
          </div>
        )}
      </div>
    );

    if (step === 5) return (
      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
          Step 5: Review & Execute
        </h3>
        <div style={{ ...card(), display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ fontSize: 'var(--text-sm)' }}><strong>Entity:</strong> {entityType}</div>
          <div style={{ fontSize: 'var(--text-sm)' }}><strong>Operation:</strong> {operationType.replace('_', ' ')}</div>
          <div style={{ fontSize: 'var(--text-sm)' }}><strong>Criteria:</strong> <code>{criteria}</code></div>
          {operationType === 'MASS_UPDATE' && (
            <div style={{ fontSize: 'var(--text-sm)' }}>
              <strong>Updates:</strong> {updateFields.filter(f => f.field).map(f => `${f.field} = ${f.value}`).join(', ')}
            </div>
          )}
          {operationType === 'MASS_TRANSFER' && (
            <div style={{ fontSize: 'var(--text-sm)' }}><strong>New Owner:</strong> {transferOwner}</div>
          )}
        </div>
        <button onClick={executeOperation} disabled={executing} style={{ ...btnPrimary, marginTop: 'var(--space-4)', background: operationType === 'MASS_DELETE' ? 'var(--color-danger)' : 'var(--color-primary)' }}>
          {executing ? <Loader2 size={14} /> : <Play size={14} />}
          {executing ? 'Executing...' : 'Execute Operation'}
        </button>
      </div>
    );

    if (step === 6 && activeOp) {
      const pct = activeOp.totalRecords > 0 ? Math.round((activeOp.processedRecords / activeOp.totalRecords) * 100) : 0;
      return (
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
            Operation Progress
          </h3>
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <span>Status: <span style={{ ...statusBadge(activeOp.status) }}>{activeOp.status}</span></span>
              <span>{pct}%</span>
            </div>
            <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', height: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: activeOp.status === 'FAILED' ? 'var(--color-danger)' : 'var(--color-primary)', borderRadius: 'var(--radius-md)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <span>Total: {activeOp.totalRecords}</span>
              <span>Processed: {activeOp.processedRecords}</span>
              <span style={{ color: activeOp.failedRecords > 0 ? '#991b1b' : undefined }}>Failed: {activeOp.failedRecords}</span>
            </div>
          </div>
          {(activeOp.status === 'COMPLETED' || activeOp.status === 'FAILED') && (
            <button onClick={resetWizard} style={{ ...btnPrimary, marginTop: 'var(--space-4)' }}>
              Start New Operation
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const c = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#374151' };
    return {
      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' as never,
      background: c.bg, color: c.color,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Layers style={{ color: 'var(--color-primary)' }} />
            Bulk Operations Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Execute mass updates, deletions, and ownership transfers across entity records.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--color-border)' }}>
        {[{ key: 'wizard' as const, label: 'New Operation', icon: <Play size={14} /> },
          { key: 'history' as const, label: 'History', icon: <History size={14} /> }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            ...btnOutline, border: 'none', borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
            borderRadius: 0, color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'wizard' && (
        <div>
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                fontSize: 'var(--text-xs)', color: step >= s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: step === s ? 'var(--weight-semibold)' as never : 'var(--weight-normal)' as never,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)',
                  background: step > s ? 'var(--color-primary)' : step === s ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                  color: step >= s ? '#fff' : 'var(--color-text-secondary)',
                }}>
                  {step > s ? <CheckCircle size={12} /> : s}
                </span>
                {s < 5 && <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />}
              </div>
            ))}
          </div>

          <div style={card()}>
            {renderStep()}
          </div>

          {step < 5 && step < 6 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
              <button onClick={() => setStep(step - 1)} disabled={step === 1} style={{ ...btnOutline, opacity: step === 1 ? 0.5 : 1 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={() => setStep(step + 1)} disabled={!canNext()} style={{ ...btnPrimary, opacity: canNext() ? 1 : 0.5 }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}
          {step === 5 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <button onClick={() => setStep(step - 1)} style={btnOutline}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ ...card(), overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading...</div>
          ) : operations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>No operations found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  {['Status', 'Entity', 'Operation', 'Records', 'Failed', 'Created'].map(h => (
                    <th key={h} style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'var(--weight-semibold)' as never, color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operations.map(op => (
                  <tr key={op.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}><span style={statusBadge(op.status)}>{op.status}</span></td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{op.entityType}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{op.operationType.replace('_', ' ')}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{op.totalRecords}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: op.failedRecords > 0 ? '#991b1b' : undefined }}>{op.failedRecords}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>
                      {new Date(op.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
