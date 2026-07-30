// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { KeyRound, Plus, Eye, Trash2, Copy, AlertTriangle } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast } from "@unerp/ui";

export default function SaasExpApiKeysPage() {
  const client = useApiClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { error: notifyError } = useToast();
  const [form, setForm] = useState({
    name: "",
    scopes: [] as string[],
    expiresAt: "",
  });
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/saas/exp/api-keys");
      setItems(Array.isArray(d) ? d : []);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load API keys";
      setError(message);
      notifyError("Failed to load API keys", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      const d = await client.post<any>("/saas/exp/api-keys", form);
      setNewKey(d?.key || "");
      setShowModal(false);
      load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create API key";
      notifyError("Failed to create API key", message);
    }
  };
  const remove = async (id: string) => {
    try {
      await client.post(`/saas/exp/api-keys/${id}/revoke`, {});
      load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to revoke API key";
      notifyError("Failed to revoke API key", message);
    }
  };
  return (
    <RouteGuard permission="saas.api-key.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <KeyRound className="ui-text-primary" /> API Keys
            </h1>
            <p className="ui-text-sm-muted">
              Manage API keys for tenant integrations.
            </p>
          </div>
          <button className="ui-btn" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Create Key
          </button>
        </div>
        {error && (
          <div className="ui-alert ui-alert-danger">
            <AlertTriangle size={16} />
            Failed to load API keys — list below may be stale. {error}
          </div>
        )}
        {newKey && (
          <div className="ui-card p-4 bg-green-50 border border-green-300">
            <p className="font-bold mb-2">API Key Created - Copy it now!</p>
            <div className="ui-hstack-2">
              <code className="p-2 bg-white border rounded flex-1">
                {newKey}
              </code>
              <button
                className="ui-btn"
                onClick={() => navigator.clipboard?.writeText(newKey)}
              >
                <Copy size={14} /> Copy
              </button>
            </div>
          </div>
        )}
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key (masked)</th>
                <th>Scopes</th>
                <th>Expires</th>
                <th>Last Used</th>
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
                    <td>
                      <code>
                        {i.key?.substring(0, 12)}...{i.key?.slice(-4)}
                      </code>
                    </td>
                    <td>{(i.scopes || []).join(", ")}</td>
                    <td>
                      {i.expiresAt
                        ? new Date(i.expiresAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td>
                      {i.lastUsedAt
                        ? new Date(i.lastUsedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td>
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
              <h2>Create API Key</h2>
              <div className="ui-form-group">
                <label>Name</label>
                <input
                  className="ui-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Scopes (comma separated)</label>
                <input
                  className="ui-input"
                  value={form.scopes.join(",")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      scopes: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>
              <div className="ui-hstack-2 mt-4">
                <button className="ui-btn" onClick={save}>
                  Create
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
