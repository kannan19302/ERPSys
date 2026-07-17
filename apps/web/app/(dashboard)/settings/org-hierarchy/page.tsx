'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Network, ChevronDown, ChevronRight, Plus, Edit2, Trash2, Users, X, Loader2, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

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

interface OrgHierarchyResponse {
  organization: { id: string } | null;
  departments: Department[];
  costCenters: CostCenter[];
}

function flattenTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.flatMap(({ children, ...item }) => [item as T, ...flattenTree(children ?? [])]);
}


/* ---- Department Tree Node ---- */
function DeptNode({ dept, allDepts, onEdit, onDelete, depth = 0 }: { dept: Department; allDepts: Department[]; onEdit: (d: Department) => void; onDelete: (d: Department) => void; depth?: number }) {
  const [open, setOpen] = useState(true);
  const children = allDepts.filter(d => d.parentId === dept.id);

  return (
    <div>
      <div className={`${styles.treeNode} ${children.length > 0 ? styles.expandableNode : ''}`} style={{ marginLeft: `calc(${depth} * var(--space-6))` }} onClick={() => children.length > 0 && setOpen(!open)}>
        {children.length > 0 ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className={styles.treeSpacer} />}
        <span className={styles.deptName}>{dept.name}</span>
        {dept.managerName && <span className="ui-text-xs-muted">&middot; {dept.managerName}</span>}
        <span className={styles.employeeCount}>
          <Users size={12} /> {dept.employeeCount}
        </span>
        <button onClick={e => { e.stopPropagation(); onEdit(dept); }} className={styles.iconButton}><Edit2 size={14} /></button>
        <button onClick={e => { e.stopPropagation(); onDelete(dept); }} className={styles.iconButton}><Trash2 size={14} /></button>
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
      <div className={styles.treeNode} style={{ marginLeft: `calc(${depth} * var(--space-6))` }}>
        {children.length > 0 ? <button className={styles.treeToggle} onClick={() => setOpen(!open)} aria-label={`${open ? 'Collapse' : 'Expand'} ${cc.name}`}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button> : <span className={styles.treeSpacer} />}
        <span className={styles.costCode}>{cc.code}</span>
        <span className={styles.costName}>{cc.name}</span>
        <span className={styles.costBudget}>${cc.budget.toLocaleString()}</span>
        <span className={`${styles.costStatus} ${cc.isActive ? styles.activeStatus : styles.inactiveStatus}`}>{cc.isActive ? 'Active' : 'Inactive'}</span>
      </div>
      {open && children.map(c => <CcNode key={c.id} cc={c} allCcs={allCcs} depth={depth + 1} />)}
    </div>
  );
}

export default function OrgHierarchyPage() {
  const client = useApiClient();
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

  const [orgId, setOrgId] = useState('');

  const fetchHierarchy = useCallback(async () => {
    try {
      const hierarchy = await client.get<OrgHierarchyResponse>('/admin/org-hierarchy/tree');
      setOrgId(hierarchy.organization?.id ?? '');
      setDepartments(flattenTree(hierarchy.departments));
      setCostCenters(flattenTree(hierarchy.costCenters));
    } catch {}
  }, [client]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchHierarchy();
      setLoading(false);
    })();
  }, [fetchHierarchy]);

  const openDeptAdd = () => { setFormName(''); setFormParentId(''); setFormManagerId(''); setDeptModal({ mode: 'add' }); };
  const openDeptEdit = (d: Department) => { setFormName(d.name); setFormParentId(d.parentId || ''); setFormManagerId(d.managerId || ''); setDeptModal({ mode: 'edit', dept: d }); };

  const saveDept = async () => {
    const body = { name: formName, parentId: formParentId || null, managerId: formManagerId || null };
    try {
      if (deptModal?.mode === 'add') {
        await client.post('/admin/org-hierarchy/departments', body);
      } else if (deptModal?.dept) {
        await client.request(`/admin/org-hierarchy/departments/${deptModal.dept.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      setDeptModal(null);
      await fetchHierarchy();
    } catch {}
  };

  const deleteDept = async (d: Department) => {
    const children = departments.filter(x => x.parentId === d.id);
    if (children.length > 0) { setDeleteConfirm(d); return; }
    try {
      await client.delete(`/admin/org-hierarchy/departments/${d.id}`);
      await fetchHierarchy();
    } catch {}
  };

  const confirmDeleteDept = async () => {
    if (!deleteConfirm) return;
    try {
      await client.delete(`/admin/org-hierarchy/departments/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      await fetchHierarchy();
    } catch {}
  };

  const openCcAdd = () => { setCcFormOrgId(orgId); setCcFormCode(''); setCcFormName(''); setCcFormParentId(''); setCcFormBudget(''); setCcFormActive(true); setCcModal({ mode: 'add' }); };
  const openCcEdit = (cc: CostCenter) => { setCcFormOrgId(cc.orgId); setCcFormCode(cc.code); setCcFormName(cc.name); setCcFormParentId(cc.parentId || ''); setCcFormBudget(String(cc.budget)); setCcFormActive(cc.isActive); setCcModal({ mode: 'edit', cc }); };

  const saveCc = async () => {
    const body = { orgId: ccFormOrgId, code: ccFormCode, name: ccFormName, parentId: ccFormParentId || null, budget: parseFloat(ccFormBudget) || 0, isActive: ccFormActive };
    try {
      if (ccModal?.mode === 'add') {
        await client.post('/admin/org-hierarchy/cost-centers', body);
      } else if (ccModal?.cc) {
        await client.request(`/admin/org-hierarchy/cost-centers/${ccModal.cc.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      setCcModal(null);
      await fetchHierarchy();
    } catch {}
  };

  const deleteCc = async (id: string) => {
    try {
      await client.delete(`/admin/org-hierarchy/cost-centers/${id}`);
      await fetchHierarchy();
    } catch {}
  };

  const rootDepts = departments.filter(d => !d.parentId);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={24} className={styles.spinner} />
      </div>
    );
  }

  return (
    <RouteGuard permission="settings.org-hierarchy.read">
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <Network size={28} className="ui-text-primary" />
        <h1 className={styles.title}>Organization Hierarchy</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['departments', 'cost-centers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}>
            {t === 'departments' ? 'Department Tree' : 'Cost Centers'}
          </button>
        ))}
      </div>

      {/* Department Tree Tab */}
      {tab === 'departments' && (
        <div>
          <div className={styles.departmentActions}>
            <button onClick={openDeptAdd} className={styles.primaryButton}>
              <Plus size={14} /> Add Department
            </button>
          </div>
          <div className={styles.treePanel}>
            {rootDepts.length === 0 ? (
              <div className={styles.emptyState}>No departments found.</div>
            ) : rootDepts.map(d => (
              <DeptNode key={d.id} dept={d} allDepts={departments} onEdit={openDeptEdit} onDelete={deleteDept} />
            ))}
          </div>
        </div>
      )}

      {/* Cost Centers Tab */}
      {tab === 'cost-centers' && (
        <div>
          <div className={styles.costCenterActions}>
            <button onClick={() => setCcTreeView(!ccTreeView)} className={styles.secondaryButton}>
              {ccTreeView ? <ToggleRight size={16} className="ui-text-primary" /> : <ToggleLeft size={16} />}
              {ccTreeView ? 'Tree View' : 'Table View'}
            </button>
            <button onClick={openCcAdd} className={styles.primaryButton}>
              <Plus size={14} /> Add Cost Center
            </button>
          </div>

          {ccTreeView ? (
            <div className={styles.treePanel}>
              {costCenters.filter(c => !c.parentId).length === 0 ? (
                <div className={styles.emptyState}>No cost centers found.</div>
              ) : costCenters.filter(c => !c.parentId).map(c => (
                <CcNode key={c.id} cc={c} allCcs={costCenters} />
              ))}
            </div>
          ) : (
            <ListPageTemplate
              columns={[
                { key: 'code', header: 'Code', render: (v) => <span className="font-mono">{String(v)}</span> },
                { key: 'name', header: 'Name', render: (v) => <span className="font-medium">{String(v)}</span> },
                { key: 'parentName', header: 'Parent', render: (v) => String(v || '-') },
                { key: 'budget', header: 'Budget', render: (v) => `$${Number(v).toLocaleString()}` },
                { key: 'isActive', header: 'Active', render: (v) => <span className={`${styles.tableStatus} ${v ? styles.activeStatus : styles.inactiveStatus}`}>{v ? 'Active' : 'Inactive'}</span> },
                { key: 'id', header: 'Actions', render: (_, row) => (
                  <div className="ui-flex ui-gap-2">
                    <button onClick={() => openCcEdit(row as unknown as CostCenter)} className={styles.iconButton}><Edit2 size={14} /></button>
                    <button onClick={() => deleteCc(String(row.id))} className={styles.iconButton}><Trash2 size={14} /></button>
                  </div>
                ) },
              ] as ListColumn[]}
              data={costCenters as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No cost centers found"
              emptyDescription="Create a cost center to get started."
            />
          )}
        </div>
      )}

      {/* Department Modal */}
      {deptModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="department-modal-title">
            <div className="ui-flex-between mb-4">
              <h2 id="department-modal-title" className={styles.modalTitle}>{deptModal.mode === 'add' ? 'Add Department' : 'Edit Department'}</h2>
              <button onClick={() => setDeptModal(null)} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
            </div>
            <div className="ui-stack-3">
              <div><label className={styles.label}>Name</label><input value={formName} onChange={e => setFormName(e.target.value)} className={styles.input} placeholder="Department name" /></div>
              <div>
                <label className={styles.label}>Parent Department</label>
                <select value={formParentId} onChange={e => setFormParentId(e.target.value)} className={styles.input}>
                  <option value="">None (Root)</option>
                  {departments.filter(d => d.id !== deptModal.dept?.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className={styles.label}>Manager ID</label><input value={formManagerId} onChange={e => setFormManagerId(e.target.value)} className={styles.input} placeholder="Manager ID (optional)" /></div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setDeptModal(null)} className={styles.modalCancel}>Cancel</button>
              <button onClick={saveDept} disabled={!formName.trim()} className={styles.primaryButton}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Center Modal */}
      {ccModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="cost-center-modal-title">
            <div className="ui-flex-between mb-4">
              <h2 id="cost-center-modal-title" className={styles.modalTitle}>{ccModal.mode === 'add' ? 'Add Cost Center' : 'Edit Cost Center'}</h2>
              <button onClick={() => setCcModal(null)} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
            </div>
            <div className="ui-stack-3">
              <div><label className={styles.label}>Code</label><input value={ccFormCode} onChange={e => setCcFormCode(e.target.value)} className={styles.input} placeholder="CC-001" /></div>
              <div><label className={styles.label}>Name</label><input value={ccFormName} onChange={e => setCcFormName(e.target.value)} className={styles.input} placeholder="Cost center name" /></div>
              <div>
                <label className={styles.label}>Parent Cost Center</label>
                <select value={ccFormParentId} onChange={e => setCcFormParentId(e.target.value)} className={styles.input}>
                  <option value="">None (Root)</option>
                  {costCenters.filter(c => c.id !== ccModal.cc?.id).map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div><label className={styles.label}>Budget</label><input type="number" value={ccFormBudget} onChange={e => setCcFormBudget(e.target.value)} className={styles.input} placeholder="0" /></div>
              <div className="ui-hstack-2">
                <label className={`${styles.label} ${styles.inlineLabel}`}>Active</label>
                <button onClick={() => setCcFormActive(!ccFormActive)} className={`${styles.activeToggle} ${ccFormActive ? styles.toggleEnabled : ''}`}>
                  {ccFormActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setCcModal(null)} className={styles.modalCancel}>Cancel</button>
              <button onClick={saveCc} disabled={!ccFormCode.trim() || !ccFormName.trim()} className={styles.primaryButton}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmationModal} role="alertdialog" aria-modal="true" aria-labelledby="delete-department-title">
            <h2 id="delete-department-title" className={styles.warningTitle}>Warning</h2>
            <p className={styles.warningText}>
              "{deleteConfirm.name}" has child departments. Deleting it will also affect its children. Continue?
            </p>
            <div className={styles.confirmationActions}>
              <button onClick={() => setDeleteConfirm(null)} className={styles.modalCancel}>Cancel</button>
              <button onClick={confirmDeleteDept} className={styles.deleteButton}>Delete Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
