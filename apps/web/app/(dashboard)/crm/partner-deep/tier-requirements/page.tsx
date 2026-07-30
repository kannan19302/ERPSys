// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function TierRequirementsPage() {
  const api = useApiClient();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/tier-requirements")
      .then((res: any) => {
        setRequirements(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading tier requirements...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Tier Requirements</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Tier</th>
            <th className="py-2 px-2">Metric</th>
            <th className="py-2 px-2">Min</th>
            <th className="py-2 px-2">Max</th>
            <th className="py-2 px-2">Unit</th>
            <th className="py-2 px-2">Weight</th>
          </tr>
        </thead>
        <tbody>
          {requirements.map((r: any) => (
            <tr key={r.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{r.tier?.name || r.tierId}</td>
              <td className="py-2 px-2">{r.metric}</td>
              <td className="py-2 px-2">{r.minValue}</td>
              <td className="py-2 px-2">{r.maxValue ?? "—"}</td>
              <td className="py-2 px-2">{r.unit}</td>
              <td className="py-2 px-2">{r.weight}</td>
            </tr>
          ))}
          {requirements.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="py-4 text-center text-muted-foreground"
              >
                No requirements defined
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
