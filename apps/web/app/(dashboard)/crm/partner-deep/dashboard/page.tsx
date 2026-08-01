"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PartnerDashboardPage() {
  const api = useApiClient();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/dashboard")
      .then((res: any) => {
        setDashboard(res.data || res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading dashboard...</div>;
  if (!dashboard)
    return <div className="ui-card p-6">Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Partner Dashboard</h1>
      <div className="ui-grid-4">
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Total Partners</p>
          <p className="text-2xl font-bold">{dashboard.totalPartners}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">{dashboard.winRate}%</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">
            ${dashboard.totalEstimatedValue?.toLocaleString()}
          </p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Referrals</p>
          <p className="text-2xl font-bold">{dashboard.totalReferrals}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Active Contracts</p>
          <p className="text-2xl font-bold">{dashboard.activeContracts}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">MDF Budget</p>
          <p className="text-2xl font-bold">
            ${dashboard.totalMdfBudget?.toLocaleString()}
          </p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">MDF Spent</p>
          <p className="text-2xl font-bold">
            ${dashboard.totalMdfSpent?.toLocaleString()}
          </p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Deal Registrations</p>
          <p className="text-2xl font-bold">
            {dashboard.totalDealRegistrations}
          </p>
        </div>
      </div>
      {dashboard.partnerPerformance?.length > 0 && (
        <div className="ui-card p-4">
          <h2 className="font-semibold mb-3">Per-Partner Performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-2">Partner</th>
                <th className="py-2 px-2">Win Rate</th>
                <th className="py-2 px-2">Deals</th>
                <th className="py-2 px-2">Referrals</th>
                <th className="py-2 px-2">MDF Util</th>
                <th className="py-2 px-2">Contracts</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.partnerPerformance.map((p: any) => (
                <tr key={p.partnerId} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2">{p.partnerName}</td>
                  <td className="py-2 px-2">{p.wonRate}%</td>
                  <td className="py-2 px-2">
                    {p.wonDeals}/{p.dealRegistrations}
                  </td>
                  <td className="py-2 px-2">{p.totalReferrals}</td>
                  <td className="py-2 px-2">{p.mdfUtilization}%</td>
                  <td className="py-2 px-2">{p.activeContracts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
