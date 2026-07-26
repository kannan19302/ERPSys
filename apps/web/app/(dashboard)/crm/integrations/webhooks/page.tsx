"use client";

import { useState, useEffect } from "react";
export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/crm/integrations/webhooks")
      .then((res) => res.json())
      .then((data) => {
        setWebhooks(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading webhooks...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Webhook Configs</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">URL</th>
            <th className="py-2 px-2">Events</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">Max Retries</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((w: any) => (
            <tr key={w.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{w.name}</td>
              <td className="py-2 px-2 max-w-[200px] truncate">{w.url}</td>
              <td className="py-2 px-2">{w.events?.join(", ")}</td>
              <td className="py-2 px-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${w.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {w.enabled ? "Enabled" : "Disabled"}
                </span>
              </td>
              <td className="py-2 px-2">{w.maxRetries}</td>
            </tr>
          ))}
          {webhooks.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-4 text-center text-muted-foreground"
              >
                No webhooks configured
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
