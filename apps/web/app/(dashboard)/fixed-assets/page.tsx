"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
  StatCardRow,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus } from "lucide-react";

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet("/fixed-assets"),
      apiGet("/fixed-assets/reports/summary"),
    ])
      .then(([a, s]) => {
        setAssets(Array.isArray(a) ? a : []);
        setSummary(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "assetCode", header: "Code" },
    { key: "name", header: "Name" },
    { key: "status", header: "Status" },
    { key: "purchaseValue", header: "Purchase Value" },
    { key: "currentValue", header: "Current Value" },
    { key: "purchaseDate", header: "Purchase Date" },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Registry"
        description={`${assets.length} assets`}
      />
      <StatCardRow
        stats={[
          { label: "Total Assets", value: summary?.totalAssets || 0 },
          { label: "Active", value: summary?.activeAssets || 0 },
          { label: "Disposed", value: summary?.disposedAssets || 0 },
          { label: "Depreciation", value: summary?.totalDepreciation || 0 },
        ]}
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Register Asset</Button>
        </div>
        <DataTable columns={columns} data={assets} />
      </div>
    </div>
  );
}
