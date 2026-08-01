"use client";
import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, DataTable, type Column } from "@unerp/ui";
import { apiGet } from "@/lib/api";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

export default function AssetCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/fixed-assets/categories")
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name" },
    { key: "depreciationMethod", header: "Depreciation Method" },
    { key: "expectedLifeMonths", header: "Life (Months)" },
    { key: "depreciationRate", header: "Rate (%)" },
    { key: "description", header: "Description" },
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
          <Button size="sm" variant="ghost">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Categories"
        description={`${categories.length} categories`}
      />
      <div className="ui-card">
        <div
          className="ui-flex"
          style={{ justifyContent: "flex-end", marginBottom: "var(--space-4)" }}
        >
          <Button leftIcon={<Plus size={16} />}>Add Category</Button>
        </div>
        <DataTable columns={columns} data={categories} />
      </div>
    </div>
  );
}
