"use client";
import React, { useState, useEffect } from "react";
import { Palette, Plus, CheckCircle } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast } from "@unerp/ui";

export default function EcommerceThemesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    isActive: false,
    config: {} as any,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    if (storeId) load();
  }, [storeId]);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>(`/ecommerce/exp/${storeId}/themes`);
      setItems(Array.isArray(d) ? d : []);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load themes.";
      setLoadError(message);
      notifyError("Failed to load themes", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      await client.post(`/ecommerce/exp/${storeId}/themes`, form);
      setShowModal(false);
      load();
    } catch (err) {
      notifyError(
        "Failed to save theme",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  const activate = async (id: string) => {
    try {
      await client.post(`/ecommerce/exp/${storeId}/themes/${id}/activate`, {});
      load();
    } catch (err) {
      notifyError(
        "Failed to activate theme",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <RouteGuard permission="ecommerce.storefront.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <Palette className="ui-text-primary" /> Store Themes
            </h1>
            <p className="ui-text-sm-muted">
              Manage visual themes for your storefront.
            </p>
          </div>
          <div className="ui-hstack-2">
            <input
              className="ui-input"
              placeholder="Store ID"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            />
            <button
              className="ui-btn"
              disabled={!storeId}
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} /> Create Theme
            </button>
          </div>
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">{loadError}</div>
        )}
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Active</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>
                      {i.isActive ? (
                        <span className="ui-badge-success">
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="ui-badge">Inactive</span>
                      )}
                    </td>
                    <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                    <td>
                      {!i.isActive && (
                        <button
                          className="ui-btn"
                          onClick={() => activate(i.id)}
                        >
                          Activate
                        </button>
                      )}
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
              <h2>Create Theme</h2>
              <div className="ui-form-group">
                <label>Name</label>
                <input
                  className="ui-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
