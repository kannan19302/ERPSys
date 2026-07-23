"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { Users, Plus, X, Calendar, Clock } from "lucide-react";
import { useApiClient } from "@unerp/framework";

interface Allocation {
  id: string;
  projectId: string;
  resourceId: string;
  resourceType: string;
  allocatedHours: number;
  startDate: string;
  endDate: string;
  notes: string | null;
}

export default function ResourcesPage() {
  const client = useApiClient();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlloc, setNewAlloc] = useState({
    projectId: "",
    resourceId: "",
    resourceType: "EMPLOYEE",
    allocatedHours: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchProjects();
  }, [client]);
  useEffect(() => {
    if (selectedProject) fetchAllocations();
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

  const fetchAllocations = async () => {
    try {
      const data = await client.get<Allocation[] | { data?: Allocation[] }>(
        `/projects/${selectedProject}/resource-allocations`,
      );
      setAllocations(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/projects/resource-allocations", {
        ...newAlloc,
        allocatedHours: parseFloat(newAlloc.allocatedHours),
      });
      setIsModalOpen(false);
      setNewAlloc({
        projectId: selectedProject,
        resourceId: "",
        resourceType: "EMPLOYEE",
        allocatedHours: "",
        startDate: "",
        endDate: "",
        notes: "",
      });
      fetchAllocations();
      alert("Resource allocation created!");
    } catch {
      alert("Failed to create allocation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this allocation?")) return;
    try {
      await client.delete(`/projects/resource-allocations/${id}`);
      fetchAllocations();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Users size={28} className="ui-text-primary" /> Resource Allocations
          </h1>
          <p className={styles.p2}>
            Allocate employees, equipment, and materials to projects
          </p>
        </div>
        <button
          onClick={() => {
            setNewAlloc((p) => ({ ...p, projectId: selectedProject }));
            setIsModalOpen(true);
          }}
          className={styles.addBtn}
        >
          <Plus size={18} /> Allocate
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
      {loading && <div className="ui-text-muted">Loading...</div>}
      <div className="ui-stack-3">
        {allocations.map((a) => (
          <div key={a.id} className={styles.card}>
            <div className="ui-flex-between">
              <div>
                <div className={styles.typeLabel}>{a.resourceType}</div>
                <p className={styles.resourceId}>Resource: {a.resourceId}</p>
                <div className={styles.meta}>
                  <span>
                    <Clock size={12} /> {a.allocatedHours}h
                  </span>
                  <span>
                    <Calendar size={12} />{" "}
                    {new Date(a.startDate).toLocaleDateString()} -{" "}
                    {new Date(a.endDate).toLocaleDateString()}
                  </span>
                </div>
                {a.notes && <p className={styles.notes}>{a.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className={styles.deleteBtn}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {allocations.length === 0 && !loading && (
          <div className="ui-text-muted">No allocations yet.</div>
        )}
      </div>
      {isModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>New Allocation</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Resource ID</label>
                <input
                  className="ui-input"
                  value={newAlloc.resourceId}
                  onChange={(e) =>
                    setNewAlloc((p) => ({ ...p, resourceId: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Type</label>
                <select
                  className="ui-input"
                  value={newAlloc.resourceType}
                  onChange={(e) =>
                    setNewAlloc((p) => ({ ...p, resourceType: e.target.value }))
                  }
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="MATERIAL">Material</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Hours</label>
                <input
                  className="ui-input"
                  type="number"
                  value={newAlloc.allocatedHours}
                  onChange={(e) =>
                    setNewAlloc((p) => ({
                      ...p,
                      allocatedHours: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Start</label>
                  <input
                    className="ui-input"
                    type="date"
                    value={newAlloc.startDate}
                    onChange={(e) =>
                      setNewAlloc((p) => ({ ...p, startDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">End</label>
                  <input
                    className="ui-input"
                    type="date"
                    value={newAlloc.endDate}
                    onChange={(e) =>
                      setNewAlloc((p) => ({ ...p, endDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Notes</label>
                <textarea
                  className="ui-input"
                  value={newAlloc.notes}
                  onChange={(e) =>
                    setNewAlloc((p) => ({ ...p, notes: e.target.value }))
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
    </div>
  );
}
