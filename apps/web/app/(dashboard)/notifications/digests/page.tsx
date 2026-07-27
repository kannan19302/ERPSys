"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Digest {
  id: string;
  frequency: string;
  channel: string;
  isEnabled: boolean;
  lastSentAt: string | null;
  nextScheduledAt: string | null;
}

export default function NotificationDigestsPage() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    frequency: "DAILY",
    channel: "EMAIL",
    isEnabled: true,
  });

  useEffect(() => {
    fetch("/api/notifications/digests")
      .then((r) => r.json())
      .then((data) => {
        setDigests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createDigest = async () => {
    const res = await fetch("/api/notifications/digests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const created = await res.json();
    setDigests((prev) => {
      const filtered = prev.filter((d) => d.frequency !== created.frequency);
      return [...filtered, created];
    });
    setShowForm(false);
  };

  const deleteDigest = async (id: string) => {
    await fetch(`/api/notifications/digests/${id}`, { method: "DELETE" });
    setDigests((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="ui-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Digest Configuration</h1>
        <button
          className="ui-btn ui-btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Digest
        </button>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4 bg-gray-50">
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Frequency</label>
              <select
                className="ui-input"
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="INSTANT">Instant</option>
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Channel</label>
              <select
                className="ui-input"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
              </select>
            </div>
            <div className="ui-form-group flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(e) =>
                    setForm({ ...form, isEnabled: e.target.checked })
                  }
                />
                Enabled
              </label>
            </div>
          </div>
          <button className="ui-btn ui-btn-primary mt-2" onClick={createDigest}>
            Create Digest
          </button>
        </div>
      )}
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && digests.length === 0 && (
        <div className="text-gray-500">No digests configured.</div>
      )}
      {digests.map((d) => (
        <div
          key={d.id}
          className="flex items-center justify-between border border-gray-200 rounded-lg p-3 mb-2"
        >
          <div>
            <span
              className={`badge ${d.isEnabled ? "badge-success" : "badge-secondary"} mr-2`}
            >
              {d.frequency}
            </span>
            <span className="text-sm text-gray-500">{d.channel}</span>
            <span
              className={`ml-3 text-xs ${d.isEnabled ? "text-green-600" : "text-gray-400"}`}
            >
              {d.isEnabled ? "Enabled" : "Disabled"}
            </span>
            {d.lastSentAt && (
              <span className="ml-3 text-xs text-gray-400">
                Last sent: {new Date(d.lastSentAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            className="ui-btn ui-btn-ghost btn-sm"
            onClick={() => deleteDigest(d.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ))}
    </div>
  );
}
