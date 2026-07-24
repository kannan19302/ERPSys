"use client";
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast } from "@unerp/ui";

export default function SaasPlansPage() {
  const client = useApiClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { error: notifyError } = useToast();
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    interval: "MONTHLY",
    amount: 0,
    currency: "USD",
    trialDays: 0,
    isActive: true,
    features: [] as string[],
  });
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/saas/exp/plans");
      setItems(Array.isArray(d) ? d : []);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load plans";
      setError(message);
      notifyError("Failed to load subscription plans", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      if (editId) {
        await client.put(`/saas/exp/plans/${editId}`, form);
      } else {
        await client.post("/saas/exp/plans", form);
      }
      setShowModal(false);
      setEditId(null);
      load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save plan";
      notifyError("Failed to save plan", message);
    }
  };
  const remove = async (id: string) => {
    try {
      await client.delete(`/saas/exp/plans/${id}`);
      load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete plan";
      notifyError("Failed to delete plan", message);
    }
  };
  return (
    <RouteGuard permission="saas.billing.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <CreditCard className="ui-text-primary" /> Subscription Plans
            </h1>
            <p className="ui-text-sm-muted">Manage pricing plans.</p>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              setEditId(null);
              setForm({
                name: "",
                code: "",
                description: "",
                interval: "MONTHLY",
                amount: 0,
                currency: "USD",
                trialDays: 0,
                isActive: true,
                features: [],
              });
              setShowModal(true);
            }}
          >
            <Plus size={14} /> Add Plan
          </button>
        </div>
        {error && (
          <div className="ui-alert ui-alert-danger">
            <AlertTriangle size={16} />
            Failed to load subscription plans — list below may be stale. {error}
          </div>
        )}
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Amount</th>
                <th>Interval</th>
                <th>Trial</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>
                      <code>{i.code}</code>
                    </td>
                    <td>
                      {i.currency} {Number(i.amount).toFixed(2)}
                    </td>
                    <td>{i.interval}</td>
                    <td>{i.trialDays}d</td>
                    <td>
                      {i.isActive ? (
                        <span className="ui-badge-success">Active</span>
                      ) : (
                        <span className="ui-badge">Inactive</span>
                      )}
                    </td>
                    <td className="ui-hstack-1">
                      <button
                        className="ui-btn-icon"
                        onClick={() => {
                          setEditId(i.id);
                          setForm(i);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="ui-btn-icon ui-text-error"
                        onClick={() => remove(i.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editId ? "Edit" : "Add"} Plan</h2>
              <div className="ui-form-group">
                <label>Name</label>
                <input
                  className="ui-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Code</label>
                <input
                  className="ui-input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Amount</label>
                <input
                  type="number"
                  className="ui-input"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                />
              </div>
              <select
                className="ui-input"
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
              >
                <option>MONTHLY</option>
                <option>YEARLY</option>
                <option>QUARTERLY</option>
              </select>
              <div className="ui-hstack-2 mt-4">
                <button className="ui-btn" onClick={save}>
                  Save
                </button>
                <button
                  className="ui-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
