"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, DataTable, Tabs, Modal, TextField, FormField, Select } from "@unerp/ui";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Users,
  X,
  Network,
  DollarSign,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface Department {
  id: string;
  orgId: string;
  name: string;
  code: string;
  parentId: string | null;
  managerId: string | null;
  _count?: { children: number; employees: number };
}

interface CostCenter {
  id: string;
  orgId: string;
  code: string;
  name: string;
  parentId: string | null;
  budget: number | null;
  isActive: boolean;
  parent?: { id: string; name: string; code: string } | null;
  _count?: { children: number };
}

interface OrgTreeResponse {
  organization: { id: string } | null;
  departments: (Department & { children?: Department[] })[];
  costCenters: (CostCenter & { children?: CostCenter[] })[];
}

function flatten<T extends { children?: T[] }>(items: T[]): T[] {
  return items.flatMap(({ children, ...item }) => [item as T, ...flatten(children ?? [])]);
}

function DeptNode({
  dept,
  all,
  depth = 0,
  onEdit,
  onDelete,
}: {
  dept: Department;
  all: Department[];
  depth?: number;
  onEdit: (d: Department) => void;
  onDelete: (d: Department) => void;
}) {
  const [open, setOpen] = useState(true);
  const children = all.filter((d) => d.parentId === dept.id);
  return (
    <div>
      <div
        className="ui-hstack-3"
        style={{ marginLeft: `calc(${depth} * var(--space-6))`, padding: "var(--space-2) 0", cursor: children.length ? "pointer" : "default" }}
        onClick={() => children.length > 0 && setOpen(!open)}
      >
        {children.length > 0 ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14, display: "inline-block" }} />}
        <span className="font-medium text-sm">{dept.name}</span>
        <span className="ui-text-xs-muted">{dept.code}</span>
        <span className="ui-hstack-2 ui-text-xs-muted">
          <Users size={12} /> {dept._count?.employees ?? 0}
        </span>
        <div className="ui-table-actions">
          <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(dept); }} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); onDelete(dept); }} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {open && children.map((c) => (
        <DeptNode key={c.id} dept={c} all={all} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function OrgHierarchyPage() {
  const client = useApiClient();
  const [tab, setTab] = useState<"departments" | "cost-centers">("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [deptModal, setDeptModal] = useState<{ mode: "add" | "edit"; dept?: Department } | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", parentId: "", managerId: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);

  const [ccModal, setCcModal] = useState<{ mode: "add" | "edit"; cc?: CostCenter } | null>(null);
  const [ccForm, setCcForm] = useState({ code: "", name: "", parentId: "", budget: "", isActive: true });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchHierarchy = useCallback(async () => {
    setError(null);
    try {
      const data = await client.get<OrgTreeResponse>("/saas-portal/org-hierarchy/tree");
      setOrgId(data.organization?.id ?? "");
      setDepartments(flatten(data.departments ?? []));
      setCostCenters(flatten(data.costCenters ?? []));
    } catch {
      setError("Could not load organization hierarchy.");
    }
  }, [client]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchHierarchy();
      setLoading(false);
    })();
  }, [fetchHierarchy]);

  const openDeptAdd = () => { setDeptForm({ name: "", code: "", parentId: "", managerId: "" }); setDeptModal({ mode: "add" }); };
  const openDeptEdit = (d: Department) => { setDeptForm({ name: d.name, code: d.code, parentId: d.parentId || "", managerId: d.managerId || "" }); setDeptModal({ mode: "edit", dept: d }); };

  const saveDept = async () => {
    try {
      if (deptModal?.mode === "add") {
        await client.post("/saas-portal/org-hierarchy/departments", {
          orgId, name: deptForm.name, code: deptForm.code,
          parentId: deptForm.parentId || undefined, managerId: deptForm.managerId || undefined,
        });
        showToast("Department created");
      } else if (deptModal?.dept) {
        await client.patch(`/saas-portal/org-hierarchy/departments/${deptModal.dept.id}`, {
          name: deptForm.name, code: deptForm.code,
          parentId: deptForm.parentId || null, managerId: deptForm.managerId || null,
        });
        showToast("Department updated");
      }
      setDeptModal(null);
      await fetchHierarchy();
    } catch {
      showToast("Failed to save department");
    }
  };

  const requestDeleteDept = (d: Department) => {
    const children = departments.filter((x) => x.parentId === d.id);
    if (children.length > 0) { setDeleteConfirm(d); return; }
    void deleteDept(d.id);
  };

  const deleteDept = async (id: string) => {
    try {
      await client.delete(`/saas-portal/org-hierarchy/departments/${id}`);
      showToast("Department deleted");
      setDeleteConfirm(null);
      await fetchHierarchy();
    } catch {
      showToast("Failed to delete department");
    }
  };

  const openCcAdd = () => { setCcForm({ code: "", name: "", parentId: "", budget: "", isActive: true }); setCcModal({ mode: "add" }); };
  const openCcEdit = (cc: CostCenter) => { setCcForm({ code: cc.code, name: cc.name, parentId: cc.parentId || "", budget: String(cc.budget ?? ""), isActive: cc.isActive }); setCcModal({ mode: "edit", cc }); };

  const saveCc = async () => {
    try {
      if (ccModal?.mode === "add") {
        await client.post("/saas-portal/org-hierarchy/cost-centers", {
          orgId, code: ccForm.code, name: ccForm.name,
          parentId: ccForm.parentId || undefined, budget: parseFloat(ccForm.budget) || undefined,
        });
        showToast("Cost center created");
      } else if (ccModal?.cc) {
        await client.patch(`/saas-portal/org-hierarchy/cost-centers/${ccModal.cc.id}`, {
          name: ccForm.name, code: ccForm.code, parentId: ccForm.parentId || null,
          budget: parseFloat(ccForm.budget) || null, isActive: ccForm.isActive,
        });
        showToast("Cost center updated");
      }
      setCcModal(null);
      await fetchHierarchy();
    } catch {
      showToast("Failed to save cost center");
    }
  };

  const deleteCc = async (id: string) => {
    try {
      await client.delete(`/saas-portal/org-hierarchy/cost-centers/${id}`);
      showToast("Cost center deleted");
      await fetchHierarchy();
    } catch {
      showToast("Failed to delete cost center");
    }
  };

  const rootDepts = departments.filter((d) => !d.parentId);

  return (
    <RouteGuard permission="admin.org-hierarchy.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Organization Hierarchy"
          description="Manage departments and cost centers across your organization."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Team", href: "/saas/team" },
            { label: "Org Hierarchy" },
          ]}
        />

        {toast && (
          <div className="toast-container">
            <div className="toast-item toast-success">{toast}</div>
          </div>
        )}

        {error && <div className="ui-alert ui-alert-danger">{error}</div>}

        <Tabs
          tabs={[
            { key: "departments", label: "Departments", icon: <Network size={14} /> },
            { key: "cost-centers", label: "Cost Centers", icon: <DollarSign size={14} /> },
          ]}
          value={tab}
          onChange={(k) => setTab(k as "departments" | "cost-centers")}
        />

        {tab === "departments" && (
          <>
            <div className="ui-list-toolbar">
              <span className="ui-heading-sm">{departments.length} Departments</span>
              <button className="ui-btn ui-btn-primary" onClick={openDeptAdd}>
                <Plus size={14} /> Add Department
              </button>
            </div>
            <Card padding="lg">
              {loading ? (
                <p className="ui-text-xs-muted">Loading...</p>
              ) : rootDepts.length === 0 ? (
                <div className="ui-empty-state">
                  <p className="ui-heading-sm">No departments found</p>
                  <p className="ui-text-xs-muted">Create your first department to build the org tree.</p>
                </div>
              ) : (
                rootDepts.map((d) => (
                  <DeptNode key={d.id} dept={d} all={departments} onEdit={openDeptEdit} onDelete={requestDeleteDept} />
                ))
              )}
            </Card>
          </>
        )}

        {tab === "cost-centers" && (
          <>
            <div className="ui-list-toolbar">
              <span className="ui-heading-sm">{costCenters.length} Cost Centers</span>
              <button className="ui-btn ui-btn-primary" onClick={openCcAdd}>
                <Plus size={14} /> Add Cost Center
              </button>
            </div>
            <Card padding="lg">
              <DataTable
                columns={[
                  { key: "code", header: "Code" },
                  { key: "name", header: "Name", sortable: true },
                  { key: "parentName", header: "Parent" },
                  { key: "budget", header: "Budget" },
                  { key: "status", header: "Status" },
                  { key: "actions", header: "" },
                ]}
                data={costCenters.map((c) => ({
                  ...c,
                  parentName: c.parent?.name || "-",
                  budget: c.budget != null ? `$${Number(c.budget).toLocaleString()}` : "-",
                  status: <span className={`ui-badge ${c.isActive ? "ui-badge-success" : "ui-badge-neutral"}`}>{c.isActive ? "Active" : "Inactive"}</span>,
                  actions: (
                    <div className="ui-table-actions">
                      <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); openCcEdit(c); }} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); deleteCc(c.id); }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                })) as unknown as Record<string, unknown>[]}
                emptyTitle="No cost centers"
                emptyMessage="Create a cost center to track budgets."
              />
            </Card>
          </>
        )}

        <Modal
          open={!!deptModal}
          onClose={() => setDeptModal(null)}
          title={deptModal?.mode === "add" ? "Add Department" : "Edit Department"}
          footer={
            <>
              <button className="ui-btn ui-btn-secondary" onClick={() => setDeptModal(null)}>Cancel</button>
              <button className="ui-btn ui-btn-primary" disabled={!deptForm.name.trim() || !deptForm.code.trim()} onClick={saveDept}>Save</button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField label="Name" required value={deptForm.name} onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))} placeholder="Department name" />
            <TextField label="Code" required value={deptForm.code} onChange={(e) => setDeptForm((f) => ({ ...f, code: e.target.value }))} placeholder="DEPT-01" />
            <FormField label="Parent Department">
              <Select value={deptForm.parentId} onChange={(e) => setDeptForm((f) => ({ ...f, parentId: e.target.value }))}>
                <option value="">None (Root)</option>
                {departments.filter((d) => d.id !== deptModal?.dept?.id).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </FormField>
            <TextField label="Manager ID" value={deptForm.managerId} onChange={(e) => setDeptForm((f) => ({ ...f, managerId: e.target.value }))} placeholder="Optional" />
          </div>
        </Modal>

        <Modal
          open={!!ccModal}
          onClose={() => setCcModal(null)}
          title={ccModal?.mode === "add" ? "Add Cost Center" : "Edit Cost Center"}
          footer={
            <>
              <button className="ui-btn ui-btn-secondary" onClick={() => setCcModal(null)}>Cancel</button>
              <button className="ui-btn ui-btn-primary" disabled={!ccForm.name.trim() || !ccForm.code.trim()} onClick={saveCc}>Save</button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField label="Code" required value={ccForm.code} onChange={(e) => setCcForm((f) => ({ ...f, code: e.target.value }))} placeholder="CC-001" />
            <TextField label="Name" required value={ccForm.name} onChange={(e) => setCcForm((f) => ({ ...f, name: e.target.value }))} placeholder="Cost center name" />
            <FormField label="Parent Cost Center">
              <Select value={ccForm.parentId} onChange={(e) => setCcForm((f) => ({ ...f, parentId: e.target.value }))}>
                <option value="">None (Root)</option>
                {costCenters.filter((c) => c.id !== ccModal?.cc?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </Select>
            </FormField>
            <TextField label="Budget" type="number" value={ccForm.budget} onChange={(e) => setCcForm((f) => ({ ...f, budget: e.target.value }))} placeholder="0" />
            {ccModal?.mode === "edit" && (
              <label className="ui-hstack-2">
                <input type="checkbox" checked={ccForm.isActive} onChange={(e) => setCcForm((f) => ({ ...f, isActive: e.target.checked }))} />
                <span className="text-sm">Active</span>
              </label>
            )}
          </div>
        </Modal>

        <Modal
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete department?"
          description={`"${deleteConfirm?.name}" has child departments. Deleting it may orphan its children. Continue?`}
          footer={
            <>
              <button className="ui-btn ui-btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="ui-btn ui-btn-danger" onClick={() => deleteConfirm && deleteDept(deleteConfirm.id)}>Delete Anyway</button>
            </>
          }
        >
          <p className="ui-text-xs-muted">This action cannot be undone.</p>
        </Modal>
      </div>
    </RouteGuard>
  );
}
