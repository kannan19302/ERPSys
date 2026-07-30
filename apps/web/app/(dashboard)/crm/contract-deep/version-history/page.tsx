// @ts-nocheck
"use client";
import { useState } from "react";

export default function VersionHistoryPage() {
  const [contractId, setContractId] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!contractId) return;
    const r = await fetch(
      `/api/crm/contract-deep/contracts/${contractId}/versions`,
    );
    setHistory(await r.json());
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Version History</h1>
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
          Load History
        </button>
      </div>
      {loaded && history && (
        <div className="space-y-6">
          {history.versions?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Versions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 font-medium">Version</th>
                      <th className="py-2 px-3 font-medium">Change Summary</th>
                      <th className="py-2 px-3 font-medium">Created By</th>
                      <th className="py-2 px-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.versions.map((v: any) => (
                      <tr key={v.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">v{v.versionNumber}</td>
                        <td className="py-2 px-3">{v.changeSummary}</td>
                        <td className="py-2 px-3">{v.createdBy}</td>
                        <td className="py-2 px-3">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {history.amendments?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Amendments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-3 font-medium">Number</th>
                      <th className="py-2 px-3 font-medium">Title</th>
                      <th className="py-2 px-3 font-medium">Created By</th>
                      <th className="py-2 px-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.amendments.map((a: any) => (
                      <tr key={a.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">{a.amendmentNumber}</td>
                        <td className="py-2 px-3">{a.title}</td>
                        <td className="py-2 px-3">{a.createdBy}</td>
                        <td className="py-2 px-3">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!history.versions?.length && !history.amendments?.length && (
            <p className="text-muted-foreground">
              No version history found for this contract
            </p>
          )}
        </div>
      )}
    </div>
  );
}
