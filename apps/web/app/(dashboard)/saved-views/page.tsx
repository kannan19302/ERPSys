"use client";

import { useState, useEffect } from "react";
import { Eye, Copy, Trash2, Share2, Layout } from "lucide-react";

interface SavedView {
  id: string;
  name: string;
  resourceName: string;
  createdAt: string;
}

export default function SavedViewsPage() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [resourceName, setResourceName] = useState("customer");
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/saved-views?resourceName=${resourceName}`)
      .then((r) => r.json())
      .then((data) => {
        setViews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resourceName]);

  const loadConfig = async (viewId: string) => {
    setSelectedView(viewId === selectedView ? null : viewId);
    if (viewId !== selectedView) {
      const res = await fetch(
        `/api/saved-views/${viewId}/apply?resourceName=${resourceName}`,
      );
      const data = await res.json();
      setConfig(data);
    }
  };

  const deleteView = async (id: string) => {
    await fetch(`/api/saved-views/${id}`, { method: "DELETE" });
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (selectedView === id) {
      setSelectedView(null);
      setConfig(null);
    }
  };

  const cloneView = async (id: string, name: string) => {
    const res = await fetch(`/api/saved-views/${id}/clone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${name} (Copy)` }),
    });
    const cloned = await res.json();
    setViews((prev) => [...prev, cloned]);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Views Manager</h1>
      <div className="ui-form-group mb-4">
        <label className="ui-label">Resource</label>
        <select
          className="ui-input"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
        >
          <option value="customer">Customers</option>
          <option value="lead">Leads</option>
          <option value="opportunity">Opportunities</option>
          <option value="invoice">Invoices</option>
          <option value="product">Products</option>
          <option value="employee">Employees</option>
        </select>
      </div>
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && views.length === 0 && (
        <div className="text-gray-500">No saved views for this resource.</div>
      )}
      {views.map((v) => (
        <div key={v.id} className="border border-gray-200 rounded-lg mb-2">
          <div
            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => loadConfig(v.id)}
          >
            <div>
              <span className="font-medium">
                <Layout className="w-4 h-4 inline mr-2" />
                {v.name}
              </span>
              <span className="text-xs text-gray-400 ml-3">
                {v.resourceName}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="ui-btn ui-btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  cloneView(v.id, v.name);
                }}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                className="ui-btn ui-btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteView(v.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
          {selectedView === v.id && config && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <h4 className="font-medium mb-2">
                <Layout className="w-4 h-4 inline mr-1" /> Layout Configuration
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  Type:{" "}
                  <span className="font-mono">
                    {config.layout?.layoutType ?? "table"}
                  </span>
                </div>
                <div>
                  Page Size:{" "}
                  <span className="font-mono">
                    {config.layout?.pageSize ?? 25}
                  </span>
                </div>
                <div>
                  Filters:{" "}
                  <span className="font-mono">
                    {config.filters?.length ?? 0}
                  </span>
                </div>
                <div>
                  Columns:{" "}
                  <span className="font-mono">
                    {config.columns?.length ?? 0}
                  </span>
                </div>
              </div>
              {config.columns && config.columns.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-1">Columns</h5>
                  <div className="flex gap-2 flex-wrap">
                    {config.columns.map((c: any) => (
                      <span
                        key={c.field}
                        className="text-xs bg-white px-2 py-1 rounded border"
                      >
                        {c.label || c.field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
