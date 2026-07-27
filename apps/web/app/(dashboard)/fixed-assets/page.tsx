"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type ListColumn,
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

  const columns: ListColumn[] = [
    { key: "assetCode", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "status", label: "Status" },
    { key: "purchaseValue", label: "Purchase Value" },
    { key: "currentValue", label: "Current Value" },
    { key: "purchaseDate", label: "Purchase Date" },
  ];

  return (
    <div>
      <PageHeader title="Asset Registry" subtitle={`${assets.length} assets`} />
      <StatCardRow
        cards={[
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
          <Button icon={Plus}>Register Asset</Button>
        </div>
        <DataTable columns={columns} data={assets} />
      </div>
    </div>
  );
}
