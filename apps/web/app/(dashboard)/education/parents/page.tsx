"use client";
import { useState, useEffect } from "react";
import { api } from "@unerp/shared/api";
import { ProtectedComponent } from "@unerp/ui";
import { Plus, Loader2 } from "lucide-react";

export default function EducationParentsPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relation: "PARENT",
  });

  useEffect(() => {
    loadData();
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const r = await api.get("/ext/education/deep/parents");
      setParents(r.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createParent() {
    try {
      await api.post("/ext/education/deep/parents", form);
      setShowForm(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        relation: "PARENT",
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Parents & Guardians</h1>
        <ProtectedComponent permission="education.students.create">
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> Add Parent
          </button>
        </ProtectedComponent>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Register Parent/Guardian</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">First Name</label>
              <input
                className="ui-input"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Last Name</label>
              <input
                className="ui-input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Email</label>
              <input
                className="ui-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Phone</label>
              <input
                className="ui-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Relation</label>
              <select
                className="ui-input"
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
              >
                <option value="PARENT">Parent</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createParent}>
              Save
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
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Relation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p: any) => (
                <tr key={p.id}>
                  <td className="font-medium">
                    {p.firstName} {p.lastName}
                  </td>
                  <td>{p.email || "-"}</td>
                  <td>{p.phone || "-"}</td>
                  <td>
                    <span className="ui-badge ui-badge-info">{p.relation}</span>
                  </td>
                  <td>
                    {p.isPrimary ? (
                      <span className="ui-badge ui-badge-success">Primary</span>
                    ) : (
                      <span className="ui-badge">Secondary</span>
                    )}
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
