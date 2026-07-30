// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function DisposalsPage() {
  const [disposals, setDisposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/fixed-assets/disposals")
      .then((d) => setDisposals(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "asset.name", header: "Asset" },
    { key: "disposalType", header: "Type" },
    { key: "disposalDate", header: "Date" },
    { key: "salePrice", header: "Sale Price" },
    { key: "gainLoss", header: "Gain/Loss" },
    { key: "approvedBy", header: "Approved By" },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Disposals"
        description={`${disposals.length} disposals`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={disposals} />
      </div>
    </div>
  );
}
