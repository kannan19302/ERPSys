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

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/api-platform/keys")
      .then((d) => setKeys(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: ListColumn[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "prefix", label: "Prefix" },
    { key: "rateLimit", label: "Rate Limit" },
    { key: "status", label: "Status" },
    { key: "expiresAt", label: "Expires" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div>
      <PageHeader title="API Keys" subtitle={`${keys.length} keys`} />
      <StatCardRow cards={[{ label: "Total API Keys", value: keys.length }]} />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button icon={Plus}>Generate Key</Button>
        </div>
        <DataTable columns={columns} data={keys} />
      </div>
    </div>
  );
}
