// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { Percent, Plus, Edit2, Trash2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast } from "@unerp/ui";

export default function POSDiscountRulesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: 0,
    appliesTo: "ORDER",
    priority: 10,
    stackable: false,
  });
  useEffect(() => {
    load();
  }, [page]);
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const d = await client.get<any>(`/pos/exp/discount-rules?${params}`);
      if (d?.data) {
        setItems(d.data);
        setTotalPages(d.meta?.totalPages || 1);
      }
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load discount rules";
      setLoadError(message);
      notifyError("Failed to load discount rules", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      if (editId) {
        await client.put(`/pos/exp/discount-rules/${editId}`, form);
      } else {
        await client.post("/pos/exp/discount-rules", form);
      }
      setShowModal(false);
      setEditId(null);
      load();
    } catch (err) {
      notifyError(
        "Failed to save discount rule",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  const remove = async (id: string) => {
    try {
      await client.delete(`/pos/exp/discount-rules/${id}`);
      load();
    } catch (err) {
      notifyError(
        "Failed to delete discount rule",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <RouteGuard permission="pos.discount.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <Percent className="ui-text-primary" /> Discount Rules
            </h1>
            <p className="ui-text-sm-muted">
              Configure percentage, fixed, and promotional discount rules.
            </p>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              setEditId(null);
              setForm({
                name: "",
                description: "",
                type: "PERCENTAGE",
                value: 0,
                appliesTo: "ORDER",
                priority: 10,
                stackable: false,
              });
              setShowModal(true);
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            Failed to load discount rules — {loadError}
          </div>
        )}
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Applies To</th>
                <th>Priority</th>
                <th>Status</th>
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
                    <td>{i.type}</td>
                    <td>
                      {i.type === "PERCENTAGE" ? `${i.value}%` : `$${i.value}`}
                    </td>
                    <td>{i.appliesTo}</td>
                    <td>{i.priority}</td>
                    <td>
                      <span
                        className={`ui-badge-${i.status === "ACTIVE" ? "success" : ""}`}
                      >
                        {i.status}
                      </span>
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
              <h2>{editId ? "Edit" : "Add"} Discount Rule</h2>
              <div className="ui-form-group">
                <label>Name</label>
                <input
                  className="ui-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Type</label>
                <select
                  className="ui-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed</option>
                  <option value="BUY_X_GET_Y">Buy X Get Y</option>
                  <option value="COMBO">Combo</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label>Value</label>
                <input
                  type="number"
                  className="ui-input"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: Number(e.target.value) })
                  }
                />
              </div>
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
