"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Copy } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  channel: string;
  eventType?: string;
  isActive: boolean;
  category?: string;
  createdAt: string;
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    channel: "EMAIL",
    eventType: "",
    category: "",
    variables: "",
  });
  const [renderVars, setRenderVars] = useState("");
  const [rendered, setRendered] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [channelFilter]);

  const loadTemplates = async () => {
    setLoading(true);
    const url = channelFilter
      ? `/api/notifications/templates?channel=${channelFilter}`
      : "/api/notifications/templates";
    const res = await fetch(url);
    const data = await res.json();
    setTemplates(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      subject: "",
      body: "",
      channel: "EMAIL",
      eventType: "",
      category: "",
      variables: "",
    });
    setRendered(null);
    setRenderVars("");
    setShowEditor(true);
  };

  const openEdit = async (id: string) => {
    setEditingId(id);
    const res = await fetch(`/api/notifications/templates/${id}`);
    const t = await res.json();
    setForm({
      name: t.name,
      subject: t.subject,
      body: t.body,
      channel: t.channel,
      eventType: t.eventType ?? "",
      category: t.category ?? "",
      variables: (t.variables ?? []).join(", "),
    });
    setRendered(null);
    setRenderVars("");
    setShowEditor(true);
  };

  const save = async () => {
    const body = {
      ...form,
      variables: form.variables
        .split(",")
        .map((v: string) => v.trim())
        .filter(Boolean),
    };
    const url = editingId
      ? `/api/notifications/templates/${editingId}`
      : "/api/notifications/templates";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowEditor(false);
    loadTemplates();
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/notifications/templates/${id}`, { method: "DELETE" });
    loadTemplates();
  };

  const renderTemplate = async (id: string) => {
    try {
      const varsObj = Object.fromEntries(
        renderVars
          .split("\n")
          .filter(Boolean)
          .map((l: string) => {
            const [k, ...v] = l.split("=");
            return [k.trim(), v.join("=").trim()];
          }),
      );
      const res = await fetch(`/api/notifications/templates/${id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: varsObj }),
      });
      const data = await res.json();
      setRendered(data);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notification Templates</h1>
        <button className="ui-btn ui-btn-primary" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> New Template
        </button>
      </div>
      <div className="ui-form-group">
        <select
          className="ui-input"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option value="">All Channels</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="PUSH">Push</option>
          <option value="IN_APP">In-App</option>
        </select>
      </div>
      {showEditor && (
        <div className="ui-card p-4">
          <h2 className="font-semibold mb-4">
            {editingId ? "Edit" : "New"} Template
          </h2>
          <div className="ui-grid-2">
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Channel</label>
              <select
                className="ui-input"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">Push</option>
                <option value="IN_APP">In-App</option>
              </select>
            </div>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Subject</label>
            <input
              className="ui-input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Body</label>
            <textarea
              className="ui-input"
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div className="ui-grid-2">
            <div className="ui-form-group">
              <label className="ui-label">Variables (comma-separated)</label>
              <input
                className="ui-input"
                value={form.variables}
                onChange={(e) =>
                  setForm({ ...form, variables: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Event Type</label>
              <input
                className="ui-input"
                value={form.eventType}
                onChange={(e) =>
                  setForm({ ...form, eventType: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="ui-btn ui-btn-primary" onClick={save}>
              Save
            </button>
            <button
              className="ui-btn ui-btn-secondary"
              onClick={() => setShowEditor(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && templates.length === 0 && (
        <div className="text-gray-500">No templates found.</div>
      )}
      <table className="ui-table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Subject</th>
            <th>Channel</th>
            <th>Event</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td className="font-medium">{t.name}</td>
              <td className="text-gray-500">{t.subject}</td>
              <td>
                <span className="badge">{t.channel}</span>
              </td>
              <td className="text-xs text-gray-400">{t.eventType ?? "-"}</td>
              <td>
                <span
                  className={`badge ${t.isActive ? "badge-success" : "badge-secondary"}`}
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div className="flex gap-1">
                  <button
                    className="ui-btn ui-btn-ghost btn-sm"
                    onClick={() => openEdit(t.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="ui-btn ui-btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(t.id);
                      setRenderVars("");
                      setRendered(null);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="ui-btn ui-btn-ghost btn-sm"
                    onClick={() => deleteTemplate(t.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingId && !showEditor && (
        <div className="ui-card p-4 mt-4">
          <h3 className="font-semibold mb-2">Preview / Render Test</h3>
          <div className="ui-form-group">
            <label className="ui-label">Variables (key=value per line)</label>
            <textarea
              className="ui-input"
              rows={3}
              value={renderVars}
              onChange={(e) => setRenderVars(e.target.value)}
            />
          </div>
          <button
            className="ui-btn ui-btn-secondary mb-3"
            onClick={() => renderTemplate(editingId!)}
          >
            <Eye className="w-4 h-4 mr-2" /> Render
          </button>
          {rendered && (
            <div className="bg-gray-50 p-3 rounded">
              <div>
                <strong>Subject:</strong> {rendered.subject}
              </div>
              <div className="mt-2">
                <strong>Body:</strong>
              </div>
              <div className="whitespace-pre-wrap mt-1">{rendered.body}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
