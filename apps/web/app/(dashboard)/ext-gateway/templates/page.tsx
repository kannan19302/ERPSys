"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  DataTable,
  Badge,
  Spinner,
  Button,
  type Column,
} from "@unerp/ui";
import { Plus, Eye, Star } from "lucide-react";

interface Template {
  id: string;
  name: string;
  slug: string;
  provider: string;
  category: string;
  description?: string;
  isBuiltIn: boolean;
}

export default function TemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ext-gateway/templates")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const columns: Column<Template>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Provider", accessor: "provider" },
    {
      header: "Category",
      accessor: (r) => <Badge variant="info">{r.category}</Badge>,
    },
    {
      header: "Built-in",
      accessor: (r) =>
        r.isBuiltIn ? <Star size={14} className="text-yellow-500" /> : "-",
    },
    {
      header: "Description",
      accessor: (r) => r.description?.slice(0, 60) || "-",
    },
    {
      header: "Actions",
      accessor: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="ui-btn-icon"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Integration Templates</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Template
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} sortable />
      </Card>
    </div>
  );
}
