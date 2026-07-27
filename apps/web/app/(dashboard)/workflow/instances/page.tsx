"use client";
import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Spinner,
  DataTable,
  type ListColumn,
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

  const columns: ListColumn[] = [
    { key: "status", label: "Status" },
    { key: "trigger", label: "Trigger" },
    { key: "startedAt", label: "Started" },
    { key: "completedAt", label: "Completed" },
    { key: "duration", label: "Duration (s)" },
  ];

  return (
    <div>
      <PageHeader
        title="Workflow Instances"
        subtitle={`${instances.length} instances`}
      />
      <div className="ui-card">
        <DataTable columns={columns} data={instances} />
      </div>
    </div>
  );
}
