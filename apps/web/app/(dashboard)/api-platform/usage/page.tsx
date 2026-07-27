"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, StatCardRow } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function UsagePage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/api-platform/usage?period=30d")
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="API Usage Dashboard" description="30-day metrics" />
      <StatCardRow
        stats={[
          { label: "Total Requests", value: metrics?.totalRequests || 0 },
          {
            label: "Avg Response Time",
            value: `${metrics?.avgResponseMs || 0}ms`,
          },
          { label: "Error Rate", value: metrics?.errorRate || "0%" },
        ]}
      />
    </div>
  );
}
