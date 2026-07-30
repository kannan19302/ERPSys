// @ts-nocheck
"use client";
import { useState, useEffect } from "react";

export default function OptOutPage() {
  const [optOuts, setOptOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/communication-deep/opt-out")
      .then((r) => r.json())
      .then((d) => {
        setOptOuts(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="ui-card p-6">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="ui-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Opt-Out List</h1>
        <button className="ui-btn">+ Add Opt-Out</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-3 font-medium">Entity Type</th>
              <th className="py-2 px-3 font-medium">Entity ID</th>
              <th className="py-2 px-3 font-medium">Channel</th>
              <th className="py-2 px-3 font-medium">Reason</th>
              <th className="py-2 px-3 font-medium">Opted Out</th>
            </tr>
          </thead>
          <tbody>
            {optOuts.map((o: any) => (
              <tr key={o.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-3">{o.entityType}</td>
                <td className="py-2 px-3">{o.entityId}</td>
                <td className="py-2 px-3">{o.channel}</td>
                <td className="py-2 px-3">{o.reason || "-"}</td>
                <td className="py-2 px-3">
                  {new Date(o.optedOutAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {optOuts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-4 text-center text-muted-foreground"
                >
                  No opt-outs recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
