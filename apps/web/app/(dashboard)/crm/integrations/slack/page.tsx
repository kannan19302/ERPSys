"use client";

import { useState, useEffect } from "react";
import { api } from "@unerp/shared";

export default function SlackPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/integrations/slack")
      .then((res: any) => {
        setConnections(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading Slack connections...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Slack Connections</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">Workspace</th>
            <th className="py-2 px-2">Default Channel</th>
            <th className="py-2 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((s: any) => (
            <tr key={s.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{s.name}</td>
              <td className="py-2 px-2">{s.workspaceName}</td>
              <td className="py-2 px-2">{s.defaultChannel || "—"}</td>
              <td className="py-2 px-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {s.enabled ? "Enabled" : "Disabled"}
                </span>
              </td>
            </tr>
          ))}
          {connections.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="py-4 text-center text-muted-foreground"
              >
                No Slack connections
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
