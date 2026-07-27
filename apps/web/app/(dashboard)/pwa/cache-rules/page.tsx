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
import { Plus, Eye, Trash2 } from "lucide-react";

interface CacheRule {
  id: string;
  name: string;
  urlPattern: string;
  cacheStrategy: string;
  maxAgeSeconds: number;
  maxEntries: number;
  compression: boolean;
  method: string;
  priority: number;
  isActive: boolean;
}

export default function CacheRulesPage() {
  const [items, setItems] = useState<CacheRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pwa/cache-rules")
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

  const columns: Column<CacheRule>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "URL Pattern", accessor: "urlPattern" },
    {
      header: "Strategy",
      accessor: (r) => <Badge variant="info">{r.cacheStrategy}</Badge>,
    },
    {
      header: "TTL",
      accessor: (r) => `${Math.round(r.maxAgeSeconds / 60)} min`,
    },
    { header: "Max Entries", accessor: "maxEntries" },
    { header: "Priority", accessor: "priority" },
    {
      header: "Active",
      accessor: (r) =>
        r.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
    },
    {
      header: "Actions",
      accessor: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Cache Rules</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Add Rule
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} sortable />
      </Card>
    </div>
  );
}
