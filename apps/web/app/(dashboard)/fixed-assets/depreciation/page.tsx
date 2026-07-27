"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function DepreciationPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/fixed-assets/reports/depreciation")
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const entries = report?.entries || [];
  const columns: Column<Record<string, unknown>>[] = [
    { key: "asset.name", header: "Asset" },
    { key: "periodName", header: "Period" },
    { key: "amount", header: "Amount" },
    { key: "bookValue", header: "Book Value" },
    { key: "date", header: "Posted" },
  ];

  return (
    <div>
      <PageHeader
        title="Depreciation Schedule"
        description={`Total: ${report?.totalAmount || 0}`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={entries} />
      </div>
    </div>
  );
}
