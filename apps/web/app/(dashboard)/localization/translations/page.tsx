"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/localization/translations")
      .then((d) => setTranslations(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "locale.code", header: "Locale" },
    { key: "key.key", header: "Key" },
    { key: "value", header: "Translation" },
    { key: "isOverride", header: "Override" },
    { key: "updatedAt", header: "Updated" },
  ];

  return (
    <div>
      <PageHeader
        title="Translation Editor"
        description={`${translations.length} entries`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={translations} />
      </div>
    </div>
  );
}
