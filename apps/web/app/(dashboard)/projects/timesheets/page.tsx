// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Badge, DataTable, type Column, Spinner } from "@unerp/ui";
import { Clock } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface TimesheetEntry {
  id: string;
  employeeName: string;
  taskName: string;
  projectName: string;
  date: string;
  hours: number;
  notes: string | null;
  status: string;
}

export default function TimesheetsPage() {
  const client = useApiClient();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await client.get<
        TimesheetEntry[] | { data?: TimesheetEntry[] }
      >("/projects/timesheets");
      setEntries(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<TimesheetEntry>[] = [
    { key: "employeeName", header: "Employee" },
    { key: "taskName", header: "Task" },
    { key: "projectName", header: "Project" },
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: "hours",
      header: "Hours",
      align: "right",
      render: (row) => `${row.hours}h`,
    },
    {
      key: "notes",
      header: "Notes",
      render: (row) => row.notes || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "APPROVED"
              ? "success"
              : row.status === "REJECTED"
                ? "danger"
                : "info"
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="projects.timesheets.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Timesheets"
          description="Log and manage project time entries"
          breadcrumbs={[
            { label: "Projects", href: "/projects" },
            { label: "Timesheets" },
          ]}
        />
        <DataTable
          columns={columns}
          data={entries}
          rowKey={(r) => r.id}
          emptyTitle="No Timesheet Entries"
          emptyMessage="Log time entries to track work hours across projects."
          emptyIcon={<Clock size={48} />}
        />
      </div>
    </RouteGuard>
  );
}
