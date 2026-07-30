// @ts-nocheck
"use client";
import { useState } from "react";

export default function CommunicationAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [analytics, setAnalytics] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);

  useState(() => {
    fetch("/api/crm/communication-deep/analytics?period=" + period)
      .then((r) => r.json())
      .then(setAnalytics);
    fetch("/api/crm/communication-deep/dashboard")
      .then((r) => r.json())
      .then(setDash);
  });

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Communication Analytics</h1>
      <div className="flex gap-4 mb-6">
        <select
          className="ui-input w-40"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="12m">Last 12 months</option>
        </select>
      </div>
      <div className="ui-grid-4 mb-8">
        <div className="ui-card p-4 text-center">
          <p className="text-3xl font-bold">{analytics?.total ?? 0}</p>
          <p className="text-sm text-muted-foreground">Total Messages</p>
        </div>
        <div className="ui-card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {analytics?.sent ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Sent</p>
        </div>
        <div className="ui-card p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {analytics?.delivered ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Delivered</p>
        </div>
        <div className="ui-card p-4 text-center">
          <p className="text-3xl font-bold text-red-600">
            {analytics?.failed ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
      </div>
      {dash && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Multi-Channel Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-3 font-medium">Channel</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Total</th>
                  <th className="py-2 px-3 font-medium">Failed</th>
                </tr>
              </thead>
              <tbody>
                {(dash.byChannel || []).map((c: any) => (
                  <tr key={c.channelId} className="border-b">
                    <td className="py-2 px-3">{c.channelName}</td>
                    <td className="py-2 px-3">{c.channelType}</td>
                    <td className="py-2 px-3">{c.total}</td>
                    <td className="py-2 px-3 text-red-600">{c.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Templates: {dash.templates} | Social Posts:{" "}
            {dash.socialPosts?.total ?? 0} ({dash.socialPosts?.published ?? 0}{" "}
            published)
          </div>
        </div>
      )}
    </div>
  );
}
