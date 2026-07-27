"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Spinner, DataTable, type ListColumn } from "@unerp/ui";
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

  const columns: ListColumn[] = [
    { key: "locale.code", label: "Locale" },
    { key: "key.key", label: "Key" },
    { key: "value", label: "Translation" },
    { key: "isOverride", label: "Override" },
    { key: "updatedAt", label: "Updated" },
  ];

  return (
    <div>
      <PageHeader
        title="Translation Editor"
        subtitle={`${translations.length} entries`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={translations} />
      </div>
    </div>
  );
}
