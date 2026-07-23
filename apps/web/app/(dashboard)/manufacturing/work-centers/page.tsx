"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { Factory, Plus, X, Calendar, Clock } from "lucide-react";
import { useApiClient } from "@unerp/framework";

interface Workstation {
  id: string;
  name: string;
  code: string;
  capacityHours: number;
}

interface Capacity {
  id: string;
  workstationId: string;
  date: string;
  availableHours: number;
  utilizedHours: number;
  overtimeHours: number;
  notes: string | null;
}

export default function WorkCentersPage() {
  const client = useApiClient();
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [selectedWS, setSelectedWS] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCap, setNewCap] = useState({
    workstationId: "",
    date: new Date().toISOString().split("T")[0],
    availableHours: "8",
    overtimeHours: "0",
    notes: "",
  });

  useEffect(() => {
    fetchWorkstations();
  }, [client]);
  useEffect(() => {
    if (selectedWS) fetchCapacities();
  }, [selectedWS]);

  const fetchWorkstations = async () => {
    try {
      const data = await client.get<Workstation[] | { data?: Workstation[] }>(
        "/manufacturing/workstations",
      );
      const list = Array.isArray(data) ? data : data?.data || [];
      setWorkstations(list);
      if (list.length > 0) setSelectedWS(list[0]!.id);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchCapacities = async () => {
    try {
      const data = await client.get<Capacity[] | { data?: Capacity[] }>(
        `/manufacturing/work-centers/${selectedWS}/capacity`,
      );
      setCapacities(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/manufacturing/work-centers/capacity", {
        ...newCap,
        availableHours: parseFloat(newCap.availableHours),
        overtimeHours: parseFloat(newCap.overtimeHours),
      });
      setIsModalOpen(false);
      setNewCap({
        workstationId: selectedWS,
        date: new Date().toISOString().split("T")[0],
        availableHours: "8",
        overtimeHours: "0",
        notes: "",
      });
      fetchCapacities();
      alert("Capacity set!");
    } catch {
      alert("Failed to set capacity");
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <Factory size={28} className="ui-text-primary" /> Work Center
            Capacity
          </h1>
          <p className={styles.p2}>
            Track daily capacity and utilization across workstations
          </p>
        </div>
        <button
          onClick={() => {
            setNewCap((p) => ({ ...p, workstationId: selectedWS }));
            setIsModalOpen(true);
          }}
          className={styles.addBtn}
        >
          <Plus size={18} /> Set Capacity
        </button>
      </div>
      <div className="ui-form-group">
        <label className="ui-label">Workstation</label>
        <select
          className="ui-input"
          value={selectedWS}
          onChange={(e) => setSelectedWS(e.target.value)}
        >
          {workstations.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} ({ws.code})
            </option>
          ))}
        </select>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Available</th>
            <th>Utilized</th>
            <th>Overtime</th>
            <th>Utilization</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {capacities.map((c) => {
            const utilPct =
              c.availableHours > 0
                ? Math.round((c.utilizedHours / c.availableHours) * 100)
                : 0;
            return (
              <tr key={c.id}>
                <td>{new Date(c.date).toLocaleDateString()}</td>
                <td>{c.availableHours}h</td>
                <td>{c.utilizedHours}h</td>
                <td>{c.overtimeHours > 0 ? `${c.overtimeHours}h` : "-"}</td>
                <td>
                  <span
                    className={
                      utilPct > 90 ? styles.highUtil : styles.normalUtil
                    }
                  >
                    {utilPct}%
                  </span>
                </td>
                <td className={styles.notesCell}>{c.notes || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {capacities.length === 0 && !loading && (
        <div className="ui-text-muted">No capacity records yet.</div>
      )}
      {isModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>Set Capacity</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Date</label>
                <input
                  className="ui-input"
                  type="date"
                  value={newCap.date}
                  onChange={(e) =>
                    setNewCap((p) => ({ ...p, date: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Available Hours</label>
                <input
                  className="ui-input"
                  type="number"
                  value={newCap.availableHours}
                  onChange={(e) =>
                    setNewCap((p) => ({ ...p, availableHours: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Overtime Hours</label>
                <input
                  className="ui-input"
                  type="number"
                  value={newCap.overtimeHours}
                  onChange={(e) =>
                    setNewCap((p) => ({ ...p, overtimeHours: e.target.value }))
                  }
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Notes</label>
                <textarea
                  className="ui-input"
                  value={newCap.notes}
                  onChange={(e) =>
                    setNewCap((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
