"use client";

import { useState } from "react";
import { useApiClient } from "@unerp/framework";

export default function PipelineDealComparisonPage() {
  const api = useApiClient();
  const [ids, setIds] = useState("");
  const [deals, setDeals] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    setError("");
    const opportunityIds = ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (opportunityIds.length < 2) {
      setError("Enter at least 2 opportunity IDs");
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.post("/crm/pipeline-deep/deal-comparison", {
        opportunityIds,
      });
      setDeals(res.data || []);
    } catch (e: any) {
      setError(e.message || "Comparison failed");
    }
    setLoading(false);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Deal Comparison</h1>
      <div className="ui-form-group flex gap-2 mb-4">
        <input
          className="ui-input flex-1"
          placeholder="Opportunity IDs (comma-separated)"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
        <button className="ui-btn" onClick={compare} disabled={loading}>
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {deals.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Stage</th>
              <th className="py-2 px-2">Amount</th>
              <th className="py-2 px-2">Probability</th>
              <th className="py-2 px-2">Weighted</th>
              <th className="py-2 px-2">Customer</th>
              <th className="py-2 px-2">Rep</th>
              <th className="py-2 px-2">Close</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d: any) => (
              <tr key={d.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2 font-medium">{d.name}</td>
                <td className="py-2 px-2">{d.stage}</td>
                <td className="py-2 px-2">${d.amount?.toLocaleString()}</td>
                <td className="py-2 px-2">{d.probability}%</td>
                <td className="py-2 px-2">
                  ${d.weightedAmount?.toLocaleString()}
                </td>
                <td className="py-2 px-2">{d.customerName}</td>
                <td className="py-2 px-2">{d.assignedToName}</td>
                <td className="py-2 px-2">
                  {d.expectedCloseDate
                    ? new Date(d.expectedCloseDate).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
