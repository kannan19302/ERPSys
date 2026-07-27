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
import { Plus, RotateCcw, Eye } from "lucide-react";

interface Deployment {
  id: string;
  name: string;
  application: string;
  version: string;
  status: string;
  strategy: string;
  environmentId: string;
  branch: string;
  deployedBy: string;
  createdAt: string;
}

export default function DeploymentsPage() {
  const [items, setItems] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devops/deployments")
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

  const columns: Column<Deployment>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Application", accessor: "application", sortable: true },
    { header: "Version", accessor: "version" },
    {
      header: "Status",
      accessor: (r) => (
        <Badge
          variant={
            r.status === "SUCCESS"
              ? "success"
              : r.status === "FAILED"
                ? "danger"
                : "warning"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    { header: "Strategy", accessor: "strategy" },
    { header: "Branch", accessor: (r) => r.branch || "-" },
    { header: "Deployed By", accessor: "deployedBy" },
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
            <RotateCcw size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Deployments</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Deployment
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} sortable />
      </Card>
    </div>
  );
}
