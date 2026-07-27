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

export default function WorkflowTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/workflow/tasks")
      .then((d) => setTasks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const columns: ListColumn[] = [
    { key: "status", label: "Status" },
    { key: "assigneeId", label: "Assignee" },
    { key: "dueAt", label: "Due" },
    { key: "createdAt", label: "Created" },
  ];

  return (
    <div>
      <PageHeader title="My Tasks" subtitle={`${tasks.length} tasks`} />
      <div className="ui-card">
        <DataTable columns={columns} data={tasks} />
      </div>
    </div>
  );
}
