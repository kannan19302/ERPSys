'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import { Plus, X, Save, Trash2, Edit3, CheckCircle, ArrowUp, ArrowDown, Search, Shield } from 'lucide-react';

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

  useEffect(() => { fetchProcesses(); }, []);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/approval-processes', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) { setProcesses(await res.json()); } else { setProcesses(MOCK_PROCESSES); }
    } catch { setProcesses(MOCK_PROCESSES); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/approval-processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setProcesses(prev => [...prev, created]);
      } else {
        setProcesses(prev => [...prev, { ...form, id: `local-${Date.now()}`, isActive: true, createdAt: new Date().toISOString() }]);
      }
      setShowModal(false);
      setForm(emptyForm());
    } catch {
      setProcesses(prev => [...prev, { ...form, id: `local-${Date.now()}`, isActive: true, createdAt: new Date().toISOString() }]);
      setShowModal(false);
    } finally { setSubmitting(false); }
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
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/crm/approval-processes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader title="Approval Processes" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Settings', href: '/crm/settings' }, { label: 'Approvals' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Processes', value: processes.length, icon: Shield, color: 'var(--color-primary, #3b82f6)' },
          { label: 'Active', value: totalActive, icon: CheckCircle, color: 'var(--color-success, #10b981)' },
          { label: 'Inactive', value: totalInactive, icon: X, color: 'var(--text-tertiary, #9ca3af)' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{kpi.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{kpi.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Approval Processes ({filtered.length})</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input style={{ ...inputStyle, paddingLeft: '32px', width: '220px' }} placeholder="Search processes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select style={{ ...inputStyle, width: '160px' }} value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
              <option value="ALL">All Entities</option>
              {APPROVAL_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <Button onClick={() => { setForm(emptyForm()); setShowModal(true); }}><Plus size={16} style={{ marginRight: 4 }} /> New Process</Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Name', 'Entity', 'Steps', 'Active', 'Created', 'Actions'].map(h => <th key={h} style={headStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
                {processes.length === 0 ? 'No approval processes configured.' : 'No processes match the current filters.'}
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td style={cellStyle}><span style={{ fontWeight: 500 }}>{p.name}</span></td>
                <td style={cellStyle}><Badge>{p.entity}</Badge></td>
                <td style={cellStyle}><Badge variant="info">{p.steps.length} step{p.steps.length !== 1 ? 's' : ''}</Badge></td>
                <td style={cellStyle}>{p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}</td>
                <td style={cellStyle}>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td style={cellStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit3 size={16} /></button>
                    <button onClick={() => setDeleteConfirm(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create Approval Process</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div><label style={labelStyle}>Process Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Large Deal Approval" /></div>
                <div>
                  <label style={labelStyle}>Entity</label>
                  <select style={inputStyle} value={form.entity} onChange={e => setForm(p => ({ ...p, entity: e.target.value }))}>
                    {APPROVAL_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Approval Steps</label>
                    <button type="button" onClick={addStep} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 500 }}><Plus size={14} /> Add Step</button>
                  </div>
                  {form.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 120px 32px', gap: '8px', marginBottom: '10px', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>#{step.order}</div>
                      <select style={inputStyle} value={step.approverType} onChange={e => updateStep(idx, 'approverType', e.target.value)}>
                        {APPROVER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input style={inputStyle} placeholder={step.approverType === 'MANAGER' ? '(auto)' : 'Approver ID'} value={step.approverId} onChange={e => updateStep(idx, 'approverId', e.target.value)} disabled={step.approverType === 'MANAGER'} />
                      <input style={inputStyle} type="number" placeholder="Auto hrs" value={step.autoApproveAfterHours ?? ''} onChange={e => updateStep(idx, 'autoApproveAfterHours', e.target.value ? Number(e.target.value) : null)} />
                      {form.steps.length > 1 && (
                        <button type="button" onClick={() => removeStep(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : <><Save size={16} style={{ marginRight: 4 }} /> Create Process</>}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} style={{ color: 'var(--color-danger)' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>Delete Approval Process</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  This will permanently remove the process and all associated rules.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button onClick={() => handleDeleteProcess(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
