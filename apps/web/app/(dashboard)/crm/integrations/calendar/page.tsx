"use client";

import { useState, useEffect } from "react";
export default function CalendarPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/crm/integrations/calendar")
      .then((res) => res.json())
      .then((data) => {
        setConnections(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading calendar connections...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Calendar Connections</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">Provider</th>
            <th className="py-2 px-2">Sync</th>
            <th className="py-2 px-2">Last Sync</th>
            <th className="py-2 px-2">Interval</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((c: any) => (
            <tr key={c.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{c.name}</td>
              <td className="py-2 px-2">{c.provider}</td>
              <td className="py-2 px-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.syncEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {c.syncEnabled ? "On" : "Off"}
                </span>
              </td>
              <td className="py-2 px-2">
                {c.lastSyncAt
                  ? new Date(c.lastSyncAt).toLocaleString()
                  : "Never"}
              </td>
              <td className="py-2 px-2">{c.syncIntervalMinutes}m</td>
            </tr>
          ))}
          {connections.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-4 text-center text-muted-foreground"
              >
                No calendar connections
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
