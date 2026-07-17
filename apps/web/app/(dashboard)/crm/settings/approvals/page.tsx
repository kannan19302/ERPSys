'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Spinner, Button, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, X, Save, Trash2, Edit3, CheckCircle, ArrowUp, ArrowDown, Search, Shield } from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

const APPROVAL_ENTITIES = ['QUOTATION', 'OPPORTUNITY', 'DISCOUNT', 'SALES_ORDER'] as const;
const APPROVER_TYPES = ['USER', 'ROLE', 'MANAGER'] as const;

interface ApprovalStep {
  order: number;
  approverType: string;
  approverId: string;
  autoApproveAfterHours: number | null;
}

interface ApprovalProcess {
  id: string;
  name: string;
  entity: string;
  isActive: boolean;
  steps: ApprovalStep[];
  createdAt: string;
}

interface ProcessForm {
  name: string;
  entity: string;
  steps: ApprovalStep[];
}

const MOCK_PROCESSES: ApprovalProcess[] = [
  { id: '1', name: 'Discount Approval', entity: 'DISCOUNT', isActive: true, steps: [
    { order: 1, approverType: 'MANAGER', approverId: '', autoApproveAfterHours: 24 },
    { order: 2, approverType: 'ROLE', approverId: 'finance_head', autoApproveAfterHours: null },
  ], createdAt: '2026-06-10T10:00:00Z' },
  { id: '2', name: 'Large Deal Approval', entity: 'OPPORTUNITY', isActive: true, steps: [
    { order: 1, approverType: 'USER', approverId: 'vp-sales', autoApproveAfterHours: 48 },
  ], createdAt: '2026-06-15T14:00:00Z' },
  { id: '3', name: 'Quote Sign-off', entity: 'QUOTATION', isActive: false, steps: [
    { order: 1, approverType: 'MANAGER', approverId: '', autoApproveAfterHours: null },
  ], createdAt: '2026-05-20T09:00:00Z' },
];

const emptyForm = (): ProcessForm => ({ name: '', entity: 'QUOTATION', steps: [{ order: 1, approverType: 'USER', approverId: '', autoApproveAfterHours: null }] });

export default function ApprovalSettingsPage() {
  const [processes, setProcesses] = useState<ApprovalProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ProcessForm>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const client = useApiClient();

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const d = await client.get<any>('/crm/approval-processes');
      setProcesses(d || []);
    } catch {
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await client.post<any>('/crm/approval-processes', form);
      setProcesses(prev => [...prev, created]);
      setShowModal(false);
      setForm(emptyForm());
    } catch {
      setProcesses(prev => [...prev, { ...form, id: `local-${Date.now()}`, isActive: true, createdAt: new Date().toISOString() }]);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const addStep = () => setForm(prev => ({ ...prev, steps: [...prev.steps, { order: prev.steps.length + 1, approverType: 'USER', approverId: '', autoApproveAfterHours: null }] }));
  const removeStep = (idx: number) => setForm(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })) }));
  const updateStep = (idx: number, key: string, val: string | number | null) => setForm(prev => ({ ...prev, steps: prev.steps.map((s, i) => i === idx ? { ...s, [key]: val } : s) }));

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' };
  const cellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-primary)' };
  const headStyle: React.CSSProperties = { ...cellStyle, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

  const handleDeleteProcess = async (id: string) => {
    try {
      await client.delete(`/crm/approval-processes/${id}`);
    } catch { /* proceed with local removal */ }
    setProcesses(prev => prev.filter(p => p.id !== id));
    setDeleteConfirm(null);
  };

  const filtered = processes.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = filterEntity === 'ALL' || p.entity === filterEntity;
    return matchesSearch && matchesEntity;
  });

  const totalActive = processes.filter(p => p.isActive).length;
  const totalInactive = processes.filter(p => !p.isActive).length;

  if (loading) {
    return (
      <RouteGuard permission="crm.read">
        <div className={styles.style0}><Spinner size="lg" /></div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="crm.read">
      <div className={styles.style1}>
        <PageHeader title="Approval Processes" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Approvals' }]} />

        <div className={styles.style2}>
          {[
            { label: 'Total Processes', value: processes.length, icon: Shield, color: 'var(--color-primary)' },
            { label: 'Active', value: totalActive, icon: CheckCircle, color: 'var(--color-success)' },
            { label: 'Inactive', value: totalInactive, icon: X, color: 'var(--color-text-tertiary)' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <div className={styles.style3}>
                <div style={{ backgroundColor: `${kpi.color}15` }} className={styles.s1}>
                  <kpi.icon size={20} style={{ color: kpi.color }} />
                </div>
                <div>
                  <div className={styles.style4}>{kpi.value}</div>
                  <div className={styles.style5}>{kpi.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className={styles.style6}>
            <div className={styles.style7}>
              <div className={styles.style8}>Approval Processes ({filtered.length})</div>
              <div className="relative">
                <Search size={14} className={styles.style9} />
                <input style={{ ...inputStyle }} className={styles.s2} placeholder="Search processes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select style={{ ...inputStyle }} className={styles.s3} value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
                <option value="ALL">All Entities</option>
                {APPROVAL_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <Button onClick={() => { setForm(emptyForm()); setShowModal(true); }}><Plus size={16} className="mr-1" /> New Process</Button>
          </div>
          <ListPageTemplate
            columns={[
              { key: 'name', header: 'Name', render: (v) => <span className={styles.style10}>{String(v)}</span> },
              { key: 'entity', header: 'Entity', render: (v) => <Badge>{String(v)}</Badge> },
              { key: 'steps', header: 'Steps', render: (v) => { const n = (v as any[]).length; return <Badge variant="info">{n} step{n !== 1 ? 's' : ''}</Badge>; } },
              { key: 'isActive', header: 'Active', render: (v) => v ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge> },
              { key: 'createdAt', header: 'Created', render: (v) => new Date(String(v)).toLocaleDateString() },
              { key: 'id', header: 'Actions', render: (v) => (
                <div className={styles.style11}>
                  <button className={styles.style12}><Edit3 size={16} /></button>
                  <button onClick={() => setDeleteConfirm(String(v))} className="ui-btn-icon ui-text-danger"><Trash2 size={16} /></button>
                </div>
              ) },
            ] as ListColumn[]}
            data={filtered as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No approval processes"
            emptyDescription={processes.length === 0 ? 'No approval processes configured.' : 'No processes match the current filters.'}
          />
        </Card>

        {showModal && (
          <div className={styles.style13}>
            <div className={styles.style14}>
              <div className={styles.style15}>
                <h3 className={styles.style16}>Create Approval Process</h3>
                <button onClick={() => setShowModal(false)} className={styles.style17}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className={styles.style18}>
                  <div><label style={labelStyle}>Process Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Large Deal Approval" /></div>
                  <div>
                    <label style={labelStyle}>Entity</label>
                    <select style={inputStyle} value={form.entity} onChange={e => setForm(p => ({ ...p, entity: e.target.value }))}>
                      {APPROVAL_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className={styles.style19}>
                      <label style={{ ...labelStyle }} className={styles.s4}>Approval Steps</label>
                      <button type="button" onClick={addStep} className={styles.style20}><Plus size={14} /> Add Step</button>
                    </div>
                    {form.steps.map((step, idx) => (
                      <div key={idx} className={styles.style21}>
                        <div className={styles.style22}>#{step.order}</div>
                        <select style={inputStyle} value={step.approverType} onChange={e => updateStep(idx, 'approverType', e.target.value)}>
                          {APPROVER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input style={inputStyle} placeholder={step.approverType === 'MANAGER' ? '(auto)' : 'Approver ID'} value={step.approverId} onChange={e => updateStep(idx, 'approverId', e.target.value)} disabled={step.approverType === 'MANAGER'} />
                        <input style={inputStyle} type="number" placeholder="Auto hrs" value={step.autoApproveAfterHours ?? ''} onChange={e => updateStep(idx, 'autoApproveAfterHours', e.target.value ? Number(e.target.value) : null)} />
                        {form.steps.length > 1 && (
                          <button type="button" onClick={() => removeStep(idx)} className="ui-btn-icon ui-text-danger"><X size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.style23}>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : <><Save size={16} className="mr-1" /> Create Process</>}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className={styles.style24}>
            <div className={styles.style25}>
              <div className={styles.style26}>
                <div className={styles.style27}>
                  <Trash2 size={20} className="ui-text-danger" />
                </div>
                <div>
                  <h3 className={styles.style28}>Delete Approval Process</h3>
                  <p className={styles.style29}>
                    This will permanently remove the process and all associated rules.
                  </p>
                </div>
              </div>
              <div className={styles.style30}>
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button onClick={() => handleDeleteProcess(deleteConfirm)}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
