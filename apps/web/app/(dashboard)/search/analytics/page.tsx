// @ts-nocheck
"use client";

import { useState, useEffect } from "react";

interface SearchAnalytics {
  totalQueries: number;
  uniqueUsers: number;
  avgResponseMs: number;
  topQueries: { query: string; count: number }[];
  zeroResultQueries: { query: string; createdAt: string }[];
}

export default function SearchAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/search/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search Analytics</h1>
      {loading && <div className="text-gray-500">Loading...</div>}
      {analytics && (
        <>
          <div className="ui-grid-3">
            <div className="ui-card p-4 text-center">
              <div className="text-3xl font-bold">{analytics.totalQueries}</div>
              <div className="text-gray-500 text-sm">Total Queries</div>
            </div>
            <div className="ui-card p-4 text-center">
              <div className="text-3xl font-bold">{analytics.uniqueUsers}</div>
              <div className="text-gray-500 text-sm">Unique Users</div>
            </div>
            <div className="ui-card p-4 text-center">
              <div className="text-3xl font-bold">
                {analytics.avgResponseMs.toFixed(0)}ms
              </div>
              <div className="text-gray-500 text-sm">Avg Response</div>
            </div>
          </div>
          <div className="ui-grid-2">
            <div className="ui-card p-4">
              <h3 className="font-semibold mb-3">Top Queries</h3>
              {analytics.topQueries.length === 0 && (
                <div className="text-gray-500">No data yet</div>
              )}
              {analytics.topQueries.map((q, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1 border-b border-gray-100"
                >
                  <span>{q.query}</span>
                  <span className="font-mono text-sm">{q.count}</span>
                </div>
              ))}
            </div>
            <div className="ui-card p-4">
              <h3 className="font-semibold mb-3">Zero-Result Queries</h3>
              {analytics.zeroResultQueries.length === 0 && (
                <div className="text-gray-500">No data yet</div>
              )}
              {analytics.zeroResultQueries.map((q, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1 border-b border-gray-100"
                >
                  <span className="text-gray-600">{q.query}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
