// @ts-nocheck
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

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/api-platform/keys")
      .then((d) => setKeys(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name" },
    { key: "prefix", header: "Prefix" },
    { key: "rateLimit", header: "Rate Limit" },
    { key: "status", header: "Status" },
    { key: "expiresAt", header: "Expires" },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <div>
      <PageHeader title="API Keys" description={`${keys.length} keys`} />
      <StatCardRow stats={[{ label: "Total API Keys", value: keys.length }]} />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Generate Key</Button>
        </div>
        <DataTable columns={columns} data={keys} />
      </div>
    </div>
  );
}
