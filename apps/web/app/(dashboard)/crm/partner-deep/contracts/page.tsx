// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PartnerContractsPage() {
  const api = useApiClient();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/contracts")
      .then((res: any) => {
        setContracts(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading contracts...</div>;

  return (
    <div className="ui-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Partner Contracts</h1>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2">Contract #</th>
            <th className="py-2 px-2">Name</th>
            <th className="py-2 px-2">Type</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">Value</th>
            <th className="py-2 px-2">Start</th>
            <th className="py-2 px-2">End</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c: any) => (
            <tr key={c.id} className="border-b hover:bg-muted/50">
              <td className="py-2 px-2">{c.contractNumber}</td>
              <td className="py-2 px-2">{c.name}</td>
              <td className="py-2 px-2">{c.type}</td>
              <td className="py-2 px-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-800" : c.status === "EXPIRED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {c.status}
                </span>
              </td>
              <td className="py-2 px-2">
                {c.currency} {c.value?.toLocaleString()}
              </td>
              <td className="py-2 px-2">
                {new Date(c.startDate).toLocaleDateString()}
              </td>
              <td className="py-2 px-2">
                {c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
          {contracts.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="py-4 text-center text-muted-foreground"
              >
                No contracts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
