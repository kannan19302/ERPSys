"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus, Eye } from "lucide-react";

export default function AssetTransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/fixed-assets-deep/transfers")
      .then((d) => setTransfers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "asset.name", header: "Asset" },
    { key: "transferDate", header: "Date" },
    { key: "fromLocation", header: "From" },
    { key: "toLocation", header: "To" },
    { key: "reason", header: "Reason" },
    { key: "transferredBy", header: "Transferred By" },
    {
      key: "actions",
      header: "Actions",
      render: (_val: unknown, row: Record<string, unknown>) => (
        <div
          className="ui-flex"
          style={{ gap: "var(--space-2)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="ghost">
            <Eye size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Transfers"
        description={`${transfers.length} transfers`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={transfers} />
      </div>
    </div>
  );
}
