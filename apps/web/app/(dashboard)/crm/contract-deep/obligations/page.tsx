"use client";
import { useState } from "react";

export default function ObligationsPage() {
  const [contractId, setContractId] = useState("");
  const [obligations, setObligations] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const search = async () => {
    if (!contractId) return;
    const r = await fetch(
      `/api/crm/contract-deep/contracts/${contractId}/obligations`,
    );
    const d = await r.json();
    setObligations(d.data || []);
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Obligations</h1>
      <div className="flex gap-3 mb-6 items-end">
        <div className="ui-form-group flex-1">
          <label className="text-sm font-medium">Contract ID</label>
          <input
            className="ui-input"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            placeholder="Enter contract ID"
          />
        </div>
        <button className="ui-btn" onClick={search}>
          Load Obligations
        </button>
      </div>
      {loaded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3 font-medium">Description</th>
                <th className="py-2 px-3 font-medium">Owner</th>
                <th className="py-2 px-3 font-medium">Due Date</th>
                <th className="py-2 px-3 font-medium">Priority</th>
                <th className="py-2 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {obligations.map((o: any) => (
                <tr key={o.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">{o.description}</td>
                  <td className="py-2 px-3">{o.owner}</td>
                  <td className="py-2 px-3">
                    {o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-2 px-3">{o.priority}</td>
                  <td className="py-2 px-3">{o.status}</td>
                </tr>
              ))}
              {obligations.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No obligations found for this contract
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
