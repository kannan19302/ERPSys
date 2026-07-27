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

export default function LocalizationPage() {
  const [locales, setLocales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/localization/locales")
      .then((d) => setLocales(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: ListColumn[] = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "direction", label: "Direction" },
    { key: "isActive", label: "Active" },
    { key: "isDefault", label: "Default" },
  ];

  return (
    <div>
      <PageHeader title="Locales" subtitle={`${locales.length} languages`} />
      <StatCardRow
        cards={[{ label: "Total Locales", value: locales.length }]}
      />
      <div className="ui-card" style={{ marginTop: "var(--space-6)" }}>
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button icon={Plus}>Add Locale</Button>
        </div>
        <DataTable columns={columns} data={locales} />
      </div>
    </div>
  );
}
