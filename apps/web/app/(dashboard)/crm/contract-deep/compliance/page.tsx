// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CompliancePage() {
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    fetch("/api/crm/contract-deep/value-at-risk")
      .then((r) => r.json())
      .then(setRisk);
  }, []);

  return (
    <div>
      <div className="ui-card p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Compliance & Risk</h1>
        {risk && (
          <div className="ui-grid-3 mb-6">
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-orange-600">{risk.count}</p>
              <p className="text-sm text-muted-foreground">Contracts at Risk</p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-red-600">
                ${(risk.totalAtRisk ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Total Value at Risk
              </p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-blue-600">
                {risk.contracts?.filter((c: any) => c.autoRenew).length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Auto-Renew Enabled
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <Link href="/crm/contract-deep" className="ui-btn">
            Back to Dashboard
          </Link>
        </div>
      </div>
      {risk?.contracts && risk.contracts.length > 0 && (
        <div className="ui-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            Contracts Expiring Within 30 Days
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3 font-medium">Contract</th>
                  <th className="py-2 px-3 font-medium">Customer</th>
                  <th className="py-2 px-3 font-medium">End Date</th>
                  <th className="py-2 px-3 font-medium">Value</th>
                  <th className="py-2 px-3 font-medium">Auto-Renew</th>
                </tr>
              </thead>
              <tbody>
                {risk.contracts.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">
                      {c.contractNumber} - {c.title}
                    </td>
                    <td className="py-2 px-3">{c.customer?.name || "-"}</td>
                    <td className="py-2 px-3">
                      {new Date(c.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3">
                      {c.currency} {Number(c.value).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">{c.autoRenew ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
