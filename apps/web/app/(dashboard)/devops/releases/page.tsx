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
import { Plus, Eye, Rocket, CheckCircle } from "lucide-react";

interface Release {
  id: string;
  name: string;
  version: string;
  application: string;
  status: string;
  releaseType: string;
  branch?: string;
  approvedBy?: string;
  createdAt: string;
}

export default function ReleasesPage() {
  const [items, setItems] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devops/releases")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const variantForStatus = (s: string) =>
    s === "RELEASED"
      ? "success"
      : s === "DRAFT"
        ? "default"
        : s === "APPROVED"
          ? "info"
          : s === "FAILED"
            ? "danger"
            : "warning";

  const columns: Column<Release>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Version", accessor: "version" },
    { header: "Application", accessor: "application" },
    {
      header: "Type",
      accessor: (r) => <Badge variant="info">{r.releaseType}</Badge>,
    },
    {
      header: "Status",
      accessor: (r) => (
        <Badge variant={variantForStatus(r.status)}>{r.status}</Badge>
      ),
    },
    { header: "Branch", accessor: (r) => r.branch || "-" },
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
            <Rocket size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Releases</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Release
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} sortable />
      </Card>
    </div>
  );
}
