"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, DataTable, type ListColumn } from "@unerp/ui";
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

  const columns: ListColumn[] = [
    { key: "asset.name", label: "Asset" },
    { key: "disposalType", label: "Type" },
    { key: "disposalDate", label: "Date" },
    { key: "salePrice", label: "Sale Price" },
    { key: "gainLoss", label: "Gain/Loss" },
    { key: "approvedBy", label: "Approved By" },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Disposals"
        subtitle={`${disposals.length} disposals`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={disposals} />
      </div>
    </div>
  );
}
