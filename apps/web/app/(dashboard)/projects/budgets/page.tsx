"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { DollarSign, Plus, X, Edit3 } from "lucide-react";
import { useApiClient } from "@unerp/framework";

interface BudgetLine {
  id: string;
  projectId: string;
  category: string;
  allocated: number;
  spent: number;
  committed: number;
  fiscalYear: string | null;
  notes: string | null;
}

export default function BudgetsPage() {
  const client = useApiClient();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLine, setEditLine] = useState<BudgetLine | null>(null);
  const [newLine, setNewLine] = useState({
    projectId: "",
    category: "LABOR",
    allocated: "",
    committed: "0",
    fiscalYear: "",
    notes: "",
  });
  const [editData, setEditData] = useState({
    allocated: "",
    committed: "",
    notes: "",
  });

  useEffect(() => {
    fetchProjects();
  }, [client]);
  useEffect(() => {
    if (selectedProject) fetchLines();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const data = await client.get<
        | { id: string; name: string }[]
        | { data?: { id: string; name: string }[] }
      >("/projects");
      const list = Array.isArray(data) ? data : data?.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0]!.id);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async () => {
    try {
      const data = await client.get<BudgetLine[] | { data?: BudgetLine[] }>(
        `/projects/${selectedProject}/budget-lines`,
      );
      setLines(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/projects/budget-lines", {
        ...newLine,
        allocated: parseFloat(newLine.allocated),
        committed: parseFloat(newLine.committed),
      });
      setIsModalOpen(false);
      setNewLine({
        projectId: selectedProject,
        category: "LABOR",
        allocated: "",
        committed: "0",
        fiscalYear: "",
        notes: "",
      });
      fetchLines();
      alert("Budget line created!");
    } catch {
      alert("Failed to create budget line");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLine) return;
    try {
      await client.put(`/projects/budget-lines/${editLine.id}`, {
        ...editData,
        allocated: parseFloat(editData.allocated),
        committed: parseFloat(editData.committed),
      });
      setIsEditOpen(false);
      setEditLine(null);
      fetchLines();
      alert("Budget line updated!");
    } catch {
      alert("Failed to update");
    }
  };

  const totalAllocated = lines.reduce((s, l) => s + l.allocated, 0);
  const totalSpent = lines.reduce((s, l) => s + l.spent, 0);

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <DollarSign size={28} className="ui-text-success" /> Project Budgets
          </h1>
          <p className={styles.p2}>
            Manage budget lines by category across projects
          </p>
        </div>
        <button
          onClick={() => {
            setNewLine((p) => ({ ...p, projectId: selectedProject }));
            setIsModalOpen(true);
          }}
          className={styles.addBtn}
        >
          <Plus size={18} /> Add Budget Line
        </button>
      </div>
      <div className="ui-form-group">
        <label className="ui-label">Project</label>
        <select
          className="ui-input"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {lines.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Allocated</span>
            <span className={styles.summaryValue}>
              ${totalAllocated.toLocaleString()}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Spent</span>
            <span className={styles.summaryValue}>
              ${totalSpent.toLocaleString()}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Remaining</span>
            <span className={styles.summaryValue}>
              ${(totalAllocated - totalSpent).toLocaleString()}
            </span>
          </div>
        </div>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Category</th>
            <th>Allocated</th>
            <th>Spent</th>
            <th>Committed</th>
            <th>Remaining</th>
            <th>Fiscal Year</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td>
                <span className={styles.categoryBadge}>{l.category}</span>
              </td>
              <td>${l.allocated.toLocaleString()}</td>
              <td>${l.spent.toLocaleString()}</td>
              <td>${l.committed.toLocaleString()}</td>
              <td>${(l.allocated - l.spent).toLocaleString()}</td>
              <td>{l.fiscalYear || "-"}</td>
              <td className={styles.notesCell}>{l.notes || "-"}</td>
              <td>
                <button
                  onClick={() => {
                    setEditLine(l);
                    setEditData({
                      allocated: String(l.allocated),
                      committed: String(l.committed),
                      notes: l.notes || "",
                    });
                    setIsEditOpen(true);
                  }}
                  className={styles.editBtn}
                >
                  <Edit3 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lines.length === 0 && !loading && (
        <div className="ui-text-muted">No budget lines yet.</div>
      )}
      {isModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>New Budget Line</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Category</label>
                <select
                  className="ui-input"
                  value={newLine.category}
                  onChange={(e) =>
                    setNewLine((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  <option value="LABOR">Labor</option>
                  <option value="MATERIAL">Material</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="OVERHEAD">Overhead</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Allocated Amount</label>
                <input
                  className="ui-input"
                  type="number"
                  value={newLine.allocated}
                  onChange={(e) =>
                    setNewLine((p) => ({ ...p, allocated: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Committed</label>
                <input
                  className="ui-input"
                  type="number"
                  value={newLine.committed}
                  onChange={(e) =>
                    setNewLine((p) => ({ ...p, committed: e.target.value }))
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Fiscal Year</label>
                <input
                  className="ui-input"
                  value={newLine.fiscalYear}
                  onChange={(e) =>
                    setNewLine((p) => ({ ...p, fiscalYear: e.target.value }))
                  }
                  placeholder="e.g. FY2026"
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Notes</label>
                <textarea
                  className="ui-input"
                  value={newLine.notes}
                  onChange={(e) =>
                    setNewLine((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Create
              </button>
            </form>
          </div>
        </div>
      )}
      {isEditOpen && editLine && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>Edit {editLine.category}</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Allocated</label>
                <input
                  className="ui-input"
                  type="number"
                  value={editData.allocated}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, allocated: e.target.value }))
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Committed</label>
                <input
                  className="ui-input"
                  type="number"
                  value={editData.committed}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, committed: e.target.value }))
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Notes</label>
                <textarea
                  className="ui-input"
                  value={editData.notes}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
