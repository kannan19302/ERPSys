"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus, Eye } from "lucide-react";

export default function AssetAuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/fixed-assets-deep/physical-audits")
      .then((d) => setAudits(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "asset.name", header: "Asset" },
    { key: "auditDate", header: "Date" },
    { key: "status", header: "Status" },
    { key: "discrepancy", header: "Discrepancy" },
    { key: "auditedBy", header: "Audited By" },
    { key: "notes", header: "Notes" },
    {
      key: "actions",
      header: "Actions",
      render: (row: Record<string, unknown>) => (
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
        title="Physical Audits"
        description={`${audits.length} audits`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>New Audit</Button>
        </div>
        <DataTable columns={columns} data={audits} />
      </div>
    </div>
  );
}
