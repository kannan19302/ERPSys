'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Network, ChevronDown, ChevronRight, Plus, Edit2, Trash2, Users, X, Loader2, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  managerName?: string;
  employeeCount: number;
  children?: Department[];
}

interface CostCenter {
  id: string;
  orgId: string;
  code: string;
  name: string;
  parentId: string | null;
  parentName?: string;
  budget: number;
  isActive: boolean;
  children?: CostCenter[];
}

const API_BASE = '/api/v1/admin/org-hierarchy';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ---- Department Tree Node ---- */
function DeptNode({ dept, allDepts, onEdit, onDelete, depth = 0 }: { dept: Department; allDepts: Department[]; onEdit: (d: Department) => void; onDelete: (d: Department) => void; depth?: number }) {
  const [open, setOpen] = useState(true);
  const children = allDepts.filter(d => d.parentId === dept.id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', marginLeft: depth * 24, borderRadius: 'var(--radius-md)', cursor: children.length > 0 ? 'pointer' : 'default' }} onClick={() => children.length > 0 && setOpen(!open)}>
        {children.length > 0 ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{dept.name}</span>
        {dept.managerName && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>&middot; {dept.managerName}</span>}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
          <Users size={12} /> {dept.employeeCount}
        </span>
        <button onClick={e => { e.stopPropagation(); onEdit(dept); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}><Edit2 size={14} /></button>
        <button onClick={e => { e.stopPropagation(); onDelete(dept); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}><Trash2 size={14} /></button>
      </div>
      {open && children.map(c => <DeptNode key={c.id} dept={c} allDepts={allDepts} onEdit={onEdit} onDelete={onDelete} depth={depth + 1} />)}
    </div>
  );
}

/* ---- Cost Center Tree Node ---- */
function CcNode({ cc, allCcs, depth = 0 }: { cc: CostCenter; allCcs: CostCenter[]; depth?: number }) {
  const [open, setOpen] = useState(true);
  const children = allCcs.filter(c => c.parentId === cc.id);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', marginLeft: depth * 24 }}>
        {children.length > 0 ? <span style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span> : <span style={{ width: 14 }} />}
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{cc.code}</span>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>{cc.name}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>${cc.budget.toLocaleString()}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: cc.isActive ? '#10b981' : '#ef4444' }}>{cc.isActive ? 'Active' : 'Inactive'}</span>
      </div>
      {open && children.map(c => <CcNode key={c.id} cc={c} allCcs={allCcs} depth={depth + 1} />)}
    </div>
  );
}

export default function OrgHierarchyPage() {
  const [tab, setTab] = useState<'departments' | 'cost-centers'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptModal, setDeptModal] = useState<{ mode: 'add' | 'edit'; dept?: Department } | null>(null);
  const [ccModal, setCcModal] = useState<{ mode: 'add' | 'edit'; cc?: CostCenter } | null>(null);
  const [ccTreeView, setCcTreeView] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formManagerId, setFormManagerId] = useState('');
  const [ccFormOrgId, setCcFormOrgId] = useState('');
  const [ccFormCode, setCcFormCode] = useState('');
  const [ccFormName, setCcFormName] = useState('');
  const [ccFormParentId, setCcFormParentId] = useState('');
  const [ccFormBudget, setCcFormBudget] = useState('');
  const [ccFormActive, setCcFormActive] = useState(true);

  const orgId = typeof window !== 'undefined' ? localStorage.getItem('orgId') || '' : '';

  const fetchDepts = useCallback(async () => {
    try {
      const res = await apiFetch<Department[]>('/departments');
      setDepartments(res);
    } catch (e) { console.error('Error fetching departments', e); }
  }, []);

  const fetchCostCenters = useCallback(async () => {
    try {
      const res = await apiFetch<CostCenter[]>(`/cost-centers/${orgId}`);
      setCostCenters(res);
    } catch (e) { console.error('Error fetching cost centers', e); }
  }, [orgId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchDepts(), fetchCostCenters()]);
      setLoading(false);
    })();
  }, [fetchDepts, fetchCostCenters]);

  const openDeptAdd = () => { setFormName(''); setFormParentId(''); setFormManagerId(''); setDeptModal({ mode: 'add' }); };
  const openDeptEdit = (d: Department) => { setFormName(d.name); setFormParentId(d.parentId || ''); setFormManagerId(d.managerId || ''); setDeptModal({ mode: 'edit', dept: d }); };

  const saveDept = async () => {
    const body = { name: formName, parentId: formParentId || null, managerId: formManagerId || null };
    try {
      if (deptModal?.mode === 'add') {
        await apiFetch('/departments', { method: 'POST', body: JSON.stringify(body) });
      } else if (deptModal?.dept) {
        await apiFetch(`/departments/${deptModal.dept.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      setDeptModal(null);
      await fetchDepts();
    } catch (e) { console.error('Save dept error', e); }
  };

  const deleteDept = async (d: Department) => {
    const children = departments.filter(x => x.parentId === d.id);
    if (children.length > 0) { setDeleteConfirm(d); return; }
    try {
      await apiFetch(`/departments/${d.id}`, { method: 'DELETE' });
      await fetchDepts();
    } catch (e) { console.error('Delete dept error', e); }
  };

  const confirmDeleteDept = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/departments/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      await fetchDepts();
    } catch (e) { console.error('Delete dept error', e); }
  };

  const openCcAdd = () => { setCcFormOrgId(orgId); setCcFormCode(''); setCcFormName(''); setCcFormParentId(''); setCcFormBudget(''); setCcFormActive(true); setCcModal({ mode: 'add' }); };
  const openCcEdit = (cc: CostCenter) => { setCcFormOrgId(cc.orgId); setCcFormCode(cc.code); setCcFormName(cc.name); setCcFormParentId(cc.parentId || ''); setCcFormBudget(String(cc.budget)); setCcFormActive(cc.isActive); setCcModal({ mode: 'edit', cc }); };

  const saveCc = async () => {
    const body = { orgId: ccFormOrgId, code: ccFormCode, name: ccFormName, parentId: ccFormParentId || null, budget: parseFloat(ccFormBudget) || 0, isActive: ccFormActive };
    try {
      if (ccModal?.mode === 'add') {
        await apiFetch('/cost-centers', { method: 'POST', body: JSON.stringify(body) });
      } else if (ccModal?.cc) {
        await apiFetch(`/cost-centers/${ccModal.cc.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      setCcModal(null);
      await fetchCostCenters();
    } catch (e) { console.error('Save cost center error', e); }
  };

  const deleteCc = async (id: string) => {
    try {
      await apiFetch(`/cost-centers/${id}`, { method: 'DELETE' });
      await fetchCostCenters();
    } catch (e) { console.error('Delete cost center error', e); }
  };

  const rootDepts = departments.filter(d => !d.parentId);

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' };
  const labelStyle: React.CSSProperties = { fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' as any, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)', display: 'block' };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--color-text-secondary)' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <Network size={28} style={{ color: 'var(--color-primary)' }} />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>Organization Hierarchy</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
        {(['departments', 'cost-centers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
            {t === 'departments' ? 'Department Tree' : 'Cost Centers'}
          </button>
        ))}
      </div>

      {/* Department Tree Tab */}
      {tab === 'departments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button onClick={openDeptAdd} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Plus size={14} /> Add Department
            </button>
          </div>
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            {rootDepts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No departments found.</div>
            ) : rootDepts.map(d => (
              <DeptNode key={d.id} dept={d} allDepts={departments} onEdit={openDeptEdit} onDelete={deleteDept} />
            ))}
          </div>
        </div>
      )}

      {/* Cost Centers Tab */}
      {tab === 'cost-centers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <button onClick={() => setCcTreeView(!ccTreeView)} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {ccTreeView ? <ToggleRight size={16} style={{ color: 'var(--color-primary)' }} /> : <ToggleLeft size={16} />}
              {ccTreeView ? 'Tree View' : 'Table View'}
            </button>
            <button onClick={openCcAdd} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <Plus size={14} /> Add Cost Center
            </button>
          </div>

          {ccTreeView ? (
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              {costCenters.filter(c => !c.parentId).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No cost centers found.</div>
              ) : costCenters.filter(c => !c.parentId).map(c => (
                <CcNode key={c.id} cc={c} allCcs={costCenters} />
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Code', 'Name', 'Parent', 'Budget', 'Active', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costCenters.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No cost centers found.</td></tr>
                  ) : costCenters.map(cc => (
                    <tr key={cc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{cc.code}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)', fontWeight: 'var(--weight-medium)' }}>{cc.name}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>{cc.parentName || '-'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-primary)' }}>${cc.budget.toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ color: cc.isActive ? '#10b981' : '#ef4444', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>{cc.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                        <button onClick={() => openCcEdit(cc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteCc(cc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2 }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Department Modal */}
      {deptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: 440, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>{deptModal.mode === 'add' ? 'Add Department' : 'Edit Department'}</h2>
              <button onClick={() => setDeptModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div><label style={labelStyle}>Name</label><input value={formName} onChange={e => setFormName(e.target.value)} style={inputStyle} placeholder="Department name" /></div>
              <div>
                <label style={labelStyle}>Parent Department</label>
                <select value={formParentId} onChange={e => setFormParentId(e.target.value)} style={inputStyle}>
                  <option value="">None (Root)</option>
                  {departments.filter(d => d.id !== deptModal.dept?.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Manager ID</label><input value={formManagerId} onChange={e => setFormManagerId(e.target.value)} style={inputStyle} placeholder="Manager ID (optional)" /></div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
              <button onClick={() => setDeptModal(null)} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button onClick={saveDept} disabled={!formName.trim()} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Center Modal */}
      {ccModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: 440, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>{ccModal.mode === 'add' ? 'Add Cost Center' : 'Edit Cost Center'}</h2>
              <button onClick={() => setCcModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div><label style={labelStyle}>Code</label><input value={ccFormCode} onChange={e => setCcFormCode(e.target.value)} style={inputStyle} placeholder="CC-001" /></div>
              <div><label style={labelStyle}>Name</label><input value={ccFormName} onChange={e => setCcFormName(e.target.value)} style={inputStyle} placeholder="Cost center name" /></div>
              <div>
                <label style={labelStyle}>Parent Cost Center</label>
                <select value={ccFormParentId} onChange={e => setCcFormParentId(e.target.value)} style={inputStyle}>
                  <option value="">None (Root)</option>
                  {costCenters.filter(c => c.id !== ccModal.cc?.id).map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Budget</label><input type="number" value={ccFormBudget} onChange={e => setCcFormBudget(e.target.value)} style={inputStyle} placeholder="0" /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Active</label>
                <button onClick={() => setCcFormActive(!ccFormActive)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ccFormActive ? '#10b981' : 'var(--color-text-secondary)' }}>
                  {ccFormActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
              <button onClick={() => setCcModal(null)} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button onClick={saveCc} disabled={!ccFormCode.trim() || !ccFormName.trim()} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', width: 400, border: '1px solid var(--color-border)' }}>
            <h2 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>Warning</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              "{deleteConfirm.name}" has child departments. Deleting it will also affect its children. Continue?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>Cancel</button>
              <button onClick={confirmDeleteDept} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Delete Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
