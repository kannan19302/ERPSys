// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  Webhook,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { useToast } from "@unerp/ui";

export default function SaasExpWebhooksPage() {
  const client = useApiClient();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeliveries, setShowDeliveries] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [form, setForm] = useState({
    url: "",
    events: [] as string[],
    isActive: true,
    secret: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const { error: notifyError } = useToast();
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/saas/exp/webhook-endpoints");
      setEndpoints(Array.isArray(d) ? d : []);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load webhook endpoints";
      setError(message);
      notifyError("Failed to load webhook endpoints", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      if (editId) {
        await client.put(`/saas/exp/webhook-endpoints/${editId}`, form);
      } else {
        await client.post("/saas/exp/webhook-endpoints", form);
      }
      setShowModal(false);
      setEditId(null);
      load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save webhook endpoint";
      notifyError("Failed to save webhook endpoint", message);
    }
  };
  const remove = async (id: string) => {
    try {
      await client.delete(`/saas/exp/webhook-endpoints/${id}`);
      load();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete webhook endpoint";
      notifyError("Failed to delete webhook endpoint", message);
    }
  };
  const loadDeliveries = async (id: string) => {
    try {
      const d = await client.get<any>(
        `/saas/exp/webhook-endpoints/${id}/deliveries`,
      );
      setDeliveries(Array.isArray(d) ? d : []);
      setShowDeliveries(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load deliveries";
      notifyError("Failed to load deliveries", message);
    }
  };
  const retry = async (id: string) => {
    try {
      await client.post(`/saas/exp/webhook-deliveries/${id}/retry`, {});
      loadDeliveries(showDeliveries!);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to retry delivery";
      notifyError("Failed to retry delivery", message);
    }
  };
  return (
    <RouteGuard permission="saas.webhook.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <Webhook className="ui-text-primary" /> Webhook Endpoints
            </h1>
            <p className="ui-text-sm-muted">
              Manage webhook endpoints and view delivery logs.
            </p>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              setEditId(null);
              setForm({
                url: "",
                events: [],
                isActive: true,
                secret: "",
                description: "",
              });
              setShowModal(true);
            }}
          >
            <Plus size={14} /> Add Endpoint
          </button>
        </div>
        {error && (
          <div className="ui-alert ui-alert-danger">
            <AlertTriangle size={16} />
            Failed to load webhook endpoints — list below may be stale. {error}
          </div>
        )}
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Events</th>
                <th>Active</th>
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
                endpoints.map((e) => (
                  <tr key={e.id}>
                    <td className="max-w-xs truncate">{e.url}</td>
                    <td>{(e.events || []).join(", ")}</td>
                    <td>
                      {e.isActive ? (
                        <span className="ui-badge-success">Active</span>
                      ) : (
                        <span className="ui-badge">Disabled</span>
                      )}
                    </td>
                    <td className="ui-hstack-1">
                      <button
                        className="ui-btn-icon"
                        onClick={() => loadDeliveries(e.id)}
                        title="View deliveries"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="ui-btn-icon"
                        onClick={() => {
                          setEditId(e.id);
                          setForm(e);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="ui-btn-icon ui-text-error"
                        onClick={() => remove(e.id)}
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
        {showDeliveries && (
          <div className="ui-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3>Deliveries</h3>
              <button
                onClick={() => setShowDeliveries(null)}
                className="ui-btn-secondary"
              >
                Close
              </button>
            </div>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Attempt</th>
                  <th>Response</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span
                        className={`ui-badge-${d.status === "SUCCESS" ? "success" : d.status === "PENDING" ? "info" : "error"}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td>{d.attemptNumber}</td>
                    <td>{d.responseCode ? `${d.responseCode}` : "-"}</td>
                    <td>{new Date(d.createdAt).toLocaleString()}</td>
                    <td>
                      {d.status !== "SUCCESS" && (
                        <button
                          className="ui-btn-icon"
                          onClick={() => retry(d.id)}
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editId ? "Edit" : "Add"} Webhook Endpoint</h2>
              <div className="ui-form-group">
                <label>URL</label>
                <input
                  className="ui-input"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Events (comma separated)</label>
                <input
                  className="ui-input"
                  value={form.events.join(",")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      events: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
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
