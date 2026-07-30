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

export default function LocalizationPage() {
  const [locales, setLocales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/localization/locales")
      .then((d) => setLocales(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "code", header: "Code" },
    { key: "name", header: "Name" },
    { key: "direction", header: "Direction" },
    { key: "isActive", header: "Active" },
    { key: "isDefault", header: "Default" },
  ];

  return (
    <div>
      <PageHeader title="Locales" description={`${locales.length} languages`} />
      <StatCardRow
        stats={[{ label: "Total Locales", value: locales.length }]}
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Add Locale</Button>
        </div>
        <DataTable columns={columns} data={locales} />
      </div>
    </div>
  );
}
