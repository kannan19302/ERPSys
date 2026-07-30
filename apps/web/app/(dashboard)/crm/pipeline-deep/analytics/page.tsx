// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PipelineAnalyticsPage() {
  const api = useApiClient();
  const [dashboard, setDashboard] = useState<any>(null);
  const [sizeDist, setSizeDist] = useState<any[]>([]);
  const [lossReasons, setLossReasons] = useState<any[]>([]);
  const [winBySource, setWinBySource] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/crm/pipeline-deep/dashboard"),
      api.get("/crm/pipeline-deep/deal-size-distribution"),
      api.get("/crm/pipeline-deep/loss-reason-analysis"),
      api.get("/crm/pipeline-deep/win-rate-by-source"),
    ])
      .then(([d, s, l, w]: any) => {
        setDashboard(d.data || {});
        setSizeDist(s.data || []);
        setLossReasons(l.data || []);
        setWinBySource(w.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline Analytics</h1>

      {dashboard && (
        <div className="ui-grid-4">
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Total Deals</p>
            <p className="text-2xl font-bold">{dashboard.totalDeals}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{dashboard.winRate}%</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold">
              ${dashboard.pipelineValue?.toLocaleString()}
            </p>
          </div>
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Won</p>
            <p className="text-2xl font-bold">{dashboard.wonDeals}</p>
          </div>
        </div>
      )}

      <div className="ui-card p-4">
        <h2 className="font-semibold mb-3">Deal Size Distribution</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Bucket</th>
              <th className="py-2 px-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {sizeDist.map((b: any) => (
              <tr key={b.label} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{b.label}</td>
                <td className="py-2 px-2">{b.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-card p-4">
        <h2 className="font-semibold mb-3">Loss Reason Analysis</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Reason</th>
              <th className="py-2 px-2">Count</th>
              <th className="py-2 px-2">Total Amount</th>
              <th className="py-2 px-2">%</th>
            </tr>
          </thead>
          <tbody>
            {lossReasons.map((l: any) => (
              <tr key={l.reason} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{l.reason}</td>
                <td className="py-2 px-2">{l.count}</td>
                <td className="py-2 px-2">
                  ${l.totalAmount?.toLocaleString()}
                </td>
                <td className="py-2 px-2">{l.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-card p-4">
        <h2 className="font-semibold mb-3">Win Rate by Source</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2">Source</th>
              <th className="py-2 px-2">Total</th>
              <th className="py-2 px-2">Converted</th>
              <th className="py-2 px-2">Conv. Rate</th>
            </tr>
          </thead>
          <tbody>
            {winBySource.map((s: any) => (
              <tr key={s.source} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{s.source}</td>
                <td className="py-2 px-2">{s.total}</td>
                <td className="py-2 px-2">{s.converted}</td>
                <td className="py-2 px-2">{s.conversionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
