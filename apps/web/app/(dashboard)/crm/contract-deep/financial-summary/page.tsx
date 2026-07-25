"use client";
import { useState } from "react";

export default function FinancialSummaryPage() {
  const [contractId, setContractId] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!contractId) return;
    const r = await fetch(
      `/api/crm/contract-deep/contracts/${contractId}/financial-summary`,
    );
    setSummary(await r.json());
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Financial Summary</h1>
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
        <button className="ui-btn" onClick={load}>
          Load Summary
        </button>
      </div>
      {loaded && summary && (
        <div className="space-y-6">
          <div className="ui-grid-4">
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold">
                {summary.currency} {summary.totalValue?.toLocaleString() ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-blue-600">
                {summary.currency} {summary.billed?.toLocaleString() ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Billed</p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-green-600">
                {summary.currency} {summary.paid?.toLocaleString() ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-orange-600">
                {summary.currency} {summary.remaining?.toLocaleString() ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Milestones: {summary.milestoneCount ?? 0}
          </p>
        </div>
      )}
    </div>
  );
}
