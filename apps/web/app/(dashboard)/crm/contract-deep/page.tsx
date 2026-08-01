"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ContractDeepPage() {
  const [dash, setDash] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/crm/contract-deep/dashboard")
      .then((r) => r.json())
      .then(setDash);
    fetch("/api/crm/contract-deep/expiry-calendar?range=90d")
      .then((r) => r.json())
      .then((d) => setCalendar(d.data || []));
  }, []);

  return (
    <div>
      <div className="ui-card p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Contract Deep Dashboard</h1>
        <div className="ui-grid-4 mb-6">
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold">{dash?.total ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Contracts</p>
          </div>
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold text-green-600">
              {dash?.active ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold text-orange-600">
              {dash?.expiringSoon ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </div>
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold text-red-600">
              {dash?.expired ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Expired</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Total Active Value: ${(dash?.totalActiveValue ?? 0).toLocaleString()}{" "}
          | Templates: {dash?.templates ?? 0}
        </div>
        <div className="ui-grid-3">
          <Link
            href="/crm/contract-deep/templates"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Templates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contract templates & categories
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/clause-library"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Clause Library</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage contract clauses
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/obligations"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Obligations</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track contract obligations
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/compliance"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Compliance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              SLA compliance & value at risk
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/financial-summary"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Financial Summary</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contract financials
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/version-history"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Version History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contract version tracking
            </p>
          </Link>
        </div>
      </div>
      <div className="ui-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          Upcoming Expiry Calendar (90 days)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3 font-medium">Contract</th>
                <th className="py-2 px-3 font-medium">Customer/Vendor</th>
                <th className="py-2 px-3 font-medium">End Date</th>
                <th className="py-2 px-3 font-medium">Renewal Date</th>
                <th className="py-2 px-3 font-medium">Value</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 font-medium">Auto-Renew</th>
              </tr>
            </thead>
            <tbody>
              {calendar.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">
                    {c.contractNumber} - {c.title}
                  </td>
                  <td className="py-2 px-3">
                    {c.customer?.name || c.vendor?.name || "-"}
                  </td>
                  <td className="py-2 px-3">
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3">
                    {new Date(c.renewalDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3">
                    {c.currency} {Number(c.value).toLocaleString()}
                  </td>
                  <td className="py-2 px-3">{c.status}</td>
                  <td className="py-2 px-3">{c.autoRenew ? "Yes" : "No"}</td>
                </tr>
              ))}
              {calendar.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No contracts expiring in the next 90 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
