// @ts-nocheck
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

export default function WorkflowTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/workflow/tasks")
      .then((d) => setTasks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "status", header: "Status" },
    { key: "assigneeId", header: "Assignee" },
    { key: "dueAt", header: "Due" },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <div>
      <PageHeader title="My Tasks" description={`${tasks.length} tasks`} />
      <div className="ui-card">
        <DataTable columns={columns} data={tasks} />
      </div>
    </div>
  );
}
