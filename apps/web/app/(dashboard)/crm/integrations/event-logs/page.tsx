"use client";

import { useState, useEffect } from "react";
import { api } from "@unerp/shared";

export default function EventLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res: any = await api.get("/crm/integrations/event-logs");
      setLogs(res.data || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const retry = async (id: string) => {
    setRetrying(id);
    try {
      await api.post(`/crm/integrations/event-logs/${id}/retry`);
      fetchLogs();
    } catch {
      /* ignore */
    }
    setRetrying(null);
  };

  if (loading) return <div className="ui-card p-6">Loading event logs...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Event Delivery Logs</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Event Type</th>
            <th className="py-2 px-2">Channel</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">Sent At</th>
            <th className="py-2 px-2">Retries</th>
            <th className="py-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l: any) => (
            <tr key={l.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{l.eventType}</td>
              <td className="py-2 px-2">{l.channel || "—"}</td>
              <td className="py-2 px-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${l.status === "SENT" ? "bg-green-100 text-green-800" : l.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {l.status}
                </span>
              </td>
              <td className="py-2 px-2">
                {l.sentAt ? new Date(l.sentAt).toLocaleString() : "—"}
              </td>
              <td className="py-2 px-2">{l.retryCount || 0}</td>
              <td className="py-2 px-2">
                {l.status === "FAILED" && (
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => retry(l.id)}
                    disabled={retrying === l.id}
                  >
                    {retrying === l.id ? "Retrying..." : "Retry"}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="py-4 text-center text-muted-foreground"
              >
                No event logs found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
