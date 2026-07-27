"use client";
import { useState, useEffect } from "react";
import { ProtectedComponent } from "@unerp/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => { const r = await fetch(`${BASE}${p}`, { credentials: "include" }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  post: async (p: string, b?: unknown) => { const r = await fetch(`${BASE}${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  patch: async (p: string, b?: unknown) => { const r = await fetch(`${BASE}${p}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
};
import { Plus, Search, Filter, Loader2 } from "lucide-react";

export default function HealthcareLabOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    patientId: "",
    testName: "",
    testCode: "",
    specimenType: "",
    priority: "ROUTINE",
    notes: "",
  });
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    api
      .get("/ext/healthcare/patients")
      .then((r: any) => setPatients(r.data || []))
      .catch(() => {});
  }, [statusFilter]);
  async function loadOrders() {
    setLoading(true);
    try {
      const r = await api.get(
        "/ext/healthcare/deep/lab-orders" +
          (statusFilter ? `?status=${statusFilter}` : ""),
      );
      setOrders(r.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createOrder() {
    try {
      await api.post("/ext/healthcare/deep/lab-orders", form);
      setShowForm(false);
      setForm({
        patientId: "",
        testName: "",
        testCode: "",
        specimenType: "",
        priority: "ROUTINE",
        notes: "",
      });
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  }
  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/ext/healthcare/deep/lab-orders/${id}/status`, {
        status,
      });
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Lab Orders</h1>
        <ProtectedComponent permission="healthcare.labs.create">
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> New Lab Order
          </button>
        </ProtectedComponent>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Create Lab Order</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Patient</label>
              <select
                className="ui-input"
                value={form.patientId}
                onChange={(e) =>
                  setForm({ ...form, patientId: e.target.value })
                }
              >
                <option value="">Select Patient</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Test Name</label>
              <input
                className="ui-input"
                value={form.testName}
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
                placeholder="e.g. Complete Blood Count"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Test Code</label>
              <input
                className="ui-input"
                value={form.testCode}
                onChange={(e) => setForm({ ...form, testCode: e.target.value })}
                placeholder="e.g. CBC"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Specimen Type</label>
              <input
                className="ui-input"
                value={form.specimenType}
                onChange={(e) =>
                  setForm({ ...form, specimenType: e.target.value })
                }
                placeholder="e.g. Blood"
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Priority</label>
              <select
                className="ui-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Notes</label>
              <input
                className="ui-input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createOrder}>
              Submit
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="ui-input pl-9" placeholder="Search lab orders..." />
        </div>
        <select
          className="ui-input w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ORDERED">Ordered</option>
          <option value="COLLECTED">Collected</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Ordered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="font-medium">
                    {o.patient?.firstName} {o.patient?.lastName}
                  </td>
                  <td>{o.testName}</td>
                  <td>
                    <span
                      className={`ui-badge ${o.priority === "STAT" ? "ui-badge-danger" : o.priority === "URGENT" ? "ui-badge-warning" : "ui-badge-info"}`}
                    >
                      {o.priority}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`ui-badge ${o.status === "COMPLETED" ? "ui-badge-success" : o.status === "CANCELLED" ? "ui-badge-danger" : "ui-badge-info"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.orderedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      {o.status === "ORDERED" && (
                        <button
                          className="ui-btn ui-btn-sm ui-btn-outline"
                          onClick={() => updateStatus(o.id, "COLLECTED")}
                        >
                          Collect
                        </button>
                      )}
                      {o.status === "COLLECTED" && (
                        <button
                          className="ui-btn ui-btn-sm ui-btn-outline"
                          onClick={() => updateStatus(o.id, "PROCESSING")}
                        >
                          Process
                        </button>
                      )}
                      {o.status === "PROCESSING" && (
                        <button
                          className="ui-btn ui-btn-sm ui-btn-outline"
                          onClick={() => updateStatus(o.id, "COMPLETED")}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
