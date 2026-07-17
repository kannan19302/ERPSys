'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
  PENDING: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-text)' },
  PROCESSING: { bg: 'var(--color-info-light)', color: 'var(--color-info-text)' },
  COMPLETED: { bg: 'var(--color-success-light)', color: 'var(--color-success-text)' },
  FAILED: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-text)' },
};

export default function BulkOperationsPage() {
  const client = useApiClient();
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
      setEntityCounts(await client.get<EntityCounts>('/admin/bulk-operations/entity-counts'));
    } catch (e) { console.error(e); }
  };

  const fetchOperations = async () => {
    setLoading(true);
    try {
      setOperations(await client.get<BulkOperation[]>('/admin/bulk-operations'));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { void fetchEntityCounts(); void fetchOperations(); }, [client]);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  const previewCriteria = async () => {
    setPreviewLoading(true);
    try {
      JSON.parse(criteria);
      const data = await client.get<EntityCounts>('/admin/bulk-operations/entity-counts');
      setPreviewCount(data[entityType as keyof EntityCounts] ?? 0);
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
      const op = await client.post<BulkOperation>('/admin/bulk-operations', body);
        setActiveOp(op);
        setStep(6);
        const iv = setInterval(async () => {
          try {
            const updated = await client.get<BulkOperation>(`/admin/bulk-operations/${op.id}`);
              setActiveOp(updated);
              if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
                clearInterval(iv);
                setPollInterval(null);
                void fetchOperations();
              }
          } catch { /* ignore */ }
        }, 2000);
        setPollInterval(iv);
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
  background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none',
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
        <h3 className={styles.p1}>
          Step 1: Select Entity Type
        </h3>
        <div className={styles.p2}>
          {(['Customer', 'Vendor', 'Product', 'Employee', 'Invoice'] as const).map(e => (
            <div key={e} onClick={() => setEntityType(e)} style={{ ...card(), borderColor: entityType === e ? 'var(--color-primary)' : 'var(--color-border)', boxShadow: entityType === e ? '0 0 0 2px var(--color-primary)' : 'none' }} className={styles.s1}>
              <div className={styles.p3}>
                {ENTITY_ICONS[e]}
              </div>
              <div className={styles.p4}>{e}</div>
              <div className={styles.p5}>
                {entityCounts ? `${entityCounts[e].toLocaleString()} records` : '...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (step === 2) return (
      <div>
        <h3 className={styles.p6}>
          Step 2: Choose Operation
        </h3>
        <div className="ui-stack-3">
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
                <div className={styles.p7}>
                  {op.replace('_', ' ')}
                </div>
                <div className="ui-text-xs-muted">
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
        <h3 className={styles.p8}>
          Step 3: Define Criteria
        </h3>
        <p className={styles.p9}>
          Enter a JSON filter to match {entityType} records.
        </p>
        <textarea value={criteria} onChange={e => setCriteria(e.target.value)} rows={8} className={styles.s2} />
        <div className={styles.p10}>
          <button onClick={previewCriteria} disabled={previewLoading} style={btnOutline}>
            {previewLoading ? <Loader2 size={14} className="spin" /> : <Play size={14} />} Preview Count
          </button>
          {previewCount !== null && (
            <span className="ui-text-sm-muted">
              Matching records: <strong>{previewCount.toLocaleString()}</strong>
            </span>
          )}
        </div>
      </div>
    );

    if (step === 4) return (
      <div>
        <h3 className={styles.p11}>
          Step 4: Configure Changes
        </h3>
        {operationType === 'MASS_UPDATE' && (
          <div className="ui-stack-3">
            {updateFields.map((f, i) => (
              <div key={i} className={styles.p12}>
                <input placeholder="Field name" value={f.field} onChange={e => {
                  const u = [...updateFields]; const item = u[i]; if (item) { item.field = e.target.value; setUpdateFields(u); }
                }} className={styles.s3} />
                <input placeholder="New value" value={f.value} onChange={e => {
                  const u = [...updateFields]; const item = u[i]; if (item) { item.value = e.target.value; setUpdateFields(u); }
                }} className={styles.s3} />
                {updateFields.length > 1 && (
                  <button onClick={() => setUpdateFields(updateFields.filter((_, j) => j !== i))} style={{ ...btnOutline }} className={styles.s4}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setUpdateFields([...updateFields, { field: '', value: '' }])} style={{ ...btnOutline }} className={styles.s5}>
              <Plus size={14} /> Add Field
            </button>
          </div>
        )}
        {operationType === 'MASS_DELETE' && (
          <div style={{ ...card({ background: 'var(--color-danger-light)' }) }} className={styles.s6}>
            <input type="checkbox" checked={deleteConfirm} onChange={e => setDeleteConfirm(e.target.checked)} id="del-confirm" />
            <label htmlFor="del-confirm" className={styles.p13}>
              <AlertTriangle size={14} className={styles.p14} />
              I confirm that I want to permanently delete all matching {entityType} records. This action cannot be undone.
            </label>
          </div>
        )}
        {operationType === 'MASS_TRANSFER' && (
          <div>
            <label className={styles.p15}>
              New Owner (User ID or email)
            </label>
            <input value={transferOwner} onChange={e => setTransferOwner(e.target.value)} placeholder="user@example.com" className={styles.s7} />
          </div>
        )}
      </div>
    );

    if (step === 5) return (
      <div>
        <h3 className={styles.p16}>
          Step 5: Review & Execute
        </h3>
        <div style={{ ...card() }} className={styles.s8}>
          <div className="text-sm"><strong>Entity:</strong> {entityType}</div>
          <div className="text-sm"><strong>Operation:</strong> {operationType.replace('_', ' ')}</div>
          <div className="text-sm"><strong>Criteria:</strong> <code>{criteria}</code></div>
          {operationType === 'MASS_UPDATE' && (
            <div className="text-sm">
              <strong>Updates:</strong> {updateFields.filter(f => f.field).map(f => `${f.field} = ${f.value}`).join(', ')}
            </div>
          )}
          {operationType === 'MASS_TRANSFER' && (
            <div className="text-sm"><strong>New Owner:</strong> {transferOwner}</div>
          )}
        </div>
        <button onClick={executeOperation} disabled={executing} style={{ ...btnPrimary, background: operationType === 'MASS_DELETE' ? 'var(--color-danger)' : 'var(--color-primary)' }} className={styles.s9}>
          {executing ? <Loader2 size={14} /> : <Play size={14} />}
          {executing ? 'Executing...' : 'Execute Operation'}
        </button>
      </div>
    );

    if (step === 6 && activeOp) {
      const pct = activeOp.totalRecords > 0 ? Math.round((activeOp.processedRecords / activeOp.totalRecords) * 100) : 0;
      return (
        <div>
          <h3 className={styles.p17}>
            Operation Progress
          </h3>
          <div style={card()}>
            <div className={styles.p18}>
              <span>Status: <span style={{ ...statusBadge(activeOp.status) }}>{activeOp.status}</span></span>
              <span>{pct}%</span>
            </div>
            <div className={styles.p19}>
              <div style={{ width: `${pct}%`, background: activeOp.status === 'FAILED' ? 'var(--color-danger)' : 'var(--color-primary)' }} className={styles.s10} />
            </div>
            <div className={styles.p20}>
              <span>Total: {activeOp.totalRecords}</span>
              <span>Processed: {activeOp.processedRecords}</span>
              <span style={{ color: activeOp.failedRecords > 0 ? 'var(--color-danger-text)' : undefined }}>Failed: {activeOp.failedRecords}</span>
            </div>
          </div>
          {(activeOp.status === 'COMPLETED' || activeOp.status === 'FAILED') && (
            <button onClick={resetWizard} style={{ ...btnPrimary }} className={styles.s9}>
              Start New Operation
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const c = STATUS_COLORS[status] || { bg: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' };
    return {
      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' as never,
      background: c.bg, color: c.color,
    };
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Layers className="ui-text-primary" />
            Bulk Operations Center
          </h1>
          <p className="ui-text-sm-muted">
            Execute mass updates, deletions, and ownership transfers across entity records.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.p21}>
        {[{ key: 'wizard' as const, label: 'New Operation', icon: <Play size={14} /> },
          { key: 'history' as const, label: 'History', icon: <History size={14} /> }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...btnOutline, borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent', color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s11}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'wizard' && (
        <div>
          {/* Step indicators */}
          <div className={styles.p22}>
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} style={{ color: step >= s ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: step === s ? 'var(--weight-semibold)' as never : 'var(--weight-normal)' as never }} className={styles.s12}>
                <span style={{ background: step > s ? 'var(--color-primary)' : step === s ? 'var(--color-primary)' : 'var(--color-bg-subtle)', color: step >= s ? 'var(--color-primary-text)' : 'var(--color-text-secondary)' }} className={styles.s13}>
                  {step > s ? <CheckCircle size={12} /> : s}
                </span>
                {s < 5 && <ChevronDown size={12} className={styles.p23} />}
              </div>
            ))}
          </div>

          <div style={card()}>
            {renderStep()}
          </div>

          {step < 5 && step < 6 && (
            <div className={styles.p24}>
              <button onClick={() => setStep(step - 1)} disabled={step === 1} style={{ ...btnOutline, opacity: step === 1 ? 0.5 : 1 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={() => setStep(step + 1)} disabled={!canNext()} style={{ ...btnPrimary, opacity: canNext() ? 1 : 0.5 }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}
          {step === 5 && (
            <div className={styles.p25}>
              <button onClick={() => setStep(step - 1)} style={btnOutline}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <ListPageTemplate
          columns={[
            { key: 'status', header: 'Status', render: (v) => <span style={statusBadge(String(v))}>{String(v)}</span> },
            { key: 'entityType', header: 'Entity' },
            { key: 'operationType', header: 'Operation', render: (v) => String(v).replace('_', ' ') },
            { key: 'totalRecords', header: 'Records' },
            { key: 'failedRecords', header: 'Failed', render: (v) => <span style={{ color: Number(v) > 0 ? 'var(--color-danger-text)' : undefined }}>{String(v)}</span> },
            { key: 'createdAt', header: 'Created', render: (v) => new Date(String(v)).toLocaleDateString() },
          ] as ListColumn[]}
          data={operations as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyTitle="No operations found"
          emptyDescription="No bulk operations have been run yet."
        />
      )}
    </div>
  );
}
