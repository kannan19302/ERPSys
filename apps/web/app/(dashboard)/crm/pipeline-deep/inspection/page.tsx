"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PipelineInspectionPage() {
  const api = useApiClient();
  const [configs, setConfigs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/crm/pipeline-deep/inspection-configs"),
      api.get("/crm/pipeline-deep/inspection-results"),
    ])
      .then(([c, r]: any) => {
        setConfigs(c.data || []);
        setResults(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const runInspection = async (configId: string) => {
    setRunning(configId);
    try {
      await api.post(`/crm/pipeline-deep/inspection-configs/${configId}/run`);
      const res: any = await api.get("/crm/pipeline-deep/inspection-results");
      setResults(res.data || []);
    } catch {
      /* ignore */
    }
    setRunning(null);
  };

  if (loading) return <div className="ui-card p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <h1 className="text-2xl font-bold mb-4">Inspection Configs</h1>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Schedule</th>
              <th className="py-2 px-2">Rules</th>
              <th className="py-2 px-2">Enabled</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{c.name}</td>
                <td className="py-2 px-2">{c.schedule}</td>
                <td className="py-2 px-2">{(c.rules || []).length}</td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    {c.enabled ? "Yes" : "No"}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => runInspection(c.id)}
                    disabled={running === c.id}
                  >
                    {running === c.id ? "Running..." : "Run"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-card p-6">
        <h2 className="text-xl font-bold mb-4">Recent Inspection Results</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Scanned</th>
              <th className="py-2 px-2">Findings</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Completed</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r: any) => (
              <tr key={r.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{r.totalScanned}</td>
                <td className="py-2 px-2">{r.totalFindings}</td>
                <td className="py-2 px-2">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {r.status}
                  </span>
                </td>
                <td className="py-2 px-2">
                  {r.completedAt
                    ? new Date(r.completedAt).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-muted-foreground"
                >
                  No results yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
