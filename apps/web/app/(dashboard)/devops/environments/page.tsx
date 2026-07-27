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
import { Plus, Eye, Activity } from "lucide-react";

interface Environment {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  baseUrl?: string;
  region?: string;
  healthStatus?: string;
  lastDeployAt?: string;
}

export default function EnvironmentsPage() {
  const [items, setItems] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devops/environments")
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

  const columns: Column<Environment>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Slug", accessor: "slug" },
    {
      header: "Type",
      accessor: (r) => (
        <Badge variant={r.type === "PRODUCTION" ? "danger" : "info"}>
          {r.type}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessor: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "warning"}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: "Health",
      accessor: (r) =>
        r.healthStatus ? (
          <Badge variant={r.healthStatus === "HEALTHY" ? "success" : "danger"}>
            {r.healthStatus}
          </Badge>
        ) : (
          "-"
        ),
    },
    { header: "Region", accessor: (r) => r.region || "-" },
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
            <Activity size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Environments</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Environment
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} sortable />
      </Card>
    </div>
  );
}
