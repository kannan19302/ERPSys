"use client";
import React, { useState, useEffect } from "react";
import { ListOrdered, Plus, Edit2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast } from "@unerp/ui";

export default function POSOrderTypesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    isDefault: false,
    sortOrder: 0,
  });
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/pos/exp/order-types");
      setItems(Array.isArray(d) ? d : []);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load order types";
      setLoadError(message);
      notifyError("Failed to load order types", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      if (editId) {
        await client.put(`/pos/exp/order-types/${editId}`, form);
      } else {
        await client.post("/pos/exp/order-types", form);
      }
      setShowModal(false);
      setEditId(null);
      load();
    } catch (err) {
      notifyError(
        "Failed to save order type",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <RouteGuard permission="pos.order-type.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <ListOrdered className="ui-text-primary" /> Order Types
            </h1>
            <p className="ui-text-sm-muted">
              Configure POS order types (Dine-in, Takeaway, Delivery, etc.).
            </p>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              setEditId(null);
              setForm({
                name: "",
                code: "",
                description: "",
                isDefault: false,
                sortOrder: 0,
              });
              setShowModal(true);
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            Failed to load order types — {loadError}
          </div>
        )}
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Default</th>
                <th>Active</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.code}</td>
                    <td>{i.isDefault ? "Yes" : "-"}</td>
                    <td>{i.isActive ? "Yes" : "No"}</td>
                    <td>{i.sortOrder}</td>
                    <td>
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
              <h2>{editId ? "Edit" : "Add"} Order Type</h2>
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
                <label>Description</label>
                <textarea
                  className="ui-input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                />{" "}
                Set as default
              </label>
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
