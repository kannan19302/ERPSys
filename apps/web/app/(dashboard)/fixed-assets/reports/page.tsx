// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, StatCardRow } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/fixed-assets/reports/summary")
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Asset Reports" description="Summary and analytics" />
      <StatCardRow
        stats={[
          { label: "Total Assets", value: summary?.totalAssets || 0 },
          {
            label: "Total Purchase Value",
            value: summary?.totalPurchaseValue || 0,
          },
          {
            label: "Total Depreciation",
            value: summary?.totalDepreciation || 0,
          },
        ]}
      />
    </div>
  );
}
