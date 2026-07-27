"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, DataTable, type ListColumn } from "@unerp/ui";
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
  const columns: ListColumn[] = [
    { key: "asset.name", label: "Asset" },
    { key: "periodName", label: "Period" },
    { key: "amount", label: "Amount" },
    { key: "bookValue", label: "Book Value" },
    { key: "date", label: "Posted" },
  ];

  return (
    <div>
      <PageHeader
        title="Depreciation Schedule"
        subtitle={`Total: ${report?.totalAmount || 0}`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={entries} />
      </div>
    </div>
  );
}
