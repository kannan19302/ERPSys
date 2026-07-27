"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Spinner,
  DataTable,
  type Column,
  StatusBadge,
} from "@unerp/ui";
import { apiGet } from "@/lib/api";

export default function WorkflowInstancesPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/workflow/instances")
      .then((d) => setInstances(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "status", header: "Status" },
    { key: "trigger", header: "Trigger" },
    { key: "startedAt", header: "Started" },
    { key: "completedAt", header: "Completed" },
    { key: "duration", header: "Duration (s)" },
  ];

  return (
    <div>
      <PageHeader
        title="Workflow Instances"
        description={`${instances.length} instances`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={instances} />
      </div>
    </div>
  );
}
